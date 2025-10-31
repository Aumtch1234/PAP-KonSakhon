const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Database pool
const pool = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'WEB_APP'
    });

// Map to store user socket connections
const userSocketMap = new Map(); // userId -> socketId

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ PostgreSQL connected successfully');
    release();
  }
});

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO with CORS for all origins
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: (origin, callback) => {
        if (process.env.SOCKET_ORIGINS) {
          const allowedOrigins = process.env.SOCKET_ORIGINS.split(',');
          if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
          } else {
            callback(new Error('CORS policy violation'));
          }
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
      allowEIO3: true
    },
    transports: ['polling', 'websocket'],
    pingInterval: 25000,
    pingTimeout: 60000
  });

  console.log('🔌 Socket.IO server initialized');

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.log('❌ No token provided');
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userName = decoded.name;
      socket.userImage = decoded.profile_image;
      
      console.log('✅ Auth success:', socket.userName);
      next();
    } catch (err) {
      console.error('❌ Auth error:', err.message);
      next(new Error('Authentication failed'));
    }
  });

  // Socket.IO Connection Handler
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.userId, '-', socket.userName);

    // ✅ เก็บ mapping ของ userId กับ socketId
    userSocketMap.set(socket.userId, socket.id);

    // Join personal room
    socket.join(`user:${socket.userId}`);

    // Broadcast online status
    socket.broadcast.emit('user_online', { userId: socket.userId });

    // ✅ New Friend Request Event
    socket.on('send_friend_request', async (data) => {
      const { recipientId } = data;
      console.log(`🔔 Friend request from ${socket.userId} to ${recipientId}`);

      // ดึงข้อมูล sender
      const client = await pool.connect();
      try {
        const userResult = await client.query(
          'SELECT id, name, email, profile_image FROM users WHERE id = $1',
          [socket.userId]
        );

        if (userResult.rows.length > 0) {
          const sender = userResult.rows[0];
          
          // emit ไปที่ recipient โดยตรง
          const recipientSocketId = userSocketMap.get(recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('new_friend_request', {
              sender_id: sender.id,
              name: sender.name,
              email: sender.email,
              profile_image: sender.profile_image,
              created_at: new Date()
            });
            console.log(`✅ Friend request sent to ${recipientId}`);
          }
        }
      } catch (err) {
        console.error('❌ Error sending friend request:', err.message);
      } finally {
        client.release();
      }
    });

    // Join chat room and load history
    socket.on('join_chat', async (data) => {
      const { chatId } = data;
      socket.join(`chat:${chatId}`);
      
      console.log(`📨 User ${socket.userName} joined chat ${chatId}`);
      
      const client = await pool.connect();
      try {
        const messages = await client.query(
          `SELECT m.*, u.name, u.profile_image 
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           WHERE m.chat_id = $1
           ORDER BY m.created_at ASC
           LIMIT 100`,
          [chatId]
        );
        
        console.log(`📋 Loaded ${messages.rows.length} messages for chat ${chatId}`);
        socket.emit('chat_history', messages.rows);
      } catch (err) {
        console.error('❌ Error loading history:', err.message);
        socket.emit('error', { message: 'ไม่สามารถโหลดประวัติแชทได้' });
      } finally {
        client.release();
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      const { chatId, message, otherUserId } = data;
      
      if (!message?.trim()) {
        console.log('⚠️ Empty message received');
        return;
      }
      
      const client = await pool.connect();
      try {
        const result = await client.query(
          `INSERT INTO messages (chat_id, sender_id, message, created_at)
           VALUES ($1, $2, $3, NOW())
           RETURNING *`,
          [chatId, socket.userId, message.trim()]
        );

        const newMessage = {
          ...result.rows[0],
          name: socket.userName,
          profile_image: socket.userImage
        };

        // Broadcast to all in chat room
        io.to(`chat:${chatId}`).emit('new_message', newMessage);

        // ✅ Emit notification ไปที่ other user
        const otherUserSocketId = userSocketMap.get(otherUserId);
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('new_message_notification', {
            sender_id: socket.userId,
            sender_name: socket.userName,
            sender_image: socket.userImage,
            message: message.trim(),
            chatId: chatId,
            timestamp: new Date()
          });
        }

        // Update last message
        await client.query(
          `UPDATE chats 
           SET last_message = $1, updated_at = NOW()
           WHERE id = $2`,
          [message.trim(), chatId]
        );

        console.log(`✉️ Message sent in chat ${chatId} by ${socket.userName}`);
      } catch (err) {
        console.error('❌ Error sending message:', err.message);
        socket.emit('error', { message: 'ส่งข้อความไม่สำเร็จ' });
      } finally {
        client.release();
      }
    });

    // Typing indicators
    socket.on('typing', (data) => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('stop_typing', (data) => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('user_stop_typing', {
        userId: socket.userId
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      const { chatId } = data;
      const client = await pool.connect();
      try {
        await client.query(
          `UPDATE messages 
           SET is_read = TRUE 
           WHERE chat_id = $1 
           AND sender_id != $2 
           AND is_read = FALSE`,
          [chatId, socket.userId]
        );
        console.log(`✓ Messages marked as read in chat ${chatId}`);
      } catch (err) {
        console.error('❌ Error marking messages as read:', err.message);
      } finally {
        client.release();
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.userName);
      
      // ✅ ลบ user จาก map
      userSocketMap.delete(socket.userId);
      
      socket.broadcast.emit('user_offline', { userId: socket.userId });
    });

    socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error('💥 Server error:', err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      const localUrl = `http://localhost:${port}`;
      const networkUrl = `http://0.0.0.0:${port}`;
      
      console.log('');
      console.log('='.repeat(50));
      console.log('🚀 Server is running!');
      console.log('='.repeat(50));
      console.log(`📍 Local:            ${localUrl}`);
      console.log(`🌐 Network:          ${networkUrl}`);
      console.log(`🔌 Socket.IO:        ws://<your-host>:${port}`);
      console.log(`🌍 Environment:      ${dev ? 'development' : 'production'}`);
      console.log(`📊 Database:         Connected`);
      console.log(`📡 CORS Origins:     ${process.env.SOCKET_ORIGINS || 'All (*)'}`);
      console.log('='.repeat(50));
      console.log('');
    });
});