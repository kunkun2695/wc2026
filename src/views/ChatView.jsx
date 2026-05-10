import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Users, MessageSquare, Image as ImageIcon, 
  Smile, X, ChevronLeft, MoreVertical, Search
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
const EMOJIS = ['⚽', '🏆', '🔥', '👏', '🙌', '😮', '😢', '😍', '🇻🇳', '🤣', '💪', '👇'];

const ChatView = () => {
  const [activeMode, setActiveMode] = useState('public'); // 'public' or 'dm'
  const [publicMessages, setPublicMessages] = useState([]);
  const [dmUsers, setDmUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('wc2026_user') || '{}');

  useEffect(() => {
    fetchPublicMessages();
    fetchDmUsers();
    const interval = setInterval(() => {
      if (activeMode === 'public') fetchPublicMessages();
      else if (selectedUser) fetchDmHistory(selectedUser.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeMode, selectedUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [publicMessages, dmMessages]);

  const fetchPublicMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}` }
      });
      const data = await res.json();
      setPublicMessages(data);
    } catch (err) {} finally { setLoading(false); }
  };

  const fetchDmUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dm/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}` }
      });
      const data = await res.json();
      setDmUsers(data);
    } catch (err) {}
  };

  const fetchDmHistory = async (otherId) => {
    try {
      const res = await fetch(`${API_URL}/api/dm/history/${otherId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}` }
      });
      const data = await res.json();
      setDmMessages(data);
    } catch (err) {}
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!content.trim() && !image) return;
    const url = activeMode === 'public' ? `${API_URL}/api/chat` : `${API_URL}/api/dm/send`;
    const body = activeMode === 'public' 
      ? { content, image_url: image }
      : { receiver_id: selectedUser.id, content, image_url: image };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setContent('');
        setImage(null);
        setShowEmojis(false);
        if (activeMode === 'public') fetchPublicMessages();
        else fetchDmHistory(selectedUser.id);
      }
    } catch (err) {}
  };

  return (
    <div className="chat-view-container">
      {/* Sidebar - Desktop */}
      <div className="chat-sidebar">
        <div className="sidebar-tabs">
          <button 
            className={`tab-btn ${activeMode === 'public' ? 'active' : ''}`}
            onClick={() => { setActiveMode('public'); setSelectedUser(null); }}
          >
            <Users size={20} /> <span>Cộng đồng</span>
          </button>
          <button 
            className={`tab-btn ${activeMode === 'dm' ? 'active' : ''}`}
            onClick={() => setActiveMode('dm')}
          >
            <MessageSquare size={20} /> <span>Tin nhắn riêng</span>
          </button>
        </div>

        {activeMode === 'dm' && (
          <div className="user-list">
            {dmUsers.map(user => (
              <div 
                key={user.id} 
                className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <img src={user.avatar || 'https://via.placeholder.com/40'} alt="av" />
                <div className="user-info">
                  <div className="user-name">{user.name || user.username}</div>
                  <div className="user-role">{user.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className={`chat-main ${selectedUser || activeMode === 'public' ? 'show' : ''}`}>
        <div className="chat-header">
          {activeMode === 'dm' && selectedUser && (
            <button className="back-btn" onClick={() => setSelectedUser(null)}><ChevronLeft /></button>
          )}
          <div className="header-info">
            <h3>{activeMode === 'public' ? 'Phòng Chat Chung' : (selectedUser?.name || 'Chọn người để chat')}</h3>
            <p>{activeMode === 'public' ? 'Hàng nghìn người đang online' : 'Đang trực tuyến'}</p>
          </div>
        </div>

        <div className="messages-container">
          {(activeMode === 'public' ? publicMessages : dmMessages).map((m, i) => {
            const isMe = m.user_id === currentUser.id || m.sender_id === currentUser.id;
            return (
              <div key={m.id || i} className={`message-wrapper ${isMe ? 'me' : 'others'}`}>
                {!isMe && activeMode === 'public' && (
                  <img src={m.avatar || 'https://via.placeholder.com/32'} alt="av" className="msg-avatar" />
                )}
                <div className="message-content">
                  {!isMe && activeMode === 'public' && <div className="msg-author">{m.name || m.username}</div>}
                  <div className="msg-bubble">
                    {m.content && <div className="msg-text">{m.content}</div>}
                    {m.image_url && (
                      <div className="msg-image">
                        <img src={m.image_url} alt="chat-img" onClick={() => window.open(m.image_url)} />
                      </div>
                    )}
                    <div className="msg-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        {(activeMode === 'public' || selectedUser) && (
          <div className="chat-input-wrapper">
            {image && (
              <div className="chat-image-preview">
                <img src={image} alt="preview" />
                <button onClick={() => setImage(null)}><X size={14} /></button>
              </div>
            )}
            
            <div className="chat-input-bar">
              <div className="input-tools">
                <button onClick={() => fileInputRef.current.click()}><ImageIcon size={20} /></button>
                <div className="emoji-wrapper">
                  <button onClick={() => setShowEmojis(!showEmojis)}><Smile size={20} /></button>
                  <AnimatePresence>
                    {showEmojis && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="emoji-dropdown">
                        {EMOJIS.map(e => <button key={e} onClick={() => setContent(c => c + e)}>{e}</button>)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <input 
                type="text" 
                placeholder="Nhập tin nhắn..." 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              
              <button className="send-btn" onClick={sendMessage} disabled={!content.trim() && !image}>
                <Send size={20} />
              </button>
            </div>
            
            <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleImageChange} />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .chat-view-container { display: flex; height: 100vh; background: #0a0e17; padding-top: 60px; overflow: hidden; }
        
        .chat-sidebar { width: 320px; border-right: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(20px); }
        .sidebar-tabs { display: flex; padding: 15px; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .tab-btn { flex: 1; background: rgba(255,255,255,0.03); border: none; color: #888; padding: 10px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .tab-btn.active { background: rgba(0, 210, 255, 0.1); color: #00d2ff; border: 1px solid rgba(0, 210, 255, 0.2); }
        
        .user-list { flex: 1; overflow-y: auto; padding: 10px; }
        .user-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; cursor: pointer; transition: 0.2s; margin-bottom: 5px; }
        .user-item:hover { background: rgba(255,255,255,0.03); }
        .user-item.active { background: rgba(255,255,255,0.05); border-left: 3px solid #00d2ff; }
        .user-item img { width: 44px; height: 44px; border-radius: 14px; object-fit: cover; }
        .user-name { font-weight: 800; color: white; font-size: 0.95rem; }
        .user-role { font-size: 0.7rem; color: #555; text-transform: uppercase; letter-spacing: 1px; }

        .chat-main { flex: 1; display: flex; flex-direction: column; background: #0a0e17; position: relative; }
        .chat-header { padding: 15px 25px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 15px; background: rgba(10, 14, 23, 0.8); backdrop-filter: blur(10px); z-index: 10; }
        .header-info h3 { margin: 0; color: white; font-size: 1.1rem; }
        .header-info p { margin: 0; color: #00d2ff; font-size: 0.75rem; font-weight: 600; }

        .messages-container { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 20px; }
        .message-wrapper { display: flex; gap: 12px; max-width: 80%; }
        .message-wrapper.me { align-self: flex-end; flex-direction: row-reverse; }
        
        .msg-avatar { width: 32px; height: 32px; border-radius: 10px; }
        .msg-bubble { padding: 12px 18px; border-radius: 18px; position: relative; }
        .message-wrapper.me .msg-bubble { background: linear-gradient(135deg, #00d2ff, #3a7bd5); color: white; border-bottom-right-radius: 4px; }
        .message-wrapper.others .msg-bubble { background: rgba(255,255,255,0.05); color: #cbd5e1; border-bottom-left-radius: 4px; }
        
        .msg-author { font-size: 0.7rem; color: #00d2ff; font-weight: 900; margin-bottom: 4px; }
        .msg-text { font-size: 0.95rem; line-height: 1.5; word-break: break-word; }
        .msg-image { margin-top: 8px; border-radius: 12px; overflow: hidden; max-width: 250px; cursor: pointer; }
        .msg-image img { width: 100%; display: block; transition: 0.3s; }
        .msg-image img:hover { transform: scale(1.05); }
        .msg-time { font-size: 0.65rem; opacity: 0.5; margin-top: 5px; text-align: right; font-weight: 600; }

        .chat-input-wrapper { padding: 20px 25px; background: #0a0e17; border-top: 1px solid rgba(255,255,255,0.05); }
        .chat-input-bar { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; display: flex; align-items: center; padding: 8px 15px; gap: 15px; }
        .chat-input-bar input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 0.95rem; }
        
        .input-tools { display: flex; gap: 12px; color: #666; }
        .input-tools button { background: none; border: none; color: inherit; cursor: pointer; transition: 0.2s; }
        .input-tools button:hover { color: #00d2ff; }
        
        .emoji-wrapper { position: relative; display: flex; }
        .emoji-dropdown { position: absolute; bottom: 40px; left: -10px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 8px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .emoji-dropdown button { font-size: 1.2rem; padding: 5px; }

        .chat-image-preview { position: relative; display: inline-block; margin-bottom: 15px; border-radius: 12px; overflow: hidden; border: 2px solid #00d2ff; }
        .chat-image-preview img { height: 80px; width: 80px; object-fit: cover; }
        .chat-image-preview button { position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.8); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .send-btn { background: #00d2ff; color: black; border: none; width: 42px; height: 42px; border-radius: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .send-btn:hover { transform: scale(1.1); background: #33e0ff; }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 768px) {
          .chat-sidebar { width: 100%; position: absolute; inset: 60px 0 0; z-index: 20; transform: translateX(0); transition: 0.3s; }
          .chat-main { position: absolute; inset: 60px 0 0; z-index: 21; transform: translateX(100%); transition: 0.3s; }
          .chat-main.show { transform: translateX(0); }
          .chat-sidebar { display: ${selectedUser ? 'none' : 'flex'}; }
          .chat-main { display: ${selectedUser || activeMode === 'public' ? 'flex' : 'none'}; }
        }
      ` }} />
    </div>
  );
};

export default ChatView;
