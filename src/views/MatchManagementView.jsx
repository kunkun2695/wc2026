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

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: absolute, inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#1a1f2e', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>CẬP NHẬT TỈ SỐ</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
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

        <button 
          onClick={() => onSave(match.id, { team1_score: s1, team2_score: s2, status, match_time: time })}
          style={{ width: '100%', padding: '18px', borderRadius: '16px', background: '#00d2ff', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '0.9rem', letterSpacing: '1px', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(0,210,255,0.3)' }}
        >
          LƯU KẾT QUẢ
        </button>
      </div>
    </div>
  );
};

const MatchManagementView = ({ matches, onUpdateScore, onSync }) => {
  const [editingMatch, setEditingMatch] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, live, upcoming, ft

  const handleSync = async () => {
    setIsSyncing(true);
    await onSync();
    setIsSyncing(false);
  };

  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'live') return m.status === 'LIVE';
    if (filter === 'upcoming') return m.status === 'UPCOMING';
    if (filter === 'ft') return m.status === 'FT' || m.status === 'FINISHED';
    return true;
  });

  return (
    <div style={{ padding: '100px 20px 150px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d2ff', marginBottom: '10px' }}>
              <Calendar size={16} />
              <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>QUẢN TRỊ VIÊN</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>QUẢN LÝ TRẬN ĐẤU</h1>
          </div>
          <button 
            onClick={handleSync} 
            disabled={isSyncing}
            style={{ padding: '12px 24px', borderRadius: '12px', background: 'rgba(0,210,255,0.1)', color: '#00d2ff', border: '1px solid rgba(0,210,255,0.3)', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ API'}
          </button>
        </header>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
          <button onClick={() => setFilter('all')} style={{ padding: '8px 20px', borderRadius: '30px', border: 'none', background: filter === 'all' ? '#00d2ff' : 'rgba(255,255,255,0.05)', color: filter === 'all' ? 'black' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>TẤT CẢ ({matches.length})</button>
          <button onClick={() => setFilter('live')} style={{ padding: '8px 20px', borderRadius: '30px', border: 'none', background: filter === 'live' ? '#ef4444' : 'rgba(255,255,255,0.05)', color: filter === 'live' ? 'white' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>TRỰC TIẾP ({matches.filter(m => m.status === 'LIVE').length})</button>
          <button onClick={() => setFilter('upcoming')} style={{ padding: '8px 20px', borderRadius: '30px', border: 'none', background: filter === 'upcoming' ? '#00d2ff' : 'rgba(255,255,255,0.05)', color: filter === 'upcoming' ? 'black' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>SẮP TỚI ({matches.filter(m => m.status === 'UPCOMING').length})</button>
          <button onClick={() => setFilter('ft')} style={{ padding: '8px 20px', borderRadius: '30px', border: 'none', background: filter === 'ft' ? '#ffd200' : 'rgba(255,255,255,0.05)', color: filter === 'ft' ? 'black' : '#94a3b8', fontWeight: 800, cursor: 'pointer', transition: '0.2s', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>KẾT THÚC ({matches.filter(m => m.status === 'FT' || m.status === 'FINISHED').length})</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredMatches.length > 0 ? filteredMatches.map(m => (
            <MatchCard key={m.id} match={m} isAdmin={true} onEdit={setEditingMatch} />
          )) : (
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
    </div>
  );
};

export default MatchManagementView;
