import React, { useState, useMemo } from 'react';
import MatchCard from '../components/MatchCard';
import { LayoutGrid, CheckCircle2, Trophy, Clock, Calendar, Zap } from 'lucide-react';

const HomeView = ({ matches, predictions = [], onSavePrediction, onRefreshMatches, onOpenComments }) => {
  const [activeTab, setActiveTab] = useState('all'); 

  const parseMatchTime = (timeStr) => {
    if (!timeStr) return new Date(0);
    try {
      const parts = timeStr.split(/[\s-]/);
      const [time, day, month] = parts;
      const [hour, min] = time.split(':');
      return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    } catch (e) {
      return new Date(0);
    }
  };

  const displayMatches = useMemo(() => {
    let filtered = activeTab === 'all' 
      ? matches 
      : matches.filter(m => predictions.some(p => p.match_id === m.id));

    return [...filtered].sort((a, b) => {
      const timeA = parseMatchTime(a.match_time);
      const timeB = parseMatchTime(b.match_time);
      return timeB - timeA; 
    });
  }, [matches, predictions, activeTab]);

  return (
    <div className="home-view-bet">
      <div className="view-header-content">
        <div className="stats-and-tabs">
          <div className="header-main-info">
            <div className="title-section">
              <Trophy size={32} color="#ffd200" />
              <h1 className="font-outfit">WORLD CUP 2026</h1>
            </div>
            <div className="prediction-counter">
              <Zap size={14} fill="currentColor" />
              <span>{predictions.length}/{matches.length} TRẬN ĐÃ DỰ ĐOÁN</span>
            </div>
          </div>

          <div className="filter-tabs">
            <button className={`filter-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              <LayoutGrid size={18} /> TẤT CẢ
            </button>
            <button className={`filter-tab-btn ${activeTab === 'predicted' ? 'active' : ''}`} onClick={() => setActiveTab('predicted')}>
              <CheckCircle2 size={18} /> ĐÃ CƯỢC
            </button>
          </div>
        </div>
      </div>

      <div className="timeline-wrapper">
        {displayMatches.map((m, idx) => {
          const pred = predictions.find(p => p.match_id === m.id);
          const [time, date] = m.match_time ? m.match_time.split(' ') : ['--:--', 'TBD'];
          
          const showDateLabel = idx === 0 || 
            (m.match_time && displayMatches[idx-1].match_time && 
             m.match_time.split(' ')[1] !== displayMatches[idx-1].match_time.split(' ')[1]);

          return (
            <div key={m.id} className="timeline-entry">
              {showDateLabel && (
                <div className="timeline-day-header">
                  <Calendar size={16} />
                  <span>NGÀY {date}</span>
                </div>
              )}
              
              <div className="timeline-row">
                {/* Cột hiển thị giờ thi đấu nổi bật */}
                <div className="time-column">
                  <div className={`time-badge ${m.status === 'LIVE' ? 'is-live' : ''}`}>
                    <span className="time-text">{time}</span>
                    <div className="time-connector"></div>
                  </div>
                </div>

                <div className="match-content">
                  <MatchCard 
                    match={m} 
                    userPrediction={pred}
                    onSavePrediction={onSavePrediction}
                    onRefreshMatches={onRefreshMatches}
                    onOpenComments={onOpenComments}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .home-view-bet { width: 100%; max-width: 1000px; margin: 0 auto; padding: 100px 20px 40px; }
        
        .header-main-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .title-section { display: flex; align-items: center; gap: 15px; }
        .title-section h1 { margin: 0; font-size: 2.2rem; font-weight: 900; background: linear-gradient(to right, #fff, #64748b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .prediction-counter { display: flex; align-items: center; gap: 8px; background: rgba(0, 210, 255, 0.1); color: #00d2ff; padding: 8px 16px; border-radius: 20px; font-size: 0.7rem; font-weight: 900; letter-spacing: 1px; border: 1px solid rgba(0, 210, 255, 0.2); }
        
        .filter-tabs { display: flex; background: rgba(255, 255, 255, 0.03); padding: 5px; border-radius: 14px; gap: 5px; margin-bottom: 50px; width: fit-content; border: 1px solid rgba(255,255,255,0.05); }
        .filter-tab-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; background: transparent; color: #475569; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; border-radius: 10px; }
        .filter-tab-btn.active { background: #00d2ff; color: #020617; }

        /* Timeline Styling */
        .timeline-wrapper { position: relative; padding-left: 10px; }
        .timeline-entry { margin-bottom: 30px; position: relative; }
        .timeline-day-header { display: flex; align-items: center; gap: 10px; color: #64748b; font-weight: 900; font-size: 0.8rem; letter-spacing: 3px; margin-bottom: 25px; margin-left: 80px; }

        .timeline-row { display: flex; gap: 25px; align-items: flex-start; }
        
        .time-column { width: 60px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding-top: 15px; }
        .time-badge { background: #0f172a; border: 1px solid rgba(0, 210, 255, 0.3); padding: 8px 12px; border-radius: 12px; position: relative; box-shadow: 0 0 15px rgba(0, 210, 255, 0.1); }
        .time-text { color: #00d2ff; font-weight: 900; font-family: 'Outfit', sans-serif; font-size: 0.9rem; }
        
        .time-connector { position: absolute; top: 50%; left: 100%; width: 25px; height: 1px; background: linear-gradient(to right, rgba(0, 210, 255, 0.5), transparent); }
        
        .is-live { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); animation: pulse-red 2s infinite; }
        .is-live .time-text { color: #ef4444; }
        @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

        .match-content { flex: 1; min-width: 0; transition: transform 0.3s ease; }
        .match-content:hover { transform: translateX(5px); }

        @media (max-width: 768px) {
          .home-view-bet { padding: 80px 15px 40px; }
          .timeline-day-header { margin-left: 0; }
          .time-column { width: 50px; gap: 10px; }
          .time-badge { padding: 6px 8px; }
          .time-text { font-size: 0.8rem; }
          .time-connector { display: none; }
        }
      ` }} />
    </div>
  );
};

export default HomeView;
