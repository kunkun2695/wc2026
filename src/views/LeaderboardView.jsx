import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, AlertTriangle } from 'lucide-react';
import UserAvatar from '../components/UserAvatar';

const LeaderboardView = ({ leaderboard }) => {
  // Tách 3 vị trí đầu tiên để đưa lên bục vinh quang (podium)
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="leaderboard-container animate-fade">
      <header className="page-header-lb">
        <div className="medal-glow-wrapper">
          <Medal className="trophy-icon-lb" size={48} />
        </div>
        <h1 className="font-outfit lb-title">BẢNG XẾP HẠNG TIÊN TRI</h1>
        <p className="lb-subtitle">Hệ thống tính điểm & phạt ăn nhậu tự động theo thời gian thực</p>
      </header>

      {/* Bục vinh quang (Top 3) */}
      {leaderboard.length > 0 && (
        <div className="lb-podium">
          {/* Hạng 2 (Silver) */}
          {topThree[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="podium-card rank-2"
            >
              <div className="podium-avatar-wrapper">
                <UserAvatar src={topThree[1].avatar} size={64} />
                <div className="podium-badge silver">2</div>
              </div>
              <span className="podium-name">{topThree[1].name}</span>
              <span className="podium-role">Á Quân</span>
              <span className="podium-points">{topThree[1].total_points || 0} ĐIỂM</span>
              <div className="podium-fines">
                <span>{Math.floor(topThree[1].total_fines / 1000)}k</span>
                <span className="fine-sub">phạt</span>
              </div>
            </motion.div>
          )}

          {/* Hạng 1 (Gold) - Đứng giữa, cao nhất */}
          {topThree[0] && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="podium-card rank-1"
            >
              <div className="crown-icon">👑</div>
              <div className="podium-avatar-wrapper">
                <UserAvatar src={topThree[0].avatar} size={84} />
                <div className="podium-badge gold">1</div>
              </div>
              <span className="podium-name">{topThree[0].name}</span>
              <span className="podium-role golden-text">Tiên Tri</span>
              <span className="podium-points">{topThree[0].total_points || 0} ĐIỂM</span>
              <div className="podium-fines">
                <span>{Math.floor(topThree[0].total_fines / 1000)}k</span>
                <span className="fine-sub">phạt</span>
              </div>
            </motion.div>
          )}

          {/* Hạng 3 (Bronze) */}
          {topThree[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="podium-card rank-3"
            >
              <div className="podium-avatar-wrapper">
                <UserAvatar src={topThree[2].avatar} size={64} />
                <div className="podium-badge bronze">3</div>
              </div>
              <span className="podium-name">{topThree[2].name}</span>
              <span className="podium-role">Hạng 3</span>
              <span className="podium-points">{topThree[2].total_points || 0} ĐIỂM</span>
              <div className="podium-fines">
                <span>{Math.floor(topThree[2].total_fines / 1000)}k</span>
                <span className="fine-sub">phạt</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Danh sách xếp hạng từ hạng 4 trở đi */}
      <div className="lb-list-wrapper">
        {leaderboard.length > 0 ? (
          <div className="lb-list-table">
            <div className="lb-table-header">
              <span className="col-rank">HẠNG</span>
              <span className="col-user">THÀNH VIÊN</span>
              <span className="col-fines text-right">TIỀN PHẠT</span>
              <span className="col-points text-right">TỔNG ĐIỂM</span>
            </div>
            
            {remaining.length > 0 ? remaining.map((user, index) => {
              const actualRank = index + 4;
              return (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="lb-row-item"
                >
                  <div className="col-rank">
                    <span className="rank-number-badge">{actualRank}</span>
                  </div>

                  <div className="col-user">
                    <div className="user-avatar-mini">
                      <UserAvatar src={user.avatar} size={36} />
                    </div>
                    <span className="user-name-mini">{user.name}</span>
                  </div>

                  <div className="col-fines text-right">
                    <span className="fine-value-mini">{Math.floor(user.total_fines / 1000)}k</span>
                  </div>

                  <div className="col-points text-right">
                    <span className="points-value-mini">{user.total_points || 0}</span>
                  </div>
                </motion.div>
              );
            }) : leaderboard.length <= 3 ? (
              <div className="no-more-users">
                ✨ Mọi thành viên tiên tri đã có mặt trên bục vinh quang!
              </div>
            ) : null}
          </div>
        ) : (
          <div className="empty-lb-state">
            <div className="alert-icon-box">
              <AlertTriangle size={36} />
            </div>
            <h3>Chưa có bảng xếp hạng</h3>
            <p>Hãy tham gia dự đoán các trận đấu tiếp theo để kích hoạt điểm xếp hạng.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaderboard-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px 100px 20px;
        }
        .page-header-lb {
          text-align: center;
          margin-bottom: 45px;
        }
        .medal-glow-wrapper {
          width: 76px;
          height: 76px;
          background: rgba(0, 210, 255, 0.08);
          border: 1px solid rgba(0, 210, 255, 0.2);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 18px;
          box-shadow: 0 8px 20px rgba(0, 210, 255, 0.15);
        }
        .trophy-icon-lb {
          color: #00d2ff;
          filter: drop-shadow(0 0 8px #00d2ff);
        }
        .lb-title {
          font-size: 2rem;
          font-weight: 900;
          color: white;
          letter-spacing: -1px;
          margin-bottom: 6px;
        }
        .lb-subtitle {
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 600;
        }

        /* Podium styling */
        .lb-podium {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 16px;
          margin-bottom: 45px;
          padding: 10px 0;
        }
        
        .podium-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(30, 41, 59, 0.3) 100%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 31%;
          max-width: 180px;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .podium-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 210, 255, 0.2);
          box-shadow: 0 12px 30px rgba(0,0,0,0.5);
        }
        
        .podium-card.rank-1 {
          max-width: 200px;
          padding: 35px 20px 25px 20px;
          border-color: rgba(255, 215, 0, 0.25);
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.04) 0%, rgba(15, 23, 42, 0.7) 100%);
          box-shadow: 0 0 25px rgba(255, 215, 0, 0.08);
          z-index: 2;
        }
        .podium-card.rank-2 {
          border-color: rgba(192, 192, 192, 0.2);
          background: linear-gradient(135deg, rgba(192, 192, 192, 0.03) 0%, rgba(15, 23, 42, 0.6) 100%);
        }
        .podium-card.rank-3 {
          border-color: rgba(205, 127, 50, 0.2);
          background: linear-gradient(135deg, rgba(205, 127, 50, 0.03) 0%, rgba(15, 23, 42, 0.6) 100%);
        }

        .crown-icon {
          position: absolute;
          top: -26px;
          font-size: 2.2rem;
          animation: float 2.5s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        .podium-avatar-wrapper {
          position: relative;
          margin-bottom: 12px;
        }
        .podium-badge {
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.75rem;
          color: black;
          border: 2px solid #0f172a;
        }
        .podium-badge.gold { background: #ffd700; box-shadow: 0 0 8px #ffd700; }
        .podium-badge.silver { background: #c0c0c0; }
        .podium-badge.bronze { background: #cd7f32; }

        .podium-name {
          font-weight: 800;
          color: white;
          font-size: 0.85rem;
          text-align: center;
          margin-bottom: 2px;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .podium-role {
          font-size: 0.65rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .golden-text {
          color: #ffd700 !important;
          text-shadow: 0 0 5px rgba(255, 215, 0, 0.2);
        }
        .podium-points {
          font-weight: 900;
          color: #00d2ff;
          font-size: 0.95rem;
          font-family: 'Outfit', sans-serif;
          letter-spacing: 0.5px;
        }
        .podium-fines {
          display: flex;
          align-items: baseline;
          gap: 2px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #ef4444;
          margin-top: 4px;
        }
        .fine-sub {
          font-size: 0.55rem;
          font-weight: 700;
          color: rgba(239, 68, 68, 0.6);
        }

        /* Leaderboard table-list styling */
        .lb-list-wrapper {
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 10px;
        }
        .lb-list-table {
          display: flex;
          flex-direction: column;
        }
        .lb-table-header {
          display: flex;
          padding: 12px 16px;
          font-size: 0.65rem;
          font-weight: 900;
          color: #475569;
          letter-spacing: 1.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        
        .col-rank { width: 60px; display: flex; align-items: center; }
        .col-user { flex: 1; display: flex; align-items: center; gap: 12px; }
        .col-fines { width: 100px; }
        .col-points { width: 100px; }
        
        .text-right { text-align: right; justify-content: flex-end; }

        .lb-row-item {
          display: flex;
          padding: 14px 16px;
          align-items: center;
          border-radius: 16px;
          margin-top: 4px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .lb-row-item:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(0, 210, 255, 0.1);
          transform: translateX(4px);
        }
        
        .rank-number-badge {
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 800;
          color: #64748b;
        }

        .user-avatar-mini {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .user-name-mini {
          font-weight: 700;
          color: white;
          font-size: 0.9rem;
        }
        
        .fine-value-mini {
          font-weight: 800;
          color: #ef4444;
          font-size: 0.95rem;
          font-family: 'Outfit', sans-serif;
        }
        .points-value-mini {
          font-weight: 900;
          color: #00d2ff;
          font-size: 1.05rem;
          font-family: 'Outfit', sans-serif;
        }

        .no-more-users {
          text-align: center;
          padding: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.5px;
        }

        .empty-lb-state {
          text-align: center;
          padding: 50px 20px;
          border: 1px dashed rgba(255,255,255,0.08);
          border-radius: 20px;
        }
        .alert-icon-box {
          color: #475569;
          margin-bottom: 15px;
        }
        .empty-lb-state h3 { color: white; margin-bottom: 8px; font-weight: 800; }
        .empty-lb-state p { color: #475569; font-size: 0.85rem; font-weight: 600; }

        @media (max-width: 600px) {
          .leaderboard-container { padding: 80px 15px 100px 15px; }
          .lb-podium { gap: 10px; }
          .podium-card { padding: 18px 10px; }
          .podium-card.rank-1 { padding: 25px 10px 18px 10px; }
          .podium-name { font-size: 0.75rem; }
          .podium-points { font-size: 0.85rem; }
          .col-fines { width: 70px; }
          .col-points { width: 70px; }
          .user-name-mini { font-size: 0.8rem; }
        }
      ` }} />
    </div>
  );
};

export default LeaderboardView;
