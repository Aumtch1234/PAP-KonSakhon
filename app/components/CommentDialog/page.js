'use client';
import { useState, useEffect } from 'react';

export default function CommentDialog({ 
  postId = null, 
  user = {}, 
  onClose = () => {}, 
  onCommentAdded = () => {} 
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Image upload states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const getProfileImage = (userData, size = 'w-10 h-10') => {
    if (userData?.profile_image) {
      return (
        <img
          src={userData.profile_image}
          alt="Profile"
          className={`${size} rounded-full object-cover`}
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
      );
    } else {
      return (
        <div className={`${size} bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm`}>
          {userData?.name?.charAt(0)?.toUpperCase() || userData?.user_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      );
    }
  };

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('รูปภาพต้องมีขนาดไม่เกิน 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if ((!newComment.trim() && !selectedImage) || !postId) return;

    setLoadingComment(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('content', newComment || '');
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setComments(prev => [...prev, result?.comment || {}]);
        setNewComment('');
        setSelectedImage(null);
        setImagePreview(null);
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!postId || !confirm('ต้องการลบความคิดเห็นนี้หรือไม่?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment?.id !== commentId));
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const currentUserId = user?.id;
  const safeComments = Array.isArray(comments) ? comments : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">ความคิดเห็น</h3>
            <span className="text-sm text-gray-500">({safeComments.length})</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {safeComments.map((comment) => (
                <div key={comment?.id} className="flex items-start space-x-3">
                  {getProfileImage({ 
                    name: comment?.user_name, 
                    profile_image: comment?.profile_image 
                  })}
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-700 mb-1">
                            {comment?.user_name || 'Unknown'}
                          </p>
                          {comment?.content && (
                            <p className="text-gray-800 leading-relaxed mb-2">
                              {comment?.content || ''}
                            </p>
                          )}
                          {comment?.image_url && (
                            <div className="mt-2">
                              <img
                                src={comment.image_url}
                                alt="Comment image"
                                className="max-w-full h-auto max-h-64 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(comment.image_url, '_blank')}
                              />
                            </div>
                          )}
                        </div>
                        {comment?.user_id === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(comment?.id)}
                            className="text-red-400 hover:text-red-600 text-xs ml-2 p-1 rounded transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 ml-3">
                      <p className="text-xs text-gray-500">
                        {comment?.created_at ? new Date(comment.created_at).toLocaleString('th-TH') : ''}
                      </p>
                      <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors duration-200">
                        ถูกใจ
                      </button>
                      <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors duration-200">
                        ตอบกลับ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {safeComments.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <div className="mb-4">
                    <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">ยังไม่มีความคิดเห็น</h4>
                  <p className="text-sm">เป็นคนแรกที่แสดงความคิดเห็นในโพสต์นี้</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Comment Form */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl">
          <form onSubmit={handleAddComment} className="flex items-start space-x-3">
            {getProfileImage(user)}
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="เขียนความคิดเห็น..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                  rows="2"
                />
              </div>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-3 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-40 rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="comment-image-upload"
                  />
                  <label
                    htmlFor="comment-image-upload"
                    className="text-gray-400 hover:text-blue-500 transition-colors duration-200 cursor-pointer p-1 rounded"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>
                  <div className="text-xs text-gray-500">
                    เพิ่มรูปภาพ (สูงสุด 5MB)
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={(!newComment.trim() && !selectedImage) || loadingComment}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                >
                  {loadingComment ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>กำลังส่ง...</span>
                    </div>
                  ) : (
                    'ส่งความคิดเห็น'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}