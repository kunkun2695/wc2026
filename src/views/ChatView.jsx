import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  User,
  Smile,
  MessageSquare
} from 'lucide-react';
const formatTime = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (e) {
    return '';
  }
};

const ChatView = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('wc2026_user') || '{}');
  const token = localStorage.getItem('wc2026_token');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Lỗi lấy tin nhắn:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling mỗi 3s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data]);
        setNewMessage('');
      } else {
        alert('Gửi tin nhắn thất bại. Vui lòng đăng nhập lại.');
      }
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ padding: '50px 0' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="flex items-center gap-3">
          <div className="header-icon-box">
            <MessageSquare size={20} color="var(--primary-cyan)" />
          </div>
          <div>
            <h2 className="chat-title">Phòng Chat Tổng</h2>
            <p className="chat-subtitle">Kết nối fan bóng đá toàn cầu</p>
          </div>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          Trực tuyến
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-area">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <Smile size={48} color="#333" />
            <p>Chưa có tin nhắn nào. Hãy là người đầu tiên!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.user_id === currentUser.id;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={msg.id || idx}
                className={`message-wrapper ${isMe ? 'is-me' : ''}`}
              >
                <div className="message-content-group">
                  <div className="message-avatar">
                    {msg.avatar ? (
                      <img src={msg.avatar} alt={msg.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                  <div className="message-body">
                    <div className="message-info">
                      <span className="sender-name">{msg.name || msg.username}</span>
                      <span className="send-time">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <div className={`message-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        {!token ? (
          <div className="login-warning">
            Bạn cần đăng nhập để gửi tin nhắn
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="chat-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={sending}
            />
            <button type="submit" disabled={sending || !newMessage.trim()}>
              <Send size={18} />
            </button>
          </form>
        )}
      </div>

      <style>{`
        .chat-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          height: calc(100vh - 180px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        .chat-header {
          padding: 15px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-icon-box {
          background: rgba(58, 134, 255, 0.1);
          padding: 10px;
          border-radius: 12px;
        }
        .chat-title { font-weight: 800; font-size: 1.1rem; }
        .chat-subtitle { font-size: 0.75rem; color: #888; }
        .status-badge {
          background: rgba(0, 255, 136, 0.1);
          color: #00ff88;
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .status-dot { width: 6px; height: 6px; background: #00ff88; border-radius: 50%; animation: pulse 2s infinite; }
        
        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .empty-chat { text-align: center; padding: 50px 0; color: #555; }
        
        .message-wrapper { display: flex; }
        .is-me { justify-content: flex-end; }
        .message-content-group { display: flex; gap: 12px; max-width: 85%; }
        .is-me .message-content-group { flex-direction: row-reverse; }
        
        .message-avatar img { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--border-color); }
        .avatar-placeholder { width: 32px; height: 32px; background: #222; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #555; }
        
        .message-body { display: flex; flex-direction: column; gap: 4px; }
        .is-me .message-body { align-items: flex-end; }
        .message-info { display: flex; gap: 8px; align-items: center; }
        .sender-name { font-size: 0.75rem; font-weight: 700; color: #aaa; }
        .send-time { font-size: 0.65rem; color: #555; }
        
        .message-bubble { padding: 10px 16px; border-radius: 16px; font-size: 0.9rem; line-height: 1.4; }
        .bubble-other { background: rgba(255, 255, 255, 0.05); color: #ddd; border-top-left-radius: 2px; }
        .bubble-me { background: var(--primary-cyan); color: #000; font-weight: 600; border-top-right-radius: 2px; box-shadow: 0 4px 15px rgba(0, 243, 255, 0.2); }
        
        .chat-input-area { padding: 20px; background: rgba(0,0,0,0.2); border-top: 1px solid var(--border-color); }
        .login-warning { text-align: center; color: #ff4d4d; font-size: 0.8rem; background: rgba(255, 77, 77, 0.1); padding: 10px; border-radius: 10px; }
        
        .chat-form { display: flex; gap: 10px; }
        .chat-form input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          padding: 12px 20px;
          border-radius: 12px;
          color: white;
          outline: none;
        }
        .chat-form input:focus { border-color: var(--primary-cyan); }
        .chat-form button {
          background: var(--primary-cyan);
          color: black;
          width: 45px;
          height: 45px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.3s;
        }
        .chat-form button:hover { transform: scale(1.05); filter: brightness(1.1); }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 768px) {
          .chat-container { height: calc(100vh - 200px); border-radius: 0; border-left: none; border-right: none; }
        }
      `}</style>
    </div>
  );
};

export default ChatView;
