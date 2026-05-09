import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Edit3, ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { mockAuth } from '../data/mockAuth';
import API_URL from '../config';
import { subscribeToPush } from '../utils/pushNotifications';

const AuthView = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const host = window.location.hostname;
      const res = await fetch(`${API_URL}/api/users/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      mockAuth.setToken(data.token);
      mockAuth.setUser(data.user);
      onLogin(data.user);
      
      // Đăng ký nhận thông báo đẩy
      subscribeToPush();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-background"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="auth-container"
      >
        <div className="auth-card">
          <div className="auth-header">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="logo-icon"
            >
              <Trophy size={48} color="#00d2ff" />
            </motion.div>
            <h1 className="auth-title">WORLD CUP 2026</h1>
            <p className="auth-subtitle">Dự đoán tỉ số - Gáy cùng đồng đội</p>
          </div>

          <div className="auth-tabs">
            <button 
              onClick={() => { setIsLogin(true); setError(''); }} 
              className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
            >
              ĐĂNG NHẬP
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }} 
              className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
            >
              ĐĂNG KÝ
            </button>
            <motion.div 
              className="tab-indicator"
              animate={{ x: isLogin ? 0 : '100%' }}
            />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-field">
              <User size={18} className="field-icon" />
              <input 
                type="text" 
                placeholder="Tên đăng nhập" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
              />
            </div>

            <div className="input-field">
              <Lock size={18} className="field-icon" />
              <input 
                type="password" 
                placeholder="Mật khẩu" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            <AnimatePresence>
              {!isLogin && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="input-field mt-4">
                    <Edit3 size={18} className="field-icon" />
                    <input 
                      type="text" 
                      placeholder="Họ và tên của bạn" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="error-message"
              >
                {error}
              </motion.div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  {isLogin ? 'Vào sân ngay' : 'Tạo đội hình'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <Sparkles size={14} />
            <span>Chơi vui vẻ, không quạu!</span>
          </div>
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-page-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020617;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }
        .auth-background {
          position: absolute;
          inset: 0;
          background-image: url('/Users/macbook/.gemini/antigravity/brain/250e2b1f-c02c-4e08-b54e-56d11ecc62eb/world_cup_bg_1778304438311.png');
          background-size: cover;
          background-position: center;
          opacity: 0.4;
          filter: blur(5px);
        }
        .auth-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
        }
        .auth-card {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo-icon {
          display: inline-block;
          margin-bottom: 16px;
        }
        .auth-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 900;
          color: white;
          letter-spacing: -0.05em;
          margin-bottom: 8px;
          background: linear-gradient(to bottom, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .auth-subtitle {
          color: #94a3b8;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .auth-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 6px;
          margin-bottom: 32px;
          position: relative;
        }
        .auth-tab-btn {
          flex: 1;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 800;
          padding: 12px;
          cursor: pointer;
          z-index: 2;
          transition: color 0.3s;
        }
        .auth-tab-btn.active {
          color: white;
        }
        .tab-indicator {
          position: absolute;
          top: 6px;
          left: 6px;
          bottom: 6px;
          width: calc(50% - 6px);
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          z-index: 1;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .input-field {
          position: relative;
          display: flex;
          align-items: center;
        }
        .field-icon {
          position: absolute;
          left: 16px;
          color: #64748b;
        }
        .input-field input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px 16px 16px 48px;
          color: white;
          font-size: 0.95rem;
          transition: all 0.3s;
        }
        .input-field input:focus {
          outline: none;
          border-color: #00d2ff;
          background: rgba(0, 210, 255, 0.05);
          box-shadow: 0 0 20px rgba(0, 210, 255, 0.1);
        }
        .submit-btn {
          margin-top: 10px;
          background: linear-gradient(135deg, #00d2ff 0%, #3a8dff 100%);
          border: none;
          border-radius: 18px;
          padding: 18px;
          color: #020617;
          font-weight: 800;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 210, 255, 0.4);
        }
        .submit-btn:active {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error-message {
          color: #ff4d4d;
          font-size: 0.8rem;
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
        }
        .auth-footer {
          margin-top: 32px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #64748b;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top: 3px solid black;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .overflow-hidden {
          overflow: hidden;
        }
      ` }} />
    </div>
  );
};

export default AuthView;
