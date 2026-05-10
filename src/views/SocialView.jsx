import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, MessageCircle, Share2, Image as ImageIcon, Smile, MoreHorizontal, X } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import API_URL from '../config';

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
        <UserAvatar src={post.avatar} size={40} className="post-avatar" />
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
  const textareaRef = useRef(null);

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
        if (textareaRef.current) textareaRef.current.style.height = '80px';
        fetchPosts();
      } else {
        const data = await res.json();
        alert('Lỗi đăng bài: ' + (data.error || 'Vui lòng thử lại'));
      }
    } catch (err) {
      alert('Lỗi kết nối server: ' + err.message);
    } finally { setSubmitting(false); }
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
            <UserAvatar src={localStorage.getItem('wc2026_user') ? JSON.parse(localStorage.getItem('wc2026_user')).avatar : '👤'} size={40} className="composer-avatar" />
            <textarea 
              ref={textareaRef}
              placeholder="Bạn đang nghĩ gì về các trận đấu hôm nay?" 
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              style={{ overflowY: 'hidden' }}
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
              <label htmlFor="social-image-upload" className="tool-btn">
                <ImageIcon size={18} /> <span>Ảnh</span>
                <input 
                  id="social-image-upload"
                  type="file" 
                  hidden 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
              </label>
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
            posts.length > 0 ? posts.map(post => {
              const userString = localStorage.getItem('wc2026_user');
              const currentUser = userString ? JSON.parse(userString) : null;
              const isMe = currentUser && post.user_id == currentUser.id;
              return (
                <PostCard key={post.id} post={post} onLike={handleLike} onOpenComments={openComments} />
              )
            }) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Chưa có bài viết nào.</div>
            )
          )}
        </div>
      </div>

      {/* Comments Drawer - Modern Premium Version */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="modern-modal-overlay" 
              onClick={() => setSelectedPost(null)} 
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="modern-comments-drawer"
            >
              <div className="modern-drawer-handle" />
              
              <div className="modern-drawer-header">
                <div className="header-title-group">
                  <MessageCircle size={24} className="header-icon" />
                  <div>
                    <h3>Thảo luận sôi nổi</h3>
                    <span>{comments.length} bình luận</span>
                  </div>
                </div>
                <button className="modern-close-btn" onClick={() => setSelectedPost(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modern-comments-list">
                {comments.length === 0 ? (
                  <div className="empty-comments">
                    <div className="empty-icon">💬</div>
                    <p>Chưa có ai lên tiếng... Hãy là người mở màn!</p>
                  </div>
                ) : (
                  comments.map((c, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={c.id} 
                      className="modern-comment-item"
                    >
                      <div className="avatar-wrapper">
                        <UserAvatar src={c.avatar} size={40} />
                        <div className="online-indicator" />
                      </div>
                      <div className="modern-comment-content">
                        <div className="comment-info">
                          <span className="author-name">{c.name || c.username}</span>
                          <span className="comment-date">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="comment-text-bubble">
                          {c.content}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="modern-input-section">
                <div className="input-container-glass">
                  <input 
                    type="text" 
                    placeholder="Viết điều gì đó thật hay..." 
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                  />
                  <button 
                    className={`modern-send-btn ${commentContent.trim() ? 'active' : ''}`}
                    onClick={handleSendComment}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .modern-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9000; backdrop-filter: blur(8px); }
        .modern-comments-drawer { 
          position: fixed; bottom: 0; left: 0; right: 0; 
          background: rgba(15, 23, 42, 0.95); 
          border-radius: 32px 32px 0 0; 
          z-index: 9001; 
          max-height: 85vh; 
          display: flex; flex-direction: column; 
          border-top: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 -20px 50px rgba(0,0,0,0.5);
          backdrop-filter: blur(25px);
        }
        
        .modern-drawer-handle {
          width: 40px; height: 5px; background: rgba(255,255,255,0.2);
          border-radius: 10px; margin: 12px auto;
        }

        .modern-drawer-header {
          padding: 10px 25px 20px; display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .header-title-group { display: flex; align-items: center; gap: 15px; }
        .header-icon { color: #00d2ff; filter: drop-shadow(0 0 8px rgba(0,210,255,0.5)); }
        .header-title-group h3 { color: white; margin: 0; font-size: 1.2rem; font-weight: 800; }
        .header-title-group span { color: #64748b; font-size: 0.85rem; font-weight: 600; }
        
        .modern-close-btn { 
          background: rgba(255,255,255,0.05); border: none; color: white; 
          width: 36px; height: 36px; border-radius: 50%; display: flex; 
          align-items: center; justify-content: center; cursor: pointer; transition: 0.3s;
        }
        .modern-close-btn:hover { background: rgba(255,255,255,0.15); transform: rotate(90deg); }

        .modern-comments-list { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 20px; }
        
        .modern-comment-item { display: flex; gap: 15px; }
        .avatar-wrapper { position: relative; }
        .avatar-wrapper img { 
          width: 40px; height: 40px; border-radius: 14px; object-fit: cover;
          border: 2px solid rgba(0,210,255,0.2);
        }
        .online-indicator {
          position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px;
          background: #10b981; border: 2px solid #0f172a; border-radius: 50%;
        }

        .modern-comment-content { flex: 1; }
        .comment-info { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .author-name { color: #f1f5f9; font-weight: 800; font-size: 0.9rem; }
        .comment-date { color: #64748b; font-size: 0.7rem; font-weight: 600; }
        
        .comment-text-bubble {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 12px 18px; border-radius: 20px; border-top-left-radius: 4px;
          color: #cbd5e1; font-size: 0.95rem; line-height: 1.5;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .empty-comments { text-align: center; padding: 60px 20px; color: #475569; }
        .empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }

        .modern-input-section { 
          padding: 20px 25px; background: rgba(15, 23, 42, 0.8);
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-bottom: calc(25px + env(safe-area-inset-bottom));
        }
        .input-container-glass {
          display: flex; gap: 12px; align-items: center;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 8px 8px 8px 20px; border-radius: 20px;
          transition: 0.3s;
        }
        .input-container-glass:focus-within {
          border-color: #00d2ff; background: rgba(255,255,255,0.05);
          box-shadow: 0 0 20px rgba(0,210,255,0.1);
        }
        .input-container-glass input {
          flex: 1; background: transparent; border: none; color: white;
          outline: none; font-size: 1rem; font-weight: 500;
        }
        .modern-send-btn {
          width: 44px; height: 44px; border: none; border-radius: 16px;
          background: rgba(255,255,255,0.05); color: #475569;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: 0.3s;
        }
        .modern-send-btn.active {
          background: linear-gradient(135deg, #00d2ff, #3a7bd5);
          color: white; box-shadow: 0 5px 15px rgba(0,210,255,0.4);
        }
        .modern-send-btn:hover:not(:disabled) { transform: scale(1.05); }

        @media (max-width: 768px) {
          .modern-comments-drawer { border-radius: 24px 24px 0 0; }
          .modern-comments-list { padding: 15px; }
        }
      ` }} />

      <style dangerouslySetInnerHTML={{ __html: `
        .social-view-container { 
          padding: 100px 5vw 120px; 
          min-height: 100vh; 
          background: #0a0e17; 
          display: flex;
          justify-content: center;
        }
        .social-feed-max { 
          width: 100%;
          max-width: 1200px; 
          margin-left: 0;
          padding-left: 40px;
        }
        
        .post-composer-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 20px; margin-bottom: 30px; backdrop-filter: blur(20px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .composer-header { display: flex; gap: 15px; margin-bottom: 15px; }
        .composer-avatar { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #00d2ff; object-fit: cover; }
        .post-composer-card textarea { flex: 1; background: transparent; border: none; color: white; font-size: 1.1rem; outline: none; resize: none; min-height: 80px; font-family: inherit; transition: height 0.1s; }
        
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
