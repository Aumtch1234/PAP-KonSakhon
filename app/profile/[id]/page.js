'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import NavBar from '../../components/NavBar/page';
import CommentDialog from '../../components/CommentDialog/page';
// หมายเหตุ: react-medium-image-zoom เป็น library ภายนอก
// หากคุณได้ติดตั้งไว้แล้ว สามารถ uncomment บรรทัดนี้ได้
// import Zoom from "react-medium-image-zoom";
// import "react-medium-image-zoom/dist/styles.css";

// ====================================================================
//   ProfileEditDialog Component (สำหรับแก้ไขโปรไฟล์)
// ====================================================================
function ProfileEditDialog({ user, onClose, onUpdate }) {
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const getProfileImage = (user, size = 'w-24 h-24') => {
    if (profileImagePreview) {
       return <img src={profileImagePreview} alt="Profile Preview" className={`${size} rounded-full object-cover border-4 border-blue-200 shadow-lg`} />;
    }
    if (user?.profile_image) {
      return (
        <img
          src={user.profile_image}
          alt="Profile"
          className={`${size} rounded-full object-cover border-4 border-gray-200`}
        />
      );
    } else {
      return (
        <div className={`${size} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xl`}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      );
    }
  };

  const handleProfileInputChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setProfileMessage('รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setProfileMessage('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      setNewProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfileImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage('');

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setProfileMessage('รหัสผ่านใหม่ไม่ตรงกัน');
      setProfileLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      if (profileData.currentPassword) formData.append('currentPassword', profileData.currentPassword);
      if (profileData.newPassword) formData.append('newPassword', profileData.newPassword);
      if (newProfileImage) formData.append('profileImage', newProfileImage);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        setProfileMessage('อัปเดตโปรไฟล์สำเร็จ');
        onUpdate(result.user);
        setTimeout(() => onClose(), 1500);
      } else {
        setProfileMessage(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      setProfileMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
    setProfileLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">แก้ไขโปรไฟล์</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">&times;</button>
        </div>
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 mb-4">{getProfileImage(user)}</div>
            <label className="bg-blue-500 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-600 text-sm">
              อัปโหลดรูปภาพ
              <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
            <input type="text" name="name" value={profileData.name} onChange={handleProfileInputChange} required className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
            <input type="email" name="email" value={profileData.email} onChange={handleProfileInputChange} required className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="border-t pt-6">
            <h4 className="text-md font-medium text-gray-700 mb-4">เปลี่ยนรหัสผ่าน (ไม่จำเป็น)</h4>
            <div className="space-y-4">
              <input type="password" name="currentPassword" value={profileData.currentPassword} onChange={handleProfileInputChange} placeholder="รหัสผ่านปัจจุบัน" className="w-full p-3 rounded-xl border border-gray-300" />
              <input type="password" name="newPassword" value={profileData.newPassword} onChange={handleProfileInputChange} minLength="6" placeholder="รหัสผ่านใหม่" className="w-full p-3 rounded-xl border border-gray-300" />
              <input type="password" name="confirmPassword" value={profileData.confirmPassword} onChange={handleProfileInputChange} minLength="6" placeholder="ยืนยันรหัสผ่านใหม่" className="w-full p-3 rounded-xl border border-gray-300" />
            </div>
          </div>
          {profileMessage && <div className={`p-4 rounded-xl text-center text-sm ${profileMessage.includes('สำเร็จ') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{profileMessage}</div>}
          <div className="flex space-x-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 hover:bg-gray-50">ยกเลิก</button>
            <button type="submit" disabled={profileLoading} className="flex-1 py-3 px-4 rounded-xl text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400">{profileLoading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ====================================================================
//   FeedPost Component (ตามตัวอย่างที่คุณต้องการ)
// ====================================================================
function FeedPost({ 
  feed = {}, 
  currentUser = {},
  onDeletePost = () => {}, 
  onUpdateLike = () => {},
  onCommentClick = () => {}
}) {
  const [isLiking, setIsLiking] = useState(false);

  // Helper function to get profile image with fallback
  const getProfileImageWithFallback = (userData, size = 'w-12 h-12') => {
    const initial = userData?.name?.charAt(0)?.toUpperCase() || 'U';
    
    return (
      <div className="relative flex-shrink-0">
        {userData?.profile_image ? (
          <img
            src={userData.profile_image}
            alt="Profile"
            className={`${size} rounded-full object-cover border-2 border-white shadow-sm`}
          />
        ) : (
          <div className={`${size} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm`}>
            {initial}
          </div>
        )}
      </div>
    );
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'เมื่อสักครู่';
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));
    if (diffInMinutes < 1) return 'เมื่อสักครู่';
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;
    return postDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  const handleLikePost = async () => {
    if (isLiking || !feed?.id) return;
    setIsLiking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${feed.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        // เรียกฟังก์ชันที่ส่งมาจาก Parent เพื่ออัปเดต State
        onUpdateLike(feed.id, result.isLiked, result.likeCount);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
    setIsLiking(false);
  };

  const handleDeletePost = async () => {
    if (!confirm('ต้องการลบโพสต์นี้หรือไม่?') || !feed?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${feed.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        onDeletePost(feed.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const isOwner = feed?.user_id === currentUser?.id;
  const { likes_count = 0, comments_count = 0, is_liked = false } = feed;

  return (
    <article className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 group">
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getProfileImageWithFallback({ name: feed.user_name, profile_image: feed.user_profile_image }, 'w-11 h-11')}
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{feed.user_name}</h4>
              <time className="text-sm text-gray-500">{formatTime(feed.created_at)}</time>
            </div>
          </div>
          {isOwner && (
            <button onClick={handleDeletePost} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100" title="ลบโพสต์">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          )}
        </div>
      </div>
      {feed.content && <p className="px-6 pb-4 text-gray-800 leading-relaxed whitespace-pre-wrap">{feed.content}</p>}
      {feed.image_url && (
        <div className="px-6 pb-4">
          <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            {/* หากคุณมี react-medium-image-zoom ให้ใช้ <Zoom>ครอบ <img> */}
            <img src={feed.image_url} alt="Post image" className="w-full h-auto max-h-[500px] object-cover" />
          </div>
        </div>
      )}
      
      {/* Stats Bar - แสดงจำนวนไลค์และคอมเมนต์ */}
      {(likes_count > 0 || comments_count > 0) && (
        <div className="px-6 py-2 flex items-center justify-between text-sm text-gray-500 border-t border-gray-50">
          <div className="flex items-center space-x-4">
            {likes_count > 0 && (
              <div className="flex items-center space-x-1">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-white">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <span className="ml-2">{likes_count} คนถูกใจ</span>
              </div>
            )}
          </div>
          {comments_count > 0 && (
            <button
              onClick={onCommentClick}
              className="hover:text-blue-600 transition-colors duration-200"
            >
              {comments_count} ความคิดเห็น
            </button>
          )}
        </div>
      )}
      
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-around">
          <button onClick={handleLikePost} disabled={isLiking} className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-all ${is_liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'}`}>
            <svg className={`w-5 h-5 ${is_liked ? 'fill-current' : ''}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <span className="text-sm font-medium">{is_liked ? 'ถูกใจแล้ว' : 'ถูกใจ'}</span>
          </button>
          <button
            onClick={onCommentClick}
            className="flex-1 flex items-center justify-center space-x-2 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="text-sm font-medium">ความคิดเห็น</span>
          </button>
        </div>
      </div>
    </article>
  );
}

// ====================================================================
//   ProfilePage Component (ส่วนหลักของหน้า)
// ====================================================================
export default function ProfilePage() {
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State สำหรับเปิด/ปิด Dialog
  
  // Comment dialog states
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ id: payload.userId });
      } catch (e) { console.error('Error parsing token:', e); }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchProfileData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const [profileRes, postsRes] = await Promise.all([
          fetch(`/api/profile/publicProfile?userId=${userId}`, { headers }),
          fetch(`/api/users/${userId}/posts`, { headers })
        ]);

        const profileData = await profileRes.json();
        if (!profileRes.ok || !profileData.success) {
          throw new Error(profileData.error || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
        }
        setUser(profileData.user);

        const postsData = await postsRes.json();
        if (postsRes.ok && postsData.success) {
          setPosts(postsData.posts);
        } else {
          console.error('Could not fetch posts:', postsData.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const handleUpdateLike = (postId, isLiked, likeCount) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id === postId ? { ...p, is_liked: isLiked, likes_count: likeCount } : p
      )
    );
  };
  
  const handleDeletePost = (postId) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

  // Function to refresh post data after comment is added
  const handleCommentAdded = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const postsRes = await fetch(`/api/users/${userId}/posts`, { headers });
      const postsData = await postsRes.json();
      
      if (postsRes.ok && postsData.success) {
        setPosts(postsData.posts);
      }
    } catch (err) {
      console.error('Error refreshing posts:', err);
    }
  };

  // ฟังก์ชันสำหรับรับข้อมูลที่อัปเดตจาก Dialog
  const handleProfileUpdate = (updatedUser) => {
    setUser(prevUser => ({...prevUser, ...updatedUser}));
  };
  
  if (loading) {
    return <div className="text-center py-20">กำลังโหลด...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">เกิดข้อผิดพลาด: {error}</div>;
  }

  if (!user) return null;

  const isOwnProfile = currentUser?.id == userId;

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar />
      <div className="max-w-4xl mx-auto p-4 md:p-8 pt-24">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative">
              {user.profile_image ? (
                <img 
                  src={user.profile_image} 
                  alt={user.name} 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-4xl md:text-5xl border-4 border-white shadow-lg">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="md:ml-8 mt-4 md:mt-0 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
              <p className="text-gray-500 mt-1">{user.email}</p>
              {isOwnProfile && (
                <button onClick={() => setIsEditDialogOpen(true)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  แก้ไขโปรไฟล์
                </button>
              )}
            </div>
          </div>
          <div className="border-t mt-6 pt-4 flex justify-around">
            <div className="text-center"><p className="font-bold text-xl">{user.total_posts}</p><p className="text-sm text-gray-500">โพสต์</p></div>
            <div className="text-center"><p className="font-bold text-xl">{user.total_likes_received}</p><p className="text-sm text-gray-500">ไลค์ที่ได้รับ</p></div>
            <div className="text-center"><p className="font-bold text-xl">{user.total_comments_received}</p><p className="text-sm text-gray-500">คอมเมนต์</p></div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">โพสต์ทั้งหมด</h2>
          {posts.length > 0 ? (
            <div className="space-y-6">
              {posts.map(post => (
                <FeedPost 
                  key={post.id} 
                  feed={post}
                  currentUser={currentUser}
                  onUpdateLike={handleUpdateLike}
                  onDeletePost={handleDeletePost}
                  onCommentClick={() => {
                    setSelectedPostId(post.id);
                    setCommentDialogOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              <p>ยังไม่มีโพสต์</p>
            </div>
          )}
        </div>
      </div>

      {/* แสดง Dialog แก้ไขโปรไฟล์เมื่อ isEditDialogOpen เป็น true */}
      {isEditDialogOpen && (
        <ProfileEditDialog
          user={user}
          onClose={() => setIsEditDialogOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {/* Comment Dialog */}
      {commentDialogOpen && selectedPostId && (
        <CommentDialog
          postId={selectedPostId}
          user={currentUser}
          onClose={() => {
            setCommentDialogOpen(false);
            setSelectedPostId(null);
          }}
          onCommentAdded={() => {
            handleCommentAdded();
          }}
        />
      )}
    </div>
  );
}

