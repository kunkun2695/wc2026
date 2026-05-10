import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageSquare, Trash2, X, User } from 'lucide-react';
import { mockAuth } from '../data/mockAuth';
import API_URL from '../config';

const CommentSection = ({ matchId, matchTitle, onClose, onCommentChange, isInline = false }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const currentUser = mockAuth.getCurrentUser();

  const fetchComments = async () => {
    try {
      const host = window.location.hostname;
      const res = await fetch(`${API_URL}/api/comments/${matchId}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi lấy bình luận:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // Auto refresh every 10 seconds for "live" feel
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    setSending(true);
    try {
      const host = window.location.hostname;
      const res = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockAuth.getToken()}`
        },
        body: JSON.stringify({ match_id: matchId, content: newComment })
      });

      if (res.ok) {
        const addedComment = await res.json();
        setComments([...comments, addedComment]);
        setNewComment('');
        if (onCommentChange) onCommentChange();
      }
    } catch (err) {
      console.error('Lỗi gửi bình luận:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
      const host = window.location.hostname;
      const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${mockAuth.getToken()}`
        }
      });

      if (res.ok) {
        setComments(comments.filter(c => c.id !== commentId));
        if (onCommentChange) onCommentChange();
      }
    } catch (err) {
      console.error('Lỗi xóa bình luận:', err);
    }
  };

  return (
    <motion.div 
      initial={isInline ? { opacity: 0 } : { opacity: 0, y: 100 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={isInline ? { opacity: 0 } : { opacity: 0, y: 100 }}
      className={`comment-section-base ${isInline ? 'is-inline' : 'comment-drawer'}`}
    >
      <div className="comment-header">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-cyan-400" />
          <h3 className="font-outfit font-bold text-sm">Gáy cho trận: {matchTitle}</h3>
        </div>
        {!isInline && (
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        )}
      </div>

      <div className="comment-list" ref={scrollRef}>
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="empty-comments">
            <MessageSquare size={40} className="opacity-20 mb-2" />
            <p>Chưa có ai gáy cả. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={`comment-item ${comment.user_id === currentUser?.id ? 'own' : ''}`}>
              <div className="comment-avatar">
                {comment.avatar ? (
                  <img src={comment.avatar} alt="avatar" />
                ) : (
                  <div className="avatar-placeholder"><User size={12} /></div>
                )}
              </div>
              <div className="comment-content-wrapper">
                <div className="comment-user-info">
                  <span className="comment-username">{comment.name || comment.username}</span>
                  <span className="comment-time">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="comment-text">{comment.content}</div>
              </div>
              {(comment.user_id === currentUser?.id || currentUser?.role === 'admin') && (
                <button onClick={() => handleDelete(comment.id)} className="delete-comment-btn">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <form className="comment-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          placeholder="Nhập nội dung gáy..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newComment.trim()}>
          <Send size={18} />
        </button>
      </form>

      <style dangerouslySetInnerHTML={{ __html: `
        .comment-section-base {
          display: flex;
          flex-direction: column;
          background: #0f172a;
        }
        .comment-drawer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70vh;
          border-top: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px 24px 0 0;
          z-index: 7000;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
          max-width: 600px;
          margin: 0 auto;
        }
        .is-inline {
          height: 100%;
          width: 100%;
        }
        .comment-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .close-btn {
          background: rgba(255,255,255,0.05);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .comment-list {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .empty-comments {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: rgba(255,255,255,0.3);
          font-size: 0.9rem;
        }
        .comment-item {
          display: flex;
          gap: 12px;
          position: relative;
          max-width: 85%;
        }
        .comment-item.own {
          align-self: flex-end;
          flex-direction: row-reverse;
          text-align: right;
        }
        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .comment-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.5);
        }
        .comment-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .comment-user-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .comment-item.own .comment-user-info {
          flex-direction: row-reverse;
        }
        .comment-username {
          font-size: 0.75rem;
          font-weight: 800;
          color: #00d2ff;
        }
        .comment-time {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.3);
        }
        .comment-text {
          background: rgba(255,255,255,0.05);
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.9rem;
          color: white;
          border: 1px solid rgba(255,255,255,0.05);
          word-break: break-word;
        }
        .comment-item.own .comment-text {
          background: #00d2ff;
          color: black;
          border: none;
        }
        .delete-comment-btn {
          position: absolute;
          top: 0;
          right: -24px;
          background: none;
          border: none;
          color: #ff4d4d;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .comment-item:hover .delete-comment-btn {
          opacity: 1;
        }
        .comment-item.own .delete-comment-btn {
          right: auto;
          left: -24px;
        }
        .comment-input-area {
          padding: 20px;
          background: #1e293b;
          display: flex;
          gap: 10px;
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
        }
        .comment-input-area input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-size: 0.9rem;
        }
        .comment-input-area button {
          width: 48px;
          height: 48px;
          background: #00d2ff;
          color: black;
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        .comment-input-area button:disabled {
          background: #444;
          color: #888;
        }
        .comment-input-area button:active {
          transform: scale(0.9);
        }
      ` }} />
    </motion.div>
  );
};

export default CommentSection;
