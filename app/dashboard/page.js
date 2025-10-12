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
import ChatBox from '../components/ChatBox/page';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feeds, setFeeds] = useState([]);
  const [members, setMembers] = useState([]);
  const [allComments, setAllComments] = useState({});
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  
  // Chat state
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  
  // Comment dialog states
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  
  // Profile dialog states
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Memoize functions to use in dependencies
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

        // Load preview comments for all posts
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
    // Prevent back navigation after login
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', preventBack);

    // Check if user is logged in
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

  // Handle highlight parameter from search
  useEffect(() => {
    const highlightParam = searchParams.get('highlight');
    if (highlightParam) {
      setHighlightedPostId(parseInt(highlightParam));
      // Scroll to highlighted post after feeds are loaded
      setTimeout(() => {
        const element = document.getElementById(`post-${highlightParam}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 1000);
      
      // Clear highlight after 5 seconds
      setTimeout(() => {
        setHighlightedPostId(null);
      }, 5000);
    }
  }, [searchParams]);

  const handleChatOpen = (chatData) => {
    setSelectedChat(chatData || {});
    setChatBoxOpen(true);
  };

  const handleChatClose = () => {
    setChatBoxOpen(false);
    setSelectedChat(null);
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
    <div className="min-h-screen bg-gray-50">
      <NavBar onLogout={handleLogout} onChatOpen={handleChatOpen} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Members */}
          <div className="lg:col-span-1">
            <MembersSidebar members={safeMembers} />
          </div>

          {/* Center - Feed */}
          <div className="lg:col-span-2">
            <CreatePost user={safeUser} onPostCreated={loadFeeds} />
            
            <div className="space-y-6">
              {safeFeeds.map((feed) => (
                <div
                  key={feed?.id}
                  id={`post-${feed?.id}`}
                  className={`transition-all duration-500 ${
                    highlightedPostId === feed?.id 
                      ? 'ring-4 ring-blue-300 ring-opacity-75 shadow-xl rounded-xl' 
                      : ''
                  }`}
                >
                  <FeedPost
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
                </div>
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

      {/* Chat Box */}
      {chatBoxOpen && selectedChat && (
        <ChatBox
          chat={selectedChat}
          user={safeUser}
          onClose={handleChatClose}
        />
      )}
    </div>
  );
}