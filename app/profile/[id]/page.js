'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import NavBar from '../../components/NavBar/page';
import CommentDialog from '../../components/CommentDialog/page';
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { MessageCircle, UserPlus, UserCheck, UserX, X, Check, Mail, Heart, MessageSquare, Trash2, Upload, Share2 } from 'lucide-react';

// ====================================================================
//   ProfileEditDialog Component
// ====================================================================
function ProfileEditDialog({ user, onClose, onUpdate }) {
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
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
      return <img src={profileImagePreview} alt="Profile Preview" className={`${size} rounded-2xl object-cover border-4 border-white shadow-lg`} />;
    }
    if (user?.profile_image) {
      return <img src={user.profile_image} alt="Profile" className={`${size} rounded-2xl object-cover border-4 border-white shadow-lg`} />;
    }
    return <div className={`${size} bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg`}>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>;
  };

  const handleProfileInputChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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
      formData.append('bio', profileData.bio);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-t-3xl">
          <h3 className="text-xl font-bold">แก้ไขโปรไฟล์</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
          <div className="text-center mb-4">
            <div className="mx-auto w-24 h-24 mb-3">{getProfileImage(user, 'w-24 h-24')}</div>
            <label className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl cursor-pointer hover:shadow-lg transition-all">
              <Upload className="w-4 h-4" />
              อัปโหลดรูป
              <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
            </label>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อ-นามสกุล</label>
            <input type="text" name="name" value={profileData.name} onChange={handleProfileInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">อีเมล</label>
            <input type="email" name="email" value={profileData.email} onChange={handleProfileInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">เกี่ยวกับฉัน</label>
            <textarea name="bio" value={profileData.bio} onChange={handleProfileInputChange} rows="2" placeholder="บอกเล่าเกี่ยวกับตัวคุณ..." className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" />
          </div>
          <div className="pt-2 border-t">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">เปลี่ยนรหัสผ่าน</h4>
            <div className="space-y-2">
              <input type="password" name="currentPassword" value={profileData.currentPassword} onChange={handleProfileInputChange} placeholder="รหัสผ่านปัจจุบัน" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              <input type="password" name="newPassword" value={profileData.newPassword} onChange={handleProfileInputChange} minLength="6" placeholder="รหัสผ่านใหม่" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              <input type="password" name="confirmPassword" value={profileData.confirmPassword} onChange={handleProfileInputChange} minLength="6" placeholder="ยืนยันรหัสผ่านใหม่" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
          </div>
          {profileMessage && (
            <div className={`p-3 rounded-xl text-sm text-center font-medium ${profileMessage.includes('สำเร็จ') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {profileMessage}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors">ยกเลิก</button>
            <button type="submit" disabled={profileLoading} className="flex-1 py-2 px-3 rounded-xl text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg disabled:opacity-50 font-medium text-sm transition-all">{profileLoading ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ====================================================================
//   FeedPost Component
// ====================================================================
function FeedPost({ feed = {}, currentUser = {}, onDeletePost = () => {}, onUpdateLike = () => {}, onCommentClick = () => {}, allComments = {} }) {
  const [isLiking, setIsLiking] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const getProfileImageWithFallback = (userData, size = 'w-11 h-11') => {
    const userKey = userData?.id || userData?.name || 'unknown';
    const hasError = imageErrors[userKey];
    
    if (!userData?.profile_image || hasError) {
      return (
        <div className={`${size} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md`}>
          {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      );
    }

    return (
      <img
        src={userData.profile_image}
        alt="Profile"
        className={`${size} rounded-full object-cover border-2 border-white shadow-md`}
        onError={() => setImageErrors(prev => ({ ...prev, [userKey]: true }))}
      />
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
    return postDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const likeCount = feed?.like_count || 0;
  const commentCount = feed?.comment_count || 0;
  const isLiked = feed?.is_liked || false;
  const feedId = feed?.id;

  return (
    <article className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getProfileImageWithFallback({ name: feed.user_name, profile_image: feed.profile_image }, 'w-11 h-11')}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 text-sm hover:text-blue-600 transition-colors">{feed.user_name}</h4>
                {isOwner && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">คุณ</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <time>{formatTime(feed.created_at)}</time>
                <span>•</span>
                <span>สาธารณะ</span>
              </div>
            </div>
          </div>
          {isOwner && (
            <button onClick={handleDeletePost} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {feed.content && (
        <div className="px-5 pb-3">
          <p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">{feed.content}</p>
        </div>
      )}

      {/* Image */}
      {feed.image_url && (
        <div className="px-5 pb-3">
          <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            <Zoom>
              <img src={feed.image_url} alt="Post image" className="w-full h-auto max-h-96 object-cover cursor-pointer hover:scale-105 transition-transform duration-300" loading="lazy" />
            </Zoom>
          </div>
        </div>
      )}

      {/* Stats */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="px-5 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
          {likeCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white fill-current" />
              </div>
              <span>{likeCount} คนถูกใจ</span>
            </div>
          )}
          {commentCount > 0 && (
            <button onClick={onCommentClick} className="hover:text-blue-600 transition-colors">
              {commentCount} ความคิดเห็น
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center gap-1">
        <button
          onClick={handleLikePost}
          disabled={isLiking}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg transition-all font-medium ${
            isLiked
              ? 'text-red-500 bg-red-50 hover:bg-red-100'
              : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">{isLiked ? 'ถูกใจแล้ว' : 'ถูกใจ'}</span>
        </button>
        <button
          onClick={onCommentClick}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">ความคิดเห็น</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all font-medium">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">แชร์</span>
        </button>
      </div>

      {/* Comments Preview */}
      {commentCount > 0 && allComments?.[feedId]?.length > 0 && (
        <div className="px-5 pb-4 bg-gray-50/30 space-y-3">
          {allComments[feedId].slice(0, 2).map((comment) => (
            <div key={comment?.id} className="flex items-start gap-3">
              {getProfileImageWithFallback({ name: comment?.user_name, profile_image: comment?.profile_image }, 'w-8 h-8')}
              <div className="flex-1">
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                  <p className="text-xs font-medium text-gray-700 mb-1">{comment?.user_name}</p>
                  <p className="text-sm text-gray-900 break-words">{comment?.content}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-2 px-1">
                  <span>{formatTime(comment?.created_at)}</span>
                  <button className="text-gray-500 hover:text-blue-600 font-medium">ตอบกลับ</button>
                  <button className="text-gray-500 hover:text-red-600 font-medium">ถูกใจ</button>
                </div>
              </div>
            </div>
          ))}
          {commentCount > 2 && (
            <button
              onClick={onCommentClick}
              className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 rounded-lg transition-all"
            >
              ดูความคิดเห็นทั้งหมด ({commentCount})
            </button>
          )}
        </div>
      )}
    </article>
  );
}

// ====================================================================
//   ProfilePage Component
// ====================================================================
export default function ProfilePage() {
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [allComments, setAllComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ id: payload.userId });
      } catch (e) { 
        console.error('Error parsing token:', e); 
      }
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

        const [profileRes, postsRes, friendshipRes] = await Promise.all([
          fetch(`/api/profile/publicProfile?userId=${userId}`, { headers }),
          fetch(`/api/users/${userId}/posts`, { headers }),
          token ? fetch(`/api/friends/status/${userId}`, { headers }) : Promise.resolve(null)
        ]);

        const profileData = await profileRes.json();
        if (!profileRes.ok || !profileData.success) {
          throw new Error(profileData.error || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
        }
        setUser(profileData.user);

        const postsData = await postsRes.json();
        if (postsRes.ok && postsData.success) {
          setPosts(postsData.posts);
          
          const commentsByPost = {};
          postsData.posts.forEach(post => {
            if (post.comments && Array.isArray(post.comments)) {
              commentsByPost[post.id] = post.comments;
            }
          });
          setAllComments(commentsByPost);
        }

        if (friendshipRes) {
          const friendshipData = await friendshipRes.json();
          if (friendshipRes.ok) {
            setFriendshipStatus(friendshipData.status);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const isOwnProfile = currentUser?.id === parseInt(userId);

  const handleFriendAction = async (action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/friends/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId: parseInt(userId) })
      });

      if (response.ok) {
        const result = await response.json();
        setFriendshipStatus(result.status);
      }
    } catch (error) {
      console.error('Friend action error:', error);
    }
    setActionLoading(false);
  };

  const handleStartChat = () => {
    window.location.href = `/chat/${userId}`;
  };

  const handleUpdateLike = (postId, isLiked, likeCount) => {
    setPosts(prevPosts =>
      prevPosts.map(p =>
        p.id === postId ? { ...p, is_liked: isLiked, like_count: likeCount } : p
      )
    );
  };
  
  const handleDeletePost = (postId) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

  const handleCommentAdded = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const postsRes = await fetch(`/api/users/${userId}/posts`, { headers });
      const postsData = await postsRes.json();
      if (postsRes.ok && postsData.success) {
        setPosts(postsData.posts);
        const commentsByPost = {};
        postsData.posts.forEach(post => {
          if (post.comments && Array.isArray(post.comments)) {
            commentsByPost[post.id] = post.comments;
          }
        });
        setAllComments(commentsByPost);
      }
    } catch (err) {
      console.error('Error refreshing posts:', err);
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(prevUser => ({...prevUser, ...updatedUser}));
  };

  const renderFriendButton = () => {
    if (isOwnProfile) {
      return (
        <button 
          onClick={() => setIsEditDialogOpen(true)} 
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Mail className="w-4 h-4" />
          แก้ไขโปรไฟล์
        </button>
      );
    }

    if (actionLoading) {
      return (
        <button disabled className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl font-medium text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </button>
      );
    }

    switch (friendshipStatus) {
      case 'friends':
        return (
          <div className="flex gap-2">
            <button onClick={handleStartChat} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              ข้อความ
            </button>
            <button onClick={() => handleFriendAction('remove')} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-red-50 hover:text-red-600 transition-all">
              ยกเลิก
            </button>
          </div>
        );
      case 'pending':
        return (
          <button onClick={() => handleFriendAction('cancel')} className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-medium text-sm hover:shadow-md transition-all">
            รอการตอบรับ
          </button>
        );
      case 'waiting':
        return (
          <div className="flex gap-2">
            <button onClick={() => handleFriendAction('accept')} className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all flex items-center gap-1">
              <Check className="w-4 h-4" />
              ยอมรับ
            </button>
            <button onClick={() => handleFriendAction('reject')} className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all">
              ปฏิเสธ
            </button>
          </div>
        );
      default:
        return (
          <button onClick={() => handleFriendAction('send')} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            เพิ่มเป็นเพื่อน
          </button>
        );
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm font-medium">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm text-center border border-gray-100">
          <div className="text-red-500 mb-2">
            <X className="w-12 h-12 mx-auto" />
          </div>
          <p className="font-semibold text-red-700 mb-1">เกิดข้อผิดพลาด</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 mb-6">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-2xl mb-4 relative -m-6 mb-4 rounded-t-3xl"></div>

            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 mb-6">
              {/* Avatar */}
              <div className="relative z-10">
                {user.profile_image ? (
                  <img src={user.profile_image} alt={user.name} className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-4xl border-4 border-white shadow-lg">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{user.name}</h1>
                <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2 mb-4">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {renderFriendButton()}
                </div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mb-6 border border-purple-100">
                <p className="text-gray-700 text-sm leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-shadow">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-2xl text-gray-900">{user.total_posts || 0}</p>
                <p className="text-xs text-gray-600 font-medium">โพสต์</p>
              </div>
              <div className="text-center p-4 hover:bg-red-50 rounded-xl transition-colors cursor-pointer group">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-shadow">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-2xl text-gray-900">{user.total_likes_received || 0}</p>
                <p className="text-xs text-gray-600 font-medium">ไลค์ที่ได้รับ</p>
              </div>
              <div className="text-center p-4 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:shadow-lg transition-shadow">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-2xl text-gray-900">{user.total_comments_received || 0}</p>
                <p className="text-xs text-gray-600 font-medium">ความเห็น</p>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">โพสต์ทั้งหมด</h2>
              <span className="ml-auto bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full font-semibold text-sm">
                {posts.length} โพสต์
              </span>
            </div>
            
            {posts.length > 0 ? (
              <div className="space-y-4">
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
                    allComments={allComments}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">ยังไม่มีโพสต์</p>
                <p className="text-gray-400 text-sm mt-2">เริ่มแชร์ความคิดเห็นของคุณได้เลย!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditDialogOpen && (
        <ProfileEditDialog
          user={user}
          onClose={() => setIsEditDialogOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

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