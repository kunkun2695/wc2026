import React, { useState } from 'react';
import { Shield, X, RefreshCw, Megaphone, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MatchCard from '../components/MatchCard';

const API_URL = import.meta.env.VITE_API_URL;

const AnnouncementComposer = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleBroadcast = async () => {
    if (!title || !body) return;
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${API_URL}/api/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, body })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage('✅ ' + data.message);
        setTitle('');
        setBody('');
      } else {
        setMessage('❌ ' + data.error);
      }
    } catch (err) {
      setMessage('❌ Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card !p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-white/40 uppercase">Tiêu đề thông báo</label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Ví dụ: CẬP NHẬT TỈ SỐ MỚI" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-white/40 uppercase">Nội dung chi tiết</label>
          <textarea 
            className="input-field min-h-[100px] py-3" 
            placeholder="Nhập nội dung bạn muốn gửi đến tất cả thành viên..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-white/40 italic">
            * Thông báo này sẽ được gửi tới toàn bộ thành viên qua Notification và Push.
          </span>
          <button 
            onClick={handleBroadcast}
            disabled={loading || !title || !body}
            className="flex items-center gap-2 bg-accent-blue text-black px-6 py-3 rounded-xl font-black uppercase text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Megaphone size={14} />}
            {loading ? 'Đang gửi...' : 'Gửi ngay'}
          </button>
        </div>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-xs font-bold"
          >
            {message}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const MatchEditorModal = ({ match, onClose, onSave }) => {
  const [s1, setS1] = useState(match.team1_score);
  const [s2, setS2] = useState(match.team2_score);
  const [status, setStatus] = useState(match.status);
  const [time, setTime] = useState(match.match_time);

  return (
    <div className="modal-container">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="sidebar-overlay" style={{ zIndex: 2900 }} />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="admin-modal-modern">
        <div className="modal-header-premium">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black uppercase tracking-tighter">Cập nhật tỉ số</h2>
          </div>
          <button onClick={onClose} className="close-btn-modern"><X size={20} /></button>
        </div>

        <div className="modal-body-premium">
          <div className="match-editor-grid">
            <div className="editor-team-side">
              <div className="editor-flag">{match.team1_flag}</div>
              <span className="editor-team-name">{match.team1_name}</span>
              <input type="number" className="premium-score-input" value={s1} onChange={(e) => setS1(parseInt(e.target.value))} />
            </div>
            <div className="editor-divider">
              <div className="divider-line" />
              <span className="text-[10px] font-black text-white/20">VS</span>
              <div className="divider-line" />
            </div>
            <div className="editor-team-side">
              <div className="editor-flag">{match.team2_flag}</div>
              <span className="editor-team-name">{match.team2_name}</span>
              <input type="number" className="premium-score-input" value={s2} onChange={(e) => setS2(parseInt(e.target.value))} />
            </div>
          </div>

          <div className="editor-controls-grid mt-8">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-white/40 uppercase">Trạng thái</label>
              <select className="input-field bg-black/20" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="UPCOMING">Sắp diễn ra</option>
                <option value="LIVE">Trực tiếp</option>
                <option value="FINISHED">Kết thúc</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-white/40 uppercase">Thời gian / Phút</label>
              <input type="text" className="input-field" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <button onClick={() => onSave(match.id, { team1_score: s1, team2_score: s2, status, match_time: time })} className="btn-primary w-full mt-8 py-4 rounded-xl font-black uppercase tracking-widest">
            Lưu kết quả
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AdminView = ({ matches, onUpdateScore, onSync }) => {
  const [editingMatch, setEditingMatch] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    setIsSyncing(true);
    await onSync();
    setIsSyncing(false);
  };
  
  const stats = {
    total: matches.length,
    live: matches.filter(m => m.status === 'LIVE').length,
    finished: matches.filter(m => m.status === 'FINISHED').length,
    upcoming: matches.filter(m => m.status === 'UPCOMING').length
  };

  const handleSave = (id, data) => {
    onUpdateScore(id, data);
    setEditingMatch(null);
  };

  return (
    <div className="p-6 pt-28">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-accent-blue" size={20} />
          <span className="text-[10px] font-black text-accent-blue uppercase tracking-[0.3em]">Hệ thống quản trị</span>
        </div>
        <div className="flex justify-between items-end">
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">QUẢN TRỊ<br/><span className="text-white/40">TRẬN ĐẤU</span></h1>
          <button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="flex items-center gap-2 bg-accent-blue/20 hover:bg-accent-blue/40 text-accent-blue px-4 py-2 rounded-lg border border-accent-blue/30 transition-all font-bold text-xs"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ API'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="glass-card !p-4 border-l-4 border-l-accent-blue">
          <p className="text-[10px] font-black text-white/40 uppercase mb-1">Tổng trận</p>
          <p className="text-2xl font-black">{stats.total}</p>
        </div>
        <div className="glass-card !p-4 border-l-4 border-l-accent-green">
          <p className="text-[10px] font-black text-white/40 uppercase mb-1">Trực tiếp</p>
          <p className="text-2xl font-black text-accent-green">{stats.live}</p>
        </div>
        <div className="glass-card !p-4 border-l-4 border-l-accent-gold">
          <p className="text-[10px] font-black text-white/40 uppercase mb-1">Đã xong</p>
          <p className="text-2xl font-black text-accent-gold">{stats.finished}</p>
        </div>
        <div className="glass-card !p-4 border-l-4 border-l-white/20">
          <p className="text-[10px] font-black text-white/40 uppercase mb-1">Sắp tới</p>
          <p className="text-2xl font-black text-white/40">{stats.upcoming}</p>
        </div>
      </div>
      
      {/* Broadcast Notification Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-accent-blue" size={20} />
          <span className="text-[10px] font-black text-accent-blue uppercase tracking-[0.3em]">Gửi thông báo toàn quốc</span>
        </div>
        <AnnouncementComposer />
      </div>

      <div className="match-list-container">
        {matches.map(m => (
          <MatchCard 
            key={m.id} 
            match={m} 
            isAdmin={true} 
            onEdit={setEditingMatch} 
          />
        ))}
      </div>

      <AnimatePresence>
        {editingMatch && (
          <MatchEditorModal 
            match={editingMatch} 
            onClose={() => setEditingMatch(null)} 
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminView;
