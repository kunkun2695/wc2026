import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Users, MessageSquare, Image as ImageIcon, 
  Smile, X, ChevronLeft, MoreVertical, Search, Globe, Megaphone
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar';
import API_URL from '../config';

const EMOJIS = ['⚽', '🏆', '🔥', '👏', '🙌', '😮', '😢', '😍', '🇻🇳', '🤣', '💪', '👇'];
const PAGE_SIZE = 30;

const ChatView = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [dmUsers, setDmUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState({ id: 'public', type: 'public', name: 'Cộng đồng' });
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isBroadcastMode, setIsBroadcastMode] = useState(false);
  
  const chatEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUser = user || JSON.parse(localStorage.getItem('wc2026_user') || '{}');

  useEffect(() => {
    fetchDmUsers();
  }, []);

  useEffect(() => {
    // Reset state when switching chat
    setMessages([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);
    fetchMessages(true);

    const interval = setInterval(() => {
      fetchNewMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedChat.id]);

  const fetchMessages = async (isInitial = false) => {
    const currentOffset = isInitial ? 0 : offset;
    const url = selectedChat.type === 'public' 
      ? `${API_URL}/api/chat?limit=${PAGE_SIZE}&offset=${currentOffset}`
      : `${API_URL}/api/dm/history/${selectedChat.id}?limit=${PAGE_SIZE}&offset=${currentOffset}`;

    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}` }
      });
      const data = await res.json();
      
      // API returns DESC, we want to store them so we can display ASC
      const newMsgs = data.reverse();
      
      if (isInitial) {
        setMessages(newMsgs);
        setTimeout(() => scrollToBottom(), 100);
      } else {
        // Prepended older messages
        const scrollHeight = scrollContainerRef.current?.scrollHeight || 0;
        setMessages(prev => [...newMsgs, ...prev]);
        
        // Maintain scroll position
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight - scrollHeight;
          }
        }, 0);
      }

      setHasMore(data.length === PAGE_SIZE);
      setOffset(currentOffset + PAGE_SIZE);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchNewMessages = async () => {
    // Only fetch newest if we are at the bottom
    const url = selectedChat.type === 'public' 
      ? `${API_URL}/api/chat?limit=10&offset=0`
      : `${API_URL}/api/dm/history/${selectedChat.id}?limit=10&offset=0`;

    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}` }
      });
      const data = await res.json();
      const latest = data.reverse();
      
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const filtered = latest.filter(m => !existingIds.has(m.id));
        if (filtered.length > 0) {
          // If we are near bottom, scroll down
          const isNearBottom = scrollContainerRef.current && 
            (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.scrollTop - scrollContainerRef.current.clientHeight < 100);
          
          if (isNearBottom) setTimeout(() => scrollToBottom(), 100);
          return [...prev, ...filtered];
        }
        return prev;
      });
    } catch (err) {}
  };

  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      fetchMessages(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const sendMessage = async () => {
    if (!content.trim() && !image) return;
    const url = selectedChat.type === 'public' ? `${API_URL}/api/chat` : `${API_URL}/api/dm/send`;
    const body = selectedChat.type === 'public' 
      ? { content, image_url: image, broadcast: isBroadcastMode }
      : { receiver_id: selectedChat.id, content, image_url: image };

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
        fetchNewMessages();
      }
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

  return (
    <div className={`chat-view-container ${selectedChat ? 'in-chat' : 'in-list'}`}>
      {/* Sidebar - Unified List */}
      <div className="chat-sidebar">
        <div className="sidebar-header-unified">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-outfit m-0">Tin nhắn</h2>
          </div>
          
          {/* Mobile Tab Switcher */}
          <div className="mobile-chat-tabs">
            <button 
              className={selectedChat?.id === 'public' ? 'active' : ''} 
              onClick={() => setSelectedChat({ id: 'public', type: 'public', name: 'Cộng đồng' })}
            >
              <Globe size={16} /> Cộng đồng
            </button>
            <button 
              className={selectedChat?.id !== 'public' && selectedChat ? 'active' : ''}
              onClick={() => {
                if (dmUsers.length > 0) {
                   const u = dmUsers[0];
                   setSelectedChat({ id: u.id, type: 'dm', name: u.name || u.username, avatar: u.avatar });
                }
              }}
            >
              <Users size={16} /> Cá nhân
            </button>
          </div>

          <div className="search-box-chat">
            <Search size={14} />
            <input type="text" placeholder="Tìm kiếm bạn bè..." />
          </div>
        </div>

        <div className="user-list">
          {/* Public Group Item */}
          <div 
            className={`user-item group-item ${selectedChat?.id === 'public' ? 'active' : ''}`}
            onClick={() => setSelectedChat({ id: 'public', type: 'public', name: 'Cộng đồng' })}
          >
            <div className="group-avatar-stack">
              <div className="stack-icon"><Globe size={20} /></div>
            </div>
            <div className="user-info">
              <div className="user-name">Cộng đồng chung</div>
              <div className="user-role">Mọi người đều ở đây</div>
            </div>
          </div>

          <div className="list-divider">TIN NHẮN RIÊNG</div>

          {dmUsers.length > 0 ? dmUsers.map(u => (
            <div 
              key={u.id} 
              className={`user-item ${selectedChat?.id === u.id ? 'active' : ''}`}
              onClick={() => setSelectedChat({ id: u.id, type: 'dm', name: u.name || u.username, avatar: u.avatar })}
            >
              <UserAvatar src={u.avatar} size={44} className="user-item-avatar" />
              <div className="user-info">
                <div className="user-name">{u.name || u.username}</div>
                <div className="user-role">{u.role}</div>
              </div>
            </div>
          )) : (
            <div className="p-4 text-center text-xs text-slate-500">Chưa có cuộc hội thoại nào.</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`chat-main ${selectedChat ? 'show' : ''}`}>
        {selectedChat ? (
          <>
            <div className="chat-header">
              <button className="back-btn mobile-only" onClick={() => setSelectedChat(null)}>
                <ChevronLeft size={24} />
              </button>
              <div className="header-info">
                <div className="flex items-center gap-3">
                  {selectedChat.type === 'dm' ? (
                    <UserAvatar src={selectedChat.avatar} size={36} />
                  ) : (
                    <div className="header-icon-circle"><Globe size={18} /></div>
                  )}
                  <div>
                    <h3 className="m-0 text-sm md:text-base">{selectedChat.name}</h3>
                    <p className="status-online m-0 text-xs">{selectedChat.type === 'public' ? 'Phòng chat chung' : 'Đang trực tuyến'}</p>
                  </div>
                </div>
              </div>
              <div className="header-actions">
                <button className="icon-btn"><Search size={18} /></button>
                <button className="icon-btn"><MoreVertical size={18} /></button>
              </div>
            </div>

            <div className="messages-container" ref={scrollContainerRef} onScroll={handleScroll}>
              {loadingMore && (
                <div className="load-more-indicator">
                  <div className="spinner-mini" /> Đang tải tin cũ...
                </div>
              )}
              
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="spinner-chat" />
                </div>
              ) : (
                messages.map((m, i) => {
                  const isMe = (m.user_id == currentUser.id) || (m.sender_id == currentUser.id);
                  return (
                    <div key={m.id || i} className={`message-wrapper ${isMe ? 'me' : 'others'}`}>
                      {!isMe && selectedChat.type === 'public' && (
                        <UserAvatar src={m.avatar} size={32} className="msg-avatar" />
                      )}
                      <div className="message-content">
                        {!isMe && selectedChat.type === 'public' && <div className="msg-author">{m.name || m.username}</div>}
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
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-wrapper">
              {image && (
                <div className="chat-image-preview">
                  <img src={image} alt="preview" />
                  <button onClick={() => setImage(null)}><X size={14} /></button>
                </div>
              )}
              
              <div className="chat-input-bar">
                <div className="input-tools-horizontal">
                  <label htmlFor="chat-image-upload" className="tool-icon-btn">
                    <ImageIcon size={20} />
                    <input 
                      id="chat-image-upload"
                      type="file" 
                      hidden 
                      accept="image/*" 
                      onChange={handleImageChange} 
                    />
                  </label>
                  <div className="emoji-wrapper">
                    <button className="tool-icon-btn" onClick={() => setShowEmojis(!showEmojis)}><Smile size={20} /></button>
                    <AnimatePresence>
                      {showEmojis && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="emoji-picker-mini">
                          {EMOJIS.map(e => <button key={e} onClick={() => setContent(c => c + e)}>{e}</button>)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {selectedChat.id === 'public' && currentUser.role === 'admin' && (
                    <button 
                      className={`tool-icon-btn broadcast-toggle ${isBroadcastMode ? 'active' : ''}`}
                      onClick={() => setIsBroadcastMode(!isBroadcastMode)}
                      title="Gửi thông báo Push đến tất cả"
                    >
                      <Megaphone size={18} />
                    </button>
                  )}
                </div>
                
                <input 
                  type="text" 
                  className="chat-input-field"
                  placeholder="Nhập tin nhắn..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                
                <button className="send-btn" onClick={sendMessage} disabled={!content.trim() && !image}>
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-30">
             <MessageSquare size={80} className="mb-4" />
             <h2 className="font-outfit text-xl m-0">Chọn một cuộc trò chuyện</h2>
             <p className="text-sm">Hãy chọn một người bạn hoặc phòng cộng đồng để bắt đầu gáy!</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .chat-view-container { display: flex; height: 100vh; background: #0a0e17; width: 100%; overflow: hidden; }
        
        .chat-sidebar { 
          width: 320px; 
          border-right: 1px solid rgba(255,255,255,0.05); 
          display: flex; 
          flex-direction: column; 
          background: rgba(15, 23, 42, 0.5); 
          backdrop-filter: blur(20px); 
          flex-shrink: 0;
        }
        
        .sidebar-header-unified { padding: 25px 20px 15px; }
        .sidebar-header-unified h2 { font-size: 1.5rem; font-weight: 900; color: white; margin-bottom: 15px; }
        .search-box-chat { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 10px 15px; display: flex; align-items: center; gap: 10px; color: #64748b; }
        .search-box-chat input { background: transparent; border: none; color: white; outline: none; font-size: 0.85rem; width: 100%; }

        .mobile-chat-tabs { display: none; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 12px; }
        .mobile-chat-tabs button { flex: 1; padding: 8px; border: none; background: transparent; color: #64748b; font-size: 0.75rem; font-weight: 800; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
        .mobile-chat-tabs button.active { background: #00d2ff; color: black; }

        .user-list { flex: 1; overflow-y: auto; padding: 10px; }
        .list-divider { font-size: 0.65rem; font-weight: 800; color: #475569; letter-spacing: 1.5px; margin: 20px 10px 10px; }
        
        .user-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; cursor: pointer; transition: 0.2s; margin-bottom: 5px; }
        .user-item:hover { background: rgba(255,255,255,0.03); }
        .user-item.active { background: rgba(255,255,255,0.05); border-left: 3px solid #00d2ff; }
        
        .group-item .group-avatar-stack { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #00d2ff, #3a7bd5); display: flex; align-items: center; justify-content: center; color: white; }
        
        .user-name { font-weight: 800; color: white; font-size: 0.95rem; }
        .user-role { font-size: 0.7rem; color: #475569; text-transform: uppercase; font-weight: 700; }

        .chat-main { flex: 1; display: flex; flex-direction: column; background: #0a0e17; min-width: 0; }
        .chat-header { padding: 15px 25px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between; background: rgba(10, 14, 23, 0.8); backdrop-filter: blur(10px); }
        .header-icon-circle { width: 36px; height: 36px; border-radius: 50%; background: rgba(0, 210, 255, 0.1); color: #00d2ff; display: flex; align-items: center; justify-content: center; }
        .status-online { color: #00ff64 !important; }
        
        .messages-container { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 20px; }
        .load-more-indicator { text-align: center; font-size: 0.75rem; color: #475569; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .spinner-mini { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #00d2ff; border-radius: 50%; animation: spin 0.6s linear infinite; }
        
        .message-wrapper { display: flex; gap: 12px; max-width: 85%; }
        .message-wrapper.me { align-self: flex-end; flex-direction: row-reverse; }
        .msg-bubble { padding: 12px 18px; border-radius: 18px; position: relative; }
        .message-wrapper.me .msg-bubble { background: linear-gradient(135deg, #00d2ff, #3a7bd5); color: white; border-bottom-right-radius: 4px; }
        .message-wrapper.others .msg-bubble { background: rgba(255,255,255,0.05); color: #cbd5e1; border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
        
        .msg-author { font-size: 0.7rem; color: #00d2ff; font-weight: 900; margin-bottom: 4px; }
        .msg-text { font-size: 0.95rem; line-height: 1.5; word-break: break-word; }
        .msg-time { font-size: 0.65rem; opacity: 0.5; margin-top: 5px; text-align: right; }

        .chat-input-wrapper { padding: 15px 20px; background: #0a0e17; border-top: 1px solid rgba(255,255,255,0.05); }
        .chat-input-bar { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; display: flex; align-items: center; padding: 6px 10px 6px 15px; gap: 12px; backdrop-filter: blur(10px); }
        .input-tools-horizontal { display: flex; align-items: center; gap: 8px; border-right: 1px solid rgba(255,255,255,0.05); padding-right: 12px; }
        .tool-icon-btn { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
        .tool-icon-btn:hover { background: rgba(0, 210, 255, 0.1); color: #00d2ff; border-color: rgba(0, 210, 255, 0.2); }
        .broadcast-toggle.active { background: #ffd200; color: black; border-color: #ffd200; box-shadow: 0 0 15px rgba(255, 210, 0, 0.3); }

        .chat-input-field { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 0.95rem; padding: 10px 0; }
        
        .chat-image-preview { position: relative; margin-bottom: 10px; width: 100px; height: 100px; }
        .chat-image-preview img { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; border: 1px solid #00d2ff; }
        .chat-image-preview button { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .emoji-picker-mini { position: absolute; bottom: 60px; left: 0; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; z-index: 100; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
        .emoji-picker-mini button { font-size: 1.4rem; padding: 6px; background: none; border: none; cursor: pointer; border-radius: 8px; transition: 0.2s; }
        .emoji-picker-mini button:hover { background: rgba(255,255,255,0.05); transform: scale(1.1); }
        
        .send-btn { background: #00d2ff; color: black; border: none; width: 42px; height: 42px; border-radius: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .send-btn:disabled { opacity: 0.5; }

        .spinner-chat { width: 40px; height: 40px; border: 4px solid rgba(0, 210, 255, 0.1); border-top-color: #00d2ff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 1024px) {
          .chat-view-container { padding-top: 60px; }
          .chat-sidebar { width: 100%; position: absolute; inset: 60px 0 0; z-index: 20; display: flex; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .chat-view-container.in-chat .chat-sidebar { transform: translateX(-100%); pointer-events: none; }
          
          .chat-main { position: absolute; inset: 60px 0 0; z-index: 21; display: flex; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .chat-view-container.in-chat .chat-main { transform: translateX(0); }
          
          .mobile-chat-tabs { display: flex; }
          .mobile-only { display: block !important; }
        }
        .mobile-only { display: none; }
      ` }} />
    </div>
  );
};

export default ChatView;
