'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '../components/NavBar/page';
import MembersSidebar from '../components/MembersSidebar/page';
import CreatePost from '../components/CreatePost/page';
import FeedPost from '../components/Feed/page';
import CommentDialog from '../components/CommentDialog/page';
import ProfileEditDialog from '../components/ProfileEdit/page';
import ProfileSidebar from '../components/ProfileSidebar/page';
import ChatBox from '../components/ChatBox';
import { SocketProvider } from '../components/SocketProvider';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feeds, setFeeds] = useState([]);
  const [members, setMembers] = useState([]);
  const [allComments, setAllComments] = useState({});
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  
  // Chat state - รองรับหลาย chat boxes
  const [activeChats, setActiveChats] = useState([]);
  
  // Comment dialog states
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  
  // Profile dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const preventBack = useCallback(() => {
    window.history.pushState(null, null, window.location.pathname);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.removeEventListener('popstate', preventBack);
    router.replace('/');
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

  const handleChatOpen = async (chatData) => {
    if (!chatData?.id) return;

    // ตรวจสอบว่ามี chat นี้เปิดอยู่แล้วหรือไม่
    const existingChat = activeChats.find(chat => chat.chatUser.id === chatData.id);
    if (existingChat) {
      // ถ้ามีอยู่แล้ว ไม่ต้องทำอะไร
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // สร้างหรือดึง chat_id จาก API
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
      
      // เพิ่ม chat ใหม่เข้าไปใน array
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
  };

  const handleChatClose = (chatUserId) => {
    setActiveChats(prev => prev.filter(chat => chat.chatUser.id !== chatUserId));
  };

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
        <NavBar onLogout={handleLogout} onChatOpen={handleChatOpen} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Members */}
            <div className="lg:col-span-1">
              <MembersSidebar members={safeMembers} onChatOpen={handleChatOpen} />
            </div>

            {/* Center - Feed */}
            <div className="lg:col-span-2">
              <CreatePost user={safeUser} onPostCreated={loadFeeds} />
              
              <div className="space-y-6">
                {safeFeeds.map((feed) => (
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
                ))}
              </div>
            </div>

            {/* Right Sidebar - User Profile */}
            <div className="lg:col-span-1">
              <ProfileSidebar
                user={safeUser}
                feeds={safeFeeds}
                members={safeMembers}
                onEditProfile={() => setProfileDialogOpen(true)}
              />
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

        {/* Multiple Chat Boxes */}
        {activeChats.map((chat, index) => (
          <div
            key={chat.chatUser.id}
            style={{
              right: `${(index * 336) + 16}px` // 320px width + 16px margin
            }}
            className="fixed bottom-0 z-50"
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
    </SocketProvider>
  );
}