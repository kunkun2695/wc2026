import React, { useState } from 'react';
import { Shield, X, RefreshCw, Megaphone, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MatchCard from '../components/MatchCard';

const API_URL = import.meta.env.VITE_API_URL;

const MatchEditorModal = ({ match, onClose, onSave }) => {
  const [s1, setS1] = useState(match.team1_score || 0);
  const [s2, setS2] = useState(match.team2_score || 0);
  const [status, setStatus] = useState(match.status || 'UPCOMING');
  const [time, setTime] = useState(match.match_time || '');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#1a1f2e', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>CẬP NHẬT TỈ SỐ</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{match.team1_flag}</div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>{match.team1_name}</div>
            <input type="number" value={s1} onChange={e => setS1(parseInt(e.target.value))} style={{ width: '60px', padding: '10px', textAlign: 'center', borderRadius: '8px', border: 'none', background: '#000', color: 'white', fontWeight: 900 }} />
          </div>
          <div style={{ fontWeight: 900, color: '#444' }}>VS</div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{match.team2_flag}</div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>{match.team2_name}</div>
            <input type="number" value={s2} onChange={e => setS2(parseInt(e.target.value))} style={{ width: '60px', padding: '10px', textAlign: 'center', borderRadius: '8px', border: 'none', background: '#000', color: 'white', fontWeight: 900 }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#555', display: 'block', marginBottom: '5px' }}>TRẠNG THÁI</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#000', color: 'white', border: 'none' }}>
              <option value="UPCOMING">Sắp diễn ra</option>
              <option value="LIVE">Trực tiếp</option>
              <option value="FINISHED">Kết thúc</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#555', display: 'block', marginBottom: '5px' }}>THỜI GIAN</label>
            <input type="text" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#000', color: 'white', border: 'none' }} />
          </div>
        </div>

        <button 
          onClick={() => onSave(match.id, { team1_score: s1, team2_score: s2, status, match_time: time })}
          style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#00d2ff', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer' }}
        >
          LƯU KẾT QUẢ
        </button>
      </div>
    </div>
  );
};

const AdminView = ({ matches, onUpdateScore, onSync }) => {
  const [editingMatch, setEditingMatch] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');

  const handleBroadcast = async () => {
    if (!notifTitle || !notifBody) return;
    setNotifLoading(true);
    setNotifMsg('');
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${API_URL}/api/notifications/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: notifTitle, body: notifBody })
      });
      const data = await res.json();
      if (res.ok) {
        setNotifMsg('✅ ' + data.message);
        setNotifTitle('');
        setNotifBody('');
      } else {
        setNotifMsg('❌ ' + data.error);
      }
    } catch (err) {
      setNotifMsg('❌ Lỗi kết nối');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await onSync();
    setIsSyncing(false);
  };

  const stats = {
    total: matches.length,
    live: matches.filter(m => m.status === 'LIVE').length,
    finished: matches.filter(m => m.status === 'FINISHED' || m.status === 'FT').length,
    upcoming: matches.filter(m => m.status === 'UPCOMING').length
  };

  return (
    <div style={{ padding: '100px 20px 20px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d2ff', marginBottom: '10px' }}>
              <Shield size={16} />
              <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>HỆ THỐNG QUẢN TRỊ</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>TRẬN ĐẤU</h1>
          </div>
          <button 
            onClick={handleSync} 
            disabled={isSyncing}
            style={{ padding: '10px 20px', borderRadius: '10px', background: 'rgba(0,210,255,0.1)', color: '#00d2ff', border: '1px solid #00d2ff', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ API'}
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '40px' }}>
          <div style={{ background: '#1a1f2e', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #00d2ff' }}>
            <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900 }}>TỔNG TRẬN</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{stats.total}</div>
          </div>
          <div style={{ background: '#1a1f2e', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #00ff64' }}>
            <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900 }}>TRỰC TIẾP</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#00ff64' }}>{stats.live}</div>
          </div>
          <div style={{ background: '#1a1f2e', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #ffd200' }}>
            <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900 }}>ĐÃ XONG</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffd200' }}>{stats.finished}</div>
          </div>
          <div style={{ background: '#1a1f2e', padding: '20px', borderRadius: '16px', borderLeft: '4px solid #444' }}>
            <div style={{ fontSize: '0.6rem', color: '#555', fontWeight: 900 }}>SẮP TỚI</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#444' }}>{stats.upcoming}</div>
          </div>
        </div>

        <section style={{ background: '#1a1f2e', padding: '30px', borderRadius: '24px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Megaphone size={20} color="#00d2ff" />
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>GỬI THÔNG BÁO TOÀN QUỐC</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              placeholder="Tiêu đề thông báo..." 
              value={notifTitle}
              onChange={e => setNotifTitle(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #222', color: 'white' }}
            />
            <textarea 
              placeholder="Nội dung chi tiết..." 
              value={notifBody}
              onChange={e => setNotifBody(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #222', color: 'white', minHeight: '100px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#444' }}>* Gửi đến tất cả mọi người qua App & Push.</span>
              <button 
                onClick={handleBroadcast}
                disabled={notifLoading || !notifTitle || !notifBody}
                style={{ padding: '12px 30px', borderRadius: '12px', background: '#00d2ff', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {notifLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                GỬI NGAY
              </button>
            </div>
            {notifMsg && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: notifMsg.includes('✅') ? '#00ff64' : '#ff4d4d' }}>{notifMsg}</div>}
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {matches.map(m => (
            <MatchCard key={m.id} match={m} isAdmin={true} onEdit={setEditingMatch} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {editingMatch && (
          <MatchEditorModal match={editingMatch} onClose={() => setEditingMatch(null)} onSave={(id, data) => { onUpdateScore(id, data); setEditingMatch(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminView;
