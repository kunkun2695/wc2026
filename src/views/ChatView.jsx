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
  const [activeTab, setActiveTab] = useState('global'); // 'global' or 'private'
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('wc2026_user') || '{}');
  const token = localStorage.getItem('wc2026_token');
  const API_URL = import.meta.env.VITE_API_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeTab === 'global') {
      fetchGlobalMessages();
      const interval = setInterval(fetchGlobalMessages, 3000);
      return () => clearInterval(interval);
    } else if (activeTab === 'private') {
      fetchUsers();
      if (selectedUser) {
        fetchPrivateMessages();
        const interval = setInterval(fetchPrivateMessages, 3000);
        return () => clearInterval(interval);
      }
    }
  }, [activeTab, selectedUser]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dm/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data.filter(u => u.id !== currentUser.id));
      }
    } catch (err) {}
  };

  const fetchGlobalMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchPrivateMessages = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`${API_URL}/api/dm/history/${selectedUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const endpoint = activeTab === 'global' ? '/api/chat' : '/api/dm/send';
    const body = activeTab === 'global' 
      ? { content: newMessage } 
      : { receiver_id: selectedUser.id, content: newMessage };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setNewMessage('');
        activeTab === 'global' ? fetchGlobalMessages() : fetchPrivateMessages();
      }
    } catch (err) {
      console.error('Lỗi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-view-wrapper">
      <div className="chat-tabs">
        <button 
          className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => { setActiveTab('global'); setSelectedUser(null); setMessages([]); }}
        >
          <MessageSquare size={18} /> Global Chat
        </button>
        <button 
          className={`tab-btn ${activeTab === 'private' ? 'active' : ''}`}
          onClick={() => { setActiveTab('private'); setMessages([]); }}
        >
          <User size={18} /> Chat Riêng
        </button>
      </div>

      <div className="chat-main-container">
        {activeTab === 'private' && !selectedUser ? (
          <div className="user-list">
            <h3 className="section-title">Chọn người để chat</h3>
            {users.map(u => (
              <div key={u.id} className="user-item" onClick={() => { setSelectedUser(u); setLoading(true); }}>
                <div className="user-avatar">
                  {u.avatar ? <img src={u.avatar} alt="" /> : <User size={20} />}
                </div>
                <div className="user-info">
                  <div className="user-name">{u.name || u.username}</div>
                  <div className="user-role">{u.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="chat-container">
            <div className="chat-header">
              {activeTab === 'private' && (
                <button className="back-btn" onClick={() => setSelectedUser(null)}>←</button>
              )}
              <div className="header-info">
                {activeTab === 'global' ? (
                  <>
                    <MessageSquare size={20} color="var(--primary-cyan)" />
                    <span>Phòng Chat Thế Giới 2026</span>
                  </>
                ) : (
                  <>
                    <div className="mini-avatar">
                      {selectedUser?.avatar ? <img src={selectedUser.avatar} alt="" /> : <User size={14} />}
                    </div>
                    <span>Chat với {selectedUser?.name || selectedUser?.username}</span>
                  </>
                )}
              </div>
            </div>

            <div className="messages-list">
              {loading ? (
                <div className="chat-loading">
                  <div className="loader"></div>
                  <p>Đang tải tin nhắn...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="empty-chat">
                  <Smile size={48} />
                  <p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser.id || msg.username === currentUser.username;
                  return (
                    <motion.div 
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`message-row ${isMe ? 'row-me' : 'row-other'}`}
                    >
                      {!isMe && activeTab === 'global' && (
                        <div className="msg-avatar">
                          {msg.avatar ? <img src={msg.avatar} alt="" /> : <User size={16} />}
                        </div>
                      )}
                      <div className="message-content">
                        {activeTab === 'global' && !isMe && (
                          <span className="sender-name">{msg.name || msg.username}</span>
                        )}
                        <div className={`message-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                          {msg.content}
                          <span className="msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-form" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Nhập tin nhắn..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim() || sending}>
                {sending ? <div className="btn-loader"></div> : <Send size={20} />}
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
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
