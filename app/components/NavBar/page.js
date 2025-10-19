'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '../SearchBar/page';

export default function NavBar({ onLogout, onChatOpen, onEditProfile }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const notificationRef = useRef(null);
  const messageRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target)) {
        setShowMessages(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      fetchPendingFriendRequests();
    }
  }, [showNotifications]);

  // Fetch chats when messages dropdown is opened
  useEffect(() => {
    if (showMessages && messages.length === 0) {
      fetchChats();
    }
  }, [showMessages]);

  const fetchPendingFriendRequests = async () => {
    setNotificationsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/friends/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.pending || []);
      } else {
        console.error('Failed to fetch friend requests');
      }
    } catch (err) {
      console.error('Error fetching friend requests:', err);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchChats = async () => {
    setMessagesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const formattedMessages = data.chats.map((chat) => ({
          id: chat.other_user_id,
          name: chat.other_user_name,
          lastMessage: chat.last_message || 'ไม่มีข้อความ',
          time: formatTime(chat.updated_at),
          unread: chat.unread_count || 0,
          avatar: chat.other_user_image,
          online: false,
          chatId: chat.id
        }));
        setMessages(formattedMessages);
      } else {
        console.error('Failed to fetch chats');
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  const getProfileImage = (userData, size = 'w-8 h-8') => {
    const defaultName = userData?.name || 'U';
    if (userData?.profile_image) {
      return (
        <img
          src={userData.profile_image}
          alt="Profile"
          className={`${size} rounded-full object-cover`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    } else {
      return (
        <div className={`${size} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm`}>
          {defaultName.charAt(0)?.toUpperCase()}
        </div>
      );
    }
  };

  const handleAcceptFriend = async (senderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId: senderId })
      });

      if (res.ok) {
        setNotifications(notifications.filter(n => n.sender_id !== senderId));
        // อาจต้องโหลด friends list ใหม่
      } else {
        console.error('Failed to accept friend request');
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const handleRejectFriend = async (senderId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/friends/reject', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId: senderId })
      });

      if (res.ok) {
        setNotifications(notifications.filter(n => n.sender_id !== senderId));
      } else {
        console.error('Failed to reject friend request');
      }
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  };

  const handleViewProfile = (userId) => {
    setShowNotifications(false);
    router.push(`/profile/${userId}`);
  };

  const handleChatItemClick = async (message) => {
    setShowMessages(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otherUserId: message.id })
      });

      if (res.ok) {
        const data = await res.json();
        onChatOpen({
          id: message.id,
          chatId: data.chat.id,
          name: message.name,
          avatar: message.avatar,
          online: message.online
        });
      }
    } catch (err) {
      console.error('Error opening chat:', err);
    }
  };

  const unreadNotifications = notifications.length;
  const unreadMessages = messages.reduce((sum, msg) => sum + msg.unread, 0);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Left Section - Logo and Search */}
          <div className="flex items-center space-x-4 flex-1">
            <h1
              onClick={() => router.push('/dashboard')}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-200"
            >
              Kon Sakon.
            </h1>
            <SearchBar />
          </div>

          {/* Center Section - Navigation Icons */}
          <div className="hidden lg:flex items-center space-x-2">
            <button className="p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
              <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <button className="p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group">
              <svg className="w-6 h-6 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>

          {/* Right Section - Notifications, Messages, Profile */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowMessages(false);
                  setShowProfileMenu(false);
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 relative"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM10.5 14H7a4 4 0 01-4-4V6a4 4 0 014-4h10a4 4 0 014 4v4a4 4 0 01-4 4h-3.5l-3.5 4v-4z" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">คำขอเป็นเพื่อน</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="mt-2">กำลังโหลด...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.sender_id}
                          className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            {getProfileImage({ name: notification.name, profile_image: notification.profile_image }, 'w-12 h-12')}
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{notification.name}</p>
                              <p className="text-sm text-gray-600 mt-1">{notification.email}</p>
                              <p className="text-xs text-gray-500 mt-1">{formatTime(notification.created_at)}</p>

                              {/* Action Buttons */}
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleAcceptFriend(notification.sender_id)}
                                  className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                  ยอมรับ
                                </button>
                                <button
                                  onClick={() => handleRejectFriend(notification.sender_id)}
                                  className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                  ปฏิเสธ
                                </button>
                                <button
                                  onClick={() => handleViewProfile(notification.sender_id)}
                                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  ดูโปรไฟล์
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM10.5 14H7a4 4 0 01-4-4V6a4 4 0 014-4h10a4 4 0 014 4v4a4 4 0 01-4 4h-3.5l-3.5 4v-4z" />
                        </svg>
                        <p>ไม่มีคำขอเป็นเพื่อน</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="relative" ref={messageRef}>
              <button
                onClick={() => {
                  setShowMessages(!showMessages);
                  setShowNotifications(false);
                  setShowProfileMenu(false);
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 relative"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>

              {/* Messages Dropdown */}
              {showMessages && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">ข้อความ</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {messagesLoading ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="mt-2">กำลังโหลด...</p>
                      </div>
                    ) : messages.length > 0 ? (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          onClick={() => handleChatItemClick(message)}
                          className="p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 cursor-pointer"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              {getProfileImage({ name: message.name, profile_image: message.avatar }, 'w-10 h-10')}
                              {message.online && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-gray-800 truncate">{message.name}</p>
                                <span className="text-xs text-gray-500">{message.time}</span>
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">{message.lastMessage}</p>
                            </div>
                            {message.unread > 0 && (
                              <div className="bg-blue-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center font-medium">
                                {message.unread}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>ไม่มีข้อความ</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                  setShowMessages(false);
                }}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                {getProfileImage(user)}
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      {getProfileImage(user, 'w-10 h-10')}
                      <div>
                        <p className="font-medium text-gray-800">{user?.name}</p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        router.push(`/profile/${user?.id}`);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-700">ดูโปรไฟล์</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onEditProfile && onEditProfile(); // ✅ เรียก callback ที่ส่งมาจาก Dashboard
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-gray-700">แก้ไขข้อมูลส่วนตัว</span>
                    </button>

                  </div>

                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 transition-colors duration-200 flex items-center space-x-3 text-red-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}