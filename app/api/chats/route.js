import pool from '../../config/db';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return Response.json({ error: 'ไม่พบ token' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          c.id,
          c.last_message,
          c.updated_at,
          CASE 
            WHEN c.user1_id = $1 THEN u2.id
            ELSE u1.id
          END as other_user_id,
          CASE 
            WHEN c.user1_id = $1 THEN u2.name
            ELSE u1.name
          END as other_user_name,
          CASE 
            WHEN c.user1_id = $1 THEN u2.profile_image
            ELSE u1.profile_image
          END as other_user_image,
          (SELECT COUNT(*) FROM messages 
           WHERE chat_id = c.id 
           AND sender_id != $1 
           AND is_read = FALSE) as unread_count
         FROM chats c
         JOIN users u1 ON c.user1_id = u1.id
         JOIN users u2 ON c.user2_id = u2.id
         WHERE c.user1_id = $1 OR c.user2_id = $1
         ORDER BY c.updated_at DESC`,
        [userId]
      );

      return Response.json({ chats: result.rows });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return Response.json({ error: 'ไม่พบ token' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { otherUserId } = await request.json();

    const client = await pool.connect();
    try {
      // ตรวจสอบว่ามีห้องแชทอยู่แล้วหรือไม่
      const existingChat = await client.query(
        `SELECT * FROM chats 
         WHERE (user1_id = $1 AND user2_id = $2) 
         OR (user1_id = $2 AND user2_id = $1)`,
        [userId, otherUserId]
      );

      if (existingChat.rowCount > 0) {
        return Response.json({ chat: existingChat.rows[0] });
      }

      // สร้างห้องแชทใหม่
      const newChat = await client.query(
        `INSERT INTO chats (user1_id, user2_id)
         VALUES ($1, $2)
         RETURNING *`,
        [Math.min(userId, otherUserId), Math.max(userId, otherUserId)]
      );

      return Response.json({ chat: newChat.rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}