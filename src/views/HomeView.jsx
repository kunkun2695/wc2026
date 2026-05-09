import React from 'react';
import MatchCard from '../components/MatchCard';

const HomeView = ({ matches, predictions = [], onSavePrediction, onRefreshMatches }) => {
  // Nhóm các trận đấu theo ngày
  const groupedMatches = matches.reduce((acc, match) => {
    const [date] = match.match_time ? match.match_time.split(' - ') : ['Sắp tới'];
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  const dates = Object.keys(groupedMatches).sort();

  return (
    <div className="home-view-bet">
      {/* Quote Banner Style */}
      <div className="quote-banner" style={{ 
        borderLeft: '4px solid var(--accent-blue)', 
        padding: '20px', 
        background: 'rgba(58, 134, 255, 0.05)', 
        borderRadius: '0 12px 12px 0',
        marginBottom: '40px',
        fontSize: '0.85rem',
        color: 'var(--text-dim)',
        fontStyle: 'italic'
      }}>
        "World Cup is not just about football, it's about the spirit of nations coming together. 2026 will be the biggest festival ever." — Official FIFA
      </div>

      <div className="view-title-bet" style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 className="font-outfit" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Group Stage (1/4)</h2>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>0/10 Matches Predicted</div>
      </div>

      <div className="matches-list-bet">
        {dates.length > 0 ? dates.map(date => (
          <div key={date}>
            <div className="date-header">
              {date.includes('.') ? `Ngày ${date}` : date}
            </div>
            {groupedMatches[date].map(m => {
              const pred = predictions.find(p => p.match_id === m.id);
              return (
                <MatchCard 
                  key={m.id} 
                  match={m} 
                  userPrediction={pred}
                  onSavePrediction={onSavePrediction}
                  onRefreshMatches={onRefreshMatches}
                />
              );
            })}
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-dim)' }}>
            Đang tải lịch thi đấu...
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .home-view-bet {
          max-width: 900px;
          margin: 0 auto;
        }
      ` }} />
    </div>
  );
};

export default HomeView;
