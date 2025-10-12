'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found, skipping socket connection');
      return;
    }

    console.log('🔄 Initializing Socket.IO connection...');

    // ดึง URL ปัจจุบันจากหน้าบราวเซอร์
    const protocol = window.location.protocol; // 'http:' or 'https:'
    const host = window.location.host; // รวม port ด้วย เช่น localhost:3000 หรือ example.com
    const socketUrl = `${protocol}//${host}`; // จะกลายเป็น http://localhost:3000 หรือ https://example.com

    console.log('🔌 Browser location:', window.location.href);
    console.log('🔌 Connecting to:', socketUrl);
    console.log('📍 Protocol:', protocol);
    console.log('📍 Host:', host);

    const socketInstance = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'], // polling first as fallback
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      secure: protocol === 'https:',
      rejectUnauthorized: false,
      forceNew: false,
      multiplex: true
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected successfully!', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', {
        message: error.message,
        type: error.type,
        code: error.code,
        fullError: error
      });
      console.log('📡 Socket URL:', socketUrl);
      console.log('🔌 Socket IO version:', socketInstance.version);
      console.log('📊 Transport:', socketInstance.io?.engine?.transport?.name);
      setConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });

    // Custom events
    socketInstance.on('user_online', (data) => {
      console.log('👤 User came online:', data.userId);
    });

    socketInstance.on('user_offline', (data) => {
      console.log('👤 User went offline:', data.userId);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🔌 Cleaning up socket connection...');
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}