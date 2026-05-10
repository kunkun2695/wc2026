import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Zap, Check, MessageSquare } from 'lucide-react';
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

  const [datePart, timePart] = match.match_time ? match.match_time.split(' - ') : ['', '00:00'];
  const venue = match.venue || 'International';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="match-card-bet">
      <div className="match-team">
        <div className="team-flag-round"><FlagIcon flag={t1.flag} /></div>
        <span className="team-name-label truncate w-[80px] text-center">{t1.name}</span>
      </div>

      <div className="match-center-bet-v2">
        <div className="match-time-v2">{timePart}</div>
        
        <div className="choice-grid-v2">
          <div className="choice-col">
            <button 
              className={`choice-btn-v2 ${selectedChoice === '1' ? 'active-1' : ''}`}
              onClick={() => handleSave('1')}
              disabled={match.status !== 'UPCOMING' || isPredicted}
            >
              <div className="btn-flag-mini"><FlagIcon flag={t1.flag} /></div>
            </button>
            <span className="vote-percent">{Math.round((match.home_votes / (match.total_votes || 1)) * 100)}%</span>
          </div>
          <div className="choice-col">
            <button 
              className={`choice-btn-v2 ${selectedChoice === 'X' ? 'active-X' : ''}`}
              onClick={() => handleSave('X')}
              disabled={match.status !== 'UPCOMING' || isPredicted}
            >
              HÒA
            </button>
            <span className="vote-percent">{Math.round((match.draw_votes / (match.total_votes || 1)) * 100)}%</span>
          </div>
          <div className="choice-col">
            <button 
              className={`choice-btn-v2 ${selectedChoice === '2' ? 'active-2' : ''}`}
              onClick={() => handleSave('2')}
              disabled={match.status !== 'UPCOMING' || isPredicted}
            >
              <div className="btn-flag-mini"><FlagIcon flag={t2.flag} /></div>
            </button>
            <span className="vote-percent">{Math.round((match.away_votes / (match.total_votes || 1)) * 100)}%</span>
          </div>
        </div>

        <div className="total-votes-label">Tổng số phiếu bầu: {match.total_votes || 0}</div>

        {isPredicted && match.status === 'UPCOMING' && (
          <div className="voted-status-mini">
            <Check size={10} /> ĐÃ CHỐT
          </div>
        )}

        {(match.status === 'FT' || match.status === 'LIVE') && (
          <div className="actual-score-mini">
            KQ: {match.team1_score} - {match.team2_score}
          </div>
        )}

        {match.status === 'FT' && userPrediction && (
          <div className="points-mini">+{userPrediction.points}đ</div>
        )}

        <button 
          className="gay-btn"
          onClick={() => onOpenComments(match)}
        >
          <MessageSquare size={12} /> GÁY NGAY ({match.comment_count || 0})
        </button>
      </div>

      <div className="match-team right">
        <div className="team-flag-round"><FlagIcon flag={t2.flag} /></div>
        <span className="team-name-label truncate w-[80px] text-center">{t2.name}</span>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .match-card-bet {
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr;
          align-items: center;
          padding: 15px 10px;
          margin-bottom: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          position: relative;
        }
        .match-center-bet-v2 {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        .match-venue-v2 {
          font-size: 0.55rem;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-align: center;
        }
        .match-time-v2 {
          font-size: 0.8rem;
          font-weight: 900;
          color: white;
        }
        .choice-grid-v2 {
          display: flex;
          gap: 6px;
          width: 100%;
        }
        .choice-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .vote-percent {
          font-size: 0.65rem;
          font-weight: 800;
          color: rgba(255,255,255,0.4);
        }
        .total-votes-label {
          font-size: 0.55rem;
          color: rgba(255,255,255,0.2);
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }
        .choice-btn-v2 {
          flex: 1;
          height: 44px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          font-weight: 900;
          font-size: 0.65rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-flag-mini {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .choice-btn-v2.active-1 { background: #00d2ff; color: black; border-color: #00d2ff; box-shadow: 0 0 15px rgba(0,210,255,0.4); }
        .choice-btn-v2.active-X { background: #ffd200; color: black; border-color: #ffd200; box-shadow: 0 0 15px rgba(255,210,0,0.4); }
        .choice-btn-v2.active-2 { background: #00ff64; color: black; border-color: #00ff64; box-shadow: 0 0 15px rgba(0,255,100,0.4); }
        
        .voted-status-mini {
          font-size: 0.5rem;
          font-weight: 900;
          color: #00d2ff;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .actual-score-mini {
          font-size: 0.7rem;
          font-weight: 900;
          color: #ffaa00;
          background: rgba(255,170,0,0.1);
          padding: 2px 8px;
          border-radius: 4px;
        }
        .points-mini {
          font-size: 0.7rem;
          font-weight: 900;
          color: #00ff64;
        }
        .gay-btn {
          margin-top: 8px;
          background: rgba(0, 210, 255, 0.1);
          border: 1px solid rgba(0, 210, 255, 0.2);
          color: #00d2ff;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .gay-btn:hover {
          background: #00d2ff;
          color: black;
        }
      ` }} />

      <style dangerouslySetInnerHTML={{ __html: `
        .comment-overlay {
          display: none;
        }
      ` }} />

      {isAdmin && (
        <button onClick={() => onEdit(match)} style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', color: '#444' }}>
          <Edit3 size={14} />
        </button>
      )}
    </motion.div>
  );
};

export default MatchCard;
