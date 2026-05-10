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
  
  // SỬA LỖI: Dùng đúng key 'wc2026_session'
  const currentUser = JSON.parse(localStorage.getItem('wc2026_session') || '{}');
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
    <div className="chat-view-v3-wrapper">
      <div className="chat-tabs-v3">
        <button 
          className={`tab-btn-v3 ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => { setActiveTab('global'); setSelectedUser(null); setMessages([]); }}
        >
          <MessageSquare size={18} /> Chat Tổng
        </button>
        <button 
          className={`tab-btn-v3 ${activeTab === 'private' ? 'active' : ''}`}
          onClick={() => { setActiveTab('private'); setMessages([]); }}
        >
          <User size={18} /> Chat Riêng
        </button>
      </div>

      <div className="chat-main-container-v3">
        {activeTab === 'private' && !selectedUser ? (
          <div className="user-list-v3">
            <h3 className="section-title-v3">Thành viên</h3>
            {users.length === 0 ? (
              <p className="empty-text-v3">Không có ai trực tuyến.</p>
            ) : (
              users.map(u => (
                <div key={u.id} className="user-item-v3" onClick={() => { setSelectedUser(u); setLoading(true); }}>
                  <div className="user-avatar-v3">
                    {u.avatar ? <img src={u.avatar} alt="" /> : <User size={20} color="#888" />}
                  </div>
                  <div className="user-info-v3">
                    <div className="user-name-v3">{u.name || u.username}</div>
                    <div className="user-role-v3">{u.role === 'admin' ? 'ADMIN' : 'MEMBER'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="chat-container-v3">
            <div className="chat-header-v3">
              {activeTab === 'private' && (
                <button className="back-btn-v3" onClick={() => setSelectedUser(null)}><ArrowLeft size={18} /></button>
              )}
              <div className="header-info-v3">
                {activeTab === 'global' ? <span>Phòng Chat Tổng</span> : <span>{selectedUser?.name || selectedUser?.username}</span>}
              </div>
            </div>

            <div className="messages-list-v3">
              {loading ? (
                <div className="chat-loading-v3"><div className="loader-v3"></div></div>
              ) : messages.length === 0 ? (
                <div className="empty-chat-v3"><Smile size={40} /><p>Hãy gửi tin nhắn đầu tiên!</p></div>
              ) : (
                messages.map((msg, idx) => {
                  // SỬA LỖI: So sánh đúng ID từ currentUser
                  const isMe = currentUser.id && (msg.user_id === currentUser.id || msg.sender_id === currentUser.id);
                  return (
                    <div key={msg.id || idx} className={`message-row-v3 ${isMe ? 'row-me' : 'row-other'}`}>
                      {!isMe && (
                        <div className="msg-avatar-v3">
                          {msg.avatar ? <img src={msg.avatar} alt="" /> : <User size={12} color="#888" />}
                        </div>
                      )}
                      <div className="message-bubble-v3">
                        {!isMe && activeTab === 'global' && <div className="sender-name-v3">{msg.name || msg.username}</div>}
                        <div className="bubble-content-v3">
                          {msg.content}
                          <span className="msg-time-v3">{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-form-v3" onSubmit={handleSendMessage}>
              <div className="input-group-v3">
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

      <style dangerouslySetInnerHTML={{ __html: `
        .chat-view-v3-wrapper { height: calc(100vh - 120px) !important; display: flex !important; flex-direction: column !important; gap: 15px !important; padding: 10px !important; max-width: 600px !important; margin: 0 auto !important; }
        .chat-tabs-v3 { display: flex !important; background: rgba(255, 255, 255, 0.05) !important; padding: 4px !important; border-radius: 12px !important; gap: 4px !important; }
        .tab-btn-v3 { flex: 1 !important; padding: 10px !important; border-radius: 10px !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px !important; font-weight: 700 !important; color: #666 !important; border: none !important; background: transparent !important; cursor: pointer !important; }
        .tab-btn-v3.active { background: #00f3ff !important; color: #000 !important; }
        .chat-main-container-v3 { flex: 1 !important; background: #0d121d !important; border: 1px solid rgba(255, 255, 255, 0.08) !important; border-radius: 24px !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; }
        .user-list-v3 { padding: 20px !important; overflow-y: auto !important; }
        .section-title-v3 { font-size: 0.7rem !important; color: #555 !important; text-transform: uppercase !important; margin-bottom: 15px !important; letter-spacing: 1.5px !important; font-weight: 800 !important; }
        .user-item-v3 { display: flex !important; align-items: center !important; gap: 12px !important; padding: 12px !important; border-radius: 16px !important; cursor: pointer !important; transition: 0.2s !important; }
        .user-item-v3:hover { background: rgba(255, 255, 255, 0.05) !important; }
        .user-avatar-v3 { width: 40px !important; height: 40px !important; background: #1a1f2e !important; border-radius: 50% !important; overflow: hidden !important; border: 1px solid rgba(255,255,255,0.1) !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        .user-avatar-v3 img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        .user-name-v3 { font-weight: 600 !important; font-size: 0.95rem !important; color: #fff !important; }
        .user-role-v3 { font-size: 0.7rem !important; color: #444 !important; font-weight: 800 !important; }

        .chat-container-v3 { display: flex !important; flex-direction: column !important; height: 100% !important; }
        .chat-header-v3 { padding: 12px 20px !important; background: rgba(255, 255, 255, 0.02) !important; border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; display: flex !important; align-items: center !important; gap: 12px !important; font-weight: 800 !important; color: #fff !important; }
        .back-btn-v3 { color: #00f3ff !important; background: none !important; border: none !important; cursor: pointer !important; }

        .messages-list-v3 { flex: 1 !important; padding: 20px !important; overflow-y: auto !important; display: flex !important; flex-direction: column !important; gap: 12px !important; }
        .message-row-v3 { display: flex !important; gap: 10px !important; max-width: 85% !important; }
        .row-me { align-self: flex-end !important; flex-direction: row-reverse !important; }
        .row-other { align-self: flex-start !important; }
        .msg-avatar-v3 { width: 30px !important; height: 30px !important; border-radius: 50% !important; background: #1a1f2e !important; flex-shrink: 0 !important; overflow: hidden !important; border: 1px solid rgba(255,255,255,0.1) !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        .msg-avatar-v3 img { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        
        .message-bubble-v3 { display: flex !important; flex-direction: column !important; gap: 4px !important; }
        .sender-name-v3 { font-size: 0.65rem !important; color: #555 !important; font-weight: 800 !important; margin: 0 10px !important; }
        .bubble-content-v3 { padding: 10px 16px !important; border-radius: 18px !important; font-size: 0.9rem !important; line-height: 1.4 !important; word-break: break-word !important; position: relative !important; }
        .row-me .bubble-content-v3 { background: #0084ff !important; color: #fff !important; border-bottom-right-radius: 4px !important; box-shadow: 0 4px 12px rgba(0, 132, 255, 0.2) !important; }
        .row-other .bubble-content-v3 { background: #1e293b !important; color: #eee !important; border-bottom-left-radius: 4px !important; border: 1px solid rgba(255,255,255,0.05) !important; }
        .msg-time-v3 { font-size: 0.6rem !important; opacity: 0.5 !important; display: block !important; margin-top: 4px !important; font-weight: 600 !important; }
        .row-me .msg-time-v3 { text-align: right !important; color: rgba(255,255,255,0.6) !important; }

        .chat-form-v3 { padding: 15px 20px !important; border-top: 1px solid rgba(255, 255, 255, 0.05) !important; }
        .input-group-v3 { display: flex !important; gap: 10px !important; background: #1a1f2e !important; padding: 4px !important; border-radius: 14px !important; border: 1px solid rgba(255,255,255,0.05) !important; }
        .chat-form-v3 input { flex: 1 !important; background: transparent !important; border: none !important; padding: 10px 15px !important; color: white !important; outline: none !important; font-size: 0.9rem !important; }
        .chat-form-v3 button { background: #00f3ff !important; color: #000 !important; width: 38px !important; height: 38px !important; border-radius: 10px !important; display: flex !important; align-items: center !important; justify-content: center !important; border: none !important; cursor: pointer !important; }
        
        .chat-loading-v3 { display: flex !important; align-items: center !important; justify-content: center !important; height: 100% !important; }
        .loader-v3 { width: 25px !important; height: 25px !important; border: 2px solid rgba(0,243,255,0.1) !important; border-top-color: #00f3ff !important; border-radius: 50% !important; animation: spin-v3 1s linear infinite !important; }
        @keyframes spin-v3 { to { transform: rotate(360deg) !important; } }

        @media (max-width: 768px) {
          .chat-view-v3-wrapper { height: calc(100vh - 150px) !important; padding: 0 !important; gap: 0 !important; }
          .chat-main-container-v3 { border-radius: 0 !important; border: none !important; }
          .chat-tabs-v3 { border-radius: 0 !important; padding: 8px !important; }
        }
      ` }} />
    </div>
  );
};

export default ChatView;
