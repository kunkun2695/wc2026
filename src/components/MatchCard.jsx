import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Check, MessageSquare, Clock, Users } from 'lucide-react';

const FlagIcon = ({ flag }) => {
  const isUrl = flag?.startsWith('http') || flag?.includes('.');
  if (isUrl) {
    return <img src={flag} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
  }
  return <span>{flag}</span>;
};

const MatchCard = ({ match, isAdmin, onEdit, userPrediction, onSavePrediction, onRefreshMatches, onOpenComments }) => {
  const [selectedChoice, setSelectedChoice] = useState(null); // '1' (Home), 'X' (Draw), '2' (Away)
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userPrediction) {
      if (userPrediction.predicted_home_score > userPrediction.predicted_away_score) setSelectedChoice('1');
      else if (userPrediction.predicted_home_score < userPrediction.predicted_away_score) setSelectedChoice('2');
      else setSelectedChoice('X');
    }
  }, [userPrediction]);

  const t1 = { name: match.team1_name || 'Team 1', flag: match.team1_flag || '⚽', score: match.team1_score ?? 0 };
  const t2 = { name: match.team2_name || 'Team 2', flag: match.team2_flag || '⚽', score: match.team2_score ?? 0 };

  // Improved time parsing: handle space or " - " separators
  const matchTimeStr = match.match_time || '00:00 01-01';
  let timePart = '00:00';
  let datePart = '01-01';
  if (matchTimeStr.includes(' - ')) {
    const parts = matchTimeStr.split(' - ');
    datePart = parts[0] || '01-01';
    timePart = parts[1] || '00:00';
  } else {
    const parts = matchTimeStr.split(' ');
    timePart = parts[0] || '00:00';
    datePart = parts[1] || '01-01';
  }

  const handleSave = async (choice) => {
    if (isPredicted) return;
    
    let h = 0, a = 0, label = '';
    if (choice === '1') { h = 1; a = 0; label = t1.name + ' thắng'; }
    else if (choice === 'X') { h = 0; a = 0; label = 'Hòa'; }
    else if (choice === '2') { h = 0; a = 1; label = t2.name + ' thắng'; }

    const confirmSave = window.confirm(`Bạn muốn bình chọn cửa: ${label}?`);
    if (!confirmSave) return;

    setIsSaving(true);
    await onSavePrediction(match.id, h, a);
    setSelectedChoice(choice);
    setIsSaving(false);
  };

  const isPredicted = userPrediction !== undefined;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className={`match-card-premium ${match.status === 'LIVE' ? 'is-live' : ''}`}
    >
      {/* Time & Status Badge */}
      <div className="match-badge-top">
        <div className="time-badge">
          <Clock size={12} className="time-icon" />
          <span>{timePart}</span>
        </div>
        {match.status === 'LIVE' && (
          <div className="live-badge">
            <span className="live-dot" />
            TRỰC TIẾP
          </div>
        )}
        {match.status === 'FT' && (
          <div className="finished-badge">KẾT THÚC</div>
        )}
      </div>

      {/* Scoreboard Section */}
      <div className="match-scoreboard">
        <div className="scoreboard-team left">
          <div className="team-flag-round">
            <FlagIcon flag={t1.flag} />
          </div>
          <span className="team-name-label">{t1.name}</span>
        </div>

        <div className="scoreboard-middle">
          {match.status === 'UPCOMING' ? (
            <span className="vs-label">VS</span>
          ) : (
            <div className="score-display-premium">
              <span>{t1.score}</span>
              <span className="score-divider">:</span>
              <span>{t2.score}</span>
            </div>
          )}
        </div>

        <div className="scoreboard-team right">
          <div className="team-flag-round">
            <FlagIcon flag={t2.flag} />
          </div>
          <span className="team-name-label">{t2.name}</span>
        </div>
      </div>

      {/* Betting / Prediction Section */}
      <div className="match-betting-section">
        <div className="choice-grid-v2">
          <div className="choice-col">
            <button 
              className={`choice-btn-v2 ${selectedChoice === '1' ? 'active-1' : ''}`}
              onClick={() => handleSave('1')}
              disabled={match.status !== 'UPCOMING' || isPredicted}
              title={`${t1.name} thắng`}
            >
              <div className="btn-team-flag"><FlagIcon flag={t1.flag} /></div>
              <span className="btn-choice-text">{t1.name}</span>
            </button>
            <div className="vote-bar-bg">
              <motion.div 
                className="vote-bar-fill home" 
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((Number(match.home_votes || 0) / (Number(match.total_votes) || 1)) * 100)}%` }}
              />
            </div>
            <span className="vote-percent">{Math.round((Number(match.home_votes || 0) / (Number(match.total_votes) || 1)) * 100)}%</span>
          </div>

          <div className="choice-col">
            <button 
              className={`choice-btn-v2 draw ${selectedChoice === 'X' ? 'active-X' : ''}`}
              onClick={() => handleSave('X')}
              disabled={match.status !== 'UPCOMING' || isPredicted}
            >
              <span className="choice-btn-v2-draw-label">HÒA</span>
            </button>
            <div className="vote-bar-bg">
              <motion.div 
                className="vote-bar-fill draw" 
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((Number(match.draw_votes || 0) / (Number(match.total_votes) || 1)) * 100)}%` }}
              />
            </div>
            <span className="vote-percent">{Math.round((Number(match.draw_votes || 0) / (Number(match.total_votes) || 1)) * 100)}%</span>
          </div>

          <div className="choice-col">
            <button 
              className={`choice-btn-v2 ${selectedChoice === '2' ? 'active-2' : ''}`}
              onClick={() => handleSave('2')}
              disabled={match.status !== 'UPCOMING' || isPredicted}
              title={`${t2.name} thắng`}
            >
              <div className="btn-team-flag"><FlagIcon flag={t2.flag} /></div>
              <span className="btn-choice-text">{t2.name}</span>
            </button>
            <div className="vote-bar-bg">
              <motion.div 
                className="vote-bar-fill away" 
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((Number(match.away_votes || 0) / (Number(match.total_votes) || 1)) * 100)}%` }}
              />
            </div>
            <span className="vote-percent">{Math.round((Number(match.away_votes || 0) / (Number(match.total_votes) || 1)) * 100)}%</span>
          </div>
        </div>

        {/* Footer actions inside card */}
        <div className="betting-footer">
          <div className="total-votes-label">
            <Users size={12} />
            <span>{match.total_votes || 0} PHIẾU</span>
          </div>

          {isPredicted && match.status === 'UPCOMING' && (
            <div className="voted-tag">
              <Check size={10} /> ĐÃ DỰ ĐOÁN
            </div>
          )}

          <button className="gay-btn-v2" onClick={() => onOpenComments(match)}>
            <MessageSquare size={14} /> GÁY NGAY ({match.comment_count || 0})
          </button>
        </div>
      </div>

      {isAdmin && (
        <button onClick={() => onEdit(match)} className="admin-edit-btn">
          <Edit3 size={14} />
        </button>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .match-card-premium {
          display: flex;
          flex-direction: column;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 16px;
          position: relative;
          transition: all 0.3s ease;
        }
        .match-card-premium:hover {
          border-color: rgba(0, 210, 255, 0.35);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
          transform: translateY(-2px);
        }
        .match-card-premium.is-live {
          border-color: rgba(239, 68, 68, 0.3);
        }
        
        .match-badge-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        
        .time-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 210, 255, 0.08);
          color: #00d2ff;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 800;
          border: 1px solid rgba(0, 210, 255, 0.15);
        }
        
        .live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ef4444;
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .live-dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 10px #ef4444;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .finished-badge {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.7rem;
          font-weight: 800;
        }

        .match-scoreboard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0 auto 20px auto;
          gap: 10px;
          width: 100%;
          max-width: 420px;
        }
        
        .scoreboard-team {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }
        
        .scoreboard-team.left {
          justify-content: flex-end;
        }
        
        .scoreboard-team.right {
          justify-content: flex-end;
          flex-direction: row-reverse;
        }
        
        .team-flag-round {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          flex-shrink: 0;
          position: relative;
        }
        
        .team-name-label {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .scoreboard-middle {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 70px;
          padding: 0 10px;
        }
        
        .vs-label {
          font-size: 0.8rem;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.2);
          letter-spacing: 2px;
          background: rgba(255, 255, 255, 0.02);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .score-display-premium {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 1.3rem;
          font-weight: 900;
          color: #00d2ff;
          font-family: 'Outfit', sans-serif;
          background: rgba(0, 210, 255, 0.08);
          padding: 4px 12px;
          border-radius: 10px;
          border: 1px solid rgba(0, 210, 255, 0.15);
          box-shadow: 0 0 15px rgba(0, 210, 255, 0.05);
        }
        .score-divider {
          opacity: 0.5;
        }
        
        .match-betting-section {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 18px;
        }
        
        .choice-grid-v2 {
          display: flex;
          gap: 10px;
          width: 100%;
          margin-bottom: 16px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.4) 100%);
          border: 1px solid rgba(0, 210, 255, 0.15);
          padding: 10px;
          border-radius: 18px;
          box-shadow: inset 0 0 15px rgba(0, 210, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          backdrop-filter: blur(8px);
          position: relative;
          overflow: hidden;
        }
        
        .choice-grid-v2::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(0, 210, 255, 0.08) 0%, transparent 60%);
          pointer-events: none;
          animation: backgroundRotate 15s linear infinite;
          z-index: 0;
        }
        
        @keyframes backgroundRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .choice-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          z-index: 1;
        }
        
        .choice-btn-v2 {
          height: 48px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: white;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0 8px;
        }
        .choice-btn-v2:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .choice-btn-v2-draw-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.5px;
        }
        
        .choice-btn-v2.active-1 {
          background: linear-gradient(135deg, rgba(0, 210, 255, 0.2), rgba(58, 134, 255, 0.2));
          border-color: #00d2ff;
          color: #00d2ff;
          box-shadow: 0 0 15px rgba(0, 210, 255, 0.25);
        }
        .choice-btn-v2.active-X {
          background: linear-gradient(135deg, rgba(255, 77, 77, 0.2), rgba(239, 68, 68, 0.2));
          border-color: #ff4d4d;
          color: #ff4d4d;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.25);
        }
        .choice-btn-v2.active-2 {
          background: linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.2));
          border-color: #34d399;
          color: #34d399;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.25);
        }
        
        .btn-team-flag {
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }
        
        .btn-choice-text {
          font-size: 0.75rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 65px;
          display: inline-block;
        }
        
        .vote-bar-bg {
          height: 5px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 3px;
          overflow: hidden;
        }
        .vote-bar-fill { height: 100%; border-radius: 3px; }
        .vote-bar-fill.home { background: #00d2ff; }
        .vote-bar-fill.draw { background: #ff4d4d; }
        .vote-bar-fill.away { background: #34d399; }
        
        .vote-percent {
          font-size: 0.7rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.25);
          text-align: center;
        }
        
        .betting-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
        }
        
        .total-votes-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.25);
          font-weight: 700;
        }
        
        .voted-tag {
          background: rgba(52, 211, 153, 0.08);
          color: #34d399;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(52, 211, 153, 0.15);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .gay-btn-v2 {
          background: linear-gradient(90deg, rgba(0, 210, 255, 0.06), rgba(58, 134, 255, 0.06));
          border: 1px solid rgba(0, 210, 255, 0.15);
          color: #00d2ff;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .gay-btn-v2:hover {
          background: var(--cyan-gradient);
          color: black;
          border-color: transparent;
          transform: scale(1.02);
        }
        
        .admin-edit-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: color 0.2s;
        }
        .admin-edit-btn:hover { color: white; }
        
        @media (max-width: 600px) {
          .match-scoreboard {
            margin-bottom: 15px;
          }
          .team-flag-round {
            width: 38px;
            height: 38px;
            font-size: 1.3rem;
            border-radius: 10px;
            padding: 5px;
          }
          .team-name-label {
            font-size: 0.85rem;
          }
          .score-display-premium {
            font-size: 1.1rem;
            padding: 3px 8px;
          }
          .choice-btn-v2 {
            height: 44px;
            font-size: 0.8rem;
            border-radius: 10px;
          }
          .choice-grid-v2 {
            gap: 8px;
          }
          .btn-choice-text {
            max-width: 50px;
            font-size: 0.7rem;
          }
        }
      ` }} />
    </motion.div>
  );
};

export default MatchCard;
