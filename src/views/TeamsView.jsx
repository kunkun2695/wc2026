import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, Search, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

const TeamModal = ({ team, onClose, onSave }) => {
  const [name, setName] = useState(team?.name || '');
  const [group, setGroup] = useState(team?.group_name || 'A');
  const [flag, setFlag] = useState(team?.flag || '');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '450px', background: '#1a1f2e', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{team ? 'SỬA ĐỘI BÓNG' : 'THÊM ĐỘI BÓNG'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, display: 'block', marginBottom: '8px' }}>TÊN ĐỘI BÓNG</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Việt Nam" style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #222', color: 'white' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, display: 'block', marginBottom: '8px' }}>BẢNG ĐẤU</label>
              <select value={group} onChange={e => setGroup(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #222', color: 'white' }}>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(g => (
                  <option key={g} value={g}>Bảng {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: '#555', fontWeight: 900, display: 'block', marginBottom: '8px' }}>LÁ CỜ (URL/EMOJI)</label>
              <input type="text" value={flag} onChange={e => setFlag(e.target.value)} placeholder="URL hoặc 🇻🇳" style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #222', color: 'white' }} />
            </div>
          </div>

          <button 
            onClick={() => onSave({ name, group_name: group, flag })}
            style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#00d2ff', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', marginTop: '10px' }}
          >
            LƯU THÔNG TIN
          </button>
        </div>
      </div>
    </div>
  );
};

const TeamsView = ({ teams, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [editingTeam, setEditingTeam] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const filteredTeams = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = selectedGroup === 'ALL' || t.group_name === selectedGroup;
    return matchSearch && matchGroup;
  });

  const groups = ['ALL', ...new Set(teams.map(t => t.group_name))].sort();

  const handleSave = async (data) => {
    const token = localStorage.getItem('wc2026_token');
    const finalApiUrl = API_URL || window.location.origin;
    const method = editingTeam ? 'PUT' : 'POST';
    const endpoint = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams';

    try {
      const res = await fetch(`${finalApiUrl}${endpoint}`, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        onRefresh();
        setEditingTeam(null);
        setIsAdding(false);
      }
    } catch (err) {
      alert('Lỗi lưu đội bóng');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đội bóng này?')) return;
    const token = localStorage.getItem('wc2026_token');
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const res = await fetch(`${finalApiUrl}/api/teams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onRefresh();
    } catch (err) {
      alert('Lỗi xóa đội bóng');
    }
  };

  const FlagDisplay = ({ flag }) => {
    const isUrl = flag?.startsWith('http') || flag?.includes('.');
    return (
      <div className="team-flag-container">
        {isUrl ? (
          <img src={flag} alt="flag" className="team-flag-img" />
        ) : (
          <span className="team-flag-emoji">{flag || '⚽'}</span>
        )}
      </div>
    );
  };

  return (
    <div className="teams-admin-container">
      <header className="teams-header">
        <div className="header-left">
          <div className="admin-badge">
            <Shield size={14} />
            <span>HỆ THỐNG QUẢN TRỊ</span>
          </div>
          <h1>QUẢN LÝ ĐỘI BÓNG</h1>
        </div>
        <button className="add-team-btn" onClick={() => setIsAdding(true)}>
          <Plus size={20} />
          <span>THÊM ĐỘI MỚI</span>
        </button>
      </header>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm đội bóng..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="group-filter">
          <Filter size={18} />
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            {groups.map(g => (
              <option key={g} value={g}>{g === 'ALL' ? 'Tất cả các bảng' : `Bảng ${g}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="teams-grid">
        <AnimatePresence>
          {filteredTeams.map((team, index) => (
            <motion.div 
              key={team.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="team-card-premium"
            >
              <div className="card-content">
                <FlagDisplay flag={team.flag} />
                <div className="team-info">
                  <h3 className="team-name">{team.name}</h3>
                  <div className="group-tag">Bảng {team.group_name}</div>
                </div>
              </div>
              <div className="card-actions">
                <button className="action-btn edit" onClick={() => setEditingTeam(team)} title="Chỉnh sửa">
                  <Edit2 size={16} />
                </button>
                <button className="action-btn delete" onClick={() => handleDelete(team.id)} title="Xóa đội">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {(editingTeam || isAdding) && (
          <TeamModal 
            team={editingTeam} 
            onClose={() => { setEditingTeam(null); setIsAdding(false); }} 
            onSave={handleSave} 
          />
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .teams-admin-container { padding: 100px 20px 40px; max-width: 1200px; margin: 0 auto; min-height: 100vh; }
        .teams-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; gap: 20px; flex-wrap: wrap; }
        .admin-badge { display: flex; align-items: center; gap: 8px; color: #00d2ff; font-size: 0.7rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 10px; }
        .teams-header h1 { font-size: 2.5rem; font-weight: 900; color: white; line-height: 1; margin: 0; }
        
        .add-team-btn { display: flex; align-items: center; gap: 10px; padding: 12px 25px; border-radius: 14px; background: #00d2ff; color: black; border: none; font-weight: 900; cursor: pointer; transition: 0.3s; box-shadow: 0 10px 20px rgba(0,210,255,0.2); }
        .add-team-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,210,255,0.4); }

        .filters-bar { display: flex; gap: 20px; margin-bottom: 40px; flex-wrap: wrap; }
        .search-box { flex: 1; min-width: 250px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; display: flex; align-items: center; padding: 0 15px; gap: 12px; color: #666; }
        .search-box input { background: transparent; border: none; padding: 15px 0; color: white; width: 100%; outline: none; font-weight: 600; }
        .group-filter { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; display: flex; align-items: center; padding: 0 15px; gap: 12px; color: #666; }
        .group-filter select { background: transparent; border: none; padding: 15px 0; color: white; outline: none; font-weight: 700; cursor: pointer; }

        .teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        
        .team-card-premium { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 20px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; position: relative; overflow: hidden; backdrop-filter: blur(10px); }
        .team-card-premium:hover { background: rgba(255,255,255,0.05); border-color: rgba(0,210,255,0.3); transform: scale(1.02); }
        
        .card-content { display: flex; align-items: center; gap: 15px; flex: 1; min-width: 0; }
        .team-flag-container { width: 50px; height: 35px; background: #000; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1); }
        .team-flag-img { width: 100%; height: 100%; object-fit: contain; }
        .team-flag-emoji { font-size: 1.5rem; }
        
        .team-info { min-width: 0; }
        .team-name { font-size: 1.1rem; font-weight: 800; color: white; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .group-tag { font-size: 0.65rem; font-weight: 900; color: #00d2ff; background: rgba(0,210,255,0.1); padding: 4px 10px; border-radius: 6px; display: inline-block; }
        
        .card-actions { display: flex; gap: 8px; }
        .action-btn { width: 36px; height: 36px; border-radius: 10px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; background: rgba(255,255,255,0.05); color: #666; }
        .action-btn.edit:hover { background: #ffd200; color: black; }
        .action-btn.delete:hover { background: #ff4d4d; color: white; }

        @media (max-width: 768px) {
          .teams-admin-container { padding-top: 80px; }
          .teams-header h1 { font-size: 1.8rem; }
          .teams-grid { grid-template-columns: 1fr; }
        }
      ` }} />
    </div>
  );
};

export default TeamsView;
