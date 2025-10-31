'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '../components/NavBar/page';
import MembersSidebar from '../components/MembersSidebar/page';
import FriendsSidebar from '../components/ProfileSidebar/page';
import CreatePost from '../components/CreatePost/page';
import FeedPost from '../components/Feed/page';
import CommentDialog from '../components/CommentDialog/page';
import ProfileEditDialog from '../components/ProfileEdit/page';
import ChatBox from '../components/ChatBox';
import { SocketProvider } from '../components/SocketProvider';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feeds, setFeeds] = useState([]);
  const [members, setMembers] = useState([]);
  const [allComments, setAllComments] = useState({});

  // Chat state - รองรับหลาย chat boxes
  const [activeChats, setActiveChats] = useState([]);

  // Comment dialog states
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  // Profile dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const router = useRouter();

  const preventBack = useCallback(() => {
    window.history.pushState(null, null, window.location.pathname);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      // ✅ อัปเดต status เป็น inactive ก่อน logout
      const token = localStorage.getItem('token');
      await fetch('/api/users/update-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'inactive' })
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }

    // จากนั้น logout ปกติ
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.removeEventListener('popstate', preventBack);

    router.push('/');
  }, [router, preventBack]);

  const loadFeeds = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/feeds', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const safeFeeds = Array.isArray(data) ? data : [];
        setFeeds(safeFeeds);

        for (const feed of safeFeeds) {
          if (feed?.comment_count > 0) {
            loadPreviewComments(feed.id);
          }
        }
      }
    } catch (error) {
      console.error('Error loading feeds:', error);
      setFeeds([]);
    }
  }, []);

  const loadPreviewComments = useCallback(async (postId) => {
    if (!postId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllComments(prev => ({
          ...prev,
          [postId]: Array.isArray(data) ? data : []
        }));
      }
    } catch (error) {
      console.error('Error loading preview comments:', error);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/members', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      setMembers([]);
    }
  }, []);

  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', preventBack);

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.replace('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadFeeds();
      loadMembers();
    } catch (error) {
      console.error('Invalid user data');
      handleLogout();
    }

    setLoading(false);

    return () => {
      window.removeEventListener('popstate', preventBack);
    };
  }, [router, preventBack, handleLogout, loadFeeds, loadMembers]);

  const handleChatOpen = useCallback(async (chatData) => {
    if (!chatData?.id) return;

    // ตรวจสอบว่ามี chat นี้อยู่แล้วไหม
    const existingChat = activeChats.find(chat => chat.chatUser.id === chatData.id);
    if (existingChat) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otherUserId: chatData.id })
      });

      if (!res.ok) {
        throw new Error('Failed to create/get chat');
      }

      const data = await res.json();

      const newChat = {
        chatId: data.chat.id,
        chatUser: {
          id: chatData.id,
          name: chatData.name,
          online: chatData.online || false,
          profile_image: chatData.avatar || chatData.profile_image
        }
      };

      setActiveChats(prev => [...prev, newChat]);

    } catch (err) {
      console.error('Error opening chat:', err);
      alert('ไม่สามารถเปิดแชทได้ กรุณาลองใหม่อีกครั้ง');
    }
  }, [activeChats]);

  const handleChatClose = useCallback((chatUserId) => {
    setActiveChats(prev => prev.filter(chat => chat.chatUser.id !== chatUserId));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const safeUser = user || {};
  const safeFeeds = Array.isArray(feeds) ? feeds : [];
  const safeMembers = Array.isArray(members) ? members : [];

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-50">
        <NavBar onLogout={handleLogout} onChatOpen={handleChatOpen} onEditProfile={() => setProfileDialogOpen(true)} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Left Sidebar - Members (Hidden on mobile, 1 col on md, 1 col on lg) */}
            <div className="hidden md:block md:col-span-1 lg:col-span-1">
              <MembersSidebar members={safeMembers} onChatOpen={handleChatOpen} />
            </div>

            {/* Center - Feed (Full on mobile, 3 cols on md, 3 cols on lg) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <CreatePost user={safeUser} onPostCreated={loadFeeds} />

              <div className="space-y-6">
                {safeFeeds.length > 0 ? (
                  safeFeeds.map((feed) => (
                    <FeedPost
                      key={feed?.id}
                      feed={feed || {}}
                      user={safeUser}
                      allComments={allComments}
                      onDeletePost={loadFeeds}
                      onLikePost={setFeeds}
                      onCommentClick={() => {
                        setSelectedPostId(feed?.id);
                        setCommentDialogOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-500">ยังไม่มีโพสต์</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Profile + Friends (Hidden on mobile, 1 col on md, 1 col on lg) */}
            <div className="hidden md:flex md:col-span-1 lg:col-span-1 flex-col gap-6">
              <FriendsSidebar onChatOpen={handleChatOpen} />
            </div>
          </div>
        </div>

        {/* Comment Dialog */}
        {commentDialogOpen && selectedPostId && (
          <CommentDialog
            postId={selectedPostId}
            user={safeUser}
            onClose={() => {
              setCommentDialogOpen(false);
              setSelectedPostId(null);
            }}
            onCommentAdded={() => {
              loadFeeds();
              if (selectedPostId) {
                loadPreviewComments(selectedPostId);
              }
            }}
          />
        )}

        {/* Profile Edit Dialog */}
        {profileDialogOpen && (
          <ProfileEditDialog
            user={safeUser}
            onClose={() => setProfileDialogOpen(false)}
            onUpdate={(updatedUser) => {
              setUser(updatedUser || {});
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }}
          />
        )}

        {/* Multiple Chat Boxes - Stack ทีละชั้นจากขวา */}
        <div className="fixed bottom-0 right-4 flex flex-col-reverse gap-2 pointer-events-none">
          {activeChats.map((chat) => (
            <div
              key={chat.chatUser.id}
              className="pointer-events-auto"
            >
              <ChatBox
                chatId={chat.chatId}
                chatUser={chat.chatUser}
                currentUser={safeUser}
                onClose={() => handleChatClose(chat.chatUser.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </SocketProvider>
  );
}