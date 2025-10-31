'use client';
import { useState, useEffect } from 'react';
import { MessageCircle, Search } from 'lucide-react';

export default function FriendsSidebar({ onChatOpen = () => {} }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.friend_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/friends/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ตรวจสอบสถานะออนไลน์ (เช็ค status แทน last_login)
  const isUserOnline = (status) => {
    return status === 'active';
  };

  const getProfileImage = (userData, size = 'w-10 h-10') => {
    const defaultName = userData?.friend_name || 'F';
    if (userData?.friend_profile_image) {
      return (
        <img
          src={userData.friend_profile_image}
          alt={userData.friend_name}
          className={`${size} rounded-full object-cover`}
        />
      );
    }
    return (
      <div className={`${size} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm`}>
        {defaultName.charAt(0)?.toUpperCase()}
      </div>
    );
  };

  const handleChatClick = async (friend) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otherUserId: friend.friend_id })
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Chat opened:', data);
        onChatOpen({
          id: friend.friend_id,
          chatId: data.chat.id,
          name: friend.friend_name,
          avatar: friend.friend_profile_image,
          email: friend.friend_email,
          online: isUserOnline(friend.status)
        });
      }
    } catch (err) {
      console.error('Error opening chat:', err);
    }
  };

  const handleViewProfile = (friendId) => {
    window.location.href = `/profile/${friendId}`;
  };

  // ✅ เรียงลำดับ: active ก่อน
  const sortedFriends = [...filteredFriends].sort((a, b) => {
    const aOnline = isUserOnline(a.status) ? 1 : 0;
    const bOnline = isUserOnline(b.status) ? 1 : 0;
    return bOnline - aOnline;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm sticky top-24 h-fit">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-base font-bold text-gray-800 mb-2">เพื่อน ({friends.length})</h3>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:outline-none text-xs"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
        {loading ? (
          <div className="p-4 text-center">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        ) : sortedFriends.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {sortedFriends.map((friend) => {
              const online = isUserOnline(friend.status);
              return (
                <div
                  key={friend.friend_id}
                  className="p-2 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div 
                      className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleViewProfile(friend.friend_id)}
                    >
                      <div className="relative flex-shrink-0">
                        {getProfileImage(friend, 'w-9 h-9')}
                        {/* ✅ จุดสถานะ */}
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${
                          online 
                            ? 'bg-green-500 animate-pulse' 
                            : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {friend.friend_name}
                        </p>
                        {/* ✅ แสดงสถานะ */}
                        <p className={`text-xs ${
                          online 
                            ? 'text-green-600' 
                            : 'text-gray-400'
                        }`}>
                          {online ? 'ออนไลน์' : 'ออฟไลน์'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleChatClick(friend)}
                      className="p-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors flex-shrink-0"
                      title="ส่งข้อความ"
                    >
                      <MessageCircle className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 text-xs">
            <p>{searchQuery ? 'ไม่พบเพื่อน' : 'ไม่มีเพื่อน'}</p>
          </div>
        )}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          width: 5px;
        }
        div::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}