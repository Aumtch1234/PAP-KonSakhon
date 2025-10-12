'use client';
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../SocketProvider';

export default function ChatBox({ chatId, chatUser = {}, currentUser = {}, onClose = () => {} }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected || !chatId) return;

    // Join chat room
    socket.emit('join_chat', { chatId });

    // Listen for chat history
    socket.on('chat_history', (history) => {
      setMessages(history);
      scrollToBottom();
    });

    // Listen for new messages
    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Listen for typing indicators
    socket.on('user_typing', (data) => {
      if (data.userId !== currentUser.id) {
        setIsTyping(true);
      }
    });

    socket.on('user_stop_typing', (data) => {
      if (data.userId !== currentUser.id) {
        setIsTyping(false);
      }
    });

    // Listen for online status (optional enhancement)
    socket.on('user_online', (data) => {
      if (data.userId === chatUser.id) {
        setIsOnline(true);
      }
    });

    socket.on('user_offline', (data) => {
      if (data.userId === chatUser.id) {
        setIsOnline(false);
      }
    });

    return () => {
      socket.off('chat_history');
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
      socket.off('user_online');
      socket.off('user_offline');
    };
  }, [socket, connected, chatId, currentUser.id, chatUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleTyping = () => {
    if (!socket || !connected) return;

    socket.emit('typing', { chatId });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { chatId });
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !connected) return;

    socket.emit('send_message', {
      chatId,
      message: newMessage.trim()
    });

    setNewMessage('');
    socket.emit('stop_typing', { chatId });
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const getProfileImage = (user, size = 'w-8 h-8') => {
    if (user?.profile_image) {
      return (
        <img
          src={user.profile_image}
          alt={user.name}
          className={`${size} rounded-full object-cover`}
        />
      );
    }
    return (
      <div className={`${size} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm`}>
        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
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
              {getProfileImage(chatUser, 'w-8 h-8')}
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">{chatUser?.name || 'Chat'}</span>
                {(chatUser?.online || isOnline) && (
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
            {getProfileImage(chatUser, 'w-8 h-8')}
            <div className="flex flex-col">
              <span className="font-medium text-sm">{chatUser?.name || 'Chat'}</span>
              <div className="flex items-center space-x-1">
                {(chatUser?.online || isOnline) ? (
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

      {/* Connection Status */}
      {!connected && (
        <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-xs text-center">
          กำลังเชื่อมต่อ...
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>เริ่มการสนทนา</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[75%] ${message.sender_id === currentUser.id ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                {message.sender_id !== currentUser.id && (
                  <div className="flex-shrink-0">
                    {getProfileImage({ 
                      name: message.name, 
                      profile_image: message.profile_image 
                    }, 'w-6 h-6')}
                  </div>
                )}
                <div>
                  <div
                    className={`px-3 py-2 rounded-xl text-sm ${
                      message.sender_id === currentUser.id
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                    }`}
                  >
                    {message.message}
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${message.sender_id === currentUser.id ? 'text-right' : 'text-left'}`}>
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2">
              {getProfileImage(chatUser, 'w-6 h-6')}
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
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="พิมพ์ข้อความ..."
            disabled={!connected}
            className="flex-1 px-3 py-2 bg-gray-100 border-0 rounded-full focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-sm disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !connected}
            className={`p-2 rounded-full transition-all duration-200 ${
              newMessage.trim() && connected
                ? 'text-blue-500 hover:text-blue-600 hover:bg-blue-50'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}