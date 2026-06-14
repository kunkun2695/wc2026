import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart2, Coins, Clock, CheckCircle, XCircle, 
  Search, RefreshCw, Users, ShieldCheck, DollarSign, Calendar, AlertCircle 
} from 'lucide-react';
import { mockAuth } from '../data/mockAuth';
import API_URL from '../config';

const FundStatsView = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [publicHistory, setPublicHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, PENDING, COMPLETED, REJECTED
  const [activeSubTab, setActiveSubTab] = useState('history'); // history, members
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = mockAuth.getToken();
      
      // 1. Fetch leaderboard for totals and member status
      const lbRes = await fetch(`${API_URL}/api/predictions/leaderboard`);
      const lbData = await lbRes.json();
      if (lbRes.ok && Array.isArray(lbData)) {
        setLeaderboard(lbData);
      }

      // 2. Fetch public payment logs
      const historyRes = await fetch(`${API_URL}/api/payments/public-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const historyData = await historyRes.json();
      if (historyRes.ok && Array.isArray(historyData)) {
        setPublicHistory(historyData);
      }
    } catch (err) {
      console.error('Lỗi lấy thống kê quỹ:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculates aggregates
  const totalFines = leaderboard.reduce((sum, u) => sum + parseInt(u.total_fines || 0), 0);
  const totalPaid = leaderboard.reduce((sum, u) => sum + parseInt(u.total_paid || 0), 0);
  const totalRemaining = leaderboard.reduce((sum, u) => sum + parseInt(u.remaining_fines || 0), 0);

  // Filters payment history logs
  const filteredHistory = publicHistory.filter(pay => {
    const matchesTab = filterTab === 'ALL' || pay.status === filterTab;
    const searchString = `${pay.username} ${pay.user_name || ''} ${pay.transfer_code}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  if (loading) {
    return (
      <div className="stats-loading">
        <RefreshCw className="animate-spin" size={32} color="#00d2ff" />
        <span style={{ marginTop: '10px', color: '#64748b' }}>Đang tải thống kê tài chính quỹ...</span>
      </div>
    );
  }

  return (
    <div className="fund-stats-container animate-fade">
      <header className="page-header-stats">
        <div className="stats-glow-wrapper">
          <BarChart2 className="stats-icon" size={48} />
        </div>
        <h1 className="font-outfit stats-title">THỐNG KÊ QUỸ GIẢI & PHẠT</h1>
        <p className="stats-subtitle">Báo cáo tài chính minh bạch về các khoản đóng góp và công nợ phạt dự đoán</p>
      </header>

      {/* 1. Summary Cards */}
      <div className="stats-summary-row">
        <div className="summary-card pool">
          <span className="summary-label">Tổng quỹ giải (Phạt phát sinh)</span>
          <span className="summary-value">{totalFines.toLocaleString('vi-VN')} đ</span>
          <div className="card-decoration pool-glow" />
        </div>
        <div className="summary-card collected">
          <span className="summary-label">Quỹ đã thu thực tế</span>
          <span className="summary-value highlight-green">{totalPaid.toLocaleString('vi-VN')} đ</span>
          <div className="card-decoration success-glow" />
        </div>
        <div className="summary-card remaining">
          <span className="summary-label">Tổng quỹ còn nợ</span>
          <span className="summary-value highlight-orange">{totalRemaining.toLocaleString('vi-VN')} đ</span>
          <div className="card-decoration warning-glow" />
        </div>
      </div>

      {/* 2. Sub-tab Selection */}
      <div className="stats-tab-selectors">
        <button 
          onClick={() => setActiveSubTab('history')} 
          className={`subtab-btn ${activeSubTab === 'history' ? 'active' : ''}`}
        >
          Nhật ký giao dịch công khai
        </button>
        <button 
          onClick={() => setActiveSubTab('members')} 
          className={`subtab-btn ${activeSubTab === 'members' ? 'active' : ''}`}
        >
          Bảng nợ quỹ thành viên
        </button>
        <button onClick={fetchData} className="stats-refresh-btn" title="Làm mới dữ liệu">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Sub-tab 1: Nhật ký đóng quỹ công khai */}
      {activeSubTab === 'history' && (
        <section className="stats-content-section animate-fade">
          <div className="section-header-controls">
            <h3 className="section-title">Nhật ký giao dịch công khai</h3>
            
            <div className="controls-group">
              <div className="history-filters">
                <button onClick={() => setFilterTab('ALL')} className={`filter-badge ${filterTab === 'ALL' ? 'active' : ''}`}>Tất cả</button>
                <button onClick={() => setFilterTab('PENDING')} className={`filter-badge ${filterTab === 'PENDING' ? 'active' : ''}`}>Chờ duyệt</button>
                <button onClick={() => setFilterTab('COMPLETED')} className={`filter-badge ${filterTab === 'COMPLETED' ? 'active' : ''}`}>Đã duyệt</button>
                <button onClick={() => setFilterTab('REJECTED')} className={`filter-badge ${filterTab === 'REJECTED' ? 'active' : ''}`}>Từ chối</button>
              </div>

              <div className="stats-search-wrapper">
                <Search size={14} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Tìm thành viên, mã nội dung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="history-table-wrapper">
            {filteredHistory.length > 0 ? (
              <div className="public-history-table">
                <div className="table-header">
                  <span>Thành viên</span>
                  <span>Số tiền</span>
                  <span>Mã nội dung</span>
                  <span>Ngày đóng</span>
                  <span>Trạng thái</span>
                  <span>Xác thực / Ghi chú</span>
                </div>
                
                {filteredHistory.map((pay, i) => (
                  <div key={i} className="table-row">
                    <div className="user-info-col">
                      <span className="user-avatar">{pay.user_avatar || '👤'}</span>
                      <div className="user-details">
                        <span className="name">{pay.user_name || pay.username}</span>
                        <span className="username font-monospace">@{pay.username}</span>
                      </div>
                    </div>
                    
                    <span className="amount-col font-monospace font-bold">
                      {pay.amount.toLocaleString('vi-VN')}đ
                    </span>
                    
                    <span className="code-col font-monospace text-info">
                      {pay.transfer_code}
                    </span>
                    
                    <span className="date-col font-monospace text-slate text-sm">
                      {new Date(pay.created_at).toLocaleString('vi-VN', { hour12: false })}
                    </span>
                    
                    <span>
                      <span className={`status-badge-mini ${pay.status.toLowerCase()}`}>
                        {pay.status === 'PENDING' && 'Chờ duyệt'}
                        {pay.status === 'COMPLETED' && 'Đã duyệt'}
                        {pay.status === 'REJECTED' && 'Từ chối'}
                      </span>
                    </span>
                    
                    <div className="verify-col text-slate text-xs">
                      {pay.status === 'COMPLETED' && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                            <ShieldCheck size={12} />
                            <span>Duyệt bởi: {pay.verifier_name}</span>
                          </div>
                          {pay.verified_at && (
                            <span style={{ fontSize: '0.65rem' }}>
                              Lúc: {new Date(pay.verified_at).toLocaleString('vi-VN', { hour12: false })}
                            </span>
                          )}
                        </>
                      )}
                      {pay.status === 'REJECTED' && (
                        <span style={{ color: '#ef4444' }}>
                          Lý do: {pay.notes || 'Từ chối'}
                        </span>
                      )}
                      {pay.status === 'PENDING' && <span className="text-warning">Đang chờ đối soát</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-history">
                <AlertCircle size={32} color="#64748b" />
                <p>Không có giao dịch nào khớp với bộ lọc.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Sub-tab 2: Bảng nợ quỹ thành viên */}
      {activeSubTab === 'members' && (
        <section className="stats-content-section animate-fade">
          <h3 className="section-title">Bảng tổng hợp công nợ thành viên</h3>
          
          <div className="members-table-wrapper">
            {leaderboard.length > 0 ? (
              <div className="members-stats-table">
                <div className="table-header">
                  <span>Thành viên</span>
                  <span className="text-right">Tổng phạt phát sinh</span>
                  <span className="text-right">Đã đóng quỹ</span>
                  <span className="text-right">Còn nợ quỹ</span>
                  <span className="text-center">Tình trạng</span>
                </div>
                
                {leaderboard
                  .slice()
                  .sort((a, b) => b.remaining_fines - a.remaining_fines)
                  .map((mem, i) => (
                    <div key={i} className="table-row">
                      <div className="user-info-col">
                        <span className="user-avatar">{mem.avatar || '👤'}</span>
                        <span className="name font-bold">{mem.name}</span>
                      </div>
                      
                      <span className="text-right font-monospace font-bold text-slate">
                        {(parseInt(mem.total_fines || 0)).toLocaleString('vi-VN')}đ
                      </span>
                      
                      <span className="text-right font-monospace font-bold text-success">
                        {(parseInt(mem.total_paid || 0)).toLocaleString('vi-VN')}đ
                      </span>
                      
                      <span className={`text-right font-monospace font-bold ${parseInt(mem.remaining_fines || 0) > 0 ? 'text-danger' : 'text-success-light'}`}>
                        {(parseInt(mem.remaining_fines || 0)).toLocaleString('vi-VN')}đ
                      </span>
                      
                      <div className="text-center">
                        {parseInt(mem.remaining_fines || 0) > 0 ? (
                          <span className="debt-status-badge owing">Còn nợ</span>
                        ) : parseInt(mem.total_fines || 0) > 0 ? (
                          <span className="debt-status-badge clear">Hoàn tất</span>
                        ) : (
                          <span className="debt-status-badge clean">Trong sạch ✨</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="empty-history">
                <Users size={32} color="#64748b" />
                <p>Chưa có dữ liệu thành viên.</p>
              </div>
            )}
          </div>
        </section>
      )}

      <style>{`
        .fund-stats-container {
          padding: 100px 20px 150px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .page-header-stats {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .stats-glow-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, #ffd200, #ff4e00);
          box-shadow: 0 0 30px rgba(255, 210, 0, 0.3);
          margin-bottom: 20px;
        }
        
        .stats-icon {
          color: white;
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
        }
        
        .stats-title {
          font-size: 2.2rem;
          font-weight: 900;
          color: white;
          letter-spacing: -0.5px;
          margin: 0;
        }
        
        .stats-subtitle {
          color: #64748b;
          margin-top: 10px;
          font-size: 0.95rem;
        }
        
        .stats-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 200px 20px;
        }
        
        .stats-summary-row {
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
        
        .highlight-green {
          color: #10b981;
          text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
        }
        
        .highlight-orange {
          color: #f59e0b;
          text-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
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
        
        .pool-glow { background: #ffd200; }
        .success-glow { background: #10b981; }
        .warning-glow { background: #f59e0b; }
        
        .stats-tab-selectors {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0f1322;
          padding: 6px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.02);
          margin-bottom: 30px;
          max-width: fit-content;
        }
        
        .subtab-btn {
          background: transparent;
          border: none;
          color: #64748b;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
          transition: 0.2s;
        }
        
        .subtab-btn.active {
          background: #1e293b;
          color: #00d2ff;
        }
        
        .stats-refresh-btn {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #64748b;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        
        .stats-refresh-btn:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .stats-content-section {
          background: #111522;
          border: 1px solid rgba(255, 255, 255, 0.02);
          border-radius: 24px;
          padding: 30px;
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 850;
          color: white;
          margin-top: 0;
          margin-bottom: 25px;
          letter-spacing: 0.5px;
          border-left: 3px solid #00d2ff;
          padding-left: 10px;
          font-family: 'Outfit', sans-serif;
        }
        
        .section-header-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }
        
        .controls-group {
          display: flex;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
        }
        
        .history-filters {
          display: flex;
          gap: 6px;
          background: #090d16;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #1e293b;
        }
        
        .filter-badge {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.15s;
        }
        
        .filter-badge.active {
          background: #1e293b;
          color: #ffd200;
        }
        
        .stats-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .stats-search-wrapper .search-icon {
          position: absolute;
          left: 12px;
          color: #475569;
        }
        
        .stats-search-wrapper input {
          padding: 8px 12px 8px 34px;
          border-radius: 8px;
          background: #090d16;
          border: 1px solid #1e293b;
          color: white;
          font-weight: 600;
          font-size: 0.8rem;
          width: 220px;
          transition: 0.2s;
        }
        
        .stats-search-wrapper input:focus {
          outline: none;
          border-color: #00d2ff;
        }
        
        .history-table-wrapper, .members-table-wrapper {
          overflow-x: auto;
        }
        
        .public-history-table {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 900px;
        }
        
        .public-history-table .table-header, .members-stats-table .table-header {
          display: grid;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #475569;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        
        .public-history-table .table-header {
          grid-template-columns: 1.5fr 1fr 1.3fr 1.2fr 1fr 1.8fr;
        }
        
        .public-history-table .table-row, .members-stats-table .table-row {
          display: grid;
          padding: 16px 20px;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.01);
          font-size: 0.85rem;
          color: white;
        }
        
        .public-history-table .table-row {
          grid-template-columns: 1.5fr 1fr 1.3fr 1.2fr 1fr 1.8fr;
        }
        
        .public-history-table .table-row:last-child, .members-stats-table .table-row:last-child {
          border-bottom: none;
        }
        
        .user-info-col {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50%;
          font-size: 1.4rem;
        }
        
        .user-details {
          display: flex;
          flex-direction: column;
        }
        
        .user-details .name {
          font-weight: 700;
        }
        
        .user-details .username {
          color: #64748b;
          font-size: 0.75rem;
        }
        
        .amount-col {
          font-size: 0.9rem;
        }
        
        .font-bold { font-weight: 700; }
        .font-monospace { font-family: monospace; }
        .text-slate { color: #64748b; }
        .text-info { color: #00d2ff; }
        
        .status-badge-mini {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
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
        
        .verify-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .empty-history {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: #64748b;
          gap: 12px;
          font-size: 0.9rem;
        }
        
        /* Members Stats Table */
        .members-stats-table {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 750px;
        }
        
        .members-stats-table .table-header {
          grid-template-columns: 1.8fr 1.2fr 1.2fr 1.2fr 1fr;
        }
        
        .members-stats-table .table-row {
          grid-template-columns: 1.8fr 1.2fr 1.2fr 1.2fr 1fr;
        }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-success { color: #10b981; }
        .text-success-light { color: #34d399; }
        .text-danger { color: #ef4444; }
        
        .debt-status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 800;
        }
        
        .debt-status-badge.owing {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        
        .debt-status-badge.clear {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
        }
        
        .debt-status-badge.clean {
          background: rgba(0, 210, 255, 0.15);
          color: #00d2ff;
        }
      `}</style>
    </div>
  );
};

export default FundStatsView;
