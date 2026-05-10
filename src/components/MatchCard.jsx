import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Zap, Check, MessageSquare, Clock, MapPin } from 'lucide-react';
import { mockAuth } from '../data/mockAuth';

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
  const parts = matchTimeStr.includes(' - ') ? matchTimeStr.split(' - ') : matchTimeStr.split(' ');
  const timePart = parts[0] || '00:00';
  const venue = match.venue || 'International Stadium';

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
      className={`match-card-bet ${match.status === 'LIVE' ? 'is-live' : ''}`}
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

      <div className="match-card-grid">
        <div className="match-team left">
          <div className="team-flag-round">
            <FlagIcon flag={t1.flag} />
            <motion.div 
              className="flag-glow" 
              animate={{ opacity: [0.2, 0.4, 0.2] }} 
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <span className="team-name-label">{t1.name}</span>
        </div>

        <div className="match-center-bet-v3">
          <div className="choice-grid-v2">
            <div className="choice-col">
              <button 
                className={`choice-btn-v2 ${selectedChoice === '1' ? 'active-1' : ''}`}
                onClick={() => handleSave('1')}
                disabled={match.status !== 'UPCOMING' || isPredicted}
              >
                <div className="btn-flag-mini"><FlagIcon flag={t1.flag} /></div>
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
                HÒA
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
              >
                <div className="btn-flag-mini"><FlagIcon flag={t2.flag} /></div>
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

          <div className="match-footer-info">
            <div className="total-votes-label">
              <Users size={10} /> {match.total_votes || 0} PHIẾU
            </div>
            
            {(match.status === 'FT' || match.status === 'LIVE') && (
              <div className="score-display-v2">
                {match.team1_score} : {match.team2_score}
              </div>
            )}
          </div>

          {isPredicted && match.status === 'UPCOMING' && (
            <div className="voted-tag">
              <Check size={12} /> ĐÃ DỰ ĐOÁN
            </div>
          )}

          <button className="gay-btn-v2" onClick={() => onOpenComments(match)}>
            <MessageSquare size={14} /> GÁY NGAY ({match.comment_count || 0})
          </button>
        </div>

        <div className="match-team right">
          <div className="team-flag-round">
            <FlagIcon flag={t2.flag} />
            <motion.div 
              className="flag-glow" 
              animate={{ opacity: [0.2, 0.4, 0.2] }} 
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
          </div>
          <span className="team-name-label">{t2.name}</span>
        </div>
      </div>

      {isAdmin && (
        <button onClick={() => onEdit(match)} className="admin-edit-btn">
          <Edit3 size={14} />
        </button>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .match-card-bet {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 20px;
          margin-bottom: 16px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .match-card-bet:hover {
          border-color: rgba(0, 210, 255, 0.3);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
          transform: translateY(-2px);
        }
        .match-card-bet.is-live {
          border-color: rgba(239, 68, 68, 0.3);
        }
        
        .match-badge-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .time-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 210, 255, 0.1);
          color: #00d2ff;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          border: 1px solid rgba(0, 210, 255, 0.2);
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
          color: rgba(255,255,255,0.4);
          font-size: 0.7rem;
          font-weight: 900;
        }

        .match-card-grid {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          align-items: center;
          gap: 15px;
        }
        
        .match-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        .team-flag-round {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          position: relative;
          padding: 10px;
        }
        .flag-glow {
          position: absolute;
          inset: -5px;
          background: radial-gradient(circle, rgba(0, 210, 255, 0.2) 0%, transparent 70%);
          z-index: -1;
          border-radius: 24px;
        }
        
        .team-name-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: white;
          text-align: center;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .match-center-bet-v3 {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .choice-grid-v2 {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .choice-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .choice-btn-v2 {
          height: 48px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
        }
        .choice-btn-v2:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        .choice-btn-v2.draw {
          font-size: 0.7rem;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 1px;
        }
        
        .choice-btn-v2.active-1 { background: linear-gradient(135deg, #00d2ff, #3a86ff); border: none; box-shadow: 0 8px 20px -5px rgba(0, 210, 255, 0.4); }
        .choice-btn-v2.active-X { background: linear-gradient(135deg, #f87171, #ef4444); border: none; box-shadow: 0 8px 20px -5px rgba(239, 68, 68, 0.4); color: white; }
        .choice-btn-v2.active-2 { background: linear-gradient(135deg, #34d399, #10b981); border: none; box-shadow: 0 8px 20px -5px rgba(16, 185, 129, 0.4); }
        
        .vote-bar-bg {
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
        }
        .vote-bar-fill { height: 100%; border-radius: 2px; }
        .vote-bar-fill.home { background: #00d2ff; }
        .vote-bar-fill.draw { background: #ef4444; }
        .vote-bar-fill.away { background: #10b981; }
        
        .vote-percent {
          font-size: 0.65rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.3);
          text-align: center;
        }
        
        .match-footer-info {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 5px;
        }
        
        .total-votes-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.2);
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        
        .score-display-v2 {
          font-size: 1.2rem;
          font-weight: 900;
          color: #f59e0b;
          font-family: 'Outfit', sans-serif;
          letter-spacing: 2px;
        }
        
        .voted-tag {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 5px;
        }
        
        .gay-btn-v2 {
          margin-top: 10px;
          width: 100%;
          background: linear-gradient(90deg, rgba(0, 210, 255, 0.1), rgba(58, 134, 255, 0.1));
          border: 1px solid rgba(0, 210, 255, 0.2);
          color: #00d2ff;
          padding: 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .gay-btn-v2:hover {
          background: var(--cyan-gradient);
          color: #000;
          border-color: transparent;
          transform: scale(1.02);
        }
        
        .admin-edit-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: 0.2s;
        }
        .admin-edit-btn:hover { color: white; }

        @media (max-width: 600px) {
          .match-card-grid { grid-template-columns: 1fr; gap: 20px; }
          .match-team { flex-direction: row; justify-content: flex-start; width: 100%; }
          .match-team.right { flex-direction: row-reverse; justify-content: flex-start; }
          .team-flag-round { width: 40px; height: 40px; font-size: 1.2rem; }
          .team-name-label { max-width: none; font-size: 1rem; }
          .choice-grid-v2 { gap: 12px; }
          .match-center-bet-v3 { width: 100%; }
        }
      ` }} />
    </motion.div>
  );
};

export default MatchCard;
