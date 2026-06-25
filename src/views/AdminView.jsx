import React, { useState } from 'react';
import { Shield, RefreshCw, Megaphone, Send, Sparkles, Trash2, AlertTriangle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL;

// Detect RFC-1918 private / LAN addresses and localhost
const isLanIp = (ip) => {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === 'localhost') return true;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const [a, b] = parts.map(Number);
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
};

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
  const [showFundFeatures, setShowFundFeatures] = useState(true);

  // Reset System States
  const [resetLoading, setResetLoading] = useState(false);
  const [resetConfirmCode, setResetConfirmCode] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  // Security States
  const [suspiciousIps, setSuspiciousIps] = useState([]);
  const [bannedIps, setBannedIps] = useState([]);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [manualIp, setManualIp] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [secLoading, setSecLoading] = useState(false);
  const [secMsg, setSecMsg] = useState('');

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
          setShowFundFeatures(data.SHOW_FUND_FEATURES !== 'false');
        }
      } catch (err) { console.error('Lỗi lấy cấu hình ngân hàng'); }
    };
    fetchConfig();
    fetchBankConfig();
    loadSecurity();

    // Tự động làm mới danh sách IP và khách truy cập mỗi 10 giây
    const interval = setInterval(loadSecurity, 10000);
    return () => clearInterval(interval);
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
          memoTemplate,
          showFundFeatures: showFundFeatures ? 'true' : 'false'
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

  const loadSecurity = async () => {
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const sRes = await fetch(`${finalApiUrl}/api/admin/security/suspicious-ips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bRes = await fetch(`${finalApiUrl}/api/admin/security/banned-ips`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vRes = await fetch(`${finalApiUrl}/api/admin/security/active-visitors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sRes.ok) setSuspiciousIps(await sRes.json());
      if (bRes.ok) setBannedIps(await bRes.json());
      if (vRes.ok) setActiveVisitors(await vRes.json());
    } catch (err) {
      console.error('Lỗi lấy dữ liệu bảo mật', err);
    }
  };

  const handleBanIp = async (ip, reason) => {
    if (!ip) return;

    // ⚠️ Warn admin before banning a LAN / internal IP
    if (isLanIp(ip)) {
      const confirmed = window.confirm(
        `⚠️ CẢNH BÁO – IP NỘI BỘ (LAN)\n\n` +
        `Bạn đang chuẩn bị CHẶN địa chỉ IP nội bộ:\n${ip}\n\n` +
        `Tất cả thiết bị trên mạng LAN có địa chỉ này sẽ bị từ chối truy cập hệ thống (kể cả chính bạn nếu đang dùng IP đó).\n\n` +
        `Bạn có chắc chắn muốn tiếp tục không?`
      );
      if (!confirmed) return;
    }

    setSecLoading(true);
    setSecMsg('');
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/admin/security/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ip, reason })
      });
      const data = await res.json();
      if (res.ok) {
        setSecMsg(`✅ Đã cấm IP ${ip} thành công!`);
        if (ip === manualIp) {
          setManualIp('');
          setManualReason('');
        }
        await loadSecurity();
      } else {
        setSecMsg(`❌ ${data.error}`);
      }
    } catch (err) {
      setSecMsg('❌ Lỗi kết nối');
    } finally {
      setSecLoading(false);
    }
  };


  const handleUnbanIp = async (ip) => {
    if (!ip) return;
    setSecLoading(true);
    setSecMsg('');
    const finalApiUrl = API_URL || window.location.origin;
    try {
      const token = localStorage.getItem('wc2026_token');
      const res = await fetch(`${finalApiUrl}/api/admin/security/unban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      if (res.ok) {
        setSecMsg(`✅ Đã gỡ cấm IP ${ip} thành công!`);
        await loadSecurity();
      } else {
        setSecMsg(`❌ ${data.error}`);
      }
    } catch (err) {
      setSecMsg('❌ Lỗi kết nối');
    } finally {
      setSecLoading(false);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0, 210, 255, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(0, 210, 255, 0.15)', marginTop: '5px', marginBottom: '5px' }}>
              <input
                type="checkbox"
                id="showFundFeatures"
                checked={showFundFeatures}
                onChange={e => setShowFundFeatures(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="showFundFeatures" style={{ color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                Kích hoạt hiển thị chức năng đóng quỹ & báo cáo thu chi (VietQR)
              </label>
            </div>
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
                  * Hỗ trợ các từ khóa tự động thay thế: <code>{'{username}'}</code> (tên hiển thị) và <code>{'{amount}'}</code> (số tiền chuyển). Ví dụ: <code>chuyen tien mua banh {'{username}'}</code>
                </span>
              </div>
            </div>
            {bankMsg && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: bankMsg.includes('✅') ? '#00ff64' : '#ff4d4d' }}>{bankMsg}</div>}
          </div>
        </section>

        {/* 4. SECURITY & IP BANNING */}
        <section style={{ background: '#1a1f2e', padding: '30px', borderRadius: '24px', marginBottom: '30px', border: '1px solid rgba(255, 68, 68, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Shield size={20} color="#ff4d4d" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white', margin: 0 }}>QUẢN LÝ BẢO MẬT & CHẶN IP TRUY CẬP</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Theo dõi các IP truy cập bất thường (đăng nhập sai nhiều lần, vượt giới hạn yêu cầu, quét lỗi) và chặn truy cập từ các IP này vào toàn bộ ứng dụng.
            </p>

            {/* Active Visitors List */}
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#00d2ff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }}></span>
                  KHÁCH TRUY CẬP ĐANG HOẠT ĐỘNG ({activeVisitors.length})
                </h4>
                <button
                  onClick={loadSecurity}
                  disabled={secLoading}
                  style={{ background: 'transparent', border: 'none', color: '#00d2ff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={12} className={secLoading ? 'animate-spin' : ''} /> LÀM MỚI
                </button>
              </div>
              {activeVisitors.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Chưa ghi nhận lượt truy cập nào gần đây.</p>
              ) : (
                <div style={{ overflowX: 'auto', background: '#000', borderRadius: '12px', border: '1px solid #222' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #222', color: '#64748b' }}>
                        <th style={{ padding: '12px 15px' }}>Địa chỉ IP</th>
                        <th style={{ padding: '12px 15px' }}>Số Request</th>
                        <th style={{ padding: '12px 15px' }}>Dò tìm lỗi hổng</th>
                        <th style={{ padding: '12px 15px' }}>Đường dẫn cuối</th>
                        <th style={{ padding: '12px 15px' }}>Thời gian</th>
                        <th style={{ padding: '12px 15px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeVisitors.map((v, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #111', color: 'white' }}>
                          <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontWeight: 700 }}>
                            {v.ip_address}
                            {isLanIp(v.ip_address) && (
                              <span style={{ fontSize: '0.6rem', background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px', fontWeight: 700, letterSpacing: '0.05em' }}>LAN</span>
                            )}
                            {v.is_banned && <span style={{ fontSize: '0.65rem', background: '#ff4d4d', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>BANNED</span>}
                          </td>
                          <td style={{ padding: '12px 15px', color: '#e2e8f0' }}>{v.request_count}</td>
                          <td style={{ padding: '12px 15px' }}>
                            {v.scan_count > 0 ? (
                              <span style={{ color: '#ff4d4d', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <AlertTriangle size={12} color="#ff4d4d" /> {v.scan_count} lần
                              </span>
                            ) : (
                              <span style={{ color: '#10b981' }}>An toàn</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 15px', color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>{v.last_path}</td>
                          <td style={{ padding: '12px 15px', color: '#64748b' }}>{new Date(v.last_seen).toLocaleTimeString('vi-VN')}</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                            {!v.is_banned ? (
                              <button
                                onClick={() => handleBanIp(v.ip_address, `Bị chặn từ danh sách hoạt động (đã quét lỗi ${v.scan_count} lần)`)}
                                disabled={secLoading}
                                style={{ padding: '6px 12px', borderRadius: '6px', background: '#ff4d4d', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                              >
                                CHẶN IP
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnbanIp(v.ip_address)}
                                disabled={secLoading}
                                style={{ padding: '6px 12px', borderRadius: '6px', background: '#334155', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                              >
                                GỠ CHẶN
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Manual Ban IP Form */}
            <div style={{ background: '#000', padding: '20px', borderRadius: '16px', border: '1px solid #222' }}>
              <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, display: 'block', marginBottom: '10px', letterSpacing: '1px' }}>CẤM IP THỦ CÔNG</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ IP (ví dụ: 1.2.3.4)..."
                  value={manualIp}
                  onChange={e => setManualIp(e.target.value)}
                  style={{ flex: 1, minWidth: '180px', padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b', color: 'white' }}
                />
                <input
                  type="text"
                  placeholder="Lý do cấm..."
                  value={manualReason}
                  onChange={e => setManualReason(e.target.value)}
                  style={{ flex: 2, minWidth: '220px', padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b', color: 'white' }}
                />
                <button
                  onClick={() => handleBanIp(manualIp, manualReason)}
                  disabled={secLoading || !manualIp}
                  style={{ padding: '0 25px', borderRadius: '10px', background: '#ff4d4d', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', transition: '0.2s' }}
                >
                  CẤM IP
                </button>
              </div>
            </div>

            {secMsg && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: secMsg.includes('✅') ? '#00ff64' : '#ff4d4d', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>{secMsg}</div>}

            {/* Banned IPs List */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#ff4d4d', marginBottom: '10px' }}>DANH SÁCH IP ĐANG BỊ CHẶN ({bannedIps.length})</h4>
              {bannedIps.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Chưa có IP nào bị cấm.</p>
              ) : (
                <div style={{ overflowX: 'auto', background: '#000', borderRadius: '12px', border: '1px solid #222' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #222', color: '#64748b' }}>
                        <th style={{ padding: '12px 15px' }}>Địa chỉ IP</th>
                        <th style={{ padding: '12px 15px' }}>Lý do cấm</th>
                        <th style={{ padding: '12px 15px' }}>Thời gian</th>
                        <th style={{ padding: '12px 15px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bannedIps.map((b, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #111', color: 'white' }}>
                          <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontWeight: 700 }}>{b.ip_address}</td>
                          <td style={{ padding: '12px 15px', color: '#94a3b8' }}>{b.reason}</td>
                          <td style={{ padding: '12px 15px', color: '#64748b' }}>{new Date(b.banned_at).toLocaleString('vi-VN')}</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleUnbanIp(b.ip_address)}
                              disabled={secLoading}
                              style={{ padding: '6px 12px', borderRadius: '6px', background: '#00d2ff', color: 'black', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                            >
                              GỠ CẤM
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Suspicious Activities IPs */}
            <div style={{ marginTop: '10px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: '#f59e0b', marginBottom: '10px' }}>CẢNH BÁO HOẠT ĐỘNG BẤT THƯỜNG</h4>
              {suspiciousIps.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>Chưa ghi nhận hoạt động bất thường nào.</p>
              ) : (
                <div style={{ overflowX: 'auto', background: '#000', borderRadius: '12px', border: '1px solid #222' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #222', color: '#64748b' }}>
                        <th style={{ padding: '12px 15px' }}>Địa chỉ IP</th>
                        <th style={{ padding: '12px 15px' }}>Số lần vi phạm</th>
                        <th style={{ padding: '12px 15px' }}>Các hành vi</th>
                        <th style={{ padding: '12px 15px' }}>Hoạt động cuối</th>
                        <th style={{ padding: '12px 15px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suspiciousIps.map((s, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #111', color: 'white' }}>
                          <td style={{ padding: '12px 15px', fontFamily: 'monospace', fontWeight: 700 }}>
                            {s.ip_address} {s.is_banned && <span style={{ fontSize: '0.65rem', background: '#ff4d4d', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>BANNED</span>}
                          </td>
                          <td style={{ padding: '12px 15px', fontWeight: 700, color: s.threat_count > 5 ? '#ff4d4d' : '#f59e0b' }}>{s.threat_count}</td>
                          <td style={{ padding: '12px 15px', color: '#94a3b8', fontSize: '0.75rem' }}>{s.activity_types}</td>
                          <td style={{ padding: '12px 15px', color: '#64748b' }}>{new Date(s.last_activity).toLocaleString('vi-VN')}</td>
                          <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                            {!s.is_banned ? (
                              <button
                                onClick={() => handleBanIp(s.ip_address, `Bị chặn do ${s.threat_count} lần vi phạm: ${s.activity_types}`)}
                                disabled={secLoading}
                                style={{ padding: '6px 12px', borderRadius: '6px', background: '#ff4d4d', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                              >
                                CHẶN IP
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnbanIp(s.ip_address)}
                                disabled={secLoading}
                                style={{ padding: '6px 12px', borderRadius: '6px', background: '#334155', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}
                              >
                                GỠ CHẶN
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* 5. DANGER ZONE */}
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
