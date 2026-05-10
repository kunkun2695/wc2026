import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Zap, AlertCircle } from 'lucide-react';
import API_URL from '../config';

const AiAssistantView = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Xin chào! Tôi là **Bench Guru**. Bạn muốn hỏi gì về World Cup 2026 hôm nay?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setError(null);
    setIsTyping(true);
    
    // 1. Thêm tin nhắn user
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      // GỌI ENDPOINT /STREAM (LUỒNG CHẠY CHỮ THẬT)
      const response = await fetch(`${API_URL}/api/ai/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('wc2026_token')}`
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (!response.ok) throw new Error('Không thể kết nối đến AI');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let hasStarted = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.text) {
              if (!hasStarted) {
                hasStarted = true;
                setIsTyping(false); // Ẩn 3 chấm
                setMessages(prev => [...prev, { role: 'assistant', content: data.text, isStreaming: true }]);
                accumulatedText = data.text;
              } else {
                accumulatedText += data.text;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  const last = newMsgs[newMsgs.length - 1];
                  if (last) last.content = accumulatedText;
                  return newMsgs;
                });
              }
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {}
        }
      }

      // Kết thúc stream
      setMessages(prev => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        if (last) last.isStreaming = false;
        return newMsgs;
      });

    } catch (err) {
      console.error('Lỗi AI:', err);
      setError(err.message);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ **Lỗi:** ${err.message}. Hãy thử lại nhé!` 
      }]);
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
  };

  return (
    <div className="ai-view-container">
      <div className="ai-chat-card">
        <header className="ai-header">
          <div className="ai-badge">
            <Zap size={14} fill="currentColor" />
            <span>BENCH GURU STREAMING</span>
          </div>
          <h2 className="font-outfit">Hỏi đáp World Cup</h2>
        </header>

        <div className="ai-messages-wrapper">
          <div className="messages-list">
            {messages.map((m, i) => (
              <div key={i} className={`msg-row ${m.role === 'assistant' ? 'ai' : 'user'}`}>
                <div className="msg-icon">
                  {m.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                </div>
                <div className="msg-bubble-ai">
                  <div className="msg-text-ai" dangerouslySetInnerHTML={{ __html: formatText(m.content) }} />
                  {m.isStreaming && <span className="streaming-cursor">|</span>}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="msg-row ai">
                <div className="msg-icon pulse"><Bot size={18} /></div>
                <div className="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>
        </div>

        <div className="ai-input-area">
          {error && <div className="error-box"><AlertCircle size={14} /> {error}</div>}
          <div className="ai-input-bar">
            <input 
              type="text" 
              placeholder="Nhập câu hỏi của bạn..." 
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
        .ai-view-container { height: 100vh; padding: 30px; background: #020617; display: flex; justify-content: center; }
        .ai-chat-card { width: 100%; max-width: 900px; height: 100%; display: flex; flex-direction: column; border-radius: 24px; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .ai-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .ai-badge { display: inline-flex; align-items: center; gap: 6px; color: #00d2ff; font-size: 0.65rem; font-weight: 800; }
        .ai-header h2 { margin: 0; font-size: 1.4rem; color: white; font-weight: 900; }

        .ai-messages-wrapper { flex: 1; overflow-y: auto; padding: 25px; }
        .messages-list { display: flex; flex-direction: column; gap: 20px; }
        .msg-row { display: flex; gap: 15px; max-width: 90%; }
        .msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
        .msg-icon { width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; }
        .msg-row.ai .msg-icon { background: linear-gradient(135deg, #00d2ff, #3a7bd5); color: white; }
        
        .msg-bubble-ai { padding: 14px 18px; border-radius: 20px; font-size: 0.95rem; line-height: 1.6; }
        .msg-row.ai .msg-bubble-ai { background: rgba(30, 41, 59, 0.7); color: #cbd5e1; border-top-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
        .msg-row.user .msg-bubble-ai { background: #00d2ff; color: #020617; border-top-right-radius: 4px; font-weight: 600; }
        
        .streaming-cursor { display: inline-block; width: 2px; height: 1em; background: #00d2ff; margin-left: 4px; animation: blink 0.8s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .typing-dots { display: flex; gap: 4px; padding: 15px 20px; background: rgba(255,255,255,0.03); border-radius: 15px; border-top-left-radius: 2px; }
        .typing-dots span { width: 6px; height: 6px; background: #00d2ff; border-radius: 50%; animation: bounce 1s infinite; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }

        .ai-input-area { padding: 20px 25px; border-top: 1px solid rgba(255,255,255,0.05); }
        .error-box { color: #ef4444; font-size: 0.8rem; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
        .ai-input-bar { display: flex; gap: 12px; background: rgba(0,0,0,0.2); padding: 8px 18px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .ai-input-bar input { flex: 1; background: transparent; border: none; color: white; outline: none; }
        .ai-send-btn { background: #00d2ff; color: #020617; border: none; width: 38px; height: 38px; border-radius: 12px; cursor: pointer; }

        @media (max-width: 768px) {
          .ai-view-container { padding: 70px 10px 90px; }
        }
      ` }} />
    </div>
  );
};

export default AiAssistantView;
