import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Lock, CheckCircle } from 'lucide-react';
import { mockAuth } from '../data/mockAuth';
import API_URL from '../config';

const SettingsView = ({ user, onUpdateUser }) => {
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '👤');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const avatarOptions = ['👤', '⚽', '🏆', '🔥', '🦁', '🦅', '🧤', '🏟️', '👟', '📢'];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const renderAvatar = (src) => {
    const isImage = src?.startsWith('data:image') || src?.startsWith('http');
    if (isImage) {
      return <img src={src} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />;
    }
    return src;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    try {
      const host = window.location.hostname;
      const res = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockAuth.getToken()}`
        },
        body: JSON.stringify({ name, avatar, password: password || undefined })
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        onUpdateUser(updatedUser);
        setMessage('Cập nhật thành công!');
        setPassword('');
      } else {
        setMessage('Lỗi khi cập nhật!');
      }
    } catch (err) {
      setMessage('Lỗi kết nối!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-container animate-fade">
      <header className="settings-header">
        <h1 className="font-outfit">Cài đặt tài khoản</h1>
        <p>Tùy chỉnh hồ sơ của bạn cho cộng đồng World Cup</p>
      </header>

      <div className="settings-content glass-panel">
        <form onSubmit={handleSave}>
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <div className="current-avatar">{renderAvatar(avatar)}</div>
              <label className="upload-badge">
                <Camera size={16} />
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            
            <div className="avatar-grid">
              {avatarOptions.map(opt => (
                <button 
                  key={opt} 
                  type="button" 
                  onClick={() => setAvatar(opt)}
                  className={`avatar-opt ${avatar === opt ? 'active' : ''}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Chọn biểu tượng hoặc tải ảnh lên
            </div>
          </div>

          {/* Form Fields */}
          <div className="form-group">
            <label><User size={14} /> Tên hiển thị</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="settings-input"
              placeholder="Nhập tên của bạn"
            />
          </div>

          <div className="form-group">
            <label><Lock size={14} /> Mật khẩu mới (để trống nếu không đổi)</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="settings-input"
              placeholder="••••••••"
            />
          </div>

          <div className="notification-settings card-box-inner">
            <div className="flex justify-between items-center">
              <div className="notif-info">
                <h4 className="font-bold text-sm mb-1">Thông báo đẩy</h4>
                <p className="text-[10px] text-slate-400">Nhận thông báo khi có người gáy hoặc kết quả trận đấu</p>
              </div>
              <div className="notif-toggle-wrapper">
                <button 
                  type="button"
                  onClick={async () => {
                    if ('Notification' in window) {
                      const res = await Notification.requestPermission();
                      setMessage(res === 'granted' ? 'Đã bật thông báo thành công!' : 'Bạn đã từ chối quyền thông báo.');
                    }
                  }}
                  className={`notif-toggle ${('Notification' in window && Notification.permission === 'granted') ? 'active' : ''}`}
                >
                  <div className="toggle-dot"></div>
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className={`status-message ${message.includes('thành công') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="save-settings-btn" disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .settings-container {
          max-width: 500px;
          margin: 0 auto;
          padding-bottom: 120px;
        }
        .settings-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .settings-header h1 {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .settings-header p {
          color: var(--text-dim);
          font-size: 0.9rem;
        }
        .settings-content {
          padding: 30px;
          border-radius: 20px;
        }
        .avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 30px;
          border-bottom: 1px solid var(--border-color);
        }
        .avatar-wrapper {
          position: relative;
          margin-bottom: 20px;
        }
        .current-avatar {
          width: 90px;
          height: 90px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          border: 2px solid var(--primary-cyan);
          box-shadow: 0 0 20px rgba(0, 210, 255, 0.2);
          overflow: hidden;
        }
        .upload-badge {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 32px;
          height: 32px;
          background: var(--cyan-gradient);
          color: black;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 3px solid #0a0a1a;
          transition: transform 0.2s;
        }
        .upload-badge:hover {
          transform: scale(1.1);
        }
        .avatar-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
        }
        .avatar-opt {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--border-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s;
        }
        .avatar-opt:hover {
          background: rgba(255,255,255,0.08);
        }
        .avatar-opt.active {
          border-color: var(--primary-cyan);
          background: rgba(0, 210, 255, 0.1);
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-dim);
          margin-bottom: 8px;
        }
        .settings-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: white;
          font-size: 0.95rem;
        }
        .settings-input:focus {
          border-color: var(--primary-cyan);
          outline: none;
        }

        .card-box-inner {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 15px;
          border-radius: 16px;
          margin-bottom: 25px;
        }
        .notif-toggle {
          width: 44px;
          height: 24px;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          position: relative;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        .notif-toggle.active {
          background: var(--primary-cyan);
          box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);
        }
        .toggle-dot {
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: all 0.3s;
        }
        .notif-toggle.active .toggle-dot {
          left: 23px;
        }

        .status-message {
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 0.85rem;
          text-align: center;
        }
        .status-message.success {
          background: rgba(0, 255, 100, 0.1);
          color: #00ff64;
          border: 1px solid rgba(0, 255, 100, 0.2);
        }
        .status-message.error {
          background: rgba(255, 0, 0, 0.1);
          color: #ff4d4d;
          border: 1px solid rgba(255, 0, 0, 0.2);
        }
        .save-settings-btn {
          width: 100%;
          padding: 16px;
          background: var(--cyan-gradient);
          color: black;
          font-weight: 800;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .save-settings-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};

export default SettingsView;
