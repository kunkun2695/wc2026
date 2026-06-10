import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Key, Search, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

const UsersManagementView = () => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reset Password Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');

  const fetchUsers = async () => {
    setUsersLoading(true);
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách user:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Hành động này sẽ xóa vĩnh viễn người dùng "${username}" và toàn bộ dữ liệu liên quan (tin nhắn, bài viết, dự đoán, bình luận). Bạn có chắc chắn không?`)) return;
    
    setDeleteLoading(userId);
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (_err) {
      alert('❌ Lỗi kết nối');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleOpenResetModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetSuccess('');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length === 0) return;
    
    setResetLoading(true);
    setResetSuccess('');
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setResetSuccess('Đặt lại mật khẩu thành công!');
        setTimeout(() => {
          setShowResetModal(false);
          setSelectedUser(null);
        }, 1500);
      } else {
        alert('❌ ' + data.error);
      }
    } catch (_err) {
      alert('❌ Lỗi kết nối');
    } finally {
      setResetLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(u => 
    (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '100px 20px 150px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d2ff', marginBottom: '10px' }}>
            <Users size={16} />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>QUẢN TRỊ VIÊN</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>QUẢN LÝ THÀNH VIÊN</h1>
          <p style={{ color: '#64748b', marginTop: '15px' }}>Xem danh sách, tìm kiếm, đặt lại mật khẩu và xóa tài khoản người dùng.</p>
        </header>

        {/* Search & Actions Bar */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input 
              type="text"
              placeholder="Tìm kiếm theo username, họ tên..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>
          <button 
            onClick={fetchUsers} 
            disabled={usersLoading} 
            style={{ 
              background: 'rgba(0, 210, 255, 0.08)', 
              border: '1px solid rgba(0, 210, 255, 0.2)', 
              color: '#00d2ff', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.85rem', 
              fontWeight: 800,
              padding: '12px 20px',
              borderRadius: '14px'
            }}
          >
            <RefreshCw size={14} className={usersLoading ? 'animate-spin' : ''} /> 
            LÀM MỚI
          </button>
        </div>

        {/* User Table Grid */}
        <div style={{ background: '#1a1f2e', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }}>
          <div style={{ overflowX: 'auto' }}>
            {usersLoading && users.length === 0 ? (
              <div style={{ padding: '60px 40px', textCenter: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <RefreshCw size={24} className="animate-spin" color="#00d2ff" />
                <span>Đang tải danh sách người dùng...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '60px 40px', textAlign: 'center', color: '#64748b' }}>
                Không tìm thấy người dùng nào phù hợp.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
                    <th style={{ padding: '18px 20px', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>THÀNH VIÊN</th>
                    <th style={{ padding: '18px 20px', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>VAI TRÒ</th>
                    <th style={{ padding: '18px 20px', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px' }}>ĐIỂM</th>
                    <th style={{ padding: '18px 20px', color: '#94a3b8', fontWeight: 800, letterSpacing: '1px', textAlign: 'right' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '15px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img 
                            src={u.avatar || 'https://via.placeholder.com/40'} 
                            style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} 
                            alt="" 
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>{u.name || u.username}</div>
                            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900,
                          background: u.role === 'admin' ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                          color: u.role === 'admin' ? '#00d2ff' : '#94a3b8',
                          border: u.role === 'admin' ? '1px solid rgba(0, 210, 255, 0.2)' : '1px solid transparent'
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '15px 20px', fontWeight: 900, color: '#00ff64', fontSize: '0.95rem' }}>{u.points}</td>
                      <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenResetModal(u)}
                            title="Đặt lại mật khẩu"
                            style={{ 
                              background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', border: 'none', 
                              width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Key size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            disabled={deleteLoading === u.id || u.role === 'admin'}
                            title={u.role === 'admin' ? "Không thể xóa Admin" : "Xóa tài khoản"}
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', 
                              width: '32px', height: '32px', borderRadius: '8px', cursor: u.role === 'admin' ? 'not-allowed' : 'pointer',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: u.role === 'admin' ? 0.3 : 1,
                              transition: 'all 0.2s'
                            }}
                          >
                            {deleteLoading === u.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: '#131824',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '30px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
              }}
            >
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="#00d2ff" />
                ĐẶT LẠI MẬT KHẨU
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '20px' }}>
                Bạn đang thực hiện đổi mật khẩu cho người dùng: <strong>{selectedUser?.name || selectedUser?.username}</strong> (@{selectedUser?.username})
              </p>

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ background: '#000', padding: '12px 15px', borderRadius: '12px', border: '1px solid #222' }}>
                  <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '6px', letterSpacing: '1px' }}>MẬT KHẨU MỚI</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập mật khẩu mới..."
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#00d2ff', fontSize: '0.95rem', outline: 'none', fontWeight: 600 }}
                  />
                </div>

                {resetSuccess && (
                  <div style={{ color: '#00ff64', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center', background: 'rgba(0,255,100,0.08)', padding: '10px', borderRadius: '8px' }}>
                    {resetSuccess}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button 
                    type="submit" 
                    disabled={resetLoading || !newPassword}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #00d2ff 0%, #3a86ff 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'black',
                      fontWeight: 900,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {resetLoading ? 'ĐANG CẬP NHẬT...' : 'XÁC NHẬN'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setShowResetModal(false); setSelectedUser(null); }}
                    style={{
                      padding: '12px 20px',
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    HỦY
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersManagementView;
