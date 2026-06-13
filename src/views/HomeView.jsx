import React, { useState, useEffect, useMemo } from 'react';
import MatchCard from '../components/MatchCard';
import { LayoutGrid, CheckCircle2, Trophy, Clock, Calendar } from 'lucide-react';

const HomeView = ({ matches, predictions = [], onSavePrediction, onRefreshMatches, onOpenComments, onViewDetails }) => {
  const [activeTab, setActiveTab] = useState('all'); 

  // Bộ đếm thời gian cập nhật tự động tiếp theo (30 phút một lần)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const calculateSecondsLeft = () => {
      const now = new Date();
      const m = now.getMinutes();
      const s = now.getSeconds();
      const nextTarget = m < 30 ? 30 : 60;
      return (nextTarget - m - 1) * 60 + (60 - s);
    };
    return calculateSecondsLeft();
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const m = now.getMinutes();
      const s = now.getSeconds();
      const nextTarget = m < 30 ? 30 : 60;
      
      const seconds = (nextTarget - m - 1) * 60 + (60 - s);
      setSecondsLeft(seconds);

      // Khi đếm ngược vừa reset và trôi qua 5 giây (để server hoàn tất đồng bộ), tự động cập nhật lại dữ liệu ở client
      if (seconds === 1795) {
        if (onRefreshMatches) {
          onRefreshMatches();
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [onRefreshMatches]);

  const formatCountdown = (totalSeconds) => {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }; 

  // Hàm chuyển đổi string "HH:mm DD-MM" hoặc tương tự thành Date để so sánh
  const parseMatchTime = (timeStr) => {
    if (!timeStr) return new Date(0);
    try {
      // 1. Định dạng "DD/MM - HH:mm" (ví dụ: "11/06 - 17:00")
      if (timeStr.includes('/')) {
        const [datePart, timePart] = timeStr.split(' - ');
        const [day, month] = datePart.split('/');
        const [hour, min] = timePart.split(':');
        return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
      }
      
      // 2. Định dạng "DD.MM - HH:mm" (ví dụ: "25.6 - 02:00")
      if (timeStr.includes('.')) {
        const [datePart, timePart] = timeStr.split(' - ');
        const [day, month] = datePart.split('.');
        const [hour, min] = timePart.split(':');
        return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
      }

      // 3. Định dạng cũ: "HH:mm DD-MM"
      const parts = timeStr.split(/[\s-]/);
      const [time, day, month] = parts.filter(Boolean);
      const [hour, min] = time.split(':');
      return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    } catch (e) {
      return new Date(0);
    }
  };

  const [hideFinished, setHideFinished] = useState(true);

  // Sắp xếp và lọc trận đấu
  const displayMatches = useMemo(() => {
    let filtered = activeTab === 'all' 
      ? matches 
      : matches.filter(m => predictions.some(p => p.match_id === m.id));

    if (hideFinished) {
      const isTodayOrYesterday = (matchDate) => {
        const today = new Date();
        const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayZero = new Date(todayZero);
        yesterdayZero.setDate(yesterdayZero.getDate() - 1);
        const matchZero = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
        return matchZero.getTime() >= yesterdayZero.getTime();
      };

      filtered = filtered.filter(m => {
        // Nếu trận chưa đá xong, luôn giữ lại
        if (m.status !== 'FT' && m.status !== 'FINISHED') {
          return true;
        }
        // Nếu trận đã kết thúc, chỉ giữ lại nếu thuộc ngày hôm nay hoặc hôm qua
        const matchDate = parseMatchTime(m.match_time);
        return isTodayOrYesterday(matchDate);
      });
    }

    // Sắp xếp theo thời gian TĂNG DẦN (Trận gần hiện tại nhất lên đầu)
    return [...filtered].sort((a, b) => {
      const timeA = parseMatchTime(a.match_time);
      const timeB = parseMatchTime(b.match_time);
      return timeA - timeB; // Tăng dần
    });
  }, [matches, predictions, activeTab, hideFinished]);

  // Nhóm theo ngày để hiển thị tiêu đề ngày
  const groupedMatches = useMemo(() => {
    const groups = [];
    displayMatches.forEach(m => {
      const getMatchDate = (timeStr) => {
        if (!timeStr) return 'Sắp tới';
        return timeStr.includes(' - ') ? timeStr.split(' - ')[0] : (timeStr.split(' ')[1] || timeStr);
      };
      const matchDate = getMatchDate(m.match_time);
      let group = groups.find(g => g.date === matchDate);
      if (!group) {
        group = { date: matchDate, matches: [] };
        groups.push(group);
      }
      group.matches.push(m);
    });
    return groups;
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="prediction-counter" style={{ background: 'rgba(255, 210, 0, 0.08)', color: '#ffd200', borderColor: 'rgba(255, 210, 0, 0.2)' }} title="Đồng bộ tự động từ Football-Data API">
                <Clock size={12} color="#ffd200" />
                <span>ĐỒNG BỘ SAU: {formatCountdown(secondsLeft)}</span>
              </div>
              <div className="prediction-counter">
                <CheckCircle2 size={14} color="#00d2ff" />
                <span>{predictedCount}/{totalMatches} TRẬN ĐÃ GÁY</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
            <div className="filter-tabs" style={{ marginBottom: 0 }}>
              <button className={`filter-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                <LayoutGrid size={18} /> TẤT CẢ TRẬN ĐẤU
              </button>
              <button className={`filter-tab-btn ${activeTab === 'predicted' ? 'active' : ''}`} onClick={() => setActiveTab('predicted')}>
                <CheckCircle2 size={18} /> ĐÃ DỰ ĐOÁN
              </button>
            </div>
            
            <label className="toggle-hide-finished">
              <input 
                type="checkbox" 
                checked={hideFinished} 
                onChange={(e) => setHideFinished(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#00d2ff' }}
              />
              <span>ẨN TRẬN KẾT THÚC CŨ</span>
            </label>
          </div>
        </div>
      </div>

      <div className="timeline-container">
        {groupedMatches.length > 0 ? (
          <div className="matches-timeline-groups">
            {groupedMatches.map((group, idx) => (
              <div key={group.date} className="date-group-section" style={{ marginBottom: '45px' }}>
                <div className="timeline-date-label">
                  <div className="date-pill">
                    <Calendar size={14} />
                    <span>{group.date ? `NGÀY ${group.date}` : 'CHƯA XÁC ĐỊNH'}</span>
                  </div>
                  <div className="date-line" />
                </div>
                
                <div className="matches-grid">
                  {group.matches.map(m => {
                    const pred = predictions.find(p => p.match_id === m.id);
                    return (
                      <div key={m.id} className="match-card-wrapper">
                        <MatchCard 
                          match={m} 
                          userPrediction={pred}
                          onSavePrediction={onSavePrediction}
                          onRefreshMatches={onRefreshMatches}
                          onOpenComments={onOpenComments}
                          onViewDetails={onViewDetails}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
        
        .filter-tabs { display: flex; background: rgba(255, 255, 255, 0.03); padding: 6px; border-radius: 16px; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.05); width: fit-content; }
        .filter-tab-btn { display: flex; align-items: center; gap: 10px; padding: 10px 20px; border: none; background: transparent; color: #64748b; font-weight: 800; font-size: 0.8rem; cursor: pointer; transition: 0.3s; border-radius: 12px; }
        .filter-tab-btn.active { background: #00d2ff; color: #020617; box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3); }

        .toggle-hide-finished {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 900;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.03);
          padding: 10px 18px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          user-select: none;
          transition: 0.2s;
        }
        .toggle-hide-finished:hover {
          color: white;
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .timeline-container { position: relative; }
        .matches-timeline-groups { display: flex; flex-direction: column; }
        
        .timeline-date-label { 
          display: flex; 
          align-items: center; 
          gap: 15px; 
          margin: 10px 0 20px 0;
        }
        .date-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 6px 16px;
          border-radius: 30px;
          color: #94a3b8;
          font-weight: 900;
          font-size: 0.7rem;
          letter-spacing: 1.5px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          white-space: nowrap;
        }
        .date-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent);
        }

        .matches-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .match-card-wrapper { transition: transform 0.3s; }
        .match-card-wrapper:hover { transform: scale(1.01); }

        @media (max-width: 1024px) {
          .matches-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .home-view-bet { padding: 80px 15px; }
          .title-section h2 { font-size: 1.4rem; }
          .filter-tabs { width: 100%; justify-content: center; }
          .toggle-hide-finished { width: 100%; justify-content: center; }
          .matches-grid {
            grid-template-columns: 1fr;
          }
        }
      ` }} />
    </div>
  );
};

export default HomeView;
