'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    console.warn('⚠️ useSocket must be used within SocketProvider');
    return { socket: null, connected: false };
  }
  return context;
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found, skipping socket connection');
      return;
    }

    console.log('🔄 Initializing Socket.IO connection...');

    const protocol = window.location.protocol;
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}`;

    console.log('🔌 Connecting to:', socketUrl);

    const socketInstance = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
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
      console.error('🔴 Socket connection error:', error.message);
      setConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('🔴 Socket error:', error);
    });

    // ✅ ไม่ต้องส่ง custom event - let components use socket directly
    // ✅ Components จะ subscribe ผ่าน socket.on() โดยตรง

    setSocket(socketInstance);

    return () => {
      console.log('🔌 Cleaning up socket connection...');
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isClient]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}