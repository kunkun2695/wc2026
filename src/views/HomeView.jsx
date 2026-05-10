import React, { useState } from 'react';
import MatchCard from '../components/MatchCard';
import { LayoutGrid, CheckCircle2, Trophy } from 'lucide-react';

const HomeView = ({ matches, predictions = [], onSavePrediction, onRefreshMatches, onOpenComments }) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'predicted'

  // Lọc trận đấu dựa trên tab đang chọn
  const filteredMatches = activeTab === 'all' 
    ? matches 
    : matches.filter(m => predictions.some(p => p.match_id === m.id));

  // Nhóm các trận đấu theo Giải đấu (Competition)
  const groupedByCompetition = filteredMatches.reduce((acc, match) => {
    const compName = match.competition_name || 'Giải đấu khác';
    if (!acc[compName]) acc[compName] = {};
    
    // Trong mỗi giải đấu, nhóm tiếp theo ngày
    const [date] = match.match_time ? match.match_time.split(' - ') : ['Sắp tới'];
    if (!acc[compName][date]) acc[compName][date] = [];
    
    acc[compName][date].push(match);
    return acc;
  }, {});

  const competitions = Object.keys(groupedByCompetition).sort();
  const predictedCount = predictions.length;
  const totalMatches = matches.length;

  return (
    <div className="home-view-bet">
      {/* Header Info */}
      <div className="view-header-content" style={{ marginBottom: '30px' }}>
        <div className="quote-banner">
          "World Cup is not just about football, it's about the spirit of nations coming together. 2026 will be the biggest festival ever." — Official FIFA
        </div>

        <div className="stats-and-tabs">
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <h2 className="font-outfit" style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '5px', letterSpacing: '-0.5px' }}>
              LỊCH THI ĐẤU
            </h2>
            <div className="prediction-counter">
              <CheckCircle2 size={14} color="#00d2ff" />
              <span>{predictedCount}/{totalMatches} Trận đã dự đoán</span>
            </div>
          </div>

          <div className="filter-tabs">
            <button 
              className={`filter-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <LayoutGrid size={18} />
              Tất cả trận đấu
            </button>
            <button 
              className={`filter-tab-btn ${activeTab === 'predicted' ? 'active' : ''}`}
              onClick={() => setActiveTab('predicted')}
            >
              <CheckCircle2 size={18} />
              Trận đã dự đoán
            </button>
          </div>
        </div>
      </div>

      <div className="matches-list-bet">
        {competitions.length > 0 ? competitions.map(compName => (
          <div key={compName} className="competition-section">
            <div className="competition-header">
              <div className="comp-title-box">
                <Trophy size={16} color="#ffd200" />
                <span className="comp-name-text">{compName}</span>
              </div>
              <div className="comp-line"></div>
            </div>
            
            {Object.keys(groupedByCompetition[compName]).sort().map(date => (
              <div key={date} className="date-group">
                <div className="date-sub-header">
                  <span className="date-text-mini">{date.includes('.') ? `Ngày ${date}` : date}</span>
                </div>
                <div className="date-matches">
                  {groupedByCompetition[compName][date].map(m => {
                    const pred = predictions.find(p => p.match_id === m.id);
                    return (
                      <MatchCard 
                        key={m.id} 
                        match={m} 
                        userPrediction={pred}
                        onSavePrediction={onSavePrediction}
                        onRefreshMatches={onRefreshMatches}
                        onOpenComments={onOpenComments}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )) : (
          <div className="empty-state">
            {activeTab === 'all' ? (
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <p>Đang tải lịch thi đấu...</p>
              </div>
            ) : (
              <div className="no-predictions">
                <CheckCircle2 size={48} color="#1e293b" />
                <h3>Bạn chưa dự đoán trận nào</h3>
                <p>Hãy quay lại tab "Tất cả trận đấu" để bắt đầu gáy!</p>
                <button className="back-to-all" onClick={() => setActiveTab('all')}>Xem tất cả</button>
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .home-view-bet { max-width: 900px; margin: 0 auto; padding: 0 10px; }
        .quote-banner { border-left: 4px solid #00d2ff; padding: 20px; background: rgba(0, 210, 255, 0.03); borderRadius: 0 12px 12px 0; margin-bottom: 30px; fontSize: 0.85rem; color: #94a3b8; font-style: italic; border: 1px solid rgba(255,255,255,0.05); border-left-width: 4px; }
        
        .prediction-counter { display: inline-flex; align-items: center; gap: 8px; background: rgba(0, 210, 255, 0.05); padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; color: #00d2ff; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border: 1px solid rgba(0, 210, 255, 0.1); }
        .filter-tabs { display: flex; background: rgba(255, 255, 255, 0.03); padding: 6px; border-radius: 16px; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.05); margin-top: 10px; }
        .filter-tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; border: none; background: transparent; color: #64748b; font-weight: 800; font-size: 0.85rem; cursor: pointer; transition: 0.3s; border-radius: 12px; }
        .filter-tab-btn.active { background: #00d2ff; color: #020617; box-shadow: 0 4px 20px rgba(0, 210, 255, 0.3); }

        /* Competition Styling */
        .competition-section { margin-bottom: 40px; }
        .competition-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
        .comp-title-box { display: flex; align-items: center; gap: 10px; background: rgba(255, 210, 0, 0.1); padding: 8px 18px; border-radius: 12px; border: 1px solid rgba(255, 210, 0, 0.2); }
        .comp-name-text { font-weight: 900; font-size: 0.85rem; color: #ffd200; text-transform: uppercase; letter-spacing: 1px; }
        .comp-line { flex: 1; height: 1px; background: linear-gradient(to right, rgba(255, 210, 0, 0.2), transparent); }

        .date-sub-header { margin: 15px 0 10px 10px; border-left: 2px solid rgba(255,255,255,0.1); padding-left: 10px; }
        .date-text-mini { font-weight: 800; font-size: 0.7rem; color: #475569; text-transform: uppercase; letter-spacing: 1px; }
        
        .empty-state { padding: 80px 20px; text-align: center; }
        .loading-spinner { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .spinner-ring { width: 40px; height: 40px; border: 3px solid rgba(0, 210, 255, 0.1); border-top-color: #00d2ff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
};

export default HomeView;
