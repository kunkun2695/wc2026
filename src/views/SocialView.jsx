import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, MessageCircle, Share2, Image as ImageIcon, Smile, MoreHorizontal, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Danh sách Emoji phổ biến để anh em nhanh chóng chọn
const EMOJIS = ['⚽', '🏆', '🔥', '👏', '🙌', '😮', '😢', '😍', '🇻🇳', '🤣', '💪', '👇'];

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
          <div className="post-author">{post.name || post.username}</div>
          <div className="post-time">{new Date(post.created_at).toLocaleString('vi-VN')}</div>
        </div>
        <button className="post-more-btn"><MoreHorizontal size={18} /></button>
      </div>

      <div className="post-content">
        <div className="post-text">{post.content}</div>
        {post.image_url && (
          <div className="post-image-container">
            <img src={post.image_url} alt="post" className="post-image" />
          </div>
        )}
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
  const [image, setImage] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [comments, setComments] = useState([]);
  const fileInputRef = useRef(null);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addEmoji = (emoji) => {
    setContent(prev => prev + emoji);
    setShowEmojis(false);
  };

  const handleCreatePost = async () => {
    if (!content.trim() && !image) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}`
        },
        body: JSON.stringify({ content, image_url: image })
      });
      if (res.ok) {
        setContent('');
        setImage(null);
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
        fetchPosts();
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

          {image && (
            <div className="composer-image-preview">
              <img src={image} alt="preview" />
              <button className="remove-img-btn" onClick={() => setImage(null)}><X size={16} /></button>
            </div>
          )}

          <div className="composer-footer">
            <div className="composer-tools">
              <button className="tool-btn" onClick={() => fileInputRef.current.click()}>
                <ImageIcon size={18} /> <span>Ảnh</span>
              </button>
              <div className="emoji-tool-wrapper">
                <button className="tool-btn" onClick={() => setShowEmojis(!showEmojis)}>
                  <Smile size={18} /> <span>Cảm xúc</span>
                </button>
                <AnimatePresence>
                  {showEmojis && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="emoji-picker-mini"
                    >
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => addEmoji(e)} className="emoji-btn">{e}</button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <input 
              type="file" 
              hidden 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleImageChange} 
            />

            <button 
              className="post-submit-btn" 
              onClick={handleCreatePost}
              disabled={submitting || (!content.trim() && !image)}
            >
              {submitting ? 'ĐANG ĐĂNG...' : 'ĐĂNG BÀI'}
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="social-posts-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải bảng tin...</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} onOpenComments={openComments} />
            ))
          )}
        </div>
      </div>

      {/* Comments Drawer */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={() => setSelectedPost(null)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="comments-drawer">
              <div className="drawer-header">
                <h3>Bình luận</h3>
                <button className="close-drawer-btn" onClick={() => setSelectedPost(null)}><X size={20} /></button>
              </div>
              <div className="comments-list">
                {comments.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#555', padding: '20px' }}>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="comment-item">
                      <img src={c.avatar || 'https://via.placeholder.com/32'} alt="av" />
                      <div className="comment-bubble">
                        <div className="comment-author">{c.name || c.username}</div>
                        <div className="comment-text">{c.content}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="comment-input-area">
                <input 
                  type="text" 
                  placeholder="Viết bình luận..." 
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                />
                <button className="send-comment-btn" onClick={handleSendComment}><Send size={18} /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .social-view-container { padding: 100px 20px 120px; min-height: 100vh; background: #0a0e17; }
        .social-feed-max { max-width: 600px; margin: 0 auto; }
        
        .post-composer-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 20px; margin-bottom: 30px; backdrop-filter: blur(20px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .composer-header { display: flex; gap: 15px; margin-bottom: 15px; }
        .composer-avatar { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #00d2ff; object-fit: cover; }
        .post-composer-card textarea { flex: 1; background: transparent; border: none; color: white; font-size: 1.05rem; outline: none; resize: none; min-height: 60px; font-family: inherit; }
        
        .composer-image-preview { position: relative; margin-bottom: 15px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
        .composer-image-preview img { width: 100%; max-height: 300px; object-fit: cover; }
        .remove-img-btn { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }

        .composer-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
        .composer-tools { display: flex; gap: 10px; }
        .tool-btn { background: rgba(255,255,255,0.03); border: none; color: #aaa; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; padding: 8px 15px; border-radius: 12px; transition: 0.2s; }
        .tool-btn:hover { background: rgba(255,255,255,0.1); color: #00d2ff; }
        
        .emoji-tool-wrapper { position: relative; }
        .emoji-picker-mini { position: absolute; bottom: 50px; left: 0; background: #1a1f2e; border: 1px solid #333; border-radius: 16px; padding: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .emoji-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 5px; border-radius: 8px; transition: 0.2s; }
        .emoji-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.2); }

        .post-submit-btn { background: linear-gradient(135deg, #00d2ff, #3a7bd5); color: white; border: none; padding: 10px 25px; border-radius: 12px; font-weight: 900; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.3s; font-size: 0.85rem; box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3); }
        .post-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 210, 255, 0.4); }
        .post-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .social-post-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 20px; margin-bottom: 20px; backdrop-filter: blur(5px); transition: 0.3s; }
        .social-post-card:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
        
        .post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
        .post-avatar { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); }
        .post-author { font-weight: 800; color: white; font-size: 1rem; }
        .post-time { font-size: 0.75rem; color: #666; margin-top: 2px; }
        .post-more-btn { margin-left: auto; background: none; border: none; color: #555; cursor: pointer; padding: 5px; }
        
        .post-text { color: #e2e8f0; line-height: 1.6; margin-bottom: 15px; white-space: pre-wrap; font-size: 1.05rem; }
        .post-image-container { border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 15px; }
        .post-image { width: 100%; display: block; max-height: 500px; object-fit: cover; }

        .post-actions { display: flex; gap: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
        .post-action-btn { background: rgba(255,255,255,0.03); border: none; color: #888; padding: 10px; border-radius: 14px; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; font-size: 0.9rem; font-weight: 700; flex: 1; justify-content: center; }
        .post-action-btn:hover { background: rgba(255,255,255,0.08); color: white; }
        .post-action-btn.liked { color: #ff4d4d; background: rgba(255, 77, 77, 0.1); }

        .loading-state { text-align: center; padding: 60px; color: #666; }
        .spinner { width: 30px; height: 30px; border: 3px solid rgba(0,210,255,0.1); border-top-color: #00d2ff; border-radius: 50%; margin: 0 auto 15px; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9000; backdrop-filter: blur(10px); }
        .comments-drawer { position: fixed; bottom: 0; left: 0; right: 0; background: #0f172a; border-radius: 32px 32px 0 0; z-index: 9001; max-height: 85vh; display: flex; flex-direction: column; border-top: 1px solid rgba(255,255,255,0.1); }
        .drawer-header { padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .drawer-header h3 { color: white; margin: 0; font-size: 1.2rem; }
        .close-drawer-btn { background: rgba(255,255,255,0.05); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .comments-list { flex: 1; overflow-y: auto; padding: 20px 25px; display: flex; flex-direction: column; gap: 18px; }
        .comment-item { display: flex; gap: 12px; }
        .comment-item img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
        .comment-bubble { background: rgba(255,255,255,0.04); padding: 12px 18px; border-radius: 20px; flex: 1; border: 1px solid rgba(255,255,255,0.02); }
        .comment-author { font-weight: 800; font-size: 0.85rem; color: #00d2ff; margin-bottom: 5px; }
        .comment-text { color: #cbd5e1; font-size: 0.95rem; line-height: 1.5; }
        
        .comment-input-area { padding: 20px 25px; background: #0a0e17; display: flex; gap: 12px; padding-bottom: calc(25px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(255,255,255,0.05); }
        .comment-input-area input { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 12px 20px; color: white; outline: none; font-size: 0.95rem; }
        .comment-input-area input:focus { border-color: #00d2ff; }
        .send-comment-btn { background: #00d2ff; color: black; width: 48px; height: 48px; border: none; border-radius: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .send-comment-btn:hover { transform: scale(1.05); background: #33e0ff; }

        @media (max-width: 768px) {
          .social-view-container { padding: 80px 15px 100px; }
          .tool-btn span { display: none; }
          .post-action-btn span { display: none; }
          .social-post-card { border-radius: 20px; padding: 15px; }
        }
      ` }} />
    </div>
  );
};

export default SocialView;
