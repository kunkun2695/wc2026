import React, { useState, useMemo } from 'react';
import MatchCard from '../components/MatchCard';
import { LayoutGrid, CheckCircle2, Trophy, Clock, Calendar } from 'lucide-react';

const HomeView = ({ matches, predictions = [], onSavePrediction, onRefreshMatches, onOpenComments }) => {
  const [activeTab, setActiveTab] = useState('all'); 

  // Hàm chuyển đổi string "HH:mm DD-MM" hoặc tương tự thành Date để so sánh
  const parseMatchTime = (timeStr) => {
    if (!timeStr) return new Date(0);
    try {
      // Giả sử định dạng: "HH:mm DD-MM" hoặc "DD-MM HH:mm"
      // Chúng ta sẽ cố gắng tách lấy ngày và tháng
      const parts = timeStr.split(/[\s-]/);
      // Ví dụ: ["00:30", "11", "05"]
      const [time, day, month] = parts;
      const [hour, min] = time.split(':');
      // Tạo Date giả lập cho năm 2026
      return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    } catch (e) {
      return new Date(0);
    }
  };

  // Sắp xếp và lọc trận đấu
  const displayMatches = useMemo(() => {
    let filtered = activeTab === 'all' 
      ? matches 
      : matches.filter(m => predictions.some(p => p.match_id === m.id));

    // Sắp xếp theo thời gian GIẢM DẦN (Mới nhất lên đầu)
    // Nếu muốn TĂNG DẦN (Trận sắp tới gần nhất lên đầu), đảo ngược a và b
    return [...filtered].sort((a, b) => {
      const timeA = parseMatchTime(a.match_time);
      const timeB = parseMatchTime(b.match_time);
      return timeB - timeA; // Giảm dần
    });
  }, [matches, predictions, activeTab]);

  // Nhóm theo ngày để hiển thị tiêu đề ngày
  const groupedByDate = useMemo(() => {
    return displayMatches.reduce((acc, match) => {
      const dateStr = match.match_time ? match.match_time.split(' ')[1] : 'Sắp tới';
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(match);
      return acc;
    }, {});
  }, [displayMatches]);

  const predictedCount = predictions.length;
  const totalMatches = matches.length;

  return (
    <div className="home-view-bet">
      <div className="view-header-content">
        <div className="quote-banner">
          "Bóng đá không chỉ là trò chơi, đó là niềm đam mê bất tận." — World Cup 2026 Guru
        </div>

        <div className="stats-and-tabs">
          <div className="header-main-info">
            <div className="title-section">
              <Calendar size={24} color="#00d2ff" />
              <h2 className="font-outfit">LỊCH THI ĐẤU CHI TIẾT</h2>
            </div>
            <div className="prediction-counter">
              <CheckCircle2 size={14} color="#00d2ff" />
              <span>{predictedCount}/{totalMatches} TRẬN ĐÃ GÁY</span>
            </div>
          </div>

          <div className="filter-tabs">
            <button className={`filter-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              <LayoutGrid size={18} /> TẤT CẢ TRẬN ĐẤU
            </button>
            <button className={`filter-tab-btn ${activeTab === 'predicted' ? 'active' : ''}`} onClick={() => setActiveTab('predicted')}>
              <CheckCircle2 size={18} /> ĐÃ DỰ ĐOÁN
            </button>
          </div>
        </div>
      </div>

      <div className="timeline-container">
        {displayMatches.length > 0 ? (
          <div className="matches-timeline">
            {displayMatches.map((m, idx) => {
              const pred = predictions.find(p => p.match_id === m.id);
              
              // Kiểm tra xem có phải trận đầu tiên của ngày không để hiện nhãn ngày
              const showDateLabel = idx === 0 || 
                (m.match_time && displayMatches[idx-1].match_time && 
                 m.match_time.split(' ')[1] !== displayMatches[idx-1].match_time.split(' ')[1]);

              return (
                <div key={m.id} className="timeline-item">
                  {showDateLabel && (
                    <div className="timeline-date-label">
                      <Clock size={14} />
                      <span>{m.match_time ? `NGÀY ${m.match_time.split(' ')[1]}` : 'CHƯA XÁC ĐỊNH'}</span>
                    </div>
                  )}
                  <div className="match-card-wrapper">
                    <MatchCard 
                      match={m} 
                      userPrediction={pred}
                      onSavePrediction={onSavePrediction}
                      onRefreshMatches={onRefreshMatches}
                      onOpenComments={onOpenComments}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Không có trận đấu nào phù hợp với bộ lọc của bạn.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .home-view-bet { width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .quote-banner { border-left: 4px solid #00d2ff; padding: 15px 20px; background: rgba(0, 210, 255, 0.05); border-radius: 0 12px 12px 0; margin-bottom: 30px; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
        
        .header-main-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
        .title-section { display: flex; align-items: center; gap: 12px; }
        .title-section h2 { margin: 0; font-size: 1.8rem; font-weight: 900; color: white; letter-spacing: -1px; }
        
        .prediction-counter { display: inline-flex; align-items: center; gap: 8px; background: rgba(0, 210, 255, 0.1); padding: 8px 16px; border-radius: 20px; font-size: 0.75rem; color: #00d2ff; font-weight: 900; letter-spacing: 1px; border: 1px solid rgba(0, 210, 255, 0.2); }
        
        .filter-tabs { display: flex; background: rgba(255, 255, 255, 0.03); padding: 6px; border-radius: 16px; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 40px; width: fit-content; }
        .filter-tab-btn { display: flex; align-items: center; gap: 10px; padding: 10px 20px; border: none; background: transparent; color: #64748b; font-weight: 800; font-size: 0.8rem; cursor: pointer; transition: 0.3s; border-radius: 12px; }
        .filter-tab-btn.active { background: #00d2ff; color: #020617; box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3); }

        .timeline-container { position: relative; }
        .matches-timeline { display: flex; flex-direction: column; gap: 20px; }
        
        .timeline-date-label { display: flex; align-items: center; gap: 8px; color: #475569; font-weight: 900; font-size: 0.75rem; letter-spacing: 2px; margin: 20px 0 10px 10px; }
        .match-card-wrapper { transition: transform 0.3s; }
        .match-card-wrapper:hover { transform: scale(1.01); }

        @media (max-width: 768px) {
          .home-view-bet { padding: 80px 15px; }
          .title-section h2 { font-size: 1.4rem; }
          .filter-tabs { width: 100%; }
        }
      ` }} />
    </div>
  );
};

export default HomeView;
