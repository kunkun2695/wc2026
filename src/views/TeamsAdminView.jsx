import React, { useState } from 'react';
import { Plus, Trash2, Edit3, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockAuth } from '../data/mockAuth';
import API_URL from '../config';

const TeamsAdminView = ({ teams, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', flag: '🏳️', group_name: 'A' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const host = window.location.hostname;
    const method = editingTeam ? 'PUT' : 'POST';
    const url = editingTeam ? `${API_URL}/api/teams/${editingTeam.id}` : `${API_URL}/api/teams`;
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockAuth.getToken()}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      onRefresh();
      setIsModalOpen(false);
      setEditingTeam(null);
      setFormData({ name: '', flag: '🏳️', group_name: 'A' });
    }
  };

  const deleteTeam = async (id) => {
    if (window.confirm('Xóa đội bóng này?')) {
      const host = window.location.hostname;
      await fetch(`${API_URL}/api/teams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      onRefresh();
    }
  };

  return (
    <div className="p-6 pt-28 pb-32">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black text-accent-green uppercase tracking-[0.3em] mb-2 block">Hệ thống quản trị</span>
          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none italic">QUẢN LÝ<br/><span className="text-white/40">ĐỘI BÓNG</span></h1>
        </div>
        <button 
          onClick={() => { setEditingTeam(null); setFormData({ name: '', flag: '🏳️', group_name: 'A' }); setIsModalOpen(true); }}
          className="btn-primary !py-3 !px-6 flex items-center gap-2 rounded-xl"
        >
          THÊM ĐỘI <Plus size={18} />
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-32">
        {teams.map(t => (
          <div key={t.id} className="glass-card group relative !p-6 flex flex-col items-center gap-3 border border-white/5 hover:border-accent-green/30 transition-all">
            <div className="text-4xl filter drop-shadow-lg group-hover:scale-110 transition-transform">{t.flag}</div>
            <div className="text-center">
              <p className="font-black text-xs uppercase tracking-tighter">{t.name}</p>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Bảng {t.group_name}</p>
            </div>
            
            <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => { setEditingTeam(t); setFormData({ name: t.name, flag: t.flag, group_name: t.group_name }); setIsModalOpen(true); }}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
              >
                <Edit3 size={14} />
              </button>
              <button 
                onClick={() => deleteTeam(t.id)}
                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal-container">
          <div className="sidebar-overlay" onClick={() => setIsModalOpen(false)} style={{ zIndex: 3000 }} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="admin-modal-modern" style={{ zIndex: 3001 }}>
             <div className="modal-header-premium">
              <h2 className="text-xl font-black uppercase">{editingTeam ? 'Sửa đội bóng' : 'Thêm đội bóng mới'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="close-btn-modern"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/40 uppercase">Tên đội tuyển</label>
                <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase">Quốc kỳ (Emoji)</label>
                  <input type="text" className="input-field text-center text-2xl" value={formData.flag} onChange={e => setFormData({...formData, flag: e.target.value})} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-white/40 uppercase">Bảng đấu</label>
                  <select className="input-field bg-black/20" value={formData.group_name} onChange={e => setFormData({...formData, group_name: e.target.value})}>
                    {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => <option key={g} value={g}>Bảng {g}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-4 rounded-xl font-black uppercase tracking-widest mt-4">
                {editingTeam ? 'Cập nhật' : 'Thêm ngay'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TeamsAdminView;
