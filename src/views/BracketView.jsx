import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield, ChevronRight, Zap, Users, Layout } from 'lucide-react';

const BracketMatch = ({ match }) => {
  if (!match) return <div className="bracket-match-empty" />;

  const isT1Winner = match.status === 'FT' && match.team1_score > match.team2_score;
  const isT2Winner = match.status === 'FT' && match.team2_score > match.team1_score;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bracket-match-card ${match.status === 'LIVE' ? 'is-live' : ''}`}
    >
      <div className="match-team-row">
        <div className="team-info">
          <span className="team-flag">{match.team1_flag || '⚽'}</span>
          <span className={`team-name ${isT1Winner ? 'winner-text' : ''}`}>{match.team1_name || 'Đang đợi...'}</span>
        </div>
        <span className={`team-score ${isT1Winner ? 'winner' : ''}`}>
          {match.status === 'UPCOMING' ? '-' : match.team1_score}
        </span>
      </div>
      <div className="match-divider" />
      <div className="match-team-row">
        <div className="team-info">
          <span className="team-flag">{match.team2_flag || '⚽'}</span>
          <span className={`team-name ${isT2Winner ? 'winner-text' : ''}`}>{match.team2_name || 'Đang đợi...'}</span>
        </div>
        <span className={`team-score ${isT2Winner ? 'winner' : ''}`}>
          {match.status === 'UPCOMING' ? '-' : match.team2_score}
        </span>
      </div>
      
      {match.status === 'LIVE' && (
        <div className="live-indicator">
          <div className="live-dot" />
          <span>TRỰC TIẾP</span>
        </div>
      )}
    </motion.div>
  );
};

const GroupCard = ({ groupName, matches }) => {
  return (
    <div className="group-card">
      <div className="group-header">{groupName}</div>
      <div className="group-matches-mini">
        {matches.map(m => (
          <div key={m.id} className="mini-match">
            <span className="m-team">{m.team1_name}</span>
            <span className="m-score">{m.status === 'UPCOMING' ? 'v' : `${m.team1_score}-${m.team2_score}`}</span>
            <span className="m-team text-right">{m.team2_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BracketView = ({ matches = [] }) => {
  // Phân loại trận đấu
  const groupMatches = useMemo(() => {
    const groups = {};
    matches.filter(m => m.competition_name?.includes('Bảng')).forEach(m => {
      if (!groups[m.competition_name]) groups[m.competition_name] = [];
      groups[m.competition_name].push(m);
    });
    return groups;
  }, [matches]);

  const knockoutStages = useMemo(() => {
    const filterByStage = (name) => matches.filter(m => m.competition_name?.toLowerCase().includes(name.toLowerCase()));
    
    return [
      { id: 'r16', name: 'Vòng 1/8', matches: filterByStage('Vòng 1/8').length ? filterByStage('Vòng 1/8') : Array(8).fill(null) },
      { id: 'qf', name: 'Tứ kết', matches: filterByStage('Tứ kết').length ? filterByStage('Tứ kết') : Array(4).fill(null) },
      { id: 'sf', name: 'Bán kết', matches: filterByStage('Bán kết').length ? filterByStage('Bán kết') : Array(2).fill(null) },
      { id: 'final', name: 'Chung kết', matches: filterByStage('Chung kết').length ? filterByStage('Chung kết') : Array(1).fill(null) }
    ];
  }, [matches]);

  return (
    <div className="bracket-view-container">
      <div className="bracket-header">
        <div className="header-content">
          <div className="trophy-badge"><Trophy size={24} /></div>
          <div>
            <h1>CON ĐƯỜNG VÔ ĐỊCH</h1>
            <p>Tự động cập nhật theo kết quả thực tế</p>
          </div>
        </div>
      </div>

      {/* Vòng bảng Section */}
      <div className="section-title">
        <Layout size={18} />
        <span>DIỄN BIẾN VÒNG BẢNG</span>
      </div>
      <div className="groups-container">
        {Object.keys(groupMatches).length > 0 ? (
          Object.entries(groupMatches).map(([name, ms]) => (
            <GroupCard key={name} groupName={name} matches={ms} />
          ))
        ) : (
          <div className="empty-groups">Đang cập nhật dữ liệu vòng bảng...</div>
        )}
      </div>

      {/* Knockout Tree Section */}
      <div className="section-title mt-40">
        <Zap size={18} />
        <span>NHÁNH ĐẤU KNOCKOUT</span>
      </div>
      
      <div className="bracket-scroll-area">
        <div className="bracket-tree">
          {knockoutStages.map((stage, sIdx) => (
            <div key={stage.id} className={`bracket-column stage-${stage.id}`}>
              <div className="stage-header-modern">{stage.name}</div>
              <div className="stage-matches">
                {stage.matches.map((m, mIdx) => (
                  <div key={mIdx} className="bracket-match-wrapper">
                    <BracketMatch match={m} />
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
                animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="trophy-container-main"
              >
                <Trophy size={100} color="#ffd700" />
                <div className="trophy-glow-main" />
              </motion.div>
              <div className="platform-gold">WORLD CUP 2026</div>
              <div className="champion-label-modern">THE CHAMPIONS</div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .bracket-view-container { min-height: 100vh; background: #020617; padding: 100px 30px 40px; color: white; }
        
        .bracket-header { margin-bottom: 40px; display: flex; justify-content: space-between; align-items: center; }
        .trophy-badge { width: 50px; height: 50px; background: linear-gradient(135deg, #ffd700, #b8860b); border-radius: 15px; display: flex; align-items: center; justify-content: center; color: black; box-shadow: 0 0 20px rgba(255,215,0,0.3); }
        .bracket-header h1 { font-size: 2.2rem; font-weight: 900; margin: 0; background: linear-gradient(to right, #fff, #64748b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .bracket-header p { color: #00d2ff; font-weight: 800; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; margin-top: 5px; }

        .section-title { display: flex; align-items: center; gap: 10px; color: #475569; font-weight: 900; font-size: 0.8rem; letter-spacing: 2px; margin-bottom: 20px; }
        .mt-40 { margin-top: 60px; }

        /* Groups Styling */
        .groups-container { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; scrollbar-width: none; }
        .groups-container::-webkit-scrollbar { display: none; }
        .group-card { min-width: 200px; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 15px; }
        .group-header { font-weight: 900; font-size: 0.8rem; color: #00d2ff; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; margin-bottom: 10px; }
        .mini-match { display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; margin-bottom: 8px; }
        .m-team { font-weight: 700; width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .m-score { color: white; font-weight: 900; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; }

        /* Bracket Styling */
        .bracket-scroll-area { overflow-x: auto; padding: 20px 0; }
        .bracket-tree { display: flex; gap: 80px; align-items: center; min-width: max-content; }
        .bracket-column { display: flex; flex-direction: column; gap: 40px; }
        .stage-header-modern { text-align: center; font-weight: 900; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 30px; }
        
        .bracket-match-card { background: #0f172a; border: 1px solid rgba(255,255,255,0.05); border-radius: 18px; width: 220px; padding: 15px; position: relative; z-index: 2; transition: 0.3s; }
        .bracket-match-card:hover { border-color: #00d2ff; transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .is-live { border-color: #ef4444 !important; box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }

        .winner-text { color: #00d2ff !important; font-weight: 900 !important; }
        .team-score.winner { color: #00d2ff; text-shadow: 0 0 10px rgba(0,210,255,0.5); }

        .line-vertical { background: rgba(255,255,255,0.08); width: 2px; }
        .line-horizontal { background: rgba(255,255,255,0.08); height: 2px; }
        
        .platform-gold { background: linear-gradient(to bottom, #b8860b, #000); padding: 15px 50px; border-radius: 10px; font-weight: 900; letter-spacing: 10px; border-top: 3px solid #ffd700; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
        .champion-label-modern { color: #ffd700; font-weight: 900; font-size: 0.8rem; margin-top: 15px; letter-spacing: 5px; text-shadow: 0 0 10px rgba(255,215,0,0.5); }
        .trophy-container-main { position: relative; }
        .trophy-glow-main { position: absolute; inset: -40px; background: radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%); }

        @media (max-width: 768px) {
          .bracket-view-container { padding: 80px 20px; }
          .bracket-header h1 { font-size: 1.5rem; }
        }
      ` }} />
    </div>
  );
};

export default BracketView;
