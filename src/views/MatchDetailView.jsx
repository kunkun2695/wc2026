import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Calendar, MapPin, Users, Zap, Check, Send, Clock } from 'lucide-react';
import CommentSection from '../components/CommentSection';
import UserAvatar from '../components/UserAvatar';
import API_URL from '../config';
import { mockAuth } from '../data/mockAuth';

const FlagIcon = ({ flag }) => {
  const isUrl = flag?.startsWith('http') || flag?.includes('.');
  if (isUrl) {
    return <img src={flag} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
  }
  return <span>{flag}</span>;
};

const MatchDetailView = ({ matchId, onBack, matches, predictions, onSavePrediction, onRefreshMatches }) => {
  const match = matches.find(m => m.id === matchId);
  const userPrediction = predictions.find(p => p.match_id === matchId);
  
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allPredictions, setAllPredictions] = useState([]);
  const [loadingPreds, setLoadingPreds] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
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
    fetchUsers();
  }, []);

  // Helper to parse match time string to Vietnam Time (UTC+7) Date
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

  const matchTime = match ? parseMatchTimeToVnDate(match.match_time) : new Date(0);
  const isClosed = match ? (match.status !== 'UPCOMING' || new Date() >= matchTime) : true;
  const isMissed = (userPrediction && userPrediction.predicted_home_score === -1) ||
                   (!userPrediction && isClosed);
  const isKnockout = match ? (match.is_knockout || match.group_name === 'KO' || ['Vòng 1/8', 'Tứ kết', 'Bán kết', 'Chung kết'].includes(match.competition_name)) : false;

  const matchTimeStr = match ? match.match_time : '';
  let timePart = '---';
  let datePart = '---';
  if (matchTimeStr) {
    if (matchTimeStr.includes(' - ')) {
      const parts = matchTimeStr.split(' - ');
      datePart = parts[0] || '---';
      timePart = parts[1] || '---';
    } else {
      const parts = matchTimeStr.split(' ');
      timePart = parts[0] || '---';
      datePart = parts[1] || '---';
    }
  }

  useEffect(() => {
    if (userPrediction) {
      if (userPrediction.predicted_home_score === -1) setSelectedChoice('MISSED');
      else if (userPrediction.predicted_home_score > userPrediction.predicted_away_score) setSelectedChoice('1');
      else if (userPrediction.predicted_home_score < userPrediction.predicted_away_score) setSelectedChoice('2');
      else setSelectedChoice('X');
    }
  }, [userPrediction]);

  const [editHistory, setEditHistory] = useState([]);

  const fetchEditHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/predictions/history/${matchId}`, {
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEditHistory(data);
      }
    } catch (err) {
      console.error('Lỗi lấy lịch sử đổi kèo:', err);
    }
  };

  useEffect(() => {
    const fetchAllPreds = async () => {
      try {
        const res = await fetch(`${API_URL}/api/predictions/all`, {
          headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllPredictions(data.filter(p => p.match_id === matchId));
        }
      } catch (err) {
        console.error('Lỗi lấy dự đoán:', err);
      } finally {
        setLoadingPreds(false);
      }
    };
    fetchAllPreds();
    fetchEditHistory();
  }, [matchId, userPrediction]);

  if (!match) return <div className="p-10 text-center">Không tìm thấy trận đấu</div>;

  const t1 = { name: match.team1_name || 'Team 1', flag: match.team1_flag || '⚽', score: match.team1_score ?? 0 };
  const t2 = { name: match.team2_name || 'Team 2', flag: match.team2_flag || '⚽', score: match.team2_score ?? 0 };

  const getOutcomeLabel = (p) => {
    if (p.predicted_home_score === -1) return 'MISSED';
    if (p.predicted_home_score > p.predicted_away_score) return '1';
    if (p.predicted_home_score < p.predicted_away_score) return '2';
    return 'X';
  };

  const getHandicapLabel = (team) => {
    if (isKnockout) return '';
    if (!match.handicap_favorite || parseFloat(match.handicap_value) === 0) {
      return '';
    }
    const valText = match.handicap_text || match.handicap_value;
    if (match.handicap_favorite === team) {
      return `-${valText}`;
    } else {
      return `+${valText}`;
    }
  };

  const getHandicapHint = () => {
    if (!selectedChoice) return null;
    
    if (isKnockout) {
      if (selectedChoice === '1') return `Bạn đang chọn ${t1.name} đi tiếp vào vòng trong (Không có kèo chấp / hòa).`;
      if (selectedChoice === '2') return `Bạn đang chọn ${t2.name} đi tiếp vào vòng trong (Không có kèo chấp / hòa).`;
      return null;
    }

    const fav = match.handicap_favorite;
    const valText = match.handicap_text || match.handicap_value;
    
    if (!fav || parseFloat(match.handicap_value) === 0) {
      if (selectedChoice === '1') return `Bạn đang chọn ${t1.name} thắng (Kèo đồng banh / 0)`;
      if (selectedChoice === '2') return `Bạn đang chọn ${t2.name} thắng (Kèo đồng banh / 0)`;
      return `Bạn đang chọn cửa Hòa (Kèo đồng banh / 0)`;
    }

    const isFavT1 = fav === t1.name;
    const underdog = isFavT1 ? t2.name : t1.name;

    if (selectedChoice === '1') {
      if (isFavT1) {
        return `Bạn đang chọn Cửa trên: ${t1.name} chấp -${valText}`;
      } else {
        return `Bạn đang chọn Cửa dưới: ${t1.name} được chấp +${valText}`;
      }
    }
    if (selectedChoice === '2') {
      if (!isFavT1) {
        return `Bạn đang chọn Cửa trên: ${t2.name} chấp -${valText}`;
      } else {
        return `Bạn đang chọn Cửa dưới: ${t2.name} được chấp +${valText}`;
      }
    }
    if (selectedChoice === 'X') {
      return `Bạn đang chọn Hòa (Đồng nghĩa chọn Cửa dưới: ${underdog} được chấp +${valText})`;
    }
    return null;
  };

  const hasAlreadyVoted = userPrediction !== undefined && userPrediction.predicted_home_score !== -1;
  const currentPredictionChoice = userPrediction ? (
    userPrediction.predicted_home_score === -1 ? 'MISSED' :
    userPrediction.predicted_home_score > userPrediction.predicted_away_score ? '1' :
    userPrediction.predicted_home_score < userPrediction.predicted_away_score ? '2' : 'X'
  ) : null;
  const isSelectionChanged = selectedChoice !== currentPredictionChoice;

  const renderPredictionOutcome = () => {
    if (isMissed) {
      return (
        <div className="prediction-outcome-detail" style={{ 
          fontSize: '0.8rem', 
          fontWeight: 900, 
          marginTop: '20px', 
          textAlign: 'center', 
          padding: '10px 16px', 
          borderRadius: '14px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          color: '#ef4444'
        }}>
          BỎ LỠ DỰ ĐOÁN: ĐÓNG GÓP 30 BÁNH LƯƠNG KHÔ (Dự đoán sai)
        </div>
      );
    }
    if (!userPrediction || match.status !== 'FT') return null;
    const isCorrect = userPrediction.points === 10;
    return (
      <div className="prediction-outcome-detail" style={{ 
        fontSize: '0.8rem', 
        fontWeight: 900, 
        marginTop: '20px', 
        textAlign: 'center', 
        padding: '10px 16px', 
        borderRadius: '14px',
        background: isCorrect ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
        border: isCorrect ? '1px solid rgba(52, 211, 153, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
        color: isCorrect ? '#34d399' : '#ef4444'
      }}>
        DỰ ĐOÁN KÈO: {isCorrect ? 'ĐÚNG (Đóng góp 10 bánh)' : 'SAI (Đóng góp 30 bánh)'}
      </div>
    );
  };

  const handleVote = async () => {
    if (!selectedChoice || isSaving || isClosed || !isSelectionChanged) return;

    let label = '';
    if (selectedChoice === '1') label = t1.name + ' thắng';
    else if (selectedChoice === 'X') label = 'Hòa';
    else if (selectedChoice === '2') label = t2.name + ' thắng';

    const promptMsg = hasAlreadyVoted
      ? `Bạn đã chốt kèo trước đó. Bạn có chắc muốn THAY ĐỔI bình chọn sang: ${label}?`
      : `Bạn muốn bình chọn cửa: ${label}?`;

    const confirmSave = window.confirm(promptMsg);
    if (!confirmSave) return;

    setIsSaving(true);
    try {
      const [h, a] = selectedChoice === '1' ? [1, 0] : selectedChoice === '2' ? [0, 1] : [0, 0];
      const success = await onSavePrediction(match.id, h, a);
      if (!success) {
        // Khôi phục lựa chọn cũ (hoặc null nếu chưa có dự đoán trước đó)
        if (userPrediction) {
          if (userPrediction.predicted_home_score > userPrediction.predicted_away_score) setSelectedChoice('1');
          else if (userPrediction.predicted_home_score < userPrediction.predicted_away_score) setSelectedChoice('2');
          else setSelectedChoice('X');
        } else {
          setSelectedChoice(null);
        }
      } else {
        if (onRefreshMatches) {
          onRefreshMatches();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="match-detail-page">
      <header className="detail-header">
        <div className="detail-header-inner">
          <button onClick={onBack} className="back-btn"><ArrowLeft size={24} /></button>
          <h2 className="font-outfit font-bold text-lg">Chi tiết trận đấu</h2>
          <div style={{ width: 24 }}></div>
        </div>
      </header>

      <div className="detail-scroll-container">
        <div className="detail-content-inner">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="score-hero"
          >
            <div className="hero-team">
              <div className="hero-flag-container">
                <FlagIcon flag={t1.flag} />
              </div>
              <span className="hero-team-name">{t1.name}</span>
            </div>

            <div className="hero-score">
              <div className="score-main">
                {match.status === 'FT' || match.status === 'LIVE' ? (
                  <span>{t1.score} - {t2.score}</span>
                ) : (
                  <span>VS</span>
                )}
              </div>
              <div className={`match-status-badge ${match.status === 'LIVE' ? 'is-live' : ''}`}>
                {match.status === 'LIVE' && <span className="live-dot"></span>}
                {match.status}
              </div>
            </div>

            <div className="hero-team">
              <div className="hero-flag-container">
                <FlagIcon flag={t2.flag} />
              </div>
              <span className="hero-team-name">{t2.name}</span>
            </div>
          </motion.div>

          <div className="detail-sections-container">
            <div className="detail-grid-layout">
              <div className="detail-grid-left">
                {/* Voting Section */}
                <div className="voting-section card-box">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="section-title mb-0"><Trophy size={18} /> Bình chọn thắng thua</h3>
                    {userPrediction && <span className="voted-tag"><Check size={12} /> Đã chốt</span>}
                  </div>

                  {/* Handicap info */}
                  <div className="handicap-info-bar">
                    <div className="info-badge handicap" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="badge-label">Tỷ lệ kèo</span>
                      <span className="badge-value">
                        {isKnockout ? (
                          <strong style={{ color: '#ffd200' }}>🏆 VÒNG LOẠI TRỰC TIẾP (KHÔNG KÈO CHẤP)</strong>
                        ) : match.handicap_favorite && parseFloat(match.handicap_value) !== 0 ? (
                          match.handicap_favorite === t1.name 
                            ? `${t1.name} chấp ${t2.name} ${match.handicap_text || match.handicap_value} trái`
                            : `${t2.name} chấp ${t1.name} ${match.handicap_text || match.handicap_value} trái`
                        ) : (
                          'Đồng banh (Không chấp)'
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`voting-options ${isKnockout ? 'knockout' : ''}`}>
                    <button 
                      onClick={() => {
                        if (!isClosed) {
                          setSelectedChoice('1');
                        }
                      }}
                      className={`vote-opt ${selectedChoice === '1' ? 'active' : ''} ${isClosed ? 'readonly' : ''}`}
                    >
                      <div className="opt-flag"><FlagIcon flag={t1.flag} /></div>
                      <span className="opt-name">{t1.name}</span>
                      {getHandicapLabel(t1.name) && (
                        <span className="opt-handicap-label">({getHandicapLabel(t1.name)})</span>
                      )}
                    </button>
                    
                    {!isKnockout && (
                      <button 
                        onClick={() => {
                          if (!isClosed) {
                            setSelectedChoice('X');
                          }
                        }}
                        className={`vote-opt ${selectedChoice === 'X' ? 'active' : ''} ${isClosed ? 'readonly' : ''}`}
                      >
                        <div className="opt-flag draw">HÒA</div>
                        <span className="opt-name">Bất phân thắng bại</span>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => {
                        if (!isClosed) {
                          setSelectedChoice('2');
                        }
                      }}
                      className={`vote-opt ${selectedChoice === '2' ? 'active' : ''} ${isClosed ? 'readonly' : ''}`}
                    >
                      <div className="opt-flag"><FlagIcon flag={t2.flag} /></div>
                      <span className="opt-name">{t2.name}</span>
                      {getHandicapLabel(t2.name) && (
                        <span className="opt-handicap-label">({getHandicapLabel(t2.name)})</span>
                      )}
                    </button>
                  </div>

                  {getHandicapHint() && (
                    <div className="handicap-hint-label">
                      {getHandicapHint()}
                    </div>
                  )}

                  <button 
                    className={`confirm-vote-btn ${!selectedChoice || !isSelectionChanged || isClosed ? 'disabled' : ''}`}
                    disabled={!selectedChoice || !isSelectionChanged || isSaving || isClosed}
                    onClick={handleVote}
                  >
                    {isSaving 
                      ? 'Đang gửi...' 
                      : (isClosed 
                        ? 'Đã đóng dự đoán' 
                        : (!selectedChoice 
                          ? 'CHỌN CỬA BẤT KỲ' 
                          : (!isSelectionChanged 
                            ? 'LỰA CHỌN CỦA BẠN (Đã chốt)' 
                            : (hasAlreadyVoted ? 'THAY ĐỔI LỰA CHỌN' : 'CHỐT KÈO NGAY'))))}
                    {!isSaving && isSelectionChanged && !isClosed && <Send size={18} />}
                  </button>

                  {renderPredictionOutcome()}
                </div>

                {/* Info Grid */}
                <div className="info-grid">
                  <div className="info-item">
                    <Calendar size={18} className="text-cyan-400" />
                    <div className="info-text">
                      <span className="info-label">Ngày thi đấu</span>
                      <span className="info-value">{datePart}</span>
                    </div>
                  </div>
                  <div className="info-item">
                    <Clock size={18} className="text-purple-400" />
                    <div className="info-text">
                      <span className="info-label">Giờ bắt đầu</span>
                      <span className="info-value">{timePart}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-grid-right">
                {/* Stats Section */}
                <div className="stats-section card-box">
                  <h3 className="section-title"><Zap size={18} /> Tỉ lệ bình chọn</h3>
                  <div className="stats-bars">
                    <div className="stat-bar-item">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-300">{t1.name}</span>
                        <span className="text-sm font-black text-cyan-400">{Math.round((match.home_votes / (match.total_votes || 1)) * 100)}%</span>
                      </div>
                      <div className="bar-bg"><div className="bar-fill home" style={{ width: `${(match.home_votes / (match.total_votes || 1)) * 100}%` }}></div></div>
                    </div>
                    {!isKnockout && (
                      <div className="stat-bar-item">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-slate-300">Hòa</span>
                          <span className="text-sm font-black text-yellow-400">{Math.round((match.draw_votes / (match.total_votes || 1)) * 100)}%</span>
                        </div>
                        <div className="bar-bg"><div className="bar-fill draw" style={{ width: `${(match.draw_votes / (match.total_votes || 1)) * 100}%` }}></div></div>
                      </div>
                    )}
                    <div className="stat-bar-item">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-slate-300">{t2.name}</span>
                        <span className="text-sm font-black text-emerald-400">{Math.round((match.away_votes / (match.total_votes || 1)) * 100)}%</span>
                      </div>
                      <div className="bar-bg"><div className="bar-fill away" style={{ width: `${(match.away_votes / (match.total_votes || 1)) * 100}%` }}></div></div>
                    </div>
                  </div>
                </div>

                {/* Everyone's predictions section */}
                <div className="everyone-preds-section card-box">
                  {loadingPreds ? (
                    <div className="text-center p-4 text-slate-500 text-xs">Đang tải dự đoán...</div>
                  ) : (
                    (() => {
                      const displayPreds = users.map(u => {
                        const existingPred = allPredictions.find(p => p.user_id === u.id);
                        if (existingPred) return existingPred;
                        
                        if (isClosed) {
                          return {
                            prediction_id: `missed_${u.id}_${matchId}`,
                            user_id: u.id,
                            user_name: u.name,
                            user_avatar: u.avatar || '',
                            match_id: matchId,
                            predicted_home_score: -1,
                            predicted_away_score: -1,
                            points: 30,
                            is_hidden: false
                          };
                        }
                        return null;
                      }).filter(Boolean);

                      return (
                        <>
                          <h3 className="section-title">
                            <Users size={18} /> Dự đoán từ bạn bè ({displayPreds.length})
                          </h3>
                          {displayPreds.length > 0 ? (
                            <div className="everyone-preds-list">
                              {displayPreds.map(p => {
                                const isCorrect = p.points === 10;
                                const choice = getOutcomeLabel(p);
                                const teamSelected = choice === 'MISSED' 
                                  ? 'Bỏ lỡ dự đoán' 
                                  : (choice === '1' ? t1.name : (choice === '2' ? t2.name : 'Hòa'));

                                return (
                                  <div key={p.prediction_id} className="everyone-pred-item">
                                    <div className="user-info-mini">
                                      <UserAvatar src={p.user_avatar} size={28} style={{ borderRadius: '50%' }} />
                                      <span className="user-name-choice">{p.user_name}</span>
                                    </div>
                                    
                                    {p.is_hidden ? (
                                      <div className="choice-pill-locked">
                                        🔒 ĐÃ KHÓA (ẨN)
                                      </div>
                                    ) : (
                                      <div className="choice-pill-revealed">
                                        <span>Chọn: </span>
                                        <strong style={{ color: choice === 'MISSED' ? '#ef4444' : 'white' }}>{teamSelected}</strong>
                                      </div>
                                    )}

                                    {isClosed && !p.is_hidden && (
                                      <span className={`outcome-lbl ${isCorrect ? 'correct' : 'wrong'}`}>
                                        {choice === 'MISSED' ? 'BỎ LỠ' : (isCorrect ? 'ĐÚNG' : 'SAI')}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center p-4 text-slate-500 text-xs">Chưa có ai dự đoán trận đấu này.</div>
                          )}
                        </>
                      );
                    })()
                  )}
                </div>

                {/* Lịch sử sửa đổi bình chọn */}
                {editHistory.length > 0 && (
                  <div className="edit-history-section card-box">
                    <h3 className="section-title">
                      <Clock size={18} /> Lịch sử thay đổi bình chọn ({editHistory.length})
                    </h3>
                    <div className="everyone-preds-list">
                      {editHistory.map(h => {
                        const getChoiceText = (c) => {
                          if (c === '1') return t1.name;
                          if (c === '2') return t2.name;
                          if (c === 'X') return 'Hòa';
                          return 'Không rõ';
                        };
                        const dateLocal = new Date(h.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        const dayLocal = new Date(h.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                        return (
                          <div key={h.id} className="everyone-pred-item" style={{ padding: '10px 14px' }}>
                            <div className="user-info-mini">
                              <UserAvatar src={h.user_avatar} size={24} style={{ borderRadius: '50%' }} />
                              <span className="user-name-choice" style={{ fontWeight: 800 }}>{h.user_name}</span>
                            </div>
                            
                            <div className="choice-pill-revealed" style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                              Đã đổi: <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{getChoiceText(h.old_choice)}</span>
                              <span style={{ margin: '0 6px', color: '#00d2ff' }}>➡️</span>
                              <strong style={{ color: '#00d2ff', fontWeight: 900 }}>{getChoiceText(h.new_choice)}</strong>
                            </div>
                            
                            <span className="time-ago-log" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                              {dateLocal} {dayLocal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-comments-section card-box">
              <h3 className="section-title">Phòng Gáy</h3>
              <div className="detail-comment-wrapper">
                <CommentSection 
                  matchId={matchId} 
                  matchTitle={`${t1.name} vs ${t2.name}`} 
                  onCommentChange={onRefreshMatches}
                  isInline={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .match-detail-page {
          background: rgba(8, 12, 24, 0.85);
          backdrop-filter: blur(25px);
          height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 5000;
        }
        .detail-header {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(15px);
          flex-shrink: 0;
          padding-top: calc(15px + env(safe-area-inset-top, 0px));
          width: 100%;
        }
        .detail-header-inner {
          width: 100%;
          max-width: 1100px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          box-sizing: border-box;
        }
        .back-btn { background: none; border: none; color: white; cursor: pointer; }
        .detail-scroll-container {
          flex: 1;
          overflow-y: auto;
          padding-bottom: env(safe-area-inset-bottom, 20px);
          width: 100%;
        }
        .detail-content-inner {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px 24px;
          box-sizing: border-box;
        }
        .score-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 30px 20px;
          background: linear-gradient(180deg, rgba(58, 134, 255, 0.15) 0%, transparent 100%);
          margin-bottom: 24px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .hero-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          width: 30%;
        }
        .hero-flag-container {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
          padding: 10px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
        .hero-team-name { font-weight: 800; font-size: 0.85rem; text-align: center; color: white; }
        .hero-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 40%;
        }
        .score-main { font-size: 2.2rem; font-weight: 900; letter-spacing: -1px; color: white; }
        .match-status-badge {
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 5px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .match-status-badge.is-live { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .live-dot { width: 6px; height: 6px; background: #ef4444; border-radius: 50%; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }

        .detail-sections-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .detail-grid-layout {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 900px) {
          .detail-grid-layout {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 24px;
            align-items: start;
          }
          .detail-grid-left, .detail-grid-right {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
        }
        .card-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 20px; }
        
        /* Voting Styles */
        .voted-tag { background: rgba(0, 255, 100, 0.1); color: #00ff64; font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 10px; display: flex; align-items: center; gap: 4px; border: 1px solid rgba(0, 255, 100, 0.2); }
        .opt-handicap-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #00d2ff;
          margin-top: 2px;
        }
        .vote-opt.active .opt-handicap-label {
          color: inherit;
        }
        .vote-opt.readonly {
          cursor: default;
        }
        .vote-opt.readonly:hover {
          background: rgba(255,255,255,0.03);
        }
        .handicap-info-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .info-badge {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 8px 12px;
          border-radius: 12px;
          text-align: center;
        }
        .info-badge.handicap {
          border-color: rgba(0, 210, 255, 0.15);
        }
        .info-badge.ou {
          border-color: rgba(255, 210, 0, 0.15);
        }
        .badge-label {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .badge-value {
          font-size: 0.8rem;
          font-weight: 900;
        }
        .info-badge.handicap .badge-value {
          color: #00d2ff;
        }
        .info-badge.ou .badge-value {
          color: #ffd200;
        }
        .handicap-hint-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: #10b981;
          text-align: center;
          margin-bottom: 15px;
          padding: 8px 12px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 10px;
        }
        .voting-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .voting-options.knockout { grid-template-columns: repeat(2, 1fr); }
        .vote-opt { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 15px 10px; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: all 0.3s; }
        .vote-opt:hover { background: rgba(255,255,255,0.06); }
        .vote-opt.active { background: rgba(58, 134, 255, 0.1); border-color: #3a86ff; box-shadow: 0 0 20px rgba(58, 134, 255, 0.2); }
        .opt-flag { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: rgba(255,255,255,0.05); }
        .opt-flag.draw { font-size: 0.6rem; font-weight: 900; color: #94a3b8; }
        .vote-opt.active .opt-flag.draw { color: #3a86ff; }
        .opt-name { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-align: center; }
        .vote-opt.active .opt-name { color: white; }
        .confirm-vote-btn { width: 100%; padding: 16px; border-radius: 16px; border: none; background: linear-gradient(135deg, #00d2ff 0%, #3a8dff 100%); color: #020617; font-weight: 900; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 0.3s; }
        .confirm-vote-btn.disabled { background: rgba(255,255,255,0.05); color: #475569; cursor: not-allowed; }
        .confirm-vote-btn:not(.disabled):hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(58, 134, 255, 0.3); }

        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .info-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 20px; display: flex; align-items: center; gap: 12px; }
        .info-text { display: flex; flex-direction: column; }
        .info-label { font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
        .info-value { font-size: 0.8rem; font-weight: 800; color: white; }
        
        .stats-bars { display: flex; flex-direction: column; gap: 16px; }
        .bar-bg { height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 5px; transition: width 1s ease-out; }
        .bar-fill.home { background: linear-gradient(90deg, #00d2ff, #3a8dff); }
        .bar-fill.draw { background: linear-gradient(90deg, #ffd200, #f7971e); }
        .bar-fill.away { background: linear-gradient(90deg, #00ff64, #00ab4e); }
        
        .everyone-preds-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 5px;
        }
        .everyone-pred-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px 14px;
          border-radius: 12px;
        }
        .user-name-choice {
          font-size: 0.8rem;
          font-weight: 700;
          color: white;
        }
        .choice-pill-locked {
          font-size: 0.65rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.03);
          padding: 4px 10px;
          border-radius: 8px;
        }
        .choice-pill-revealed {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        .choice-pill-revealed strong {
          color: white;
          font-weight: 800;
        }
        .outcome-lbl {
          font-size: 0.65rem;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .outcome-lbl.correct {
          background: rgba(52, 211, 153, 0.1);
          color: #34d399;
        }
        .outcome-lbl.wrong {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .detail-comment-wrapper {
          height: 400px;
          margin-top: 10px;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(0,0,0,0.2);
        }
      ` }} />
    </div>
  );
};

export default MatchDetailView;
