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
  const [activeTab, setActiveTab] = useState('global');
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
          <MessageSquare size={18} /> Chat Tổng
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
            <h3 className="section-title">Danh sách thành viên</h3>
            {users.length === 0 ? (
              <p className="empty-text">Chưa có ai trực tuyến.</p>
            ) : (
              users.map(u => (
                <div key={u.id} className="user-item" onClick={() => { setSelectedUser(u); setLoading(true); }}>
                  <div className="user-avatar">
                    {u.avatar ? <img src={u.avatar} alt="" /> : <User size={24} color="#888" />}
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
                <button className="back-btn" onClick={() => setSelectedUser(null)}><ArrowLeft size={20} /></button>
              )}
              <div className="header-info">
                {activeTab === 'global' ? (
                  <>
                    <MessageSquare size={18} color="var(--primary-cyan)" />
                    <span>Phòng Chat Thế Giới 2026</span>
                  </>
                ) : (
                  <>
                    <div className="mini-avatar">
                      {selectedUser?.avatar ? <img src={selectedUser.avatar} alt="" /> : <User size={12} color="#888" />}
                    </div>
                    <span>{selectedUser?.name || selectedUser?.username}</span>
                  </>
                )}
              </div>
            </div>

            <div className="messages-list">
              {loading ? (
                <div className="chat-loading"><div className="loader"></div></div>
              ) : messages.length === 0 ? (
                <div className="empty-chat"><Smile size={40} /><p>Bắt đầu gáy thôi!</p></div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = (msg.user_id === currentUser.id) || (msg.sender_id === currentUser.id);
                  return (
                    <motion.div 
                      key={msg.id || idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`message-row ${isMe ? 'row-me' : 'row-other'}`}
                    >
                      {!isMe && activeTab === 'global' && (
                        <div className="msg-avatar">
                          {msg.avatar ? <img src={msg.avatar} alt="" /> : <User size={14} color="#888" />}
                        </div>
                      )}
                      <div className="message-content-wrapper">
                        {!isMe && activeTab === 'global' && (
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
              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="Nhập nội dung..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <style>{`
        .chat-view-wrapper {
          height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding: 10px;
          max-width: 600px;
          margin: 0 auto;
        }
        .chat-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
          gap: 4px;
        }
        .tab-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 700;
          color: #666;
          transition: 0.2s;
          border: none;
          background: transparent;
          cursor: pointer;
        }
        .tab-btn.active {
          background: var(--primary-cyan);
          color: #000;
        }
        .chat-main-container {
          flex: 1;
          background: #0d121d;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .user-list { padding: 20px; overflow-y: auto; }
        .section-title { font-size: 0.7rem; color: #555; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1.5px; font-weight: 800; }
        .empty-text { text-align: center; color: #444; margin-top: 30px; font-size: 0.9rem; }
        .user-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; cursor: pointer; transition: 0.2s; }
        .user-item:hover { background: rgba(255, 255, 255, 0.05); }
        .user-avatar { width: 44px; height: 44px; background: #1a1f2e; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
        .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .user-name { font-weight: 600; font-size: 0.95rem; }
        .user-role { font-size: 0.7rem; color: #555; }

        .chat-container { display: flex; flex-direction: column; height: 100%; }
        .chat-header { padding: 12px 20px; background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; gap: 12px; }
        .header-info { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 0.9rem; }
        .mini-avatar { width: 28px; height: 28px; border-radius: 50%; overflow: hidden; background: #222; border: 1.5px solid var(--primary-cyan); display: flex; align-items: center; justify-content: center; }
        .back-btn { color: var(--primary-cyan); background: none; border: none; cursor: pointer; }

        .messages-list { flex: 1; padding: 15px 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .message-row { display: flex; gap: 10px; max-width: 90%; }
        .row-me { align-self: flex-end; flex-direction: row-reverse; }
        .row-other { align-self: flex-start; }
        .msg-avatar { width: 32px; height: 32px; border-radius: 50%; background: #1a1f2e; overflow: hidden; flex-shrink: 0; margin-top: auto; }
        
        .message-content-wrapper { display: flex; flex-direction: column; gap: 4px; max-width: 100%; }
        .sender-name { font-size: 0.65rem; color: #555; font-weight: 800; margin: 0 10px; text-transform: uppercase; }
        .message-bubble { 
          padding: 10px 16px; 
          border-radius: 18px; 
          font-size: 0.92rem; 
          line-height: 1.4; 
          display: inline-block;
          word-break: break-word;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .bubble-me { 
          background: #00f3ff; 
          color: #000; 
          border-bottom-right-radius: 4px; 
          font-weight: 500;
        }
        .bubble-other { 
          background: #1a1f2e; 
          color: #eee; 
          border-bottom-left-radius: 4px; 
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .msg-time { font-size: 0.6rem; opacity: 0.4; display: block; margin-top: 5px; font-weight: 600; }
        .row-me .msg-time { text-align: right; color: rgba(0,0,0,0.4); }

        .chat-form { padding: 15px 20px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
        .input-group { display: flex; gap: 10px; background: #1a1f2e; padding: 5px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .chat-form input { flex: 1; background: transparent; border: none; padding: 10px 15px; color: white; outline: none; font-size: 0.9rem; }
        .chat-form button { background: var(--primary-cyan); color: #000; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: 0.2s; }
        .chat-form button:hover { transform: scale(1.05); }
        .chat-form button:disabled { opacity: 0.2; }
        
        .chat-loading { display: flex; align-items: center; justify-content: center; height: 100%; }
        .loader { width: 25px; height: 25px; border: 2px solid rgba(0,243,255,0.1); border-top-color: var(--primary-cyan); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .empty-chat { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; opacity: 0.2; color: white; }

        @media (max-width: 768px) {
          .chat-view-wrapper { height: calc(100vh - 150px); padding: 0; gap: 0; }
          .chat-main-container { border-radius: 0; border: none; }
          .chat-tabs { border-radius: 0; padding: 8px; }
        }
      `}</style>
    </div>
  );
};

export default ChatView;
