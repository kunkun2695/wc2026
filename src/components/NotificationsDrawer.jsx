import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, User } from 'lucide-react';
import UserAvatar from './UserAvatar';

const NotificationsDrawer = ({ notifications, onClose, onMarkAsRead, onDeleteAll, onNotificationClick, onRequestPermission }) => {
  const showEnableButton = 'Notification' in window && Notification.permission !== 'granted';

  return (
    <motion.div 
      initial={{ x: 400 }} 
      animate={{ x: 0 }} 
      exit={{ x: 400 }}
      className="notifications-drawer"
    >
      <div className="notif-header">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-yellow-400" />
          <h3 className="font-outfit font-bold">Thông báo</h3>
        </div>
        <button onClick={onClose} className="close-btn"><X size={20} /></button>
      </div>

      <div className="notif-actions">
        <button onClick={onMarkAsRead} className="action-btn">
          <Check size={14} /> Đọc hết
        </button>
        <button onClick={onDeleteAll} className="action-btn delete">
          <Trash2 size={14} /> Xóa hết
        </button>
      </div>

      {showEnableButton && (
        <div className="enable-notif-banner">
          <p>Bật thông báo để không bỏ lỡ gáy!</p>
          <button onClick={onRequestPermission} className="enable-btn">
            CHO PHÉP NGAY
          </button>
        </div>
      )}

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="empty-notif">
            <Bell size={48} className="opacity-10 mb-4" />
            <p>Không có thông báo mới</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`notif-item ${notif.is_read ? 'read' : 'unread'}`}
              onClick={() => onNotificationClick(notif)}
              style={{ cursor: 'pointer' }}
            >
              <div className="notif-avatar">
                <UserAvatar src={notif.sender_avatar} size={36} />
              </div>
              <div className="notif-content">
                <p className="notif-text">{notif.content}</p>
                <span className="notif-time">{new Date(notif.created_at).toLocaleString()}</span>
              </div>
              {!notif.is_read && <div className="unread-dot"></div>}
            </div>
          ))
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .notifications-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 350px;
          background: #0f172a;
          border-left: 1px solid rgba(255,255,255,0.1);
          z-index: 5000;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 40px rgba(0,0,0,0.5);
        }
        @media (max-width: 640px) {
          .notifications-drawer { width: 100%; }
        }
        .notif-header {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }
        .notif-actions {
          padding: 10px 20px;
          display: flex;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .action-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .action-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .action-btn.delete:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        
        .enable-notif-banner {
          background: linear-gradient(135deg, #3a86ff 0%, #00d2ff 100%);
          margin: 10px 20px;
          padding: 15px;
          border-radius: 12px;
          color: black;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          text-align: center;
        }
        .enable-notif-banner p {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .enable-btn {
          background: black;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 900;
          cursor: pointer;
        }
        
        .notif-list {
          flex: 1;
          overflow-y: auto;
        }
        .empty-notif {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #475569;
        }
        .notif-item {
          padding: 16px 20px;
          display: flex;
          gap: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          position: relative;
          transition: background 0.2s;
        }
        .notif-item.unread { background: rgba(58, 134, 255, 0.03); }
        .notif-item.unread:hover { background: rgba(58, 134, 255, 0.06); }
        .notif-item.read { opacity: 0.7; }
        
        .notif-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          background: #1e293b;
          flex-shrink: 0;
        }
        .notif-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; color: #475569; }
        
        .notif-content { flex: 1; }
        .notif-text { color: #e2e8f0; font-size: 0.85rem; line-height: 1.4; margin-bottom: 4px; }
        .notif-time { color: #64748b; font-size: 0.7rem; font-weight: 500; }
        
        .unread-dot {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          box-shadow: 0 0 10px #3b82f6;
        }
      ` }} />
    </motion.div>
  );
};

export default NotificationsDrawer;
