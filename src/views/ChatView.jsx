import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Smile, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
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
            {users.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#555', marginTop: '20px' }}>Không có người dùng nào khác trực tuyến.</p>
            ) : (
              users.map(u => (
                <div key={u.id} className="user-item" onClick={() => { setSelectedUser(u); setLoading(true); }}>
                  <div className="user-avatar">
                    {u.avatar ? <img src={u.avatar} alt="" /> : <User size={24} color="#555" />}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{u.name || u.username}</div>
                    <div className="user-role">{u.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="chat-container">
            <div className="chat-header">
              {activeTab === 'private' && (
                <button className="back-btn" onClick={() => setSelectedUser(null)}><ArrowLeft size={24} /></button>
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
                      {selectedUser?.avatar ? <img src={selectedUser.avatar} alt="" /> : <User size={14} color="#888" />}
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
                  <p>Chưa có tin nhắn nào. Hãy bắt đầu!</p>
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
                          {msg.avatar ? <img src={msg.avatar} alt="" /> : <User size={16} color="#888" />}
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
        .chat-view-wrapper {
          height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 15px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .chat-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px;
          border-radius: 16px;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .tab-btn {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 700;
          color: #888;
          transition: all 0.3s;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        .tab-btn.active {
          background: var(--primary-cyan);
          color: #000;
          box-shadow: 0 4px 15px rgba(0, 243, 255, 0.3);
        }
        .chat-main-container {
          flex: 1;
          background: rgba(13, 18, 29, 0.75);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
        }
        .user-list { padding: 25px; height: 100%; overflow-y: auto; }
        .section-title { font-size: 0.8rem; color: var(--primary-cyan); text-transform: uppercase; margin-bottom: 20px; letter-spacing: 2px; font-weight: 800; }
        .user-item { display: flex; align-items: center; gap: 18px; padding: 15px; border-radius: 16px; cursor: pointer; transition: 0.2s; margin-bottom: 8px; }
        .user-item:hover { background: rgba(255, 255, 255, 0.05); transform: translateX(5px); }
        .user-avatar { width: 50px; height: 50px; background: #222; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid rgba(255, 255, 255, 0.1); }
        .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .user-name { font-weight: 700; font-size: 1rem; }
        .user-role { font-size: 0.75rem; color: #666; }

        .chat-container { display: flex; flex-direction: column; height: 100%; }
        .chat-header { padding: 18px 25px; background: rgba(255, 255, 255, 0.03); border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; gap: 15px; }
        .header-info { display: flex; align-items: center; gap: 12px; font-weight: 800; }
        .mini-avatar { width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: #333; border: 2px solid var(--primary-cyan); display: flex; align-items: center; justify-content: center; }
        .mini-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .back-btn { color: var(--primary-cyan); background: none; border: none; cursor: pointer; }

        .messages-list { flex: 1; padding: 25px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
        .message-row { display: flex; gap: 12px; max-width: 80%; }
        .row-me { align-self: flex-end; flex-direction: row-reverse; }
        .row-other { align-self: flex-start; }
        .msg-avatar { width: 36px; height: 36px; border-radius: 50%; background: #222; overflow: hidden; flex-shrink: 0; border: 1px solid rgba(255, 255, 255, 0.1); }
        
        .message-content { display: flex; flex-direction: column; gap: 5px; }
        .sender-name { font-size: 0.75rem; color: #666; font-weight: 700; margin: 0 10px; }
        .message-bubble { padding: 12px 18px; border-radius: 20px; font-size: 0.95rem; position: relative; line-height: 1.5; }
        .bubble-me { background: var(--primary-cyan); color: #000; border-bottom-right-radius: 4px; font-weight: 500; }
        .bubble-other { background: rgba(255, 255, 255, 0.1); color: #fff; border-bottom-left-radius: 4px; }
        .msg-time { font-size: 0.65rem; opacity: 0.5; display: block; margin-top: 5px; }
        .row-me .msg-time { text-align: right; color: rgba(0,0,0,0.5); }

        .chat-form { padding: 20px 25px; border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; gap: 12px; }
        .chat-form input { flex: 1; background: rgba(26, 31, 46, 0.8); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 14px 20px; color: white; outline: none; }
        .chat-form input:focus { border-color: var(--primary-cyan); }
        .chat-form button { background: var(--primary-cyan); color: #000; width: 50px; height: 50px; border-radius: 16px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
        .chat-form button:disabled { opacity: 0.4; }
        
        .chat-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 15px; }
        .loader { width: 40px; height: 40px; border: 3px solid rgba(0,243,255,0.1); border-top-color: var(--primary-cyan); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .chat-view-wrapper { height: calc(100vh - 160px); padding: 0; gap: 0; }
          .chat-main-container { border-radius: 0; border: none; }
          .chat-tabs { border-radius: 0; border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        }
      `}</style>
    </div>
  );
};

export default ChatView;
