import React, { useState } from 'react';
import { RefreshCw, X, Edit3, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MatchCard from '../components/MatchCard';

const FlagDisplay = ({ flag }) => {
  const isUrl = flag?.startsWith('http') || flag?.includes('.');
  if (isUrl) {
    return <img src={flag} alt="flag" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
  }
  return <span style={{ fontSize: '2.5rem' }}>{flag || '⚽'}</span>;
};

const MatchEditorModal = ({ match, onClose, onSave }) => {
  const [s1, setS1] = useState(match.team1_score || 0);
  const [s2, setS2] = useState(match.team2_score || 0);
  const [status, setStatus] = useState(match.status || 'UPCOMING');
  const [time, setTime] = useState(match.match_time || '');
  const [ouTxt, setOuTxt] = useState(match.ou_text || '');
  const [isKnockout, setIsKnockout] = useState(match.is_knockout || false);
  const [penalties1, setPenalties1] = useState(match.penalties_team1 || 0);
  const [penalties2, setPenalties2] = useState(match.penalties_team2 || 0);

  const isFavT1 = match.handicap_favorite === match.team1_name;
  const isFavT2 = match.handicap_favorite === match.team2_name;
  const [hVal1, setHVal1] = useState(isFavT1 ? (match.handicap_text || match.handicap_value || '') : '');
  const [hVal2, setHVal2] = useState(isFavT2 ? (match.handicap_text || match.handicap_value || '') : '');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#1a1f2e', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>CẬP NHẬT TRẬN ĐẤU & KÈO</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
            <div style={{ width: '60px', height: '40px', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <FlagDisplay flag={match.team1_flag} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '10px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.team1_name}</div>
            <input type="number" value={s1} onChange={e => setS1(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '12px', textAlign: 'center', borderRadius: '12px', border: 'none', background: '#000', color: '#00d2ff', fontWeight: 900, fontSize: '1.2rem' }} />
          </div>
          
          <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.1)', fontSize: '0.8rem' }}>VS</div>
          
          <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
            <div style={{ width: '60px', height: '40px', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <FlagDisplay flag={match.team2_flag} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '10px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.team2_name}</div>
            <input type="number" value={s2} onChange={e => setS2(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '12px', textAlign: 'center', borderRadius: '12px', border: 'none', background: '#000', color: '#00d2ff', fontWeight: 900, fontSize: '1.2rem' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>TRẠNG THÁI</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#000', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 700 }}>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="LIVE">Trực tiếp</option>
              <option value="FT">Kết thúc (FT)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>THỜI GIAN</label>
            <input type="text" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#000', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 700 }} />
          </div>
        </div>

        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox" 
            id="isKnockout" 
            checked={isKnockout} 
            onChange={e => setIsKnockout(e.target.checked)} 
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="isKnockout" style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Vòng loại trực tiếp (Knockout)
          </label>
        </div>

        {isKnockout && status === 'FT' && s1 === s2 && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>TỶ SỐ LUÂN LƯU (PENALTIES)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 700 }}>Pen {match.team1_name}:</label>
                <input 
                  type="number" 
                  value={penalties1} 
                  onChange={e => setPenalties1(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '12px', textAlign: 'center', borderRadius: '12px', border: 'none', background: '#000', color: '#ffd200', fontWeight: 900, fontSize: '1rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 700 }}>Pen {match.team2_name}:</label>
                <input 
                  type="number" 
                  value={penalties2} 
                  onChange={e => setPenalties2(parseInt(e.target.value) || 0)} 
                  style={{ width: '100%', padding: '12px', textAlign: 'center', borderRadius: '12px', border: 'none', background: '#000', color: '#ffd200', fontWeight: 900, fontSize: '1rem' }} 
                />
              </div>
            </div>
          </div>
        )}

        {isKnockout ? (
          <div style={{ marginBottom: '25px', padding: '12px', background: 'rgba(255, 210, 0, 0.05)', border: '1px solid rgba(255, 210, 0, 0.15)', borderRadius: '12px', color: '#ffd200', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>
            🏆 TRẬN ĐẤU LOẠI TRỰC TIẾP: KHÔNG SỬ DỤNG KÈO CHẤP
          </div>
        ) : (
          <div style={{ marginBottom: '25px' }}>
            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>KÈO CHẤP</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.65rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{match.team1_name} chấp:</label>
                <input 
                  type="text" 
                  value={hVal1} 
                  placeholder="0"
                  onChange={e => {
                    const val = e.target.value;
                    setHVal1(val);
                    if (val.trim() !== '') setHVal2('');
                  }} 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#000', color: '#00d2ff', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 900, fontSize: '0.95rem' }} 
                />
              </div>
              
              <div>
                <label style={{ fontSize: '0.65rem', color: '#888', display: 'block', marginBottom: '6px', fontWeight: 700 }}>{match.team2_name} chấp:</label>
                <input 
                  type="text" 
                  value={hVal2} 
                  placeholder="0"
                  onChange={e => {
                    const val = e.target.value;
                    setHVal2(val);
                    if (val.trim() !== '') setHVal1('');
                  }} 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#000', color: '#00d2ff', border: '1px solid rgba(255,255,255,0.05)', fontWeight: 900, fontSize: '0.95rem' }} 
                />
              </div>
            </div>
            <span style={{ display: 'block', fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', marginTop: '8px', textAlign: 'center' }}>
              * Nhập số quả chấp vào ô của đội chấp (để trống cả 2 nghĩa là đồng banh).
            </span>
          </div>
        )}

        <button 
          onClick={() => {
            let finalFav = '';
            let finalTxt = '';
            
            if (hVal1 && String(hVal1).trim() !== '' && String(hVal1).trim() !== '0') {
              finalFav = match.team1_name;
              finalTxt = String(hVal1).trim();
            } else if (hVal2 && String(hVal2).trim() !== '' && String(hVal2).trim() !== '0') {
              finalFav = match.team2_name;
              finalTxt = String(hVal2).trim();
            }
            
            onSave(match.id, { 
              team1_score: s1, 
              team2_score: s2, 
              status, 
              match_time: time,
              handicap_favorite: isKnockout ? '' : finalFav,
              handicap_text: isKnockout ? '' : finalTxt,
              ou_text: isKnockout ? '' : ouTxt,
              penalties_team1: isKnockout && s1 === s2 ? (parseInt(penalties1) || 0) : null,
              penalties_team2: isKnockout && s1 === s2 ? (parseInt(penalties2) || 0) : null,
              is_knockout: isKnockout
            });
          }}
          style={{ width: '100%', padding: '18px', borderRadius: '16px', background: '#00d2ff', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '0.9rem', letterSpacing: '1px', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(0,210,255,0.3)' }}
        >
          LƯU KẾT QUẢ
        </button>
      </div>
    </div>
  );
};

const MatchManagementView = ({ matches, predictions = [], onSavePrediction, onRefreshMatches, onOpenComments, onUpdateScore, onSync, onDeleteMatch }) => {
  const [editingMatch, setEditingMatch] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingOdds, setIsSyncingOdds] = useState(false);
  const [filter, setFilter] = useState('all'); // all, live, upcoming, ft
  const [hidePlayed, setHidePlayed] = useState(false);
  const [isQuickEdit, setIsQuickEdit] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await onSync();
    setIsSyncing(false);
  };

  const handleSyncOdds = async () => {
    setIsSyncingOdds(true);
    try {
      const finalApiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/admin/matches/sync-odds`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message || 'Đồng bộ tỷ lệ kèo thành công!');
      window.location.reload();
    } catch (err) {
      alert('Lỗi đồng bộ tỷ lệ kèo!');
    } finally {
      setIsSyncingOdds(false);
    }
  };

  const parseMatchTime = (timeStr) => {
    if (!timeStr) return new Date(0);
    try {
      if (timeStr.includes('/')) {
        const [datePart, timePart] = timeStr.split(' - ');
        const [day, month] = datePart.split('/');
        const [hour, min] = timePart.split(':');
        return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
      }
      if (timeStr.includes('.')) {
        const [datePart, timePart] = timeStr.split(' - ');
        const [day, month] = datePart.split('.');
        const [hour, min] = timePart.split(':');
        return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
      }
      const parts = timeStr.split(/[\s-]/);
      const [time, day, month] = parts.filter(Boolean);
      const [hour, min] = time.split(':');
      return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    } catch (e) {
      return new Date(0);
    }
  };

  const sortedMatches = matches.filter(m => {
    if (hidePlayed && (m.status === 'FT' || m.status === 'FINISHED')) return false;
    if (filter === 'all') return true;
    if (filter === 'live') return m.status === 'LIVE';
    if (filter === 'upcoming') return m.status === 'UPCOMING';
    if (filter === 'ft') return m.status === 'FT' || m.status === 'FINISHED';
    return true;
  }).sort((a, b) => {
    const timeA = parseMatchTime(a.match_time);
    const timeB = parseMatchTime(b.match_time);
    return timeA - timeB;
  });

  const groupedMatches = [];
  sortedMatches.forEach(m => {
    const getMatchDate = (timeStr) => {
      if (!timeStr) return 'CHƯA XÁC ĐỊNH';
      return timeStr.includes(' - ') ? timeStr.split(' - ')[0] : (timeStr.split(' ')[1] || timeStr);
    };
    const matchDate = getMatchDate(m.match_time);
    let group = groupedMatches.find(g => g.date === matchDate);
    if (!group) {
      group = { date: matchDate, matches: [] };
      groupedMatches.push(group);
    }
    group.matches.push(m);
  });

  return (
    <div className="match-management-container">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d2ff', marginBottom: '10px' }}>
              <Calendar size={16} />
              <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>QUẢN TRỊ VIÊN</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>QUẢN LÝ TRẬN ĐẤU</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setIsQuickEdit(!isQuickEdit)} 
              style={{ 
                padding: '12px 24px', 
                borderRadius: '12px', 
                background: isQuickEdit ? '#f59e0b' : 'rgba(255,255,255,0.05)', 
                color: isQuickEdit ? 'black' : 'white', 
                border: isQuickEdit ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                cursor: 'pointer', 
                fontWeight: 800, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                transition: 'all 0.2s',
                boxShadow: isQuickEdit ? '0 4px 15px rgba(245,158,11,0.3)' : 'none'
              }}
            >
              <span>{isQuickEdit ? '✍️ ĐANG BẬT SỬA NHANH' : '✍️ BẬT SỬA NHANH KÈO'}</span>
            </button>
            <button 
              onClick={handleSyncOdds} 
              disabled={isSyncingOdds}
              style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(0,210,255,0.1)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.3)', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <RefreshCw size={18} className={isSyncingOdds ? 'animate-spin' : ''} />
              {isSyncingOdds ? 'ĐANG ĐỒNG BỘ KÈO...' : 'ĐỒNG BỘ TỶ LỆ KÈO'}
            </button>
            <button 
              onClick={handleSync} 
              disabled={isSyncing}
              style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ API'}
            </button>
          </div>
        </header>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
            <button onClick={() => setFilter('all')} style={{ padding: '8px 20px', borderRadius: '30px', border: 'none', background: filter === 'all' ? '#00d2ff' : 'rgba(255,255,255,0.05)', color: filter === 'all' ? 'black' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>TẤT CẢ ({matches.length})</button>
            <button onClick={() => setFilter('live')} style={{ padding: '8px 20px', borderRadius: '30px', border: 'none', background: filter === 'live' ? '#ef4444' : 'rgba(255,255,255,0.05)', color: filter === 'live' ? 'white' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>TRỰC TIẾP ({matches.filter(m => m.status === 'LIVE').length})</button>
            <button onClick={() => setFilter('upcoming')} style={{ padding: '8px 20px', borderRadius: '30px', border: 'none', background: filter === 'upcoming' ? '#00d2ff' : 'rgba(255,255,255,0.05)', color: filter === 'upcoming' ? 'black' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>SẮP TỚI ({matches.filter(m => m.status === 'UPCOMING').length})</button>
            <button onClick={() => setFilter('ft')} style={{ padding: '8px 20px', borderRadius: '30px', border: 'none', background: filter === 'ft' ? '#ffd200' : 'rgba(255,255,255,0.05)', color: filter === 'ft' ? 'black' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>KẾT THÚC ({matches.filter(m => m.status === 'FT' || m.status === 'FINISHED').length})</button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <input 
              type="checkbox" 
              id="hidePlayed"
              checked={hidePlayed} 
              onChange={(e) => setHidePlayed(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#00d2ff', cursor: 'pointer' }}
            />
            <label htmlFor="hidePlayed" style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', userSelect: 'none' }}>
              ẨN TRẬN ĐÃ ĐÁ
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {groupedMatches.length > 0 ? (
            groupedMatches.map(group => (
              <div key={group.date} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '10px 0 20px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.05)', padding: '6px 16px', borderRadius: '30px', color: '#94a3b8', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '1.5px', border: '1px solid rgba(255, 255, 255, 0.05)', whiteSpace: 'nowrap' }}>
                    <Calendar size={14} />
                    <span>NGÀY {group.date}</span>
                  </div>
                  <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {group.matches.map(m => {
                    const userPrediction = predictions.find(p => p.match_id === m.id);
                    return (
                      <MatchCard 
                        key={m.id} 
                        match={m} 
                        isAdmin={true} 
                        onEdit={setEditingMatch} 
                        onDelete={onDeleteMatch}
                        userPrediction={userPrediction}
                        onSavePrediction={onSavePrediction}
                        onRefreshMatches={onRefreshMatches}
                        onOpenComments={onOpenComments}
                        isQuickEdit={isQuickEdit}
                        onUpdateScore={onUpdateScore}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#475569', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p>Không tìm thấy trận đấu nào phù hợp.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingMatch && (
          <MatchEditorModal 
            match={editingMatch} 
            onClose={() => setEditingMatch(null)} 
            onSave={(id, data) => { 
              onUpdateScore(id, data); 
              setEditingMatch(null); 
            }} 
          />
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .match-management-container {
          padding: 100px 20px 150px;
        }
        @media (max-width: 768px) {
          .match-management-container {
            padding: 80px 0px 100px;
          }
        }
      ` }} />
    </div>
  );
};

export default MatchManagementView;
