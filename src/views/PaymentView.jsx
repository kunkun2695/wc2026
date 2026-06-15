import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, QrCode, AlertCircle, CheckCircle, 
  XCircle, Clock, RefreshCw, Copy, Check, ExternalLink, DollarSign, Send 
} from 'lucide-react';
import { mockAuth } from '../data/mockAuth';
import API_URL from '../config';

const cleanVietnameseString = (str) => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const PaymentView = () => {
  const [user, setUser] = useState(null);
  const [bankConfig, setBankConfig] = useState({
    BANK_ID: 'MB',
    BANK_ACCOUNT_NO: '1234567890',
    BANK_ACCOUNT_NAME: 'NGUYEN VAN A',
    BANK_NAME: 'MB Bank',
    MEMO_PREFIX: 'KBPAY',
    MEMO_TEMPLATE: 'KBPAY {username}'
  });
  
  // Payment state
  const [paymentMode, setPaymentMode] = useState('full'); // 'full' or 'custom'
  const [amount, setAmount] = useState(0);
  const [memo, setMemo] = useState('');
  const [userNotes, setUserNotes] = useState('');
  
  // App states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [copiedField, setCopiedField] = useState('');
  
  // User fund history
  const [userFines, setUserFines] = useState({ total: 0, paid: 0, remaining: 0 });
  const [paymentsHistory, setPaymentsHistory] = useState([]);

  useEffect(() => {
    const currentUser = mockAuth.getCurrentUser();
    setUser(currentUser);
    fetchData(currentUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const template = bankConfig.MEMO_TEMPLATE || 'KBPAY {username}';
    const userDisplayName = cleanVietnameseString(user.name || user.username);
    const cleanMemo = template
      .replace(/{username}/gi, userDisplayName)
      .replace(/{amount}/gi, amount)
      .toUpperCase();
    setMemo(cleanMemo);
  }, [amount, user, bankConfig.MEMO_TEMPLATE]);

  const fetchData = async (currentUser) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const token = mockAuth.getToken();
      
      // 1. Fetch bank config
      const bankRes = await fetch(`${API_URL}/api/config/bank`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const bankData = await bankRes.json();
      if (bankRes.ok) {
        setBankConfig(bankData);
      }
      
      // 2. Fetch leaderboard to get user's outstanding fine
      const lbRes = await fetch(`${API_URL}/api/predictions/leaderboard`);
      const lbData = await lbRes.json();
      if (lbRes.ok && Array.isArray(lbData)) {
        const myRank = lbData.find(u => u.id === currentUser.id);
        if (myRank) {
          const totalFines = parseInt(myRank.total_fines || 0);
          const totalPaid = parseInt(myRank.total_paid || 0);
          const remainingFines = parseInt(myRank.remaining_fines || 0);
          
          setUserFines({ total: totalFines, paid: totalPaid, remaining: remainingFines });
          const defaultAmt = remainingFines > 0 ? remainingFines : 0;
          setAmount(defaultAmt);
          setPaymentMode(defaultAmt > 0 ? 'full' : 'custom');
        }
      }

      // 3. Fetch payment history
      const historyRes = await fetch(`${API_URL}/api/payments/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      if (historyRes.ok) {
        setPaymentsHistory(historyData);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu đóng quỹ:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setMsg({ text: 'Vui lòng nhập số tiền hợp lệ lớn hơn 0đ', type: 'error' });
      return;
    }
    if (!memo || !memo.trim()) {
      setMsg({ text: 'Vui lòng nhập nội dung chuyển khoản', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMsg({ text: '', type: '' });
    
    try {
      const token = mockAuth.getToken();
      const res = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          amount: parseInt(amount),
          memo: memo.toUpperCase(),
          notes: userNotes
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsg({ text: '🎉 Gửi yêu cầu xác thực đóng quỹ thành công! Admin sẽ duyệt giao dịch của bạn sớm.', type: 'success' });
        setUserNotes('');
        // Refresh data
        fetchData(user);
      } else {
        setMsg({ text: `❌ ${data.error || 'Lỗi gửi yêu cầu'}`, type: 'error' });
      }
    } catch (err) {
      setMsg({ text: '❌ Lỗi kết nối hệ thống', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // VietQR Image URL
  const qrUrl = `https://img.vietqr.io/image/${bankConfig.BANK_ID}-${bankConfig.BANK_ACCOUNT_NO}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(bankConfig.BANK_ACCOUNT_NAME)}`;

  // Mobile Deep Link
  const deepLinkUrl = `https://dl.vietqr.io/pay?app=${bankConfig.BANK_ID.toLowerCase()}&ba=${bankConfig.BANK_ACCOUNT_NO}&am=${amount}&tn=${encodeURIComponent(memo)}`;

  if (loading) {
    return (
      <div className="payment-loading">
        <RefreshCw className="animate-spin" size={32} color="#00d2ff" />
        <span style={{ marginTop: '10px', color: '#64748b' }}>Đang tải thông tin đóng quỹ...</span>
      </div>
    );
  }

  return (
    <div className="payment-view-container animate-fade">
      <header className="page-header-payment">
        <div className="wallet-glow-wrapper">
          <CreditCard className="wallet-icon" size={48} />
        </div>
        <h1 className="font-outfit payment-title">ĐÓNG GÓP QUỸ PHẠT</h1>
        <p className="payment-subtitle">Thanh toán tiền phạt dự đoán sai bằng VietQR & Tự động đối soát</p>
      </header>

      {/* 1. Dashboard summary cards */}
      <div className="payment-summary-row">
        <div className="summary-card fine">
          <span className="summary-label">Tổng phạt tích lũy</span>
          <span className="summary-value">{Math.floor(userFines.total / 1000)} bánh</span>
          <div className="card-decoration error-glow" />
        </div>
        <div className="summary-card paid">
          <span className="summary-label">Đã đóng quỹ</span>
          <span className="summary-value">{Math.floor(userFines.paid / 1000)} bánh</span>
          <div className="card-decoration success-glow" />
        </div>
        <div className="summary-card remaining">
          <span className="summary-label">Còn nợ quỹ</span>
          <span className="summary-value highlight">{Math.floor(userFines.remaining / 1000)} bánh</span>
          <div className="card-decoration info-glow" />
        </div>
      </div>

      <div className="payment-content-grid">
        {/* 2. Transfer Details Form */}
        <section className="payment-form-section">
          <h3 className="section-title">Thông tin giao dịch</h3>
          
          <form onSubmit={handleSubmitPayment} className="transfer-form">
            <div className="form-group">
              <label>Lựa chọn hình thức đóng quỹ</label>
              <div className="payment-options-selector">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('full');
                    setAmount(userFines.remaining > 0 ? userFines.remaining : 0);
                  }}
                  className={`selector-btn ${paymentMode === 'full' ? 'active' : ''}`}
                >
                  Đóng toàn bộ nợ phạt ({Math.floor(userFines.remaining / 1000)} bánh)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('custom')}
                  className={`selector-btn ${paymentMode === 'custom' ? 'active' : ''}`}
                >
                  Nhập số tiền khác
                </button>
              </div>
            </div>

            {paymentMode === 'custom' && (
              <div className="form-group animate-fade">
                <label>Số tiền đóng quỹ tùy chọn (VNĐ)</label>
                <div className="input-with-icon">
                  <DollarSign size={18} className="input-icon" />
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Nhập số tiền muốn chuyển..."
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Nội dung chuyển khoản (Tự động sinh)</label>
              <input 
                type="text" 
                value={memo} 
                readOnly
                placeholder="Nội dung chuyển khoản..."
                style={{ background: '#090d16', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.2)' }}
                required
              />
              <span className="input-tip">* Được tự động sinh theo mẫu của Admin để đối soát dễ dàng.</span>
            </div>

            <div className="form-group">
              <label>Ghi chú gửi Admin (Không bắt buộc)</label>
              <textarea 
                value={userNotes} 
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Nhập ghi chú hoặc mã giao dịch ngân hàng của bạn..."
                rows={2}
              />
            </div>

            {/* Quick Copy Info Card */}
            <div className="copy-info-card">
              <div className="copy-row">
                <span className="copy-label">Ngân hàng nhận:</span>
                <span className="copy-val font-outfit">{bankConfig.BANK_NAME} ({bankConfig.BANK_ID})</span>
              </div>
              <div className="copy-row">
                <span className="copy-label">Số tài khoản:</span>
                <div className="copy-action-wrapper">
                  <span className="copy-val font-monospace">{bankConfig.BANK_ACCOUNT_NO}</span>
                  <button type="button" onClick={() => handleCopy(bankConfig.BANK_ACCOUNT_NO, 'account')} className="copy-btn">
                    {copiedField === 'account' ? <Check size={14} color="#00ff64" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="copy-row">
                <span className="copy-label">Tên tài khoản:</span>
                <span className="copy-val font-outfit" style={{ color: '#fff' }}>{bankConfig.BANK_ACCOUNT_NAME}</span>
              </div>
              <div className="copy-row">
                <span className="copy-label">Số tiền:</span>
                <div className="copy-action-wrapper">
                  <span className="copy-val font-monospace" style={{ color: '#ffd200' }}>{amount.toLocaleString('vi-VN')} đ ({Math.floor(amount / 1000)} bánh)</span>
                  <button type="button" onClick={() => handleCopy(amount.toString(), 'amount')} className="copy-btn">
                    {copiedField === 'amount' ? <Check size={14} color="#00ff64" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="copy-row">
                <span className="copy-label">Nội dung chuyển:</span>
                <div className="copy-action-wrapper">
                  <span className="copy-val font-monospace" style={{ color: '#00d2ff' }}>{memo}</span>
                  <button type="button" onClick={() => handleCopy(memo, 'memo')} className="copy-btn">
                    {copiedField === 'memo' ? <Check size={14} color="#00ff64" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                type="submit" 
                disabled={submitting} 
                className="submit-payment-btn"
              >
                {submitting ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                XÁC NHẬN ĐÃ CHUYỂN TIỀN
              </button>
            </div>

            {msg.text && (
              <div className={`message-banner ${msg.type}`}>
                {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                <span>{msg.text}</span>
              </div>
            )}
          </form>
        </section>

        {/* 3. VietQR scanning display */}
        <section className="payment-qr-section">
          <h3 className="section-title text-center">Quét mã chuyển khoản</h3>
          
          <div className="qr-container-box">
            {amount > 0 ? (
              <div className="qr-wrapper">
                <img 
                  src={qrUrl} 
                  alt="VietQR code chuyển khoản"
                  className="vietqr-img" 
                />
                <div className="qr-scan-guide">
                  <QrCode size={20} color="#00d2ff" />
                  <span>Sử dụng app ngân hàng quét mã để điền nhanh</span>
                </div>
              </div>
            ) : (
              <div className="empty-qr-state">
                <AlertCircle size={36} color="#64748b" />
                <p>Nhập số tiền lớn hơn 0 để tạo mã QR Code chuyển khoản VietQR tự động.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 4. Payment request history */}
      <section className="payment-history-section" style={{ marginTop: '40px' }}>
        <h3 className="section-title">Lịch sử yêu cầu đóng quỹ</h3>
        
        <div className="history-table-wrapper">
          {paymentsHistory.length > 0 ? (
            <div className="history-table">
              <div className="table-header">
                <span>Ngày tạo</span>
                <span>Số lượng (Bánh)</span>
                <span>Nội dung chuyển</span>
                <span>Trạng thái</span>
                <span>Ghi chú duyệt</span>
              </div>
              
              {paymentsHistory.map((pay) => (
                <div key={pay.id} className="table-row">
                  <span className="font-monospace text-slate">
                    {new Date(pay.created_at).toLocaleString('vi-VN', { hour12: false })}
                  </span>
                  <span className="font-monospace font-bold">
                    {Math.floor(pay.amount / 1000)} bánh ({pay.amount.toLocaleString('vi-VN')}đ)
                  </span>
                  <span className="font-monospace text-info">{pay.transfer_code}</span>
                  <span>
                    <span className={`status-badge ${pay.status.toLowerCase()}`}>
                      {pay.status === 'PENDING' && <Clock size={12} />}
                      {pay.status === 'COMPLETED' && <CheckCircle size={12} />}
                      {pay.status === 'REJECTED' && <XCircle size={12} />}
                      {pay.status === 'PENDING' && 'Chờ duyệt'}
                      {pay.status === 'COMPLETED' && 'Đã duyệt'}
                      {pay.status === 'REJECTED' && 'Bị từ chối'}
                    </span>
                  </span>
                  <span className="text-slate text-sm">
                    {pay.notes || '-'}
                    {pay.status === 'COMPLETED' && pay.verifier_name && ` (Duyệt bởi ${pay.verifier_name})`}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-history-state">
              <p>Bạn chưa gửi yêu cầu đóng quỹ nào.</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        .payment-view-container {
          padding: 100px 20px 150px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header-payment {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .wallet-glow-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, #00d2ff, #0066ff);
          box-shadow: 0 0 30px rgba(0, 210, 255, 0.3);
          margin-bottom: 20px;
        }
        
        .wallet-icon {
          color: white;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
        }
        
        .payment-title {
          font-size: 2.2rem;
          font-weight: 900;
          color: white;
          letter-spacing: -0.5px;
          margin: 0;
        }
        
        .payment-subtitle {
          color: #64748b;
          margin-top: 10px;
          font-size: 0.95rem;
        }
        
        .payment-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 200px 20px;
        }
        
        .payment-summary-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .summary-card {
          position: relative;
          background: #1a1f2e;
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          padding: 25px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .summary-label {
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-value {
          font-size: 1.8rem;
          font-weight: 900;
          color: white;
          margin-top: 10px;
          font-family: 'Outfit', sans-serif;
        }
        
        .summary-value.highlight {
          color: #00d2ff;
          text-shadow: 0 0 10px rgba(0, 210, 255, 0.2);
        }
        
        .card-decoration {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          right: -20px;
          bottom: -20px;
          filter: blur(40px);
          opacity: 0.15;
          pointer-events: none;
        }
        
        .error-glow { background: #ef4444; }
        .success-glow { background: #10b981; }
        .info-glow { background: #00d2ff; }
        
        .payment-content-grid {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 30px;
        }
        
        @media (max-width: 900px) {
          .payment-content-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .payment-form-section, .payment-qr-section {
          background: #111522;
          border: 1px solid rgba(255, 255, 255, 0.02);
          border-radius: 24px;
          padding: 30px;
        }
        
        .section-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: white;
          margin-top: 0;
          margin-bottom: 25px;
          letter-spacing: 0.5px;
          border-left: 3px solid #00d2ff;
          padding-left: 10px;
        }
        
        .section-title.text-center {
          border-left: none;
          padding-left: 0;
          text-align: center;
        }
        
        .transfer-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 700;
        }
        
        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .input-icon {
          position: absolute;
          left: 15px;
          color: #475569;
        }
        
        .input-with-icon input {
          padding-left: 40px !important;
        }
        
        .transfer-form input, .transfer-form textarea {
          width: 100%;
          padding: 15px;
          border-radius: 12px;
          background: #090d16;
          border: 1px solid #1e293b;
          color: white;
          font-weight: 600;
          font-family: inherit;
          transition: 0.2s;
        }
        
        .transfer-form input:focus, .transfer-form textarea:focus {
          border-color: #00d2ff;
          outline: none;
          box-shadow: 0 0 10px rgba(0, 210, 255, 0.1);
        }
        
        .input-tip {
          color: #475569;
          font-size: 0.75rem;
          font-style: italic;
        }
        
        .copy-info-card {
          background: #090d16;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .copy-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.03);
          padding-bottom: 8px;
        }
        
        .copy-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        
        .copy-label {
          color: #64748b;
          font-weight: 600;
        }
        
        .copy-val {
          font-weight: 700;
          color: #cbd5e1;
        }
        
        .copy-action-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .copy-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
          border-radius: 4px;
        }
        
        .copy-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .submit-payment-btn {
          flex: 1.2;
          background: #00d2ff;
          color: black;
          font-weight: 900;
          border: none;
          border-radius: 12px;
          padding: 14px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: 0.2s;
        }
        
        .submit-payment-btn:hover {
          box-shadow: 0 0 15px rgba(0, 210, 255, 0.4);
          transform: translateY(-1px);
        }
        
        .message-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          margin-top: 10px;
        }
        
        .message-banner.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        
        .message-banner.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .qr-container-box {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          background: #090d16;
          border-radius: 20px;
          border: 1px solid #1e293b;
          padding: 20px;
        }
        
        .qr-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          animation: fade-in 0.3s ease-out;
        }
        
        .vietqr-img {
          width: 260px;
          height: 260px;
          border-radius: 16px;
          border: 4px solid white;
          background: white;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        }
        
        .qr-scan-guide {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .empty-qr-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 15px;
          color: #64748b;
          max-width: 240px;
          font-size: 0.85rem;
        }
        
        .history-table-wrapper {
          background: #111522;
          border: 1px solid rgba(255, 255, 255, 0.02);
          border-radius: 24px;
          padding: 25px;
          overflow-x: auto;
        }
        
        .history-table {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 650px;
        }
        
        .table-header {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1.5fr 1fr 1.8fr;
          padding: 15px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .table-row {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1.5fr 1fr 1.8fr;
          padding: 18px 20px;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.01);
          font-size: 0.85rem;
          color: white;
        }
        
        .table-row:last-child {
          border-bottom: none;
        }
        
        .text-slate { color: #64748b; }
        .text-info { color: #00d2ff; }
        .font-bold { font-weight: 700; }
        .font-monospace { font-family: monospace; }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        
        .status-badge.pending {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        
        .status-badge.completed {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        
        .status-badge.rejected {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .empty-history-state {
          text-align: center;
          padding: 40px;
          color: #64748b;
          font-size: 0.9rem;
        }
        
        .payment-options-selector {
          display: flex;
          gap: 10px;
          margin-bottom: 5px;
        }
        .selector-btn {
          flex: 1;
          background: #090d16;
          border: 1px solid #1e293b;
          color: #94a3b8;
          padding: 12px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: 0.2s;
        }
        .selector-btn:hover {
          background: rgba(255, 255, 255, 0.02);
          color: white;
        }
        .selector-btn.active {
          background: rgba(0, 210, 255, 0.1);
          border-color: #00d2ff;
          color: #00d2ff;
        }
      `}</style>
    </div>
  );
};

export default PaymentView;
