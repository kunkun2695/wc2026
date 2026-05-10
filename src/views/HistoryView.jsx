import React from 'react';
import { motion } from 'framer-motion';
import { History, CheckCircle2, Clock, Trophy, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

const HistoryView = ({ predictions }) => {
  const renderFlag = (flag) => {
    const isUrl = flag?.startsWith('http') || flag?.includes('.');
    if (isUrl) return <img src={flag} alt="flag" className="flag-mini-history" />;
    return <span className="flag-emoji-history">{flag || '⚽'}</span>;
  };

  const getOutcomeLabel = (p) => {
    if (p.predicted_home_score > p.predicted_away_score) return '1';
    if (p.predicted_home_score < p.predicted_away_score) return '2';
    return 'X';
  };

  const getActualOutcome = (p) => {
    if (p.status !== 'FT') return null;
    if (p.team1_score > p.team2_score) return '1';
    if (p.team1_score < p.team2_score) return '2';
    return 'X';
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return { time: '--:--', date: '---' };
    const parts = timeStr.includes(' - ') ? timeStr.split(' - ') : timeStr.split(' ');
    return { time: parts[0] || '--:--', date: parts[1] || '---' };
  };

  return (
    <div className="history-container animate-fade">
      <header className="page-header-history">
        <div className="header-icon-wrapper">
          <History className="header-icon-history" size={32} />
        </div>
        <h1 className="font-outfit">Lịch sử dự đoán</h1>
        <p>Thống kê những "kèo" bạn đã chốt</p>
      </header>

      <div className="history-list">
        {predictions.length > 0 ? predictions.map((p, index) => {
          const myChoice = getOutcomeLabel(p);
          const actualOutcome = getActualOutcome(p);
          const isCorrect = actualOutcome && myChoice === actualOutcome;
          const isFinished = p.status === 'FT';
          const { time, date } = parseTime(p.match_time);

          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`history-card-v2 ${isFinished ? (isCorrect ? 'is-correct' : 'is-wrong') : 'is-pending'}`}
            >
              {/* Header: Time and Status */}
              <div className="card-top">
                <div className="match-time-badge">
                  <Clock size={12} />
                  <span>{time} • {date}</span>
                </div>
                
                <div className="status-indicator">
                  {isFinished ? (
                    isCorrect ? (
                      <span className="status-label win"><CheckCircle2 size={12} /> THẮNG</span>
                    ) : (
                      <span className="status-label loss"><XCircle size={12} /> TRẬT</span>
                    )
                  ) : (
                    <span className="status-label pending"><AlertCircle size={12} /> {p.status === 'LIVE' ? 'LIVE' : 'CHỜ'}</span>
                  )}
                </div>
              </div>

              {/* Body: Teams and Scores */}
              <div className="card-body">
                <div className="team-info-mini">
                  <div className="flag-box">{renderFlag(p.team1_flag)}</div>
                  <span className="name-box">{p.team1_name}</span>
                </div>

                <div className="score-box-mini">
                  {isFinished || p.status === 'LIVE' ? (
                    <span className="score-text">{p.team1_score} - {p.team2_score}</span>
                  ) : (
                    <span className="vs-text">VS</span>
                  )}
                </div>

                <div className="team-info-mini right">
                  <span className="name-box">{p.team2_name}</span>
                  <div className="flag-box">{renderFlag(p.team2_flag)}</div>
                </div>
              </div>

              {/* Footer: Your Choice and Points */}
              <div className="card-footer-v2">
                <div className="choice-section">
                  <span className="footer-label">BẠN CHỌN:</span>
                  <div className="choice-pills">
                    <div className={`choice-pill ${myChoice === '1' ? 'active' : ''}`}>1</div>
                    <div className={`choice-pill ${myChoice === 'X' ? 'active' : ''}`}>X</div>
                    <div className={`choice-pill ${myChoice === '2' ? 'active' : ''}`}>2</div>
                  </div>
                </div>

                <div className="points-section">
                  {isFinished ? (
                    <div className={`points-badge ${isCorrect ? 'plus' : 'zero'}`}>
                      <TrendingUp size={14} />
                      <span>{isCorrect ? `+${p.points} ĐIỂM` : '0 ĐIỂM'}</span>
                    </div>
                  ) : (
                    <span className="points-estimate">ĐANG TÍNH...</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        }) : (
          <div className="empty-history-v2">
            <div className="empty-icon-box">
              <History size={48} />
            </div>
            <h3>Chưa có lịch sử</h3>
            <p>Hãy tham gia dự đoán các trận đấu sắp tới để tích điểm nhé!</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .history-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 100px 20px 150px;
        }
        .page-header-history {
          text-align: center;
          margin-bottom: 40px;
        }
        .header-icon-wrapper {
          width: 64px;
          height: 64px;
          background: rgba(0, 210, 255, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          border: 1px solid rgba(0, 210, 255, 0.2);
          color: #00d2ff;
        }
        .page-header-history h1 { font-size: 2rem; font-weight: 900; margin-bottom: 5px; }
        .page-header-history p { color: #64748b; font-weight: 600; }

        .history-list { display: flex; flex-direction: column; gap: 16px; }

        .history-card-v2 {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }
        .history-card-v2:hover { transform: translateY(-3px); border-color: rgba(255,255,255,0.1); }
        
        /* Variants */
        .history-card-v2.is-correct { border-left: 4px solid #00ff64; background: linear-gradient(90deg, rgba(0, 255, 100, 0.05) 0%, transparent 100%); }
        .history-card-v2.is-wrong { border-left: 4px solid #ff4d4d; }
        .history-card-v2.is-pending { border-left: 4px solid #00d2ff; }

        .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .match-time-badge { 
          display: flex; align-items: center; gap: 6px; 
          background: rgba(255,255,255,0.05); padding: 4px 12px; 
          border-radius: 10px; font-size: 0.7rem; font-weight: 800; color: #94a3b8;
        }
        .status-label { 
          font-size: 0.65rem; font-weight: 900; padding: 4px 10px; 
          border-radius: 8px; display: flex; align-items: center; gap: 4px;
        }
        .status-label.win { background: rgba(0, 255, 100, 0.1); color: #00ff64; }
        .status-label.loss { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; }
        .status-label.pending { background: rgba(0, 210, 255, 0.1); color: #00d2ff; }

        .card-body { 
          display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; 
          gap: 15px; margin-bottom: 25px; padding: 0 10px;
        }
        .team-info-mini { display: flex; align-items: center; gap: 12px; }
        .team-info-mini.right { flex-direction: row; justify-content: flex-end; }
        .flag-box { 
          width: 36px; height: 36px; background: rgba(255,255,255,0.03); 
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255,255,255,0.05); overflow: hidden;
        }
        .flag-mini-history { width: 100%; height: 100%; object-fit: contain; }
        .flag-emoji-history { font-size: 1.4rem; }
        .name-box { font-weight: 800; color: white; font-size: 0.9rem; }
        
        .score-box-mini { 
          background: rgba(0,0,0,0.3); padding: 8px 15px; 
          border-radius: 12px; min-width: 60px; text-align: center;
        }
        .score-text { font-weight: 900; font-size: 1.2rem; color: white; letter-spacing: 2px; }
        .vs-text { font-weight: 900; font-size: 0.8rem; color: #475569; }

        .card-footer-v2 { 
          display: flex; justify-content: space-between; align-items: center; 
          padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.05);
        }
        .footer-label { font-size: 0.65rem; font-weight: 800; color: #475569; margin-right: 10px; }
        .choice-section { display: flex; align-items: center; }
        .choice-pills { display: flex; gap: 6px; }
        .choice-pill { 
          width: 28px; height: 28px; border-radius: 8px; 
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 900; background: rgba(255,255,255,0.03);
          color: #475569; border: 1px solid rgba(255,255,255,0.05);
        }
        .choice-pill.active { background: #00d2ff; color: #020617; border-color: #00d2ff; box-shadow: 0 0 15px rgba(0, 210, 255, 0.3); }

        .points-badge { 
          display: flex; align-items: center; gap: 6px; 
          padding: 6px 12px; border-radius: 12px; font-weight: 900; font-size: 0.8rem;
        }
        .points-badge.plus { background: rgba(0, 255, 100, 0.1); color: #00ff64; border: 1px solid rgba(0, 255, 100, 0.2); }
        .points-badge.zero { background: rgba(255,255,255,0.05); color: #64748b; }
        .points-estimate { font-size: 0.65rem; font-weight: 800; color: #475569; }

        .empty-history-v2 { 
          text-align: center; padding: 60px 20px; background: rgba(255,255,255,0.02);
          border-radius: 32px; border: 1px dashed rgba(255,255,255,0.1);
        }
        .empty-icon-box { color: #1e293b; margin-bottom: 20px; }
        .empty-history-v2 h3 { color: white; margin-bottom: 10px; }
        .empty-history-v2 p { color: #475569; font-size: 0.9rem; }

        @media (max-width: 640px) {
          .name-box { display: none; }
          .card-body { grid-template-columns: auto auto auto; justify-content: space-between; }
        }
      ` }} />
    </div>
  );
};

export default HistoryView;
