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

  // Bank Config States
  const [bankId, setBankId] = useState('');
  const [bankNo, setBankNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [memoPrefix, setMemoPrefix] = useState('');
  const [memoTemplate, setMemoTemplate] = useState('');
  const [bankLoading, setBankLoading] = useState(false);
  const [bankMsg, setBankMsg] = useState('');

  // Reset System States
  const [resetLoading, setResetLoading] = useState(false);
  const [resetConfirmCode, setResetConfirmCode] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  // Fetch Configs on Load
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
    const fetchBankConfig = async () => {
      const finalApiUrl = API_URL || window.location.origin;
      try {
        const token = localStorage.getItem('wc2026_token');
        const res = await fetch(`${finalApiUrl}/api/config/bank`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setBankId(data.BANK_ID || '');
          setBankNo(data.BANK_ACCOUNT_NO || '');
          setBankName(data.BANK_NAME || '');
          setBankHolder(data.BANK_ACCOUNT_NAME || '');
          setMemoPrefix(data.MEMO_PREFIX || '');
          setMemoTemplate(data.MEMO_TEMPLATE || '');
        }
      } catch (err) { console.error('Lỗi lấy cấu hình ngân hàng'); }
    };
    fetchConfig();
    fetchBankConfig();
  }, []);

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

  const handleSaveBankConfig = async () => {
    if (!bankId || !bankNo || !bankHolder) {
      alert('Vui lòng điền đầy đủ Mã ngân hàng, Số tài khoản và Tên chủ tài khoản!');
      return;
    }
    setBankLoading(true);
    setBankMsg('');
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/config/bank`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          bankId,
          bankAccountNo: bankNo,
          bankAccountName: bankHolder,
          bankName,
          memoPrefix,
          memoTemplate
        })
      });
      const data = await res.json();
      if (res.ok) {
        setBankMsg('✅ Cập nhật thông tin ngân hàng thành công!');
      } else {
        setBankMsg('❌ ' + (data.error || 'Lỗi lưu cấu hình'));
      }
    } catch (err) {
      setBankMsg('❌ Lỗi kết nối');
    } finally {
      setBankLoading(false);
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

        {/* 3. CẤU HÌNH THÔNG TIN NGÂN HÀNG (QUỸ PHẠT) */}
        <section style={{ background: '#1a1f2e', padding: '30px', borderRadius: '24px', marginBottom: '30px', border: '1px solid rgba(0,210,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Settings size={20} color="#00d2ff" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', margin: 0 }}>CẤU HÌNH THÔNG TIN NGÂN HÀNG (QUỸ PHẠT)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Thiết lập thông tin tài khoản nhận tiền quỹ phạt để người dùng quét VietQR tự động hoặc mở app ngân hàng trực tiếp.
            </p>
            <div style={{ background: '#000', padding: '20px', borderRadius: '16px', border: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>MÃ NGÂN HÀNG VIETQR (VIẾT TẮT)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: MB, VCB, ACB, TCB..."
                    value={bankId}
                    onChange={e => setBankId(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b', color: '#00d2ff', fontWeight: 650 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>TÊN NGÂN HÀNG ĐẦY ĐỦ</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: MB Bank, Vietcombank..."
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>SỐ TÀI KHOẢN</label>
                  <input
                    type="text"
                    placeholder="Nhập số tài khoản nhận tiền..."
                    value={bankNo}
                    onChange={e => setBankNo(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b', color: 'white', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>TÊN CHỦ TÀI KHOẢN (KHÔNG DẤU)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: NGUYEN VAN A..."
                    value={bankHolder}
                    onChange={e => setBankHolder(e.target.value.toUpperCase())}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b', color: 'white', fontWeight: 650 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>CẤU HÌNH MẪU NỘI DUNG CHUYỂN TIỀN (MEMO TEMPLATE)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Ví dụ: chuyen tien mua banh {username} {amount}"
                    value={memoTemplate}
                    onChange={e => setMemoTemplate(e.target.value)}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b', color: 'white' }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveBankConfig}
                    disabled={bankLoading}
                    style={{ padding: '0 25px', borderRadius: '10px', background: '#00d2ff', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', transition: '0.2s' }}
                  >
                    {bankLoading ? <RefreshCw size={16} className="animate-spin" /> : 'LƯU THÔNG TIN'}
                  </button>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
                  * Hỗ trợ các từ khóa tự động thay thế: <code>{'{username}'}</code> (tên đăng nhập) và <code>{'{amount}'}</code> (số tiền chuyển). Ví dụ: <code>chuyen tien mua banh {'{username}'}</code>
                </span>
              </div>
            </div>
            {bankMsg && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: bankMsg.includes('✅') ? '#00ff64' : '#ff4d4d' }}>{bankMsg}</div>}
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
