import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, User, RefreshCw, Zap } from 'lucide-react';
import API_URL from '../config';

const AiAssistantView = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là **King Guru**. Bạn muốn hỏi gì về World Cup 2026 hôm nay?' }
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

    // 1. Thêm tin nhắn user
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    // 2. Bật trạng thái đang nhập (hiện 3 chấm)
    setIsTyping(true);

    try {
      console.log('[AI FRONTEND] Đang gửi yêu cầu tới:', `${API_URL}/api/ai/stream`);
      const response = await fetch(`${API_URL}/api/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (!response.ok) {
        console.error('[AI FRONTEND] Lỗi HTTP:', response.status);
        throw new Error('Network response was not ok');
      }

      console.log('[AI FRONTEND] Đã kết nối thành công, đang chờ luồng dữ liệu (stream)...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';
      let hasStarted = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('[AI FRONTEND] Luồng dữ liệu kết thúc (Stream Done).');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          const cleanLine = line.replace(/^data: /, '').trim();
          if (!cleanLine || cleanLine === '[DONE]') {
            continue;
          }

          try {
            const data = JSON.parse(cleanLine);
            if (data.error) {
              console.error('[AI FRONTEND] Lỗi từ Server:', data.error);
              setIsTyping(false);
              setMessages(prev => [...prev, { role: 'assistant', content: `❌ **Lỗi:** ${data.error}` }]);
              break;
            }
            if (data.text) {
              if (!hasStarted) {
                console.log('[AI FRONTEND] Bắt đầu nhận những chữ đầu tiên...');
                setIsTyping(false);
                hasStarted = true;
                setMessages(prev => [...prev, { role: 'assistant', content: data.text, isStreaming: true }]);
                accumulatedText = data.text;
              } else {
                accumulatedText += data.text;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  if (last && last.role === 'assistant') last.content = accumulatedText;
                  return newMsgs;
                });
              }
            }
          } catch (e) {
            console.warn('[AI FRONTEND] Lỗi phân tích cú pháp chunk:', e.message);
          }
        }
      }
    } catch (err) {
      console.error('[AI FRONTEND] Lỗi Fetch/Stream:', err);
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi kết nối rồi đại ca ơi! Hãy thử tải lại trang nhé.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    // Mã hóa HTML trước tiên để tránh XSS từ nội dung AI trả về
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="ai-view-container">
      <div className="ai-chat-card">
        <header className="ai-header">
          <div className="ai-badge">
            <Zap size={14} fill="currentColor" />
            <span>REAL-TIME ENGINE</span>
          </div>
          <h2 className="font-outfit"> Guru</h2>
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
                  <div className="msg-text-ai" dangerouslySetInnerHTML={{ __html: formatText(m.content) }} />
                  {m.isStreaming && <span className="streaming-cursor">|</span>}
                </div>
              </motion.div>
            ))}

            {/* CHỈ HIỆN 3 CHẤM KHI CHƯA CÓ CHỮ NÀO TRẢ VỀ */}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="msg-row ai">
                <div className="msg-icon pulse"><Bot size={18} /></div>
                <div className="typing-indicator-modern">
                  <span></span><span></span><span></span>
                </div>
              </motion.div>
            )}

            <div ref={scrollRef} />
          </div>
        </div>

        <div className="ai-input-area">
          <div className="suggestions-row">
            <button onClick={() => setInput('Phân tích Brazil')}>🔍 Brazil</button>
            <button onClick={() => setInput('Vua phá lưới')}>🏆 Vua phá lưới</button>
            <button onClick={() => setInput('Dự đoán vô địch')}>⭐ Dự đoán</button>
          </div>
          <div className="ai-input-bar">
            <input
              type="text"
              placeholder="Hỏi Guru..."
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

      <style dangerouslySetInnerHTML={{
        __html: `
        .ai-view-container { height: 100%; width: 100%; padding: 30px 40px; background: transparent; display: flex; justify-content: center; overflow: hidden; }
        .ai-chat-card { width: 100%; max-width: 900px; height: 100%; display: flex; flex-direction: column; border-radius: 28px; overflow: hidden; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 30px 60px rgba(0,0,0,0.6); min-height: 0; }
        .ai-header { padding: 20px 25px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ai-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(0, 210, 255, 0.1); color: #00d2ff; padding: 4px 10px; border-radius: 20px; font-size: 0.6rem; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px; }
        .ai-header h2 { margin: 0; font-size: 1.4rem; font-weight: 900; color: white; }

        .ai-messages-wrapper { 
          flex: 1; 
          overflow-y: auto; 
          padding: 25px; 
          background: rgba(0,0,0,0.1); 
          background-image: url('../assets/chat-bg.png');
          background-repeat: repeat;
          background-size: 380px;
          background-attachment: local;
        }
        .messages-list { display: flex; flex-direction: column; gap: 20px; }
        .msg-row { display: flex; gap: 15px; max-width: 90%; }
        .msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
        .msg-icon { width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; }
        .msg-row.ai .msg-icon { background: linear-gradient(135deg, #00d2ff, #3a7bd5); color: white; }
        
        .msg-bubble-ai { padding: 14px 18px; border-radius: 20px; font-size: 0.95rem; line-height: 1.6; position: relative; }
        .msg-row.ai .msg-bubble-ai { background: rgba(30, 41, 59, 0.7); color: #cbd5e1; border-top-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
        .msg-row.user .msg-bubble-ai { background: #00d2ff; color: #020617; border-top-right-radius: 4px; font-weight: 600; }
        
        .streaming-cursor { display: inline-block; width: 2px; height: 1em; background: #00d2ff; margin-left: 4px; vertical-align: middle; animation: blink 0.8s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .typing-indicator-modern { display: flex; gap: 4px; padding: 12px 18px; background: rgba(255,255,255,0.03); border-radius: 18px; border-top-left-radius: 4px; }
        .typing-indicator-modern span { width: 6px; height: 6px; background: #00d2ff; border-radius: 50%; animation: bounce 1s infinite; }
        .typing-indicator-modern span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator-modern span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

        .ai-input-area { padding: 15px 25px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(15, 23, 42, 0.8); }
        .suggestions-row { display: flex; gap: 10px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
        .suggestions-row button { white-space: nowrap; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; padding: 6px 12px; border-radius: 12px; font-size: 0.75rem; cursor: pointer; transition: 0.2s; }

        .ai-input-bar { display: flex; gap: 12px; align-items: center; background: rgba(0,0,0,0.2); padding: 8px 10px 8px 18px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .ai-input-bar input { flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 0.95rem; }
        .ai-send-btn { 
          background: linear-gradient(135deg, #00d2ff, #3a7bd5); 
          color: white; 
          border: none; 
          width: 42px; 
          height: 42px; 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          cursor: pointer; 
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
          flex-shrink: 0;
        }
        .ai-send-btn:hover:not(:disabled) { 
          transform: translateY(-2px); 
          box-shadow: 0 6px 20px rgba(0, 210, 255, 0.4);
        }
        .ai-send-btn:disabled { opacity: 0.4; filter: grayscale(1); }

        @media (max-width: 768px) {
          .ai-view-container { padding: 0; }
          .ai-chat-card { border-radius: 0; border: none; }
          .msg-row { max-width: 95%; }
        }
      ` }} />
    </div>
  );
};

export default AiAssistantView;
