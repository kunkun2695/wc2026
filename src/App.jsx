import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Trophy, Search, Edit3, Settings,
  Play, Star, LogOut, Shield, History, Bell, MessageSquare, Users, Sparkles, GitBranch, Calendar, BookOpen, CreditCard, BarChart2
} from 'lucide-react';
import BracketView from './views/BracketView';
import NotificationsDrawer from './components/NotificationsDrawer';
import HomeView from './views/HomeView';
import AdminView from './views/AdminView';
import MatchManagementView from './views/MatchManagementView';
import AuthView from './views/AuthView';
import TeamsView from './views/TeamsView';
import StandingsView from './views/StandingsView';
import LeaderboardView from './views/LeaderboardView';
import SettingsView from './views/SettingsView';
import HistoryView from './views/HistoryView';
import MatchDetailView from './views/MatchDetailView';
import ChatView from './views/ChatView';
import SocialView from './views/SocialView';
import AiAssistantView from './views/AiAssistantView';
import UsersManagementView from './views/UsersManagementView';
import DailyStatsView from './views/DailyStatsView';
import RulesView from './views/RulesView';
import PaymentView from './views/PaymentView';
import PaymentManagementView from './views/PaymentManagementView';
import FundStatsView from './views/FundStatsView';
import CommentSection from './components/CommentSection';
import UserAvatar from './components/UserAvatar';
import { mockAuth } from './data/mockAuth';
import API_URL from './config';
import { subscribeToPush } from './utils/pushNotifications';

const App = () => {
  const [activeTab, setActiveTab] = useState('home'); // home, social, leaderboard, stats, chat, history, settings, admin_matches, admin_teams, admin_users, admin_system, ai, bracket, rules
  const [hideHeader, setHideHeader] = useState(false);
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [lastNotifId, setLastNotifId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentMatch, setCommentMatch] = useState(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showFundFeatures, setShowFundFeatures] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const savedUser = mockAuth.getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
        if ('Notification' in window && Notification.permission === 'granted') {
          subscribeToPush();
        }
      }
      await fetchData();
      fetchNotifications();
      fetchUnreadChatCount();
    };
    checkSession();

    // Auto-fetch data and notifications every 30 seconds
    const interval = setInterval(() => {
      fetchData();
      if (mockAuth.getCurrentUser()) {
        fetchNotifications();
        fetchUnreadChatCount();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadChatCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dm/unread-count`, {
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      const data = await res.json();
      setUnreadChatCount(data.unread_count || 0);
    } catch (err) { }
  };

  // Poll for notifications and counts every 10s
  useEffect(() => {
    const token = mockAuth.getToken();
    if (!token) return;

    const interval = setInterval(() => {
      fetchUnreadChatCount();
      fetchNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const host = window.location.hostname;
      const token = mockAuth.getToken();
      
      const fetchPromises = [
        fetch(`${API_URL}/api/teams`),
        fetch(`${API_URL}/api/matches`),
        fetch(`${API_URL}/api/predictions/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/predictions/leaderboard`)
      ];

      if (token) {
        fetchPromises.push(
          fetch(`${API_URL}/api/config/bank`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        );
      }

      const results = await Promise.all(fetchPromises);
      const teamsData = await results[0].json();
      const matchesData = await results[1].json();
      const predsData = await results[2].json();
      const lbData = await results[3].json();

      if (token && results[4]) {
        try {
          const bankData = await results[4].json();
          setShowFundFeatures(bankData.SHOW_FUND_FEATURES !== 'false');
        } catch (e) {
          console.error('Lỗi phân tích config bank:', e);
        }
      }

      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setPredictions(Array.isArray(predsData) ? predsData : []);
      setLeaderboard(Array.isArray(lbData) ? lbData : []);
    } catch (err) {
      console.error('Lỗi fetch data');
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('Trình duyệt không hỗ trợ thông báo.');
      // alert('Trình duyệt của bạn không hỗ trợ thông báo đẩy. Trên iPhone, bạn cần thêm ứng dụng vào Màn hình chính (Add to Home Screen) để sử dụng tính năng này.');
      return;
    }

    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
      console.warn('Thông báo yêu cầu HTTPS.');
      // alert('Thông báo đẩy yêu cầu kết nối bảo mật (HTTPS). Vui lòng sử dụng HTTPS hoặc localhost.');
      return;
    }

    if (Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Đã cấp quyền thông báo');
          subscribeToPush();
        }
      } catch (err) {
        console.error('Lỗi yêu cầu quyền thông báo:', err);
      }
    } else if (Notification.permission === 'denied') {
      // alert('Bạn đã chặn thông báo. Vui lòng bật lại trong cài đặt trình duyệt.');
    }
  };

  const showPushNotification = (notif) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification('Gáy World Cup 2026', {
        body: notif.content,
        icon: notif.sender_avatar || '/favicon.svg'
      });
      n.onclick = () => {
        window.focus();
        handleNotificationClick(notif);
      };
    }
  };

  const fetchNotifications = async () => {
    try {
      const host = window.location.hostname;
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      const data = await res.json();
      const notifs = Array.isArray(data) ? data : [];

      // Check for new notifications to show push alert
      if (notifs.length > 0) {
        const newest = notifs[0];
        if (lastNotifId && newest.id > lastNotifId && !newest.is_read) {
          showPushNotification(newest);
        }
        setLastNotifId(newest.id);
      }

      setNotifications(notifs);
    } catch (err) {
      console.error('Lỗi fetch notifications');
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const host = window.location.hostname;
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      fetchNotifications();
    } catch (err) { }
  };

  const deleteAllNotifications = async () => {
    if (!window.confirm('Xóa toàn bộ thông báo?')) return;
    try {
      const host = window.location.hostname;
      await fetch(`${API_URL}/api/notifications`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      setNotifications([]);
    } catch (err) { }
  };

  const handleNotificationClick = async (notif) => {
    try {
      const host = window.location.hostname;
      await fetch(`${API_URL}/api/notifications/${notif.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      fetchNotifications();
      
      if (notif.url === '/payment') {
        setActiveTab('payment');
      } else if (notif.url === '/admin_payments') {
        setActiveTab('admin_payments');
      } else if (notif.match_id) {
        setSelectedMatchId(notif.match_id);
        setActiveTab('match_detail');
      }
      
      setShowNotifications(false);
      requestNotificationPermission(); // Request on interaction
    } catch (err) { }
  };

  const savePrediction = async (match_id, home_score, away_score) => {
    try {
      const host = window.location.hostname;
      const res = await fetch(`${API_URL}/api/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockAuth.getToken()}`
        },
        body: JSON.stringify({ match_id, home_score, away_score })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Dự đoán của bạn đã được lưu thành công!');
        fetchData();
        return true;
      }
      alert('Lỗi: ' + (data.error || 'Không thể lưu dự đoán'));
      return false;
    } catch (err) {
      alert('Lỗi mạng: Không thể kết nối tới máy chủ');
      return false;
    }
  };

  const updateMatchScore = async (id, data) => {
    const host = window.location.hostname;
    const res = await fetch(`${API_URL}/api/matches/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockAuth.getToken()}`
      },
      body: JSON.stringify(data)
    });
    if (res.ok) fetchData();
  };

  const syncMatches = async () => {
    try {
      const host = window.location.hostname;
      const res = await fetch(`${API_URL}/api/matches/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockAuth.getToken()}`
        }
      });
      const data = await res.json();
      alert(data.message || 'Đã đồng bộ thành công!');
      fetchData();
    } catch (err) {
      alert('Lỗi đồng bộ dữ liệu!');
    }
  };

  const handleLogout = () => {
    mockAuth.logout();
    setUser(null);
    setActiveTab('home');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    mockAuth.setUser(updatedUser);
  };

  if (!user) return (
    <AuthView 
      onLogin={(u) => { 
        setUser(u); 
        fetchData();
        fetchNotifications();
        fetchUnreadChatCount();
      }} 
    />
  );

  const handleOpenComments = (match) => {
    setCommentMatch(match);
  };

  return (
    <div className="app-layout">
      {/* Mobile Header - Conditionally hidden */}
      {!hideHeader && (
        <header className="mobile-header">
          <div className="mobile-header-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-logo-glow" style={{ width: '32px', height: '32px' }}>
                <Trophy size={18} className="brand-icon" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span className="font-outfit" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>KizzBugs</span>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace' }}>v1.1.63</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => setShowAdminMenu(!showAdminMenu)} 
                  className={`mobile-admin-btn ${showAdminMenu ? 'active' : ''}`}
                  title="Quản trị viên"
                >
                  <Shield size={18} />
                </button>
              )}
              <button onClick={() => { setShowNotifications(true); requestNotificationPermission(); }} className="mobile-notif-btn">
                <Bell size={18} />
                {notifications.some(n => !n.is_read) && <span className="notif-badge-mini" style={{ top: '6px', right: '6px' }}></span>}
              </button>
              <button onClick={() => setActiveTab('settings')} className="mobile-notif-btn">
                <Settings size={18} />
              </button>
              <button onClick={handleLogout} className="mobile-logout-btn">
                <LogOut size={18} />
              </button>
            </div>
          </div>
          {/* Admin Dropdown Panel */}
          {showAdminMenu && user?.role === 'admin' && (
            <>
              <div className="admin-menu-overlay" onClick={() => setShowAdminMenu(false)} />
              <div className="mobile-admin-dropdown">
                <div className="admin-dropdown-header">
                  <Shield size={14} color="#ffd200" />
                  <span>BẢNG ĐIỀU HÀNH ADMIN</span>
                </div>
                <div className="admin-dropdown-list">
                  <button 
                    onClick={() => { setActiveTab('admin_matches'); setShowAdminMenu(false); }} 
                    className={`admin-dropdown-item ${activeTab === 'admin_matches' ? 'active' : ''}`}
                  >
                    <Play size={16} />
                    <span>Quản lý trận đấu</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('admin_teams'); setShowAdminMenu(false); }} 
                    className={`admin-dropdown-item ${activeTab === 'admin_teams' ? 'active' : ''}`}
                  >
                    <Shield size={16} />
                    <span>Quản lý đội bóng</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('admin_users'); setShowAdminMenu(false); }} 
                    className={`admin-dropdown-item ${activeTab === 'admin_users' ? 'active' : ''}`}
                  >
                    <Users size={16} />
                    <span>Quản lý thành viên</span>
                  </button>
                  {showFundFeatures && (
                    <button 
                      onClick={() => { setActiveTab('admin_payments'); setShowAdminMenu(false); }} 
                      className={`admin-dropdown-item ${activeTab === 'admin_payments' ? 'active' : ''}`}
                    >
                      <CreditCard size={16} color="#ffd200" />
                      <span>Xác thực đóng quỹ</span>
                    </button>
                  )}
                  <button 
                    onClick={() => { setActiveTab('admin_system'); setShowAdminMenu(false); }} 
                    className={`admin-dropdown-item ${activeTab === 'admin_system' ? 'active' : ''}`}
                  >
                    <Settings size={16} />
                    <span>Cài đặt hệ thống</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </header>
      )}

      {/* Sidebar - Modern Professional Version */}
      <aside className={`sidebar ${activeTab === 'notifications' ? 'sidebar-minimized' : ''}`}>
        <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo-glow">
              <Trophy className="brand-icon" size={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <h1 className="brand-name">KizzBugs</h1>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'monospace', marginTop: '2px' }}>v1.1.63</span>
            </div>
          </div>
        </div>

        <nav className="nav-menu">
          <div className="nav-group">
            <div className="nav-label">TRANG CHỦ</div>
            <button onClick={() => setActiveTab('home')} className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <Home size={18} className="nav-icon" /> <span>Trang chủ</span>
            </button>
            <button onClick={() => setActiveTab('leaderboard')} className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <Trophy size={18} className="nav-icon" /> <span>Bảng xếp hạng</span>
            </button>
             {showFundFeatures && (
              <button onClick={() => setActiveTab('fund_stats')} className={`nav-item ${activeTab === 'fund_stats' ? 'active' : ''}`}>
                <div className="active-indicator" />
                <BarChart2 size={18} className="nav-icon" color="#ffd200" /> <span>Thống kê quỹ 📊</span>
              </button>
            )}
            <button onClick={() => setActiveTab('stats')} className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <Calendar size={18} className="nav-icon" /> <span>Thống kê hằng ngày</span>
            </button>
            <button onClick={() => setActiveTab('social')} className={`nav-item ${activeTab === 'social' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <Users size={18} className="nav-icon" /> <span>Cộng đồng</span>
            </button>
            <button onClick={() => setActiveTab('bracket')} className={`nav-item ${activeTab === 'bracket' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <GitBranch size={18} className="nav-icon" /> <span>Nhánh đấu WC</span>
            </button>
            <button onClick={() => setActiveTab('chat')} className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <div className="icon-badge-wrapper">
                <MessageSquare size={18} className="nav-icon" />
                {unreadChatCount > 0 && <span className="icon-badge">{unreadChatCount}</span>}
              </div>
              <span>Phòng Chat</span>
            </button>
            <button onClick={() => setActiveTab('ai')} className={`nav-item ${activeTab === 'ai' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <Sparkles size={18} className="nav-icon" color="#00d2ff" />
              <span style={{ color: activeTab === 'ai' ? '#00d2ff' : 'inherit' }}>Trợ lý AI</span>
            </button>
          </div>

          <div className="nav-group">
            <div className="nav-label">CÁ NHÂN</div>
            <button onClick={() => setActiveTab('history')} className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <History size={18} className="nav-icon" /> <span>Lịch sử dự đoán</span>
            </button>
             {showFundFeatures && (
              <button onClick={() => setActiveTab('payment')} className={`nav-item ${activeTab === 'payment' ? 'active' : ''}`}>
                <div className="active-indicator" />
                <CreditCard size={18} className="nav-icon" color="#00d2ff" /> <span>Đóng quỹ 💸</span>
              </button>
            )}
            <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <Settings size={18} className="nav-icon" /> <span>Cài đặt hồ sơ</span>
            </button>
            <button onClick={() => setActiveTab('rules')} className={`nav-item ${activeTab === 'rules' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <BookOpen size={18} className="nav-icon" /> <span>Luật chơi & Thể lệ</span>
            </button>
            <button onClick={() => { setShowNotifications(true); requestNotificationPermission(); }} className={`nav-item ${showNotifications ? 'active' : ''}`}>
              <div className="active-indicator" />
              <div className="icon-badge-wrapper">
                <Bell size={18} className="nav-icon" />
                {notifications.some(n => !n.is_read) && <span className="icon-badge">{notifications.filter(n => !n.is_read).length}</span>}
              </div>
              <span>Thông báo</span>
            </button>
          </div>

          {user?.role === 'admin' && (
            <div className="nav-group admin-section">
              <div className="nav-label">QUẢN TRỊ VIÊN</div>
              <button onClick={() => setActiveTab('admin_matches')} className={`nav-item ${activeTab === 'admin_matches' ? 'active' : ''}`}>
                <div className="active-indicator" />
                <Play size={18} className="nav-icon" /> <span>Quản lý trận đấu</span>
              </button>
              <button onClick={() => setActiveTab('admin_teams')} className={`nav-item ${activeTab === 'admin_teams' ? 'active' : ''}`}>
                <div className="active-indicator" />
                <Shield size={18} className="nav-icon" /> <span>Quản lý đội bóng</span>
              </button>
              <button onClick={() => setActiveTab('admin_users')} className={`nav-item ${activeTab === 'admin_users' ? 'active' : ''}`}>
                <div className="active-indicator" />
                <Users size={18} className="nav-icon" /> <span>Quản lý thành viên</span>
              </button>
              {showFundFeatures && (
                <button onClick={() => setActiveTab('admin_payments')} className={`nav-item ${activeTab === 'admin_payments' ? 'active' : ''}`}>
                  <div className="active-indicator" />
                  <CreditCard size={18} className="nav-icon" color="#ffd200" /> <span>Xác thực đóng quỹ</span>
                </button>
              )}
              <button onClick={() => setActiveTab('admin_system')} className={`nav-item ${activeTab === 'admin_system' ? 'active' : ''}`}>
                <div className="active-indicator" />
                <Settings size={18} className="nav-icon" /> <span>Cài đặt hệ thống</span>
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-mini">
            <UserAvatar
              src={user?.avatar}
              className="user-avatar-mini"
              size={36}
            />
            <div className="user-details-mini">
              <div className="user-name-mini">{user?.name || user?.username}</div>
              <div className="user-role-mini">{user?.role === 'admin' ? 'Administrator' : 'Betting Expert'}</div>
            </div>
            <button onClick={handleLogout} className="logout-icon-btn" title="Đăng xuất">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HomeView
                matches={matches}
                predictions={predictions}
                onSavePrediction={savePrediction}
                onRefreshMatches={fetchData}
                onOpenComments={handleOpenComments}
                onViewDetails={(matchId) => {
                  setSelectedMatchId(matchId);
                  setActiveTab('match_detail');
                }}
              />
            </motion.div>
          )}
          {activeTab === 'leaderboard' && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LeaderboardView leaderboard={leaderboard} onNavigate={setActiveTab} showFundFeatures={showFundFeatures} />
            </motion.div>
          )}
          {activeTab === 'fund_stats' && (
            <motion.div key="fs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FundStatsView />
            </motion.div>
          )}
          {activeTab === 'payment' && (
            <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PaymentView />
            </motion.div>
          )}
          {activeTab === 'admin_payments' && (
            <motion.div key="ap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PaymentManagementView />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DailyStatsView matches={matches} />
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="hi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HistoryView predictions={predictions} matches={matches} />
            </motion.div>
          )}
          {activeTab === 'rules' && (
            <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RulesView />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsView user={user} onUpdateUser={handleUpdateUser} />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <ChatView user={user} onToggleHeader={setHideHeader} />
            </motion.div>
          )}
          {activeTab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <AiAssistantView />
            </motion.div>
          )}
          {activeTab === 'social' && (
            <motion.div key="social" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SocialView onOpenComments={handleOpenComments} />
            </motion.div>
          )}
          {activeTab === 'bracket' && (
            <motion.div key="bracket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BracketView matches={matches} user={user} onRefresh={fetchData} />
            </motion.div>
          )}
          {activeTab === 'admin_matches' && (
            <motion.div key="am" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MatchManagementView
                matches={matches}
                predictions={predictions}
                onSavePrediction={savePrediction}
                onRefreshMatches={fetchData}
                onOpenComments={handleOpenComments}
                onUpdateScore={updateMatchScore}
                onSync={syncMatches}
              />
            </motion.div>
          )}
          {activeTab === 'admin_system' && (
            <motion.div key="as" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminView />
            </motion.div>
          )}
          {activeTab === 'admin_users' && (
            <motion.div key="au" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UsersManagementView />
            </motion.div>
          )}
          {activeTab === 'admin_teams' && (
            <motion.div key="at" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TeamsView teams={teams} onRefresh={fetchData} />
            </motion.div>
          )}
          {activeTab === 'match_detail' && (
            <motion.div key="md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MatchDetailView
                matchId={selectedMatchId}
                onBack={() => setActiveTab('home')}
                matches={matches}
                predictions={predictions}
                onSavePrediction={savePrediction}
                onRefreshMatches={fetchData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="mobile-nav-container">
        <div className="bottom-nav-bet">
          <button onClick={() => setActiveTab('home')} className={`nav-item-bet ${activeTab === 'home' ? 'active' : ''}`}>
            <Home size={20} />
            <span>Trận đấu</span>
          </button>
          <button onClick={() => setActiveTab('leaderboard')} className={`nav-item-bet ${activeTab === 'leaderboard' ? 'active' : ''}`}>
            <Trophy size={20} />
            <span>Xếp hạng</span>
          </button>
          {showFundFeatures && (
            <button onClick={() => setActiveTab('payment')} className={`nav-item-bet ${activeTab === 'payment' ? 'active' : ''}`}>
              <CreditCard size={20} color="#00d2ff" />
              <span style={{ color: activeTab === 'payment' ? '#00d2ff' : 'inherit' }}>Đóng quỹ</span>
            </button>
          )}
          <button onClick={() => setActiveTab('stats')} className={`nav-item-bet ${activeTab === 'stats' ? 'active' : ''}`}>
            <Calendar size={20} />
            <span>Thống kê</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`nav-item-bet ${activeTab === 'history' ? 'active' : ''}`}>
            <History size={20} />
            <span>Lịch sử</span>
          </button>
          <button onClick={() => setActiveTab('rules')} className={`nav-item-bet ${activeTab === 'rules' ? 'active' : ''}`}>
            <BookOpen size={20} />
            <span>Luật chơi</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="notif-overlay"
              onClick={() => setShowNotifications(false)}
            />
            <NotificationsDrawer
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAsRead={markNotificationsAsRead}
              onDeleteAll={deleteAllNotifications}
              onNotificationClick={handleNotificationClick}
              onRequestPermission={requestNotificationPermission}
            />
          </>
        )}

        {commentMatch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="notif-overlay"
              style={{ zIndex: 5900 }}
              onClick={() => setCommentMatch(null)}
            />
            <CommentSection
              matchId={commentMatch.id}
              matchTitle={`${commentMatch.team1_name} vs ${commentMatch.team2_name}`}
              onClose={() => setCommentMatch(null)}
              onCommentChange={fetchData}
            />
          </>
        )}
      </AnimatePresence>

      <style>{`
        .app-layout { display: flex; min-height: 100vh; background: transparent; }
        
        .sidebar {
          width: 280px; height: 100vh; background: rgba(15, 23, 42, 0.7); border-right: 1px solid rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          display: flex; flex-direction: column; position: sticky; top: 0; z-index: 1000;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar-brand {
          padding: 30px 25px; display: flex; align-items: center; gap: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.02);
        }
        .brand-logo-glow {
          width: 42px; height: 42px; background: linear-gradient(135deg, #00d2ff, #3a7bd5);
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(0, 210, 255, 0.2);
        }
        .brand-icon { color: white; filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
        .brand-name { font-size: 1.4rem; font-weight: 900; color: white; letter-spacing: -0.5px; margin: 0; }
        .brand-name span { color: #00d2ff; }

        .nav-menu { flex: 1; padding: 25px 12px; overflow-y: auto; }
        .nav-group { margin-bottom: 25px; }
        .nav-label { 
          font-size: 0.65rem; color: #475569; font-weight: 800; letter-spacing: 1.5px;
          margin-bottom: 12px; padding-left: 15px;
        }

        .nav-item {
          width: 100%; border: none; background: transparent; padding: 12px 15px;
          border-radius: 12px; display: flex; align-items: center; gap: 12px;
          color: #94a3b8; cursor: pointer; transition: 0.2s; position: relative;
          margin-bottom: 4px; font-weight: 600; font-size: 0.9rem;
          text-align: left;
        }
        .nav-item:hover { color: #f1f5f9; background: rgba(255,255,255,0.03); }
        .nav-item.active { 
          background: linear-gradient(90deg, rgba(0, 210, 255, 0.08), transparent);
          color: #00d2ff; font-weight: 700;
        }
        .active-indicator {
          position: absolute; left: 0; top: 25%; height: 50%; width: 3px;
          background: #00d2ff; border-radius: 0 4px 4px 0; opacity: 0; transition: 0.3s;
          box-shadow: 0 0 10px #00d2ff;
        }
        .nav-item.active .active-indicator { opacity: 1; }
        .nav-icon { transition: 0.2s; opacity: 0.7; }
        .nav-item.active .nav-icon { opacity: 1; filter: drop-shadow(0 0 5px rgba(0,210,255,0.4)); }

        .icon-badge-wrapper { position: relative; }
        .icon-badge {
          position: absolute; top: -8px; right: -8px; background: #ef4444;
          color: white; font-size: 9px; font-weight: 900; min-width: 16px; height: 16px;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          border: 2px solid #0f172a;
        }

        .sidebar-footer { padding: 20px 12px; border-top: 1px solid rgba(255,255,255,0.02); }
        .user-profile-mini {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
          padding: 10px; border-radius: 16px; display: flex; align-items: center; gap: 10px;
        }
        .user-avatar-mini { width: 36px; height: 36px; border-radius: 10px; border: 1.5px solid rgba(0,210,255,0.2); object-fit: cover; }
        .user-details-mini { flex: 1; min-width: 0; }
        .user-name-mini { color: #f1f5f9; font-weight: 700; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role-mini { color: #475569; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; }
        
        .logout-icon-btn {
          background: rgba(239, 68, 68, 0.08); border: none; color: #f87171;
          width: 30px; height: 30px; border-radius: 8px; display: flex;
          align-items: center; justify-content: center; cursor: pointer; transition: 0.2s;
        }
        .logout-icon-btn:hover { background: #ef4444; color: white; }

        .main-content { 
          flex: 1; 
          min-width: 0; 
          position: relative; 
          height: 100vh;
          height: 100dvh;
          overflow: ${activeTab === 'chat' || activeTab === 'ai' ? 'hidden' : 'auto'};
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          background: transparent;
        }

        .mobile-header { display: none; }
        .notif-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 4900; }

        @media (max-width: 1024px) {
          .sidebar { display: none; }
          .main-content { 
            padding-top: ${hideHeader ? 'env(safe-area-inset-top, 20px)' : 'calc(60px + env(safe-area-inset-top, 20px))'}; 
            padding-bottom: 80px; 
            height: 100vh;
            height: 100dvh;
            overflow: ${activeTab === 'chat' || activeTab === 'ai' ? 'hidden' : 'auto'};
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
          }
          .mobile-header {
            display: block; position: fixed; top: 0; left: 0; right: 0;
            background: #0f172a; z-index: 2000; border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-top: env(safe-area-inset-top, 20px);
            height: calc(60px + env(safe-area-inset-top, 20px));
          }
        }

        /* Mobile Admin Menu Styles */
        .mobile-admin-btn {
          background: rgba(0, 210, 255, 0.08);
          border: 1px solid rgba(0, 210, 255, 0.2);
          color: #00d2ff;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
          position: relative;
        }
        .mobile-admin-btn:hover, .mobile-admin-btn.active {
          background: rgba(255, 210, 0, 0.12);
          border-color: #ffd200;
          color: #ffd200;
          box-shadow: 0 0 10px rgba(255, 210, 0, 0.2);
        }

        .admin-menu-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(2px);
          z-index: 1999;
        }

        .mobile-admin-dropdown {
          position: absolute;
          top: calc(100% + 5px);
          right: 15px;
          width: 220px;
          background: #172033;
          border: 1px solid rgba(255, 210, 0, 0.3);
          border-radius: 16px;
          padding: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
          z-index: 2000;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .admin-dropdown-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px 6px 12px;
          font-size: 0.7rem;
          font-weight: 900;
          color: #64748b;
          letter-spacing: 1px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 6px;
        }

        .admin-dropdown-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .admin-dropdown-item {
          width: 100%;
          border: none;
          background: transparent;
          padding: 10px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #94a3b8;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .admin-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.03);
          color: white;
        }

        .admin-dropdown-item.active {
          background: rgba(255, 210, 0, 0.08);
          color: #ffd200;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default App;
