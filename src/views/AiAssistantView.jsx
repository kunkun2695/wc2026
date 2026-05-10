import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, User, RefreshCw, Zap } from 'lucide-react';
import API_URL from '../config';

// Component để tạo hiệu ứng chữ chạy
const TypeWriter = ({ text, speed = 15, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[index]);
        setIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return <div dangerouslySetInnerHTML={{ __html: displayedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
};

const AiAssistantView = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là **Bench Guru**, trợ lý AI chuyên về World Cup 2026. Tôi có thể giúp bạn phân tích trận đấu, soi kèo lịch sử hoặc giải đáp mọi thắc mắc về bóng đá. Bạn muốn "soi" trận nào hôm nay?', isNew: false }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, isNew: false }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, isNew: true }]);
      } else {
        const errorText = data.error || 'Lỗi không xác định';
        const debugInfo = data.details 
          ? `\n\n**Chi tiết lỗi:**\n${data.details}\n\n💡 **Gợi ý:** Kiểm tra lại file .env (typo l thường và I hoa).`
          : '';
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `⚠️ **Lỗi từ hệ thống:** ${errorText}${debugInfo}`,
          isNew: true 
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi kết nối rồi đại ca ơi! Kiểm tra lại mạng nhé.', isNew: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  const markAsRead = (idx) => {
    setMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs[idx]) newMsgs[idx].isNew = false;
      return newMsgs;
    });
  };

  return (
    <div className="ai-view-container">
      <div className="ai-chat-card glass-panel">
        <header className="ai-header">
          <div className="ai-badge">
            <Sparkles size={16} className="sparkle-icon" />
            <span>AI POWERED</span>
          </div>
          <h2 className="font-outfit">Bench Guru <span className="beta-tag">BETA</span></h2>
          <p>Chuyên gia phân tích World Cup 2026</p>
        </header>

        <div className="ai-messages-wrapper">
          <div className="messages-list">
            {messages.map((m, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`msg-row ${m.role === 'assistant' ? 'ai' : 'user'}`}
              >
                <div className="msg-icon">
                  {m.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className="msg-bubble-ai">
                  <div className="msg-text-ai">
                    {m.role === 'assistant' && m.isNew ? (
                      <TypeWriter 
                        text={m.content} 
                        speed={10} 
                        onComplete={() => markAsRead(i)} 
                      />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="msg-row ai">
                <div className="msg-icon pulse"><Bot size={18} /></div>
                <div className="typing-indicator-modern">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>

        <div className="ai-input-area">
          <div className="suggestions-row">
            <button onClick={() => setInput('Phân tích trận Brazil tối nay')}>🔍 Phân tích Brazil</button>
            <button onClick={() => setInput('Ai là vua phá lưới?')}>🏆 Vua phá lưới</button>
            <button onClick={() => setInput('Lịch sử vô địch World Cup')}>⏳ Lịch sử</button>
          </div>
          <div className="ai-input-bar">
            <input 
              type="text" 
              placeholder="Hỏi Bench Guru bất cứ điều gì..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="ai-send-btn" onClick={handleSend} disabled={!input.trim() || isTyping}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ai-view-container { 
          height: 100vh; 
          padding: 30px 40px; 
          background: #020617; 
          display: flex;
          justify-content: center;
        }
        .ai-chat-card {
          width: 100%;
          max-width: 900px;
          height: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 28px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 30px 60px rgba(0,0,0,0.6);
        }
        .ai-header { padding: 25px; border-bottom: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.03); }
        .ai-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(0, 210, 255, 0.1); color: #00d2ff; padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 800; letter-spacing: 1.5px; margin-bottom: 12px; border: 1px solid rgba(0, 210, 255, 0.2); }
        .sparkle-icon { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        .beta-tag { font-size: 0.6rem; background: #ffd200; color: black; padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 8px; }
        .ai-header h2 { margin: 0; font-size: 1.6rem; font-weight: 900; color: white; }
        .ai-header p { margin: 5px 0 0; color: #64748b; font-size: 0.85rem; font-weight: 500; }

        .ai-messages-wrapper { flex: 1; overflow-y: auto; padding: 30px; background: rgba(0,0,0,0.15); scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
        .messages-list { display: flex; flex-direction: column; gap: 25px; }
        .msg-row { display: flex; gap: 15px; max-width: 85%; }
        .msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
        
        .msg-icon { width: 40px; height: 40px; border-radius: 14px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .msg-row.ai .msg-icon { background: linear-gradient(135deg, #00d2ff, #3a7bd5); color: white; border: none; }
        .msg-row.user .msg-icon { background: rgba(255,255,255,0.1); color: white; }
        
        .msg-bubble-ai { padding: 16px 20px; border-radius: 22px; font-size: 0.95rem; line-height: 1.7; box-shadow: 0 5px 20px rgba(0,0,0,0.1); }
        .msg-row.ai .msg-bubble-ai { background: rgba(30, 41, 59, 0.7); color: #cbd5e1; border-top-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
        .msg-row.user .msg-bubble-ai { background: #00d2ff; color: #020617; border-top-right-radius: 4px; font-weight: 600; }
        
        .typing-indicator-modern { display: flex; gap: 5px; padding: 18px 25px; background: rgba(255,255,255,0.03); border-radius: 22px; border-top-left-radius: 4px; }
        .typing-indicator-modern span { width: 7px; height: 7px; background: #00d2ff; border-radius: 50%; animation: bounce 1.2s infinite; }
        .typing-indicator-modern span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator-modern span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.3; } 50% { transform: translateY(-8px); opacity: 1; } }

        .ai-input-area { padding: 20px 30px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(15, 23, 42, 0.8); }
        .suggestions-row { display: flex; gap: 12px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px; }
        .suggestions-row::-webkit-scrollbar { display: none; }
        .suggestions-row button { white-space: nowrap; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; padding: 8px 16px; border-radius: 14px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.3s; }
        .suggestions-row button:hover { background: rgba(0, 210, 255, 0.15); color: #00d2ff; border-color: #00d2ff; transform: translateY(-2px); }

        .ai-input-bar { display: flex; gap: 15px; align-items: center; background: rgba(0,0,0,0.3); padding: 10px 12px 10px 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); transition: 0.3s; }
        .ai-input-bar:focus-within { border-color: rgba(0, 210, 255, 0.5); box-shadow: 0 0 20px rgba(0, 210, 255, 0.1); }
        .ai-input-bar input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 1rem; }
        .ai-send-btn { background: #00d2ff; color: #020617; border: none; width: 44px; height: 44px; border-radius: 15px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.3s; }
        .ai-send-btn:hover:not(:disabled) { transform: scale(1.05); background: #33e0ff; box-shadow: 0 0 15px rgba(0, 210, 255, 0.4); }
        .ai-send-btn:disabled { opacity: 0.4; filter: grayscale(1); }

        @media (max-width: 768px) {
          .ai-view-container { padding: 70px 0 90px; }
          .ai-chat-card { border-radius: 0; border: none; height: 100%; }
          .msg-row { max-width: 95%; }
          .ai-header { padding: 15px 20px; }
          .ai-messages-wrapper { padding: 20px 15px; }
          .ai-input-area { padding: 15px; }
        }
      ` }} />
    </div>
  );
};

export default AiAssistantView;
