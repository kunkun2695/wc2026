import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, MessageCircle, Share2, Image as ImageIcon, Smile, MoreHorizontal } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const PostCard = ({ post, onLike, onOpenComments }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(parseInt(post.likes_count));

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike(post.id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="social-post-card"
    >
      <div className="post-header">
        <img src={post.avatar || 'https://via.placeholder.com/40'} alt="avatar" className="post-avatar" />
        <div className="post-meta">
          <div className="post-author">{post.name}</div>
          <div className="post-time">{new Date(post.created_at).toLocaleString('vi-VN')}</div>
        </div>
        <button className="post-more-btn"><MoreHorizontal size={18} /></button>
      </div>

      <div className="post-content">
        {post.content}
        {post.image_url && <img src={post.image_url} alt="post" className="post-image" />}
      </div>

      <div className="post-actions">
        <button 
          className={`post-action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <Heart size={20} fill={isLiked ? "#ff4d4d" : "none"} />
          <span>{likesCount}</span>
        </button>
        <button className="post-action-btn" onClick={() => onOpenComments(post)}>
          <MessageCircle size={20} />
          <span>{post.comments_count}</span>
        </button>
        <button className="post-action-btn">
          <Share2 size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const SocialView = () => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}` }
      });
      const data = await res.json();
      setPosts(data);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleCreatePost = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}`
        },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        setContent('');
        fetchPosts();
      }
    } catch (err) {} finally { setSubmitting(false); }
  };

  const handleLike = async (postId) => {
    try {
      await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}` }
      });
    } catch (err) {}
  };

  const openComments = async (post) => {
    setSelectedPost(post);
    try {
      const res = await fetch(`${API_URL}/api/posts/${post.id}/comments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}` }
      });
      const data = await res.json();
      setComments(data);
    } catch (err) {}
  };

  const handleSendComment = async () => {
    if (!commentContent.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}`
        },
        body: JSON.stringify({ content: commentContent })
      });
      if (res.ok) {
        setCommentContent('');
        openComments(selectedPost);
        fetchPosts(); // Cập nhật số lượng comment ngoài feed
      }
    } catch (err) {}
  };

  return (
    <div className="social-view-container">
      <div className="social-feed-max">
        {/* Post Composer */}
        <div className="post-composer-card">
          <div className="composer-header">
            <img src="https://via.placeholder.com/40" alt="me" className="composer-avatar" />
            <textarea 
              placeholder="Bạn đang nghĩ gì về các trận đấu hôm nay?" 
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="composer-footer">
            <div className="composer-tools">
              <button className="tool-btn"><ImageIcon size={18} /> Ảnh</button>
              <button className="tool-btn"><Smile size={18} /> Cảm xúc</button>
            </div>
            <button 
              className="post-submit-btn" 
              onClick={handleCreatePost}
              disabled={submitting || !content.trim()}
            >
              {submitting ? 'ĐANG ĐĂNG...' : 'ĐĂNG BÀI'}
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="social-posts-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Đang tải bảng tin...</div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} onOpenComments={openComments} />
            ))
          )}
        </div>
      </div>

      {/* Comments Drawer/Modal */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedPost(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="comments-drawer">
              <div className="drawer-header">
                <h3>Bình luận</h3>
                <button onClick={() => setSelectedPost(null)}>Đóng</button>
              </div>
              <div className="comments-list">
                {comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <img src={c.avatar || 'https://via.placeholder.com/32'} alt="av" />
                    <div className="comment-bubble">
                      <div className="comment-author">{c.name}</div>
                      <div className="comment-text">{c.content}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="comment-input-area">
                <input 
                  type="text" 
                  placeholder="Viết bình luận..." 
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                />
                <button onClick={handleSendComment}><Send size={18} /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .social-view-container { padding: 100px 20px 100px; min-height: 100vh; }
        .social-feed-max { max-width: 600px; margin: 0 auto; }
        
        .post-composer-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 20px; margin-bottom: 30px; backdrop-filter: blur(10px); }
        .composer-header { display: flex; gap: 15px; margin-bottom: 15px; }
        .composer-avatar { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #00d2ff; }
        .post-composer-card textarea { flex: 1; background: transparent; border: none; color: white; font-size: 1rem; outline: none; resize: none; min-height: 80px; font-family: inherit; }
        
        .composer-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
        .composer-tools { display: flex; gap: 15px; }
        .tool-btn { background: none; border: none; color: #888; display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
        .tool-btn:hover { color: #00d2ff; }
        
        .post-submit-btn { background: #00d2ff; color: black; border: none; padding: 10px 25px; border-radius: 12px; font-weight: 900; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; font-size: 0.8rem; }
        .post-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .social-post-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 20px; margin-bottom: 20px; backdrop-filter: blur(5px); }
        .post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
        .post-avatar { width: 40px; height: 40px; border-radius: 50%; }
        .post-author { font-weight: 800; color: white; font-size: 0.95rem; }
        .post-time { font-size: 0.7rem; color: #555; }
        .post-more-btn { margin-left: auto; background: none; border: none; color: #555; cursor: pointer; }
        
        .post-content { color: #e2e8f0; line-height: 1.6; margin-bottom: 20px; white-space: pre-wrap; font-size: 1rem; }
        .post-image { width: 100%; border-radius: 16px; margin-top: 15px; }

        .post-actions { display: flex; gap: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
        .post-action-btn { background: rgba(255,255,255,0.03); border: none; color: #888; padding: 8px 20px; border-radius: 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; font-size: 0.85rem; font-weight: 700; flex: 1; justify-content: center; }
        .post-action-btn:hover { background: rgba(255,255,255,0.08); color: white; }
        .post-action-btn.liked { color: #ff4d4d; background: rgba(255, 77, 77, 0.1); }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9000; backdrop-filter: blur(5px); }
        .comments-drawer { position: fixed; bottom: 0; left: 0; right: 0; background: #1a1f2e; border-radius: 30px 30px 0 0; z-index: 9001; max-height: 85vh; display: flex; flex-direction: column; }
        .drawer-header { padding: 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; }
        .drawer-header h3 { color: white; margin: 0; }
        .drawer-header button { background: none; border: none; color: #00d2ff; font-weight: 700; cursor: pointer; }
        
        .comments-list { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        .comment-item { display: flex; gap: 12px; }
        .comment-item img { width: 32px; height: 32px; border-radius: 50%; }
        .comment-bubble { background: rgba(255,255,255,0.05); padding: 12px 18px; border-radius: 20px; flex: 1; }
        .comment-author { font-weight: 900; font-size: 0.75rem; color: #00d2ff; margin-bottom: 4px; }
        .comment-text { color: white; font-size: 0.9rem; line-height: 1.4; }
        
        .comment-input-area { padding: 20px; background: #000; display: flex; gap: 10px; padding-bottom: calc(20px + env(safe-area-inset-bottom)); }
        .comment-input-area input { flex: 1; background: #1a1f2e; border: 1px solid #333; border-radius: 12px; padding: 12px 20px; color: white; outline: none; }
        .comment-input-area button { background: #00d2ff; color: black; border: none; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        @media (max-width: 768px) {
          .social-view-container { padding-top: 80px; }
          .post-action-btn span { display: none; }
        }
      ` }} />
    </div>
  );
};

export default SocialView;
