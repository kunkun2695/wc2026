import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Trophy, Coins, Users, CheckCircle2, XCircle, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { mockAuth } from '../data/mockAuth';
import UserAvatar from '../components/UserAvatar';
import API_URL from '../config';

const DailyStatsView = ({ matches = [] }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [users, setUsers] = useState([]);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách user:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const parseMatchTimeToVnDate = (timeStr) => {
    if (!timeStr) return new Date(0);
    try {
      let day, month, hour, min;
      if (timeStr.includes('/')) {
        const [datePart, timePart] = timeStr.split(' - ');
        [day, month] = datePart.split('/');
        [hour, min] = timePart.split(':');
      } else if (timeStr.includes('.')) {
        const [datePart, timePart] = timeStr.split(' - ');
        [day, month] = datePart.split('.');
        [hour, min] = timePart.split(':');
      } else {
        const parts = timeStr.split(/[\s-]/);
        const [time, d, m] = parts.filter(Boolean);
        [hour, min] = time.split(':');
        day = d;
        month = m;
      }
      const pad = (n) => String(n).padStart(2, '0');
      const isoString = `2026-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:00+07:00`;
      return new Date(isoString);
    } catch (e) {
      return new Date(0);
    }
  };

  // Fetch all predictions from the server
  const fetchAllPredictions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/predictions/all`, {
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data);
      }
    } catch (err) {
      console.error('Lỗi lấy tất cả dự đoán:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPredictions();
  }, [matches]);

  // Helper to extract date from match time string "HH:mm DD/MM" or "DD/MM - HH:mm"
  const getMatchDateString = (timeStr) => {
    if (!timeStr) return 'Khác';
    if (timeStr.includes(' - ')) {
      return timeStr.split(' - ')[0]; // Trả về "DD/MM" hoặc "DD.MM"
    }
    const parts = timeStr.split(' ');
    return parts[1] || timeStr;
  };

  // Get list of unique dates with matches
  const uniqueDates = useMemo(() => {
    const datesSet = new Set();
    matches.forEach(m => {
      const d = getMatchDateString(m.match_time);
      if (d && d !== 'Khác') datesSet.add(d);
    });
    
    // Sắp xếp các ngày theo trật tự thời gian (Ví dụ 11/06, 12/06...)
    return Array.from(datesSet).sort((a, b) => {
      const [dayA, monthA] = a.split(/[\/\.]/);
      const [dayB, monthB] = b.split(/[\/\.]/);
      const dateA = new Date(2026, parseInt(monthA) - 1, parseInt(dayA));
      const dateB = new Date(2026, parseInt(monthB) - 1, parseInt(dayB));
      return dateA - dateB;
    });
  }, [matches]);

  // Set default selected date
  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      // Tìm ngày gần với ngày hiện tại nhất hoặc ngày đầu tiên có trận đấu
      const now = new Date();
      const currentDay = String(now.getDate()).padStart(2, '0');
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      const todayStr = `${currentDay}/${currentMonth}`;
      
      const foundToday = uniqueDates.find(d => d.replace('.', '/') === todayStr);
      if (foundToday) {
        setSelectedDate(foundToday);
      } else {
        setSelectedDate(uniqueDates[0]);
      }
    }
  }, [uniqueDates, selectedDate]);

  // Filter matches of selected date
  const matchesToday = useMemo(() => {
    return matches.filter(m => getMatchDateString(m.match_time) === selectedDate);
  }, [matches, selectedDate]);

  // Filter predictions of selected date's matches
  const predictionsToday = useMemo(() => {
    const matchIds = new Set(matchesToday.map(m => m.id));
    return predictions.filter(p => matchIds.has(p.match_id));
  }, [predictions, matchesToday]);

  // Calculate user summary for the selected date
  const userStatsToday = useMemo(() => {
    const statsMap = {};

    // 1. Initialize stats for ALL users
    users.forEach(u => {
      statsMap[u.id] = {
        userId: u.id,
        userName: u.name,
        userAvatar: u.avatar || '',
        correct: 0,
        wrong: 0,
        fines: 0,
        predictedCount: 0
      };
    });

    // 2. Map predictions by user_id and match_id for quick lookup
    const predMap = {};
    predictionsToday.forEach(p => {
      predMap[`${p.user_id}_${p.match_id}`] = p;
    });

    // 3. For each user and each match today, compute points/fines
    users.forEach(u => {
      matchesToday.forEach(m => {
        const mTime = parseMatchTimeToVnDate(m.match_time);
        const isStarted = m.status !== 'UPCOMING' || new Date() >= mTime;
        const isFinished = m.status === 'FT';
        
        const p = predMap[`${u.id}_${m.id}`];
        
        if (p) {
          if (p.predicted_home_score !== -1) {
            statsMap[u.id].predictedCount++;
          }
          
          if (isFinished) {
            if (p.points === 10) {
              statsMap[u.id].correct++;
              statsMap[u.id].fines += 10000;
            } else {
              statsMap[u.id].wrong++;
              statsMap[u.id].fines += 30000;
            }
          } else if (isStarted && p.predicted_home_score === -1) {
            statsMap[u.id].wrong++;
            statsMap[u.id].fines += 30000;
          }
        } else {
          if (isStarted) {
            statsMap[u.id].wrong++;
            statsMap[u.id].fines += 30000;
          }
        }
      });
    });

    return Object.values(statsMap).sort((a, b) => {
      if (b.correct !== a.correct) return b.correct - a.correct;
      return a.fines - b.fines;
    });
  }, [users, matchesToday, predictionsToday]);

  // Aggregated totals for the selected date
  const dateTotals = useMemo(() => {
    let totalFines = 0;
    let finishedMatches = matchesToday.filter(m => m.status === 'FT').length;
    
    userStatsToday.forEach(u => {
      totalFines += u.fines;
    });

    return {
      totalFines,
      finishedMatches,
      totalMatches: matchesToday.length
    };
  }, [userStatsToday, matchesToday]);

  const getOutcomeLabel = (p) => {
    if (p.predicted_home_score === -1) return 'MISSED';
    if (p.predicted_home_score > p.predicted_away_score) return '1';
    if (p.predicted_home_score < p.predicted_away_score) return '2';
    return 'X';
  };

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = () => {
    setExporting(true);
    
    const runExport = () => {
      const element = document.getElementById('daily-stats-pdf-content');
      if (!element) {
        setExporting(false);
        return;
      }
      
      element.classList.add('is-pdf-exporting');
      
      const opt = {
        margin:       [10, 10, 10, 10],
        filename:     `Bao_cao_phat_WC2026_Ngay_${selectedDate.replace(/[\/\.]/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#06090f',
          logging: false
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      window.html2pdf().from(element).set(opt).save()
        .then(() => {
          element.classList.remove('is-pdf-exporting');
          setExporting(false);
        })
        .catch(err => {
          console.error('Lỗi xuất PDF:', err);
          element.classList.remove('is-pdf-exporting');
          setExporting(false);
          alert('Không thể xuất file PDF. Vui lòng thử lại!');
        });
    };

    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = '/html2pdf.bundle.min.js';
      script.onload = () => {
        runExport();
      };
      script.onerror = () => {
        setExporting(false);
        alert('Lỗi tải thư viện xuất PDF cục bộ. Vui lòng thử lại!');
      };
      document.body.appendChild(script);
    } else {
      runExport();
    }
  };

  if (loading) {
    return (
      <div className="stats-loading">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  return (
    <div className="daily-stats-container animate-fade">
      <header className="stats-header">
        <div className="stats-header-icon">
          <Calendar size={32} />
        </div>
        <h1 className="font-outfit">Thống Kê Hằng Ngày</h1>
        <p>Bảng tổng hợp điểm số và tiền phạt ăn nhậu hôm nay</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px' }}>
          <button 
            onClick={handleExportPDF} 
            className="export-pdf-btn"
            disabled={exporting}
          >
            {exporting ? 'Đang xuất PDF...' : '📄 Xuất Báo Cáo PDF'}
          </button>
        </div>
      </header>

      {/* Date selector slider */}
      <div className="date-selector-slider">
        {uniqueDates.map((d, index) => (
          <button
            key={index}
            className={`date-pill-btn ${selectedDate === d ? 'active' : ''}`}
            onClick={() => setSelectedDate(d)}
          >
            <span>Ngày {d}</span>
          </button>
        ))}
      </div>

      <div id="daily-stats-pdf-content" className="pdf-content-wrapper">
        {/* PDF Header */}
        <div className="pdf-header">
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#00d2ff', fontFamily: 'Outfit, sans-serif' }}>
            BÁO CÁO PHẠT HẰNG NGÀY
          </div>
          <div style={{ fontSize: '0.9rem', color: '#8a94a6', fontWeight: 600, marginTop: '5px' }}>
            Giải đấu: World Cup 2026 Tracker
          </div>
          <div style={{ fontSize: '1.1rem', color: '#ffd200', fontWeight: 800, marginTop: '8px' }}>
            Ngày thi đấu: {selectedDate}
          </div>
        </div>

        <div className="stats-grid-dashboard">
        {/* Card: Total Fines */}
        <div className="dashboard-card glow-red">
          <div className="card-icon-wrapper red">
            <Coins size={22} />
          </div>
          <div className="card-info">
            <span className="card-lbl">TỔNG PHẠT TRONG NGÀY</span>
            <span className="card-val red">
              {new Intl.NumberFormat('vi-VN').format(dateTotals.totalFines)}đ
            </span>
          </div>
        </div>

        {/* Card: Top performer */}
        <div className="dashboard-card glow-cyan">
          <div className="card-icon-wrapper cyan">
            <Trophy size={22} />
          </div>
          <div className="card-info">
            <span className="card-lbl">ĐỈNH CAO HÔM NAY</span>
            <span className="card-val cyan">
              {userStatsToday.length > 0 && userStatsToday[0].correct > 0
                ? `${userStatsToday[0].userName} (+${userStatsToday[0].correct})`
                : 'Chưa xác định'}
            </span>
          </div>
        </div>

        {/* Card: Progress */}
        <div className="dashboard-card glow-purple">
          <div className="card-icon-wrapper purple">
            <Clock size={22} />
          </div>
          <div className="card-info">
            <span className="card-lbl">TIẾN ĐỘ TRẬN ĐẤU</span>
            <span className="card-val purple">
              {dateTotals.finishedMatches}/{dateTotals.totalMatches} TRẬN Xong
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table for Selected Day */}
      <section className="stats-section-box">
        <h3 className="section-title-stats">
          <Trophy size={18} color="#ffd200" /> Bảng Quy Đổi Phạt Ăn Nhậu Ngày {selectedDate}
        </h3>
        
        <div className="table-responsive glass-panel">
          <table className="stats-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Hạng</th>
                <th>Thành viên</th>
                <th style={{ textAlign: 'center' }}>Đoán đúng</th>
                <th style={{ textAlign: 'center' }}>Đoán sai</th>
                <th style={{ textAlign: 'right' }}>Tiền phạt hôm nay</th>
              </tr>
            </thead>
            <tbody>
              {userStatsToday.length > 0 ? (
                userStatsToday.map((u, idx) => (
                  <tr key={u.userId} className={idx === 0 && u.correct > 0 ? 'top-row' : ''}>
                    <td className="rank-cell">
                      {idx + 1}
                    </td>
                    <td>
                      <div className="user-profile-cell">
                        <UserAvatar src={u.userAvatar} size={32} />
                        <span className="user-name-cell">{u.userName}</span>
                      </div>
                    </td>
                    <td className="stat-num-cell green">
                      <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {u.correct}
                    </td>
                    <td className="stat-num-cell red-text">
                      <XCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      {u.wrong}
                    </td>
                    <td className="fine-cell">
                      <span>{new Intl.NumberFormat('vi-VN').format(u.fines)}đ</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-cell">Chưa có dự đoán nào trong ngày này.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Match Details & Bets in Selected Day */}
      <section className="stats-section-box" style={{ marginTop: '30px' }}>
        <h3 className="section-title-stats">
          <Users size={18} color="#00d2ff" /> Chi Tiết Lựa Chọn Trận Đấu Ngày {selectedDate}
        </h3>

        <div className="matches-stats-list">
          {matchesToday.length > 0 ? (
            matchesToday.map(m => {
              const matchPredictions = predictions.filter(p => p.match_id === m.id);
              const isFinished = m.status === 'FT';
              
              return (
                <div key={m.id} className="match-stat-card">
                  {/* Match summary header */}
                  <div className="match-stat-header">
                    <div className="teams-info-row">
                      <span className="team-name">{m.team1_name}</span>
                      {isFinished ? (
                        <span className="score-pill">{m.team1_score} - {m.team2_score}</span>
                      ) : (
                        <span className="vs-pill">VS</span>
                      )}
                      <span className="team-name">{m.team2_name}</span>
                    </div>

                    <div className="odds-row">
                      {m.handicap_favorite && parseFloat(m.handicap_value) !== 0 ? (
                        <span className="odd-badge cap">
                          Kèo chấp: {m.handicap_favorite === m.team1_name 
                            ? `${m.team1_name} chấp ${m.team2_name} ${m.handicap_text || m.handicap_value} trái`
                            : `${m.team2_name} chấp ${m.team1_name} ${m.handicap_text || m.handicap_value} trái`
                          }
                        </span>
                      ) : (
                        <span className="odd-badge cap">Đồng banh (Không chấp)</span>
                      )}
                    </div>
                  </div>

                  {/* Users choices for this match */}
                  <div className="match-choices-grid">
                    {(() => {
                      const mTime = parseMatchTimeToVnDate(m.match_time);
                      const isStarted = m.status !== 'UPCOMING' || new Date() >= mTime;
                      
                      const displayPreds = users.map(u => {
                        const existingPred = matchPredictions.find(p => p.user_id === u.id);
                        if (existingPred) return existingPred;
                        
                        if (isStarted) {
                          return {
                            prediction_id: `missed_${u.id}_${m.id}`,
                            user_id: u.id,
                            user_name: u.name,
                            user_avatar: u.avatar || '',
                            match_id: m.id,
                            predicted_home_score: -1,
                            predicted_away_score: -1,
                            points: 30,
                            is_hidden: false
                          };
                        }
                        return null;
                      }).filter(Boolean);

                      if (displayPreds.length > 0) {
                        return displayPreds.map(p => {
                          const isCorrect = p.points === 10;
                          const choice = getOutcomeLabel(p);
                          const teamSelected = choice === 'MISSED' 
                            ? 'Bỏ lỡ dự đoán' 
                            : (choice === '1' ? m.team1_name : (choice === '2' ? m.team2_name : 'Hòa (X)'));
                          
                          return (
                            <div key={p.prediction_id} className="user-choice-card">
                              <div className="user-info-choice">
                                <UserAvatar src={p.user_avatar} size={24} />
                                <span className="name">{p.user_name}</span>
                              </div>
                              
                              {p.is_hidden ? (
                                <div className="choice-badge-locked">
                                  <Clock size={10} /> ĐÃ KHÓA (ẨN)
                                </div>
                              ) : (
                                <div className="choice-badge-revealed">
                                  <span className="label">Chọn: </span>
                                  <span className="val" style={{ color: choice === 'MISSED' ? '#ef4444' : 'inherit', fontWeight: choice === 'MISSED' ? 800 : 'inherit' }}>{teamSelected}</span>
                                </div>
                              )}

                              {isStarted && !p.is_hidden && (
                                <div className={`outcome-badge ${isCorrect ? 'correct' : 'wrong'}`}>
                                  {choice === 'MISSED' ? 'BỎ LỠ (Phạt 30k)' : (isCorrect ? 'ĐÚNG (Phạt 10k)' : 'SAI (Phạt 30k)')}
                                </div>
                              )}
                            </div>
                          );
                        });
                      } else {
                        return <div className="no-preds-match">Chưa có ai dự đoán trận đấu này.</div>;
                      }
                    })()}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state-stats">Không có trận đấu nào diễn ra.</div>
          )}
        </div>
      </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .daily-stats-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 100px 20px 150px;
        }

        .stats-header {
          text-align: center;
          margin-bottom: 35px;
        }

        .stats-header-icon {
          width: 64px;
          height: 64px;
          background: rgba(0, 210, 255, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          border: 1px solid rgba(0, 210, 255, 0.2);
          color: #00d2ff;
        }

        .stats-header h1 {
          font-size: 2rem;
          font-weight: 900;
          margin-bottom: 5px;
          color: white;
        }

        .stats-header p {
          color: #64748b;
          font-weight: 600;
        }

        /* Date Selector */
        .date-selector-slider {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 10px 5px;
          margin-bottom: 30px;
          scrollbar-width: thin;
        }
        .date-selector-slider::-webkit-scrollbar {
          height: 4px;
        }
        .date-selector-slider::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
        }

        .date-pill-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 8px 16px;
          border-radius: 12px;
          color: #94a3b8;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .date-pill-btn:hover {
          background: rgba(255, 255, 255, 0.07);
          color: white;
        }
        .date-pill-btn.active {
          background: #00d2ff;
          color: #020617;
          border-color: #00d2ff;
          box-shadow: 0 4px 15px rgba(0, 210, 255, 0.35);
        }

        /* Dashboard Grid */
        .stats-grid-dashboard {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 35px;
        }

        .dashboard-card {
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 15px;
          position: relative;
          overflow: hidden;
        }

        .dashboard-card.glow-red { border-color: rgba(239, 68, 68, 0.15); }
        .dashboard-card.glow-cyan { border-color: rgba(0, 210, 255, 0.15); }
        .dashboard-card.glow-purple { border-color: rgba(168, 85, 247, 0.15); }

        .card-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-icon-wrapper.red { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .card-icon-wrapper.cyan { background: rgba(0, 210, 255, 0.08); color: #00d2ff; }
        .card-icon-wrapper.purple { background: rgba(168, 85, 247, 0.08); color: #a855f7; }

        .card-info {
          display: flex;
          flex-direction: column;
        }

        .card-lbl {
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 0.5px;
        }

        .card-val {
          font-size: 1.15rem;
          font-weight: 900;
          font-family: 'Outfit', sans-serif;
        }
        .card-val.red { color: #f87171; }
        .card-val.cyan { color: #22d3ee; }
        .card-val.purple { color: #c084fc; }

        /* Tables & Sections */
        .stats-section-box {
          margin-bottom: 25px;
        }

        .section-title-stats {
          font-size: 1.05rem;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .glass-panel {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 22px;
          padding: 8px;
          overflow: hidden;
        }

        .stats-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .stats-table th {
          text-align: left;
          padding: 12px 16px;
          font-weight: 800;
          color: #64748b;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 0.75rem;
          text-transform: uppercase;
        }

        .stats-table td {
          padding: 12px 16px;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          font-weight: 600;
        }

        .stats-table tr:last-child td {
          border-bottom: none;
        }

        .stats-table tr.top-row td {
          background: rgba(0, 210, 255, 0.03);
        }

        .user-profile-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-name-cell {
          color: white;
          font-weight: 700;
        }

        .stat-num-cell {
          text-align: center;
          font-weight: 800;
        }
        .stat-num-cell.green { color: #34d399; }
        .stat-num-cell.red-text { color: #f87171; }

        .fine-cell {
          text-align: right;
          font-weight: 900;
          color: #ef4444;
          font-size: 0.95rem;
        }

        .empty-cell {
          text-align: center;
          padding: 30px;
          color: #475569;
        }

        /* Match Stats Cards */
        .matches-stats-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .match-stat-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 16px;
        }

        .match-stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .teams-info-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .teams-info-row .team-name {
          font-weight: 800;
          color: white;
          font-size: 0.9rem;
        }

        .score-pill {
          background: rgba(0, 210, 255, 0.1);
          color: #00d2ff;
          padding: 4px 12px;
          border-radius: 8px;
          font-weight: 900;
          font-size: 0.95rem;
          border: 1px solid rgba(0, 210, 255, 0.2);
        }

        .vs-pill {
          background: rgba(255, 255, 255, 0.03);
          color: #475569;
          padding: 4px 10px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 0.7rem;
        }

        .odds-row {
          display: flex;
          gap: 8px;
        }

        .odd-badge {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .odd-badge.cap { background: rgba(0, 210, 255, 0.08); color: #00d2ff; }
        .odd-badge.ou { background: rgba(255, 210, 0, 0.08); color: #ffd200; }

        .match-choices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .user-choice-card {
          background: rgba(255, 255, 255, 0.015);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .user-info-choice {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-info-choice .name {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .choice-badge-locked {
          font-size: 0.65rem;
          font-weight: 800;
          color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.03);
          padding: 4px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .choice-badge-revealed {
          font-size: 0.7rem;
          font-weight: 700;
          color: white;
        }
        .choice-badge-revealed .label {
          color: #64748b;
        }
        .choice-badge-revealed .val {
          font-weight: 800;
          color: #e2e8f0;
        }

        .outcome-badge {
          font-size: 0.65rem;
          font-weight: 900;
          padding: 4px 8px;
          border-radius: 6px;
          text-align: center;
        }
        .outcome-badge.correct { background: rgba(52, 211, 153, 0.08); color: #34d399; }
        .outcome-badge.wrong { background: rgba(239, 68, 68, 0.08); color: #ef4444; }

        .no-preds-match {
          grid-column: 1 / -1;
          text-align: center;
          padding: 15px;
          color: #475569;
          font-size: 0.75rem;
        }

        .empty-state-stats {
          text-align: center;
          padding: 30px;
          color: #475569;
          background: rgba(255,255,255,0.01);
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .stats-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 20px;
          color: #94a3b8;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 210, 255, 0.1);
          border-radius: 50%;
          border-top-color: #00d2ff;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 15px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .daily-stats-container {
            padding-top: 80px;
            padding-bottom: 100px;
          }
          .stats-grid-dashboard {
            grid-template-columns: 1fr;
          }
          .stats-table th {
            padding: 8px 10px;
            font-size: 0.7rem;
          }
          .stats-table td {
            padding: 8px 10px;
            font-size: 0.8rem;
          }
          .fine-cell {
            font-size: 0.85rem;
          }
          .match-choices-grid {
            grid-template-columns: 1fr;
          }
        }

        /* PDF Export Button */
        .export-pdf-btn {
          background: linear-gradient(90deg, rgba(0, 210, 255, 0.1), rgba(58, 134, 255, 0.1));
          border: 1px solid rgba(0, 210, 255, 0.3);
          color: #00d2ff;
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 15px;
        }
        .export-pdf-btn:hover:not(:disabled) {
          background: var(--cyan-gradient);
          color: black;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(0, 210, 255, 0.2);
          transform: scale(1.02);
        }
        .export-pdf-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* PDF Styles */
        .pdf-header {
          display: none;
        }
        
        .pdf-content-wrapper.is-pdf-exporting {
          background: #06090f !important;
          padding: 20px !important;
        }
        
        .is-pdf-exporting .pdf-header {
          display: block;
          text-align: center;
          margin-bottom: 25px;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
          padding-bottom: 15px;
        }
      `}} />
    </div>
  );
};

export default DailyStatsView;
