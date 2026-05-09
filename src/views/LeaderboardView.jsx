import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';

const LeaderboardView = ({ leaderboard }) => {
  return (
    <div className="leaderboard-container animate-fade">
      <header className="page-header-lb">
        <Medal className="trophy-icon-lb" size={48} />
        <h1 className="font-outfit lb-title">Bảng Xếp Hạng Bạn Bè</h1>
        <p className="lb-subtitle">Ai sẽ là "Nhà tiên tri" World Cup 2026?</p>
      </header>

      <div className="lb-list glass-panel">
        {leaderboard.length > 0 ? leaderboard.map((user, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`lb-item ${index === 0 ? 'top-1' : ''}`}
          >
            <div className="lb-rank">
              {index === 0 && <Trophy size={20} color="#ffd700" />}
              {index === 1 && <Trophy size={18} color="#c0c0c0" />}
              {index === 2 && <Trophy size={16} color="#cd7f32" />}
              {index > 2 && <span>{index + 1}</span>}
            </div>

            <div className="user-avatar-lb">
              {(() => {
                const src = user.avatar;
                const isImage = src?.startsWith('data:image') || src?.startsWith('http');
                if (isImage) {
                  return <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                }
                return <span style={{ fontSize: '1.2rem' }}>{src || '👤'}</span>;
              })()}
            </div>

            <div className="user-info-lb">
              <span className="user-name-lb">{user.name}</span>
              <span className="user-role-lb">{index === 0 ? 'Dẫn đầu' : 'Thành viên'}</span>
            </div>

            <div className="user-points-lb">
              <span className="points-val">{user.total_points || 0}</span>
              <span className="points-label">ĐIỂM</span>
            </div>
          </motion.div>
        )) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            Chưa có ai tham gia dự đoán!
          </div>
        )}
      </div>

      <style jsx>{`
        .leaderboard-container {
          max-width: 600px;
          margin: 0 auto;
          padding-bottom: 100px;
        }
        .page-header-lb {
          text-align: center;
          margin-bottom: 40px;
        }
        .trophy-icon-lb {
          color: var(--primary-cyan);
          margin-bottom: 15px;
          filter: drop-shadow(0 0 10px var(--primary-cyan));
        }
        .lb-title {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 10px;
        }
        .lb-subtitle {
          color: var(--text-dim);
          font-size: 0.9rem;
        }
        .lb-list {
          padding: 10px;
          border-radius: 20px;
        }
        .lb-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 8px;
          background: rgba(255,255,255,0.02);
          border: 1px solid transparent;
          transition: all 0.3s;
        }
        .lb-item:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(0, 210, 255, 0.2);
          transform: scale(1.02);
        }
        .top-1 {
          background: rgba(0, 210, 255, 0.05);
          border-color: var(--primary-cyan);
        }
        .lb-rank {
          width: 40px;
          display: flex;
          justify-content: center;
          font-weight: 800;
          font-size: 1.1rem;
        }
        .user-avatar-lb {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 15px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .user-info-lb {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .user-name-lb {
          font-weight: 700;
          font-size: 1rem;
        }
        .user-role-lb {
          font-size: 0.7rem;
          color: var(--text-dim);
          text-transform: uppercase;
        }
        .user-points-lb {
          text-align: right;
          display: flex;
          flex-direction: column;
        }
        .points-val {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--primary-cyan);
          font-family: 'Outfit', sans-serif;
        }
        .points-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
};

export default LeaderboardView;
