import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Check, X, Search, RefreshCw, 
  Calendar, Clock, DollarSign, User, FileText, CheckCircle, XCircle, AlertCircle 
} from 'lucide-react';
import { mockAuth } from '../data/mockAuth';
import API_URL from '../config';
import UserAvatar from '../components/UserAvatar';

const PaymentManagementView = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, COMPLETED, REJECTED, ALL
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPayId, setSelectedPayId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = mockAuth.getToken();
      const res = await fetch(`${API_URL}/api/payments/admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPayments(Array.isArray(data) ? data : []);
      } else {
        setMsg({ text: `❌ ${data.error || 'Lỗi tải danh sách thanh toán'}`, type: 'error' });
      }
    } catch (err) {
      setMsg({ text: '❌ Lỗi kết nối máy chủ', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, status, notes = '') => {
    setActionLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const token = mockAuth.getToken();
      const res = await fetch(`${API_URL}/api/payments/${id}/verify`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status, notes })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMsg({ 
          text: `✅ Đã ${status === 'COMPLETED' ? 'PHÊ DUYỆT' : 'TỪ CHỐI'} giao dịch thành công!`, 
          type: 'success' 
        });
        fetchPayments();
        setShowRejectModal(false);
        setRejectReason('');
      } else {
        setMsg({ text: `❌ ${data.error || 'Lỗi xử lý giao dịch'}`, type: 'error' });
      }
    } catch (err) {
      setMsg({ text: '❌ Lỗi kết nối hệ thống', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id) => {
    setSelectedPayId(id);
    setShowRejectModal(true);
  };

  // Filters and search logic
  const filteredPayments = payments.filter(pay => {
    const matchesTab = activeTab === 'ALL' || pay.status === activeTab;
    const searchString = `${pay.username} ${pay.user_name || ''} ${pay.transfer_code}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Aggregate stats
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;
  const pendingSum = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + parseInt(p.amount), 0);

  return (
    <div className="admin-payments-container animate-fade">
      <header className="page-header-admin-pay">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d2ff', marginBottom: '10px' }}>
          <ShieldCheck size={16} />
          <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2px' }}>QUẢN TRỊ VIÊN</span>
        </div>
        <h1 className="font-outfit page-title">XÁC THỰC ĐÓNG QUỸ</h1>
        <p className="page-subtitle">Kiểm tra thông tin giao dịch ngân hàng và phê duyệt tích lũy tiền đóng quỹ của thành viên.</p>
      </header>

      {/* Stats Summary Section */}
      <div className="admin-pay-summary">
        <div className="summary-stat-box">
          <Clock size={20} color="#ffd200" />
          <div>
            <span className="stat-label">Số giao dịch chờ duyệt</span>
            <span className="stat-value font-monospace text-warning">{pendingCount}</span>
          </div>
        </div>
        <div className="summary-stat-box">
          <DollarSign size={20} color="#00d2ff" />
          <div>
            <span className="stat-label">Số tiền chờ đối soát</span>
            <span className="stat-value font-monospace text-info">{pendingSum.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
        <button onClick={fetchPayments} className="refresh-btn">
          <RefreshCw size={16} />
          <span>TẢI LẠI</span>
        </button>
      </div>

      {/* Search and Tabs controls */}
      <div className="controls-row">
        <div className="tabs-wrapper">
          <button onClick={() => setActiveTab('PENDING')} className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}>
            Chờ duyệt ({pendingCount})
          </button>
          <button onClick={() => setActiveTab('COMPLETED')} className={`tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}>
            Đã duyệt
          </button>
          <button onClick={() => setActiveTab('REJECTED')} className={`tab-btn ${activeTab === 'REJECTED' ? 'active' : ''}`}>
            Từ chối
          </button>
          <button onClick={() => setActiveTab('ALL')} className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}>
            Tất cả
          </button>
        </div>

        <div className="search-box-wrapper">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Tìm theo Tên, Username, Mã nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Global alert banner */}
      {msg.text && (
        <div className={`global-message ${msg.type}`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Main content table */}
      <div className="payments-list-wrapper">
        {loading ? (
          <div className="list-loading-state">
            <RefreshCw className="animate-spin" size={24} color="#00d2ff" />
            <span>Đang tải danh sách giao dịch...</span>
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="admin-pay-table">
            <div className="table-header">
              <span>Thành viên</span>
              <span>Số tiền</span>
              <span>Nội dung chuyển</span>
              <span>Thời gian</span>
              <span>Trạng thái / Ghi chú</span>
              <span className="text-right">Hành động</span>
            </div>
            
            {filteredPayments.map((pay) => (
              <div key={pay.id} className="table-row">
                {/* User column */}
                <div className="user-col">
                  <div className="avatar-preview" style={{ borderRadius: '50%', overflow: 'hidden' }}>
                    <UserAvatar src={pay.user_avatar} size={32} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="user-name">{pay.user_name || pay.username}</span>
                    <span className="username font-monospace">@{pay.username}</span>
                  </div>
                </div>

                {/* Amount */}
                <div className="amount-col font-monospace font-bold">
                  {pay.amount.toLocaleString('vi-VN')}đ
                </div>

                {/* Transfer code / Custom Memo */}
                <div className="code-col font-monospace text-info">
                  {pay.transfer_code}
                </div>

                {/* Created Date */}
                <div className="date-col font-monospace text-slate text-sm">
                  {new Date(pay.created_at).toLocaleString('vi-VN', { hour12: false })}
                </div>

                {/* Status & notes */}
                <div className="status-col">
                  <span className={`status-badge-mini ${pay.status.toLowerCase()}`}>
                    {pay.status === 'PENDING' && 'Chờ duyệt'}
                    {pay.status === 'COMPLETED' && 'Đã duyệt'}
                    {pay.status === 'REJECTED' && 'Từ chối'}
                  </span>
                  {pay.notes && (
                    <span className="pay-note text-slate text-xs" title={pay.notes}>
                      Lưu vết: {pay.notes}
                    </span>
                  )}
                  {pay.status === 'COMPLETED' && pay.verifier_name && (
                    <span className="pay-note text-slate text-xs">
                      Duyệt bởi: {pay.verifier_name}
                    </span>
                  )}
                </div>

                {/* Admin Actions */}
                <div className="actions-col">
                  {pay.status === 'PENDING' ? (
                    <div className="action-buttons-group">
                      <button 
                        onClick={() => handleVerify(pay.id, 'COMPLETED')}
                        disabled={actionLoading}
                        className="btn-approve"
                        title="Phê duyệt giao dịch"
                      >
                        <Check size={14} /> Duyệt
                      </button>
                      <button 
                        onClick={() => openRejectModal(pay.id)}
                        disabled={actionLoading}
                        className="btn-reject"
                        title="Từ chối giao dịch"
                      >
                        <X size={14} /> Từ chối
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate text-xs">Đã xử lý</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-list-state">
            <AlertCircle size={36} color="#64748b" />
            <p>Không tìm thấy yêu cầu thanh toán nào trùng khớp.</p>
          </div>
        )}
      </div>

      {/* Rejection reason modal dialog */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="reject-modal-card"
            >
              <div className="modal-header">
                <XCircle size={20} color="#ef4444" />
                <h3>TỪ CHỐI GIAO DỊCH ĐÓNG QUỸ</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '10px 0 20px' }}>
                Vui lòng nhập lý do từ chối (lý do này sẽ hiển thị trực tiếp cho thành viên trong lịch sử giao dịch của họ).
              </p>
              
              <textarea
                placeholder="Nhập lý do từ chối... Ví dụ: Sai số tiền chuyển khoản, chưa nhận được tiền trên tài khoản ngân hàng..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                required
                className="modal-textarea"
              />
              
              <div className="modal-actions">
                <button 
                  onClick={() => handleVerify(selectedPayId, 'REJECTED', rejectReason)}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="modal-btn-confirm"
                >
                  XÁC NHẬN TỪ CHỐI
                </button>
                <button 
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); }} 
                  className="modal-btn-cancel"
                >
                  HỦY BỎ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .admin-payments-container {
          padding: 100px 20px 150px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header-admin-pay {
          margin-bottom: 40px;
        }
        
        .page-title {
          font-size: 2.2rem;
          font-weight: 900;
          color: white;
          line-height: 1;
          margin: 0;
        }
        
        .page-subtitle {
          color: #64748b;
          margin-top: 15px;
          font-size: 0.95rem;
        }
        
        .admin-pay-summary {
          display: flex;
          align-items: center;
          gap: 20px;
          background: #1a1f2e;
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 20px;
          padding: 20px 30px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        
        .summary-stat-box {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 1;
          min-width: 200px;
          border-right: 1px solid rgba(255, 255, 255, 0.03);
        }
        
        .summary-stat-box:nth-child(2) {
          border-right: none;
        }
        
        @media (max-width: 700px) {
          .summary-stat-box {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            padding-bottom: 15px;
          }
        }
        
        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 900;
          margin-top: 5px;
        }
        
        .text-warning { color: #f59e0b; }
        .text-info { color: #00d2ff; }
        
        .refresh-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: white;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: 0.2s;
        }
        
        .refresh-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }
        
        .tabs-wrapper {
          display: flex;
          gap: 8px;
          background: #0f1322;
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.02);
        }
        
        .tab-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.2s;
        }
        
        .tab-btn.active {
          background: #1e293b;
          color: #00d2ff;
        }
        
        .search-box-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          flex: 0.4;
          min-width: 280px;
        }
        
        @media (max-width: 700px) {
          .search-box-wrapper {
            flex: 1;
          }
        }
        
        .search-icon {
          position: absolute;
          left: 15px;
          color: #475569;
        }
        
        .search-box-wrapper input {
          width: 100%;
          padding: 10px 15px 10px 40px;
          border-radius: 10px;
          background: #0f1322;
          border: 1px solid #1e293b;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          transition: 0.2s;
        }
        
        .search-box-wrapper input:focus {
          outline: none;
          border-color: #00d2ff;
          box-shadow: 0 0 10px rgba(0, 210, 255, 0.1);
        }
        
        .global-message {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 25px;
        }
        
        .global-message.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        
        .global-message.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .payments-list-wrapper {
          background: #111522;
          border: 1px solid rgba(255,255,255,0.02);
          border-radius: 24px;
          padding: 25px;
          overflow-x: auto;
        }
        
        .list-loading-state, .empty-list-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #64748b;
          gap: 12px;
          font-size: 0.9rem;
        }
        
        .admin-pay-table {
          display: flex;
          flex-direction: column;
          min-width: 900px;
        }
        
        .admin-pay-table .table-header {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1.5fr 1.2fr 1.5fr 1.3fr;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .admin-pay-table .table-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1.5fr 1.2fr 1.5fr 1.3fr;
          padding: 15px 20px;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.01);
          font-size: 0.85rem;
          color: white;
        }
        
        .admin-pay-table .table-row:last-child {
          border-bottom: none;
        }
        
        .user-col {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .avatar-preview {
          font-size: 1.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50%;
        }
        
        .user-name {
          font-weight: 700;
          color: white;
          font-size: 0.85rem;
        }
        
        .username {
          color: #64748b;
          font-size: 0.75rem;
        }
        
        .pay-note {
          display: block;
          margin-top: 4px;
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .action-buttons-group {
          display: flex;
          gap: 8px;
        }
        
        .btn-approve, .btn-reject {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          border: none;
          transition: 0.15s;
        }
        
        .btn-approve {
          background: #10b981;
          color: black;
        }
        
        .btn-approve:hover {
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }
        
        .btn-reject {
          background: #ef4444;
          color: white;
        }
        
        .btn-reject:hover {
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
        }
        
        .status-badge-mini {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        
        .status-badge-mini.pending {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }
        
        .status-badge-mini.completed {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .status-badge-mini.rejected {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        
        /* Modal dialog styling */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9000;
        }
        
        .reject-modal-card {
          background: #111522;
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 20px;
          padding: 30px;
          width: 90%;
          max-width: 480px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .modal-header h3 {
          margin: 0;
          color: white;
          font-size: 1.1rem;
          font-weight: 950;
          font-family: 'Outfit', sans-serif;
        }
        
        .modal-textarea {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          background: #090d16;
          border: 1px solid #1e293b;
          color: white;
          font-family: inherit;
          font-size: 0.85rem;
          margin-bottom: 20px;
          transition: 0.2s;
          resize: none;
        }
        
        .modal-textarea:focus {
          outline: none;
          border-color: #ef4444;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        
        .modal-btn-confirm {
          background: #ef4444;
          color: white;
          font-weight: 800;
          font-size: 0.75rem;
          padding: 10px 18px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
        
        .modal-btn-confirm:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .modal-btn-cancel {
          background: #334155;
          color: white;
          font-weight: 800;
          font-size: 0.75rem;
          padding: 10px 18px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }
        
        .text-right { text-align: right; }
      `}</style>
    </div>
  );
};

export default PaymentManagementView;
