'use client';
import { useState, useEffect, useRef } from 'react';

export default function ChatBox({ chat = {}, user = {}, onClose = () => {} }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Mock messages for demonstration
  useEffect(() => {
    // Add guards to handle undefined chat/user
    if (!chat?.id || !user?.id) return;

    const chatId = chat.id;
    const chatName = chat.name || 'Chat';
    const userId = user.id;
    const userName = user.name || 'User';

    setMessages([
      {
        id: 1,
        content: 'สวัสดีครับ วันนี้เป็นอย่างไรบ้าง',
        senderId: chatId,
        senderName: chatName,
        timestamp: new Date(Date.now() - 30000),
        type: 'text'
      },
      {
        id: 2,
        content: 'สวัสดีครับ สบายดีเลยครับ',
        senderId: userId,
        senderName: userName,
        timestamp: new Date(Date.now() - 25000),
        type: 'text'
      },
      {
        id: 3,
        content: 'งานเป็นอย่างไรบ้างครับ',
        senderId: chatId,
        senderName: chatName,
        timestamp: new Date(Date.now() - 20000),
        type: 'text'
      },
      {
        id: 4,
        content: 'ยุ่งอยู่เหมือนกันครับ แต่โอเคครับ',
        senderId: userId,
        senderName: userName,
        timestamp: new Date(Date.now() - 15000),
        type: 'text'
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageToSend = {
      id: Date.now(),
      content: newMessage.trim(),
      senderId: user.id,
      senderName: user.name,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, messageToSend]);
    setNewMessage('');

    // Auto response simulation
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        const responses = [
          'ได้ครับ',
          'เข้าใจแล้วครับ',
          'โอเคครับ',
          'ขอบคุณครับ',
          'ดีครับ'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: randomResponse,
          senderId: chat.id,
          senderName: chat.name,
          timestamp: new Date(),
          type: 'text'
        }]);
        setIsTyping(false);
      }, 1500);
    }, 500);
  };

  const getProfileImage = (userId, userName, size = 'w-8 h-8') => {
    return (
      <div className={`${size} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm`}>
        {userName?.charAt(0)?.toUpperCase() || 'U'}
      </div>
    );
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-0 right-4 w-80 bg-white border border-gray-200 rounded-t-lg shadow-lg z-50">
        <div
          onClick={() => setIsMinimized(false)}
          className="p-3 bg-blue-500 text-white rounded-t-lg cursor-pointer hover:bg-blue-600 transition-colors duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getProfileImage(chat?.id, chat?.name, 'w-8 h-8')}
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{chat?.name || 'Chat'}</span>
                {chat?.online && (
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 w-80 bg-white border border-gray-200 rounded-t-lg shadow-xl z-50 flex flex-col h-96">
      {/* Header */}
      <div className="p-3 bg-blue-500 text-white rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getProfileImage(chat?.id, chat?.name, 'w-8 h-8')}
            <div className="flex flex-col">
              <span className="font-medium text-sm">{chat?.name || 'Chat'}</span>
              <div className="flex items-center space-x-1">
                {chat?.online ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-green-200">ออนไลน์</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-300">ออฟไลน์</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[75%] ${message.senderId === user.id ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
              {message.senderId !== user.id && (
                <div className="flex-shrink-0">
                  {getProfileImage(message.senderId, message.senderName, 'w-6 h-6')}
                </div>
              )}
              <div>
                <div
                  className={`px-3 py-2 rounded-xl text-sm ${
                    message.senderId === user.id
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {message.content}
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${message.senderId === user.id ? 'text-right' : 'text-left'}`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              {getProfileImage(chat?.id, chat?.name, 'w-6 h-6')}
              <div className="bg-white border border-gray-200 rounded-xl rounded-bl-sm px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-gray-200 flex-shrink-0 bg-white rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <div className="flex-1 flex items-center space-x-2">
            <button
              type="button"
              className="text-blue-500 hover:text-blue-600 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="พิมพ์ข้อความ..."
              className="flex-1 px-3 py-2 bg-gray-100 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`p-2 rounded-full transition-all duration-200 ${
              newMessage.trim()
                ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        {/* Quick Actions */}
        <div className="flex items-center justify-center space-x-4 mt-2">
          <button className="text-gray-400 hover:text-blue-500 transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="text-gray-400 hover:text-blue-500 transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 100-5H9v5zm0 0H7.5a2.5 2.5 0 100 5H9V10z" />
            </svg>
          </button>
          <button className="text-gray-400 hover:text-blue-500 transition-colors duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-1 0v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4h1z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}