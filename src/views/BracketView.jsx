import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield, ChevronRight, Zap } from 'lucide-react';

const BracketMatch = ({ match, stage }) => {
  if (!match) return <div className="bracket-match-empty" />;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bracket-match-card ${match.status === 'LIVE' ? 'is-live' : ''}`}
    >
      <div className="match-team-row">
        <div className="team-info">
          <span className="team-flag">{match.team1_flag || '⚽'}</span>
          <span className="team-name">{match.team1_name || 'TBD'}</span>
        </div>
        <span className={`team-score ${match.team1_score > match.team2_score ? 'winner' : ''}`}>
          {match.status === 'UPCOMING' ? '-' : match.team1_score}
        </span>
      </div>
      <div className="match-divider" />
      <div className="match-team-row">
        <div className="team-info">
          <span className="team-flag">{match.team2_flag || '⚽'}</span>
          <span className="team-name">{match.team2_name || 'TBD'}</span>
        </div>
        <span className={`team-score ${match.team2_score > match.team1_score ? 'winner' : ''}`}>
          {match.status === 'UPCOMING' ? '-' : match.team2_score}
        </span>
      </div>
      
      {match.status === 'LIVE' && (
        <div className="live-indicator">
          <div className="live-dot" />
          <span>LIVE</span>
        </div>
      )}
    </motion.div>
  );
};

const BracketView = ({ matches = [] }) => {
  // Lọc các trận knockout (Giả định Round of 16, QF, SF, Final)
  // Trong thực tế, bạn có thể đánh dấu trận đấu thuộc vòng nào trong DB
  // Ở đây tôi sẽ demo cấu trúc cây cho World Cup
  
  const knockoutStages = [
    { id: 'r16', name: 'Vòng 1/8', matches: Array(8).fill(null) },
    { id: 'qf', name: 'Tứ kết', matches: Array(4).fill(null) },
    { id: 'sf', name: 'Bán kết', matches: Array(2).fill(null) },
    { id: 'final', name: 'Chung kết', matches: Array(1).fill(null) }
  ];

  // Map matches thực tế vào bracket nếu có (Ví dụ dựa vào competition_name hoặc stage)
  // Tạm thời hiển thị cấu trúc mẫu cho người dùng thấy "dạng cây" premium

  return (
    <div className="bracket-view-container">
      <div className="bracket-header">
        <div className="header-content">
          <Trophy size={32} className="header-icon" />
          <div>
            <h1>SƠ ĐỒ NHÁNH ĐẤU</h1>
            <p>World Cup 2026 - Con đường đến vinh quang</p>
          </div>
        </div>
        
        <div className="bracket-legend">
          <div className="legend-item">
            <span className="dot winner" /> Thắng
          </div>
          <div className="legend-item">
            <span className="dot live" /> Đang diễn ra
          </div>
        </div>
      </div>

      <div className="bracket-scroll-area">
        <div className="bracket-tree">
          {knockoutStages.map((stage, sIdx) => (
            <div key={stage.id} className={`bracket-column stage-${stage.id}`}>
              <div className="stage-header">{stage.name}</div>
              <div className="stage-matches">
                {stage.matches.map((m, mIdx) => (
                  <div key={mIdx} className="bracket-match-wrapper">
                    <BracketMatch match={m} stage={stage.id} />
                    {sIdx < knockoutStages.length - 1 && (
                      <div className={`bracket-connector ${mIdx % 2 === 0 ? 'top' : 'bottom'}`}>
                        <div className="line-horizontal" />
                        <div className="line-vertical" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="final-stage">
            <div className="winner-platform">
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="trophy-container"
              >
                <Trophy size={80} color="#ffd700" />
                <div className="trophy-glow" />
              </motion.div>
              <div className="platform-base">WORLD CUP 2026</div>
              <div className="champion-label">NHÀ VÔ ĐỊCH</div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .bracket-view-container {
          min-height: 100vh;
          background: radial-gradient(circle at top right, #1e293b, #020617);
          padding: 40px;
          color: white;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .bracket-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 50px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding-bottom: 20px;
        }

        .header-content { display: flex; align-items: center; gap: 20px; }
        .header-icon { color: #00d2ff; filter: drop-shadow(0 0 10px rgba(0,210,255,0.5)); }
        .bracket-header h1 { font-size: 2.5rem; font-weight: 900; margin: 0; letter-spacing: -1px; }
        .bracket-header p { color: #64748b; margin: 5px 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; font-size: 0.8rem; }

        .bracket-legend { display: flex; gap: 20px; margin-bottom: 5px; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #475569; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.winner { background: #00d2ff; }
        .dot.live { background: #ef4444; }

        .bracket-scroll-area {
          flex: 1;
          overflow-x: auto;
          overflow-y: auto;
          padding: 40px 0;
          display: flex;
          justify-content: center;
        }

        .bracket-tree {
          display: flex;
          gap: 60px;
          align-items: center;
          padding-right: 100px;
        }

        .bracket-column {
          display: flex;
          flex-direction: column;
          gap: 30px;
          min-width: 220px;
        }

        .stage-header {
          text-align: center;
          font-weight: 900;
          font-size: 0.75rem;
          color: #00d2ff;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 20px;
          padding: 8px;
          background: rgba(0,210,255,0.05);
          border-radius: 8px;
        }

        .stage-matches {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          flex: 1;
          gap: 40px;
        }

        .bracket-match-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .bracket-match-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          width: 220px;
          padding: 12px;
          position: relative;
          z-index: 2;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transition: 0.3s;
        }
        .bracket-match-card:hover { transform: scale(1.05); border-color: rgba(0,210,255,0.3); }

        .bracket-match-empty {
          width: 220px;
          height: 80px;
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.02);
        }
        .bracket-match-empty::after { content: 'CHỜ CẬP NHẬT'; font-size: 0.6rem; font-weight: 800; color: rgba(255,255,255,0.1); letter-spacing: 2px; }

        .match-team-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
        .team-info { display: flex; align-items: center; gap: 10px; }
        .team-flag { font-size: 1.2rem; }
        .team-name { font-size: 0.85rem; font-weight: 700; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }
        .team-score { font-size: 1rem; font-weight: 900; color: #64748b; min-width: 20px; text-align: right; }
        .team-score.winner { color: #00d2ff; text-shadow: 0 0 10px rgba(0,210,255,0.5); }

        .match-divider { height: 1px; background: rgba(255,255,255,0.05); margin: 4px 0; }

        .live-indicator { position: absolute; top: -10px; right: 10px; background: #ef4444; padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; font-size: 0.6rem; font-weight: 900; }
        .live-dot { width: 5px; height: 5px; background: white; border-radius: 50%; animation: pulse 1s infinite; }

        /* Connectors logic */
        .bracket-connector {
          position: absolute;
          right: -60px;
          top: 50%;
          width: 60px;
          height: 100%;
        }
        .line-horizontal { position: absolute; top: 0; left: 0; width: 30px; height: 2px; background: rgba(255,255,255,0.1); }
        .line-vertical { position: absolute; width: 2px; background: rgba(255,255,255,0.1); right: 30px; }

        .stage-r16 .bracket-connector { height: 60px; }
        .stage-r16 .bracket-connector.top { top: 50%; }
        .stage-r16 .bracket-connector.top .line-vertical { height: 30px; top: 0; }
        .stage-r16 .bracket-connector.bottom { top: -10px; }
        .stage-r16 .bracket-connector.bottom .line-vertical { height: 30px; bottom: 30px; }

        .stage-qf .bracket-connector { height: 120px; }
        .stage-sf .bracket-connector { height: 240px; }

        .final-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding-left: 40px;
        }

        .winner-platform {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .trophy-container { position: relative; z-index: 5; margin-bottom: 20px; }
        .trophy-glow { 
          position: absolute; inset: -20px; background: radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%); 
          animation: rotate 10s linear infinite; 
        }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .platform-base {
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          padding: 15px 40px;
          border-radius: 4px;
          font-weight: 900;
          font-size: 1.2rem;
          color: white;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          border-top: 2px solid #ffd700;
          letter-spacing: 5px;
        }
        .champion-label { margin-top: 15px; color: #ffd700; font-weight: 900; font-size: 0.7rem; letter-spacing: 3px; }

        @media (max-width: 1024px) {
          .bracket-view-container { padding: 80px 20px 40px; }
          .bracket-header h1 { font-size: 1.8rem; }
        }
      ` }} />
    </div>
  );
};

export default BracketView;
