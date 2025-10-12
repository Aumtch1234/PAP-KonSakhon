'use client';
import { useState, useEffect, useCallback } from 'react';
import FeedPost from '../Feed/page';
import CommentDialog from '../CommentDialog/page';

export default function SearchResultsClient({ initialPosts = [], initialUsers = [], initialMembers = [] }) {
  const [feeds, setFeeds] = useState(Array.isArray(initialPosts) ? initialPosts : []);
  const [members, setMembers] = useState(Array.isArray(initialMembers) ? initialMembers : []);
  const [allComments, setAllComments] = useState({});
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const loadFeeds = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/feeds', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeeds(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading feeds', err);
    }
  }, []);

  const loadPreviewComments = useCallback(async (postId) => {
    if (!postId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllComments(prev => ({ ...prev, [postId]: Array.isArray(data) ? data : [] }));
      }
    } catch (err) {
      console.error('Error loading preview comments', err);
    }
  }, []);

  useEffect(() => {
    // initialize preview comments for posts that have comments
    for (const p of feeds) {
      if (p?.comment_count > 0) loadPreviewComments(p.id);
    }
  }, [feeds, loadPreviewComments]);

  useEffect(() => {
    // If initialPosts change, update feeds
    setFeeds(Array.isArray(initialPosts) ? initialPosts : []);
  }, [initialPosts]);

  const handleCommentClick = (postId) => {
    setSelectedPostId(postId);
    setCommentDialogOpen(true);
  };

  return (
    <div>
      <div className="space-y-6">
        {feeds.map((feed) => (
          <FeedPost
            key={feed?.id}
            feed={feed || {}}
            user={JSON.parse(localStorage.getItem('user') || '{}')}
            allComments={allComments}
            onDeletePost={loadFeeds}
            onLikePost={setFeeds}
            onCommentClick={() => handleCommentClick(feed?.id)}
          />
        ))}
      </div>

      {commentDialogOpen && selectedPostId && (
        <CommentDialog
          postId={selectedPostId}
          user={JSON.parse(localStorage.getItem('user') || '{}')}
          onClose={() => {
            setCommentDialogOpen(false);
            setSelectedPostId(null);
          }}
          onCommentAdded={() => {
            // refresh feeds and preview comments for this post
            loadFeeds();
            if (selectedPostId) loadPreviewComments(selectedPostId);
          }}
        />
      )}
    </div>
  );
}
