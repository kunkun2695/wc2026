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

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Registration States
  const [regQuestion, setRegQuestion] = useState('Đội bóng yêu thích của bạn là gì?');
  const [regAnswer, setRegAnswer] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const host = window.location.hostname;
      const body = isLogin 
        ? { username, password } 
        : { username, password, name, security_question: regQuestion, security_answer: regAnswer };

      const res = await fetch(`${API_URL}/api/users/${isLogin ? 'login' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (!isLogin) {
        setSuccessMsg(data.message || 'Đăng ký thành công! Tài khoản của bạn đang chờ Admin xác thực.');
        setUsername('');
        setPassword('');
        setName('');
        setRegAnswer('');
        setTimeout(() => {
          setIsLogin(true);
          setSuccessMsg('');
        }, 3000);
      } else {
        mockAuth.setToken(data.token);
        mockAuth.setUser(data.user);
        onLogin(data.user);
        
        // Đăng ký nhận thông báo đẩy
        subscribeToPush();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFindAccount = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/forgot-password/question?username=${username}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSecurityQuestion(data.security_question);
      setForgotStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          security_answer: securityAnswer,
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccessMsg('Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        setIsForgotPassword(false);
        setIsLogin(true);
        setForgotStep(1);
        setNewPassword('');
        setConfirmPassword('');
        setSecurityAnswer('');
        setSuccessMsg('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-background"></div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="auth-container"
        >
          <div className="auth-card">
            <div className="auth-header" style={{ marginBottom: '25px' }}>
              <div className="logo-icon">
                <Trophy size={48} color="#00d2ff" />
              </div>
              <h1 className="auth-title" style={{ fontSize: '1.8rem' }}>KHÔI PHỤC MẬT KHẨU</h1>
              <p className="auth-subtitle">Sử dụng câu hỏi bảo mật để đặt lại</p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleFindAccount} className="auth-form">
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginBottom: '8px', lineHeight: 1.4 }}>
                  Nhập tên đăng nhập của tài khoản bạn muốn khôi phục mật khẩu:
                </p>
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

                {error && <div className="error-message" style={{ marginTop: '8px' }}>{error}</div>}

                <button type="submit" className="submit-btn" disabled={loading} style={{ width: '100%', marginTop: '15px' }}>
                  {loading ? <div className="spinner"></div> : 'TÌM TÀI KHOẢN'}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPassword(false); setError(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#00d2ff', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', marginTop: '15px', width: '100%', textAlign: 'center' }}
                >
                  QUAY LẠI ĐĂNG NHẬP
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="auth-form">
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '5px' }}>
                  <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, display: 'block', marginBottom: '4px' }}>CÂU HỎI BẢO MẬT CỦA BẠN</label>
                  <p style={{ color: '#00d2ff', fontWeight: 700, fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>{securityQuestion}</p>
                </div>

                <div className="input-field">
                  <Edit3 size={18} className="field-icon" />
                  <input 
                    type="text" 
                    placeholder="Nhập câu trả lời bảo mật..." 
                    value={securityAnswer} 
                    onChange={e => setSecurityAnswer(e.target.value)} 
                    required 
                  />
                </div>

                <div className="input-field">
                  <Lock size={18} className="field-icon" />
                  <input 
                    type="password" 
                    placeholder="Mật khẩu mới" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div className="input-field">
                  <Lock size={18} className="field-icon" />
                  <input 
                    type="password" 
                    placeholder="Nhập lại mật khẩu mới" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>

                {error && <div className="error-message" style={{ marginTop: '8px' }}>{error}</div>}
                {successMsg && <div style={{ color: '#00ff64', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', marginTop: '8px' }}>{successMsg}</div>}

                <button type="submit" className="submit-btn" disabled={loading} style={{ width: '100%', marginTop: '15px' }}>
                  {loading ? <div className="spinner"></div> : 'ĐẶT LẠI MẬT KHẨU'}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => { setForgotStep(1); setError(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', marginTop: '15px', width: '100%', textAlign: 'center' }}
                >
                  QUAY LẠI BƯỚC TRƯỚC
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

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

            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px' }}>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(''); setForgotStep(1); }}
                  style={{ background: 'none', border: 'none', color: '#00d2ff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <AnimatePresence>
              {!isLogin && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <div className="input-field">
                    <Edit3 size={18} className="field-icon" />
                    <input 
                      type="text" 
                      placeholder="Họ và tên của bạn" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Câu hỏi bảo mật (Khôi phục tài khoản)</label>
                    <select 
                      value={regQuestion} 
                      onChange={e => setRegQuestion(e.target.value)} 
                      style={{ width: '100%', padding: '10px 8px', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', color: 'white', fontSize: '0.8rem', outline: 'none' }}
                    >
                      <option value="Đội bóng yêu thích của bạn là gì?">Đội bóng yêu thích của bạn là gì?</option>
                      <option value="Cầu thủ bóng đá thần tượng của bạn là ai?">Cầu thủ bóng đá thần tượng của bạn là ai?</option>
                      <option value="Mật mã khôi phục bí mật của bạn là gì?">Mật mã khôi phục bí mật của bạn là gì?</option>
                      <option value="Tên trường tiểu học đầu tiên của bạn?">Tên trường tiểu học đầu tiên của bạn?</option>
                      <option value="Tên con vật cưng đầu tiên của bạn?">Tên con vật cưng đầu tiên của bạn?</option>
                    </select>
                    <input 
                      type="text" 
                      placeholder="Nhập câu trả lời..." 
                      value={regAnswer} 
                      onChange={e => setRegAnswer(e.target.value)} 
                      required 
                      style={{ width: '100%', padding: '12px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', color: 'white', fontSize: '0.85rem', outline: 'none', marginTop: '4px' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginBottom: '10px'
                }}
              >
                {successMsg}
              </motion.div>
            )}

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
          background-image: url('/world_cup_bg_1778304438311.png');
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
