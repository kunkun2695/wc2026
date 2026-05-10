import React, { useState } from 'react';
import MatchCard from '../components/MatchCard';
import { LayoutGrid, CheckCircle2 } from 'lucide-react';

const HomeView = ({ matches, predictions = [], onSavePrediction, onRefreshMatches, onOpenComments }) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'predicted'

  // Lọc trận đấu dựa trên tab đang chọn
  const filteredMatches = activeTab === 'all' 
    ? matches 
    : matches.filter(m => predictions.some(p => p.match_id === m.id));

  // Nhóm các trận đấu đã lọc theo ngày
  const groupedMatches = filteredMatches.reduce((acc, match) => {
    const [date] = match.match_time ? match.match_time.split(' - ') : ['Sắp tới'];
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  const dates = Object.keys(groupedMatches).sort();
  const predictedCount = predictions.length;
  const totalMatches = matches.length;

  return (
    <div className="home-view-bet">
      {/* Header Info */}
      <div className="view-header-content" style={{ marginBottom: '30px' }}>
        <div className="quote-banner" style={{ 
          borderLeft: '4px solid #00d2ff', 
          padding: '20px', 
          background: 'rgba(0, 210, 255, 0.03)', 
          borderRadius: '0 12px 12px 0',
          marginBottom: '30px',
          fontSize: '0.85rem',
          color: '#94a3b8',
          fontStyle: 'italic',
          border: '1px solid rgba(255,255,255,0.05)',
          borderLeftWidth: '4px'
        }}>
          "World Cup is not just about football, it's about the spirit of nations coming together. 2026 will be the biggest festival ever." — Official FIFA
        </div>

        <div className="stats-and-tabs">
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <h2 className="font-outfit" style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '5px', letterSpacing: '-0.5px' }}>
              VÒNG BẢNG 2026
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
        {dates.length > 0 ? dates.map(date => (
          <div key={date} className="date-section">
            <div className="date-header">
              <span className="date-line"></span>
              <span className="date-text">{date.includes('.') ? `Ngày ${date}` : date}</span>
              <span className="date-line"></span>
            </div>
            <div className="date-matches">
              {groupedMatches[date].map(m => {
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
        .home-view-bet {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 10px;
        }
        .prediction-counter {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 210, 255, 0.05);
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          color: #00d2ff;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          border: 1px solid rgba(0, 210, 255, 0.1);
        }
        .filter-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          padding: 6px;
          border-radius: 16px;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-top: 10px;
        }
        .filter-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 12px;
        }
        .filter-tab-btn.active {
          background: #00d2ff;
          color: #020617;
          box-shadow: 0 4px 20px rgba(0, 210, 255, 0.3);
        }
        .date-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin: 35px 0 20px;
        }
        .date-text {
          font-weight: 900;
          font-size: 0.75rem;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 2px;
          white-space: nowrap;
        }
        .date-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent);
        }
        .empty-state {
          padding: 80px 20px;
          text-align: center;
        }
        .no-predictions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }
        .no-predictions h3 { color: #fff; margin-bottom: 0; }
        .no-predictions p { color: #64748b; font-size: 0.9rem; }
        .back-to-all {
          margin-top: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 10px 25px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
        }
        .back-to-all:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .spinner-ring {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 210, 255, 0.1);
          border-top-color: #00d2ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
};

export default HomeView;
