import React from 'react';
import { motion } from 'framer-motion';
import { History, CheckCircle2, Clock, Trophy } from 'lucide-react';

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

  return (
    <div className="history-container animate-fade">
      <header className="page-header-history">
        <History className="header-icon-history" size={40} />
        <h1 className="font-outfit">Lịch sử dự đoán</h1>
        <p>Xem lại các "kèo" bạn đã chốt</p>
      </header>

      <div className="history-list">
        {predictions.length > 0 ? predictions.map((p, index) => {
          const myChoice = getOutcomeLabel(p);
          const actualOutcome = getActualOutcome(p);
          const isCorrect = actualOutcome && myChoice === actualOutcome;

          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`history-card glass-panel ${isCorrect ? 'correct-border' : ''}`}
            >
              <div className="history-card-header">
                <span className="time-tag">{p.match_time}</span>
              </div>

              <div className="history-match-row">
                <div className="team-col">
                  <div className="flag-wrapper-history">{renderFlag(p.team1_flag)}</div>
                  <span className="team-name-mini">{p.team1_name || 'Đội 1'}</span>
                </div>
                
                <div className="result-col">
                  {p.status === 'FT' ? (
                    <div className="actual-score-history">{p.team1_score} - {p.team2_score}</div>
                  ) : (
                    <div className="status-badge-history">{p.status === 'LIVE' ? 'LIVE' : 'SẮP ĐÁ'}</div>
                  )}
                </div>

                <div className="team-col right">
                  <span className="team-name-mini">{p.team2_name || 'Đội 2'}</span>
                  <div className="flag-wrapper-history">{renderFlag(p.team2_flag)}</div>
                </div>
              </div>

              <div className="prediction-info-row">
                <div className="my-choice-tag">
                  Lựa chọn: <span className={`choice-val color-${myChoice}`}>{myChoice}</span>
                </div>
                
                {p.status === 'FT' && (
                  <div className={`points-earned ${isCorrect ? 'plus' : 'zero'}`}>
                    {isCorrect ? `+${p.points} ĐIỂM` : '0 ĐIỂM'}
                  </div>
                )}
              </div>
            </motion.div>
          );
        }) : (
          <div className="empty-history glass-panel">
            Bạn chưa thực hiện dự đoán nào!
          </div>
        )}
      </div>

      <style jsx>{`
        .history-container {
          max-width: 800px;
          margin: 0 auto;
          padding-bottom: 120px;
          padding: 0 5vw;
        }
        .page-header-history {
          text-align: center;
          margin-bottom: 30px;
        }
        .header-icon-history {
          color: var(--primary-cyan);
          margin-bottom: 10px;
        }
        .history-card {
          padding: 15px;
          border-radius: 16px;
          margin-bottom: 12px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .correct-border {
          border-color: rgba(0, 255, 100, 0.3);
          background: rgba(0, 255, 100, 0.02);
        }
        .history-card-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          opacity: 0.5;
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .history-match-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .team-col {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .team-col.right {
          justify-content: flex-end;
        }
        .flag-wrapper-history {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }
        .flag-mini-history {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .flag-emoji-history {
          font-size: 1.2rem;
        }
        .team-name-mini {
          font-size: 0.8rem;
          font-weight: 800;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }
        .actual-score-history {
          font-size: 1.1rem;
          font-weight: 900;
          letter-spacing: 2px;
        }
        .status-badge-history {
          font-size: 0.6rem;
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .prediction-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .my-choice-tag {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-dim);
        }
        .choice-val {
          padding: 2px 8px;
          border-radius: 4px;
          color: black;
          margin-left: 4px;
        }
        .choice-val.color-1 { background: #00d2ff; }
        .choice-val.color-X { background: #ffd200; }
        .choice-val.color-2 { background: #00ff64; }
        
        .points-earned {
          font-size: 0.75rem;
          font-weight: 900;
        }
        .points-earned.plus { color: #00ff64; }
        .points-earned.zero { color: rgba(255,255,255,0.2); }
        
        .empty-history {
          padding: 40px;
          text-align: center;
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
};

export default HistoryView;
