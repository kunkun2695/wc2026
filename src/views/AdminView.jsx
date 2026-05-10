import React, { useState } from 'react';
import { Shield, RefreshCw, Megaphone, Send, Sparkles, Trash2, AlertTriangle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

const AdminView = () => {
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifMsg, setNotifMsg] = useState('');

  // AI Config States
  const [aiKey, setAiKey] = useState('');
  const [configLoading, setConfigLoading] = useState(false);
  const [configMsg, setConfigMsg] = useState('');

  // Reset System States
  const [resetLoading, setResetLoading] = useState(false);
  const [resetConfirmCode, setResetConfirmCode] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  
  // User Management States
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null); // stores id of deleting user

  // Fetch AI Config on Load
  React.useEffect(() => {
    const fetchConfig = async () => {
      const finalApiUrl = API_URL || window.location.origin;
      try {
        const token = localStorage.getItem('wc2026_token');
        const res = await fetch(`${finalApiUrl}/api/config/ai`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setAiKey(data.apiKey);
      } catch (err) { console.error('Lỗi lấy cấu hình AI'); }
    };
    fetchConfig();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) { console.error('Lỗi lấy danh sách user'); }
    finally { setUsersLoading(false); }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Hành động này sẽ xóa vĩnh viễn người dùng "${username}" và toàn bộ dữ liệu liên quan (tin nhắn, bài viết, dự đoán). Bạn có chắc chắn không?`)) return;
    
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
    } catch (err) {
      alert('❌ Lỗi kết nối');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSaveAiKey = async () => {
    if (!aiKey) return;
    setConfigLoading(true);
    setConfigMsg('');
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/config/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ apiKey: aiKey })
      });
      const data = await res.json();
      if (res.ok) setConfigMsg('✅ ' + data.message);
      else setConfigMsg('❌ ' + data.error);
    } catch (err) {
      setConfigMsg('❌ Lỗi kết nối');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!notifTitle || !notifBody) return;
    setNotifLoading(true);
    setNotifMsg('');
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/notifications/broadcast`, {
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

  const handleResetSystem = async () => {
    if (resetConfirmCode !== 'RESET_WC2026_FINAL') {
      alert('Mã xác nhận không đúng!');
      return;
    }

    if (!confirm('HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC! Bạn có chắc chắn muốn xóa toàn bộ dữ liệu bài đăng, tin nhắn và lịch sử không?')) {
      return;
    }

    setResetLoading(true);
    setResetMsg('');
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/admin/reset-system`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ confirmation_code: resetConfirmCode })
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg('✅ ' + data.message);
        setShowResetConfirm(false);
        setResetConfirmCode('');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setResetMsg('❌ ' + data.error);
      }
    } catch (err) {
      setResetMsg('❌ Lỗi kết nối');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{ padding: '100px 20px 150px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d2ff', marginBottom: '10px' }}>
            <Settings size={16} />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>QUẢN TRỊ VIÊN</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>CÀI ĐẶT HỆ THỐNG</h1>
          <p style={{ color: '#64748b', marginTop: '15px' }}>Quản lý các thông số vận hành của toàn bộ ứng dụng World Cup.</p>
        </header>

        {/* 1. Broadcast Notification */}
        <section style={{ background: '#1a1f2e', padding: '30px', borderRadius: '24px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Megaphone size={20} color="#00d2ff" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', margin: 0 }}>GỬI THÔNG BÁO TOÀN HỆ THỐNG</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="Tiêu đề thông báo..."
              value={notifTitle}
              onChange={e => setNotifTitle(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #222', color: 'white', fontWeight: 600 }}
            />
            <textarea
              placeholder="Nội dung chi tiết gửi đến hàng nghìn người dùng..."
              value={notifBody}
              onChange={e => setNotifBody(e.target.value)}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#000', border: '1px solid #222', color: 'white', minHeight: '100px', fontWeight: 500 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#475569' }}>* Tin nhắn sẽ xuất hiện trong trung tâm thông báo.</span>
              <button
                onClick={handleBroadcast}
                disabled={notifLoading || !notifTitle || !notifBody}
                style={{ padding: '12px 30px', borderRadius: '12px', background: '#00d2ff', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}
              >
                {notifLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                PHÁT LOA NGAY
              </button>
            </div>
            {notifMsg && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: notifMsg.includes('✅') ? '#00ff64' : '#ff4d4d', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>{notifMsg}</div>}
          </div>
        </section>

        {/* 2. AI CONFIG */}
        <section style={{ background: '#1a1f2e', padding: '30px', borderRadius: '24px', marginBottom: '30px', border: '1px solid rgba(0,210,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Sparkles size={20} color="#00d2ff" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', margin: 0 }}>CẤU HÌNH TRỢ LÝ AI (GEMINI / OPENAI)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Thay đổi API Key để Guru có thể hoạt động liên tục. Hệ thống sẽ tự động nhận diện Key và chuyển đổi luồng xử lý.
            </p>
            <div style={{ background: '#000', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
              <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>AI API KEY</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="password"
                  placeholder="Nhập API Key mới..."
                  value={aiKey}
                  onChange={e => setAiKey(e.target.value)}
                  style={{ flex: 1, minWidth: '200px', padding: '15px', borderRadius: '12px', background: '#0f172a', border: '1px solid #1e293b', color: '#00d2ff', fontFamily: 'monospace' }}
                />
                <button
                  onClick={handleSaveAiKey}
                  disabled={configLoading}
                  style={{ padding: '0 25px', borderRadius: '12px', background: '#00d2ff', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', transition: '0.2s' }}
                >
                  {configLoading ? <RefreshCw size={18} className="animate-spin" /> : 'LƯU KEY'}
                </button>
              </div>
            </div>
            {configMsg && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: configMsg.includes('✅') ? '#00ff64' : '#ff4d4d' }}>{configMsg}</div>}
          </div>
        </section>

        {/* 3. USER MANAGEMENT */}
        <section style={{ background: '#1a1f2e', padding: '30px', borderRadius: '24px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color="#00d2ff" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', margin: 0 }}>QUẢN LÝ NGƯỜI DÙNG ({users.length})</h3>
            </div>
            <button onClick={fetchUsers} disabled={usersLoading} style={{ background: 'transparent', border: 'none', color: '#00d2ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 700 }}>
              <RefreshCw size={14} className={usersLoading ? 'animate-spin' : ''} /> Làm mới
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {usersLoading && users.length === 0 ? (
              <div style={{ padding: '40px', textCenter: 'center', color: '#64748b' }}>Đang tải danh sách người dùng...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px', textCenter: 'center', color: '#64748b' }}>Không có người dùng nào.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '15px', color: '#94a3b8', fontWeight: 800 }}>NGƯỜI DÙNG</th>
                    <th style={{ padding: '15px', color: '#94a3b8', fontWeight: 800 }}>VAI TRÒ</th>
                    <th style={{ padding: '15px', color: '#94a3b8', fontWeight: 800 }}>ĐIỂM</th>
                    <th style={{ padding: '15px', color: '#94a3b8', fontWeight: 800, textAlign: 'right' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={u.avatar || 'https://via.placeholder.com/40'} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} alt="" />
                          <div>
                            <div style={{ fontWeight: 800, color: 'white' }}>{u.name || u.username}</div>
                            <div style={{ fontSize: '0.7rem', color: '#475569' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        <span style={{ 
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900,
                          background: u.role === 'admin' ? 'rgba(0, 210, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                          color: u.role === 'admin' ? '#00d2ff' : '#94a3b8',
                          border: u.role === 'admin' ? '1px solid rgba(0, 210, 255, 0.2)' : '1px solid transparent'
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', fontWeight: 900, color: '#00ff64' }}>{u.points}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          disabled={deleteLoading === u.id || u.role === 'admin'}
                          style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', 
                            width: '32px', height: '32px', borderRadius: '8px', cursor: u.role === 'admin' ? 'not-allowed' : 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyCenter: 'center', opacity: u.role === 'admin' ? 0.3 : 1
                          }}
                        >
                          {deleteLoading === u.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* 4. DANGER ZONE */}
        <section style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <AlertTriangle size={20} color="#ef4444" />
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#ef4444', margin: 0 }}>VÙNG NGUY HIỂM (SYSTEM RESET)</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
            Xóa toàn bộ bài viết, tin nhắn và lịch sử dự đoán để bắt đầu một mùa giải mới. Dữ liệu sau khi xóa sẽ <strong>KHÔNG THỂ KHÔI PHỤC</strong>.
          </p>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              style={{ padding: '12px 25px', borderRadius: '12px', background: '#ef4444', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Trash2 size={18} />
              DỌN DẸP TOÀN BỘ DỮ LIỆU
            </button>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
                Xác nhận mã bảo mật: <code style={{ background: '#000', padding: '4px 8px', color: '#00d2ff', borderRadius: '4px' }}>RESET_WC2026_FINAL</code>
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={resetConfirmCode}
                  onChange={e => setResetConfirmCode(e.target.value)}
                  placeholder="Nhập mã xác nhận..."
                  style={{ flex: 1, minWidth: '150px', padding: '12px', borderRadius: '10px', background: '#000', border: '1px solid #ef4444', color: 'white' }}
                />
                <button
                  onClick={handleResetSystem}
                  disabled={resetLoading}
                  style={{ padding: '0 25px', height: '45px', borderRadius: '10px', background: '#ef4444', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer' }}
                >
                  {resetLoading ? 'ĐANG XÓA...' : 'XÁC NHẬN'}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={{ padding: '0 20px', height: '45px', borderRadius: '10px', background: '#334155', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  HỦY
                </button>
              </div>
              {resetMsg && <div style={{ marginTop: '10px', fontSize: '0.8rem', fontWeight: 700, color: resetMsg.includes('✅') ? '#00ff64' : '#ff4d4d' }}>{resetMsg}</div>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminView;
