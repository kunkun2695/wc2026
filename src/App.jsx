import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Trophy, Search, Edit3, Settings, 
  Play, Star, LogOut, Shield, History, Bell, MessageSquare
} from 'lucide-react';
import NotificationsDrawer from './components/NotificationsDrawer';
import HomeView from './views/HomeView';
import AdminView from './views/AdminView';
import AuthView from './views/AuthView';
import TeamsAdminView from './views/TeamsAdminView';
import StandingsView from './views/StandingsView';
import LeaderboardView from './views/LeaderboardView';
import SettingsView from './views/SettingsView';
import HistoryView from './views/HistoryView';
import MatchDetailView from './views/MatchDetailView';
import ChatView from './views/ChatView';
import CommentSection from './components/CommentSection';
import { mockAuth } from './data/mockAuth';
import API_URL from './config';
import { subscribeToPush } from './utils/pushNotifications';

const App = () => {
  const [activeTab, setActiveTab] = useState('home');
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

    // Auto-fetch notifications every 30 seconds
    const interval = setInterval(() => {
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
      setUnreadChatCount(data.count || 0);
    } catch (err) {}
  };

  const fetchData = async () => {
    try {
      const host = window.location.hostname;
      const [teamsRes, matchesRes, predsRes, lbRes] = await Promise.all([
        fetch(`${API_URL}/api/teams`),
        fetch(`${API_URL}/api/matches`),
        fetch(`${API_URL}/api/predictions/my`, {
          headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
        }),
        fetch(`${API_URL}/api/predictions/leaderboard`)
      ]);
      const teamsData = await teamsRes.json();
      const matchesData = await matchesRes.json();
      const predsData = await predsRes.json();
      const lbData = await lbRes.json();

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
        icon: notif.sender_avatar || '/favicon.ico'
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
    } catch (err) {}
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
    } catch (err) {}
  };

  const handleNotificationClick = async (notif) => {
    try {
      const host = window.location.hostname;
      await fetch(`${API_URL}/api/notifications/${notif.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${mockAuth.getToken()}` }
      });
      fetchNotifications();
      setSelectedMatchId(notif.match_id);
      setActiveTab('match_detail');
      setShowNotifications(false);
      requestNotificationPermission(); // Request on interaction
    } catch (err) {}
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
      if (res.ok) {
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
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

  if (!user) return <AuthView onLogin={(u) => setUser(u)} />;

  const handleOpenComments = (match) => {
    setCommentMatch(match);
  };

  return (
    <div className="app-layout">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={22} color="var(--primary-cyan)" />
            <span className="font-outfit" style={{ fontWeight: 800, fontSize: '1.2rem' }}>Bench-Bets</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => { setShowNotifications(true); requestNotificationPermission(); }} className="mobile-notif-btn">
              <Bell size={20} />
              {notifications.some(n => !n.is_read) && <span className="notif-badge-mini"></span>}
            </button>
            <button onClick={handleLogout} className="mobile-logout-btn">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Bench-Bets Style */}
      <aside className="sidebar">
        <div className="sidebar-logo" style={{ marginBottom: '30px', padding: '0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={24} color="var(--primary-cyan)" />
            <h1 className="font-outfit" style={{ fontSize: '1.4rem', fontWeight: 800 }}>Bench-Bets</h1>
          </div>
        </div>

        <nav className="nav-menu">
          <button onClick={() => setActiveTab('home')} className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}>
            <Home size={18} /> Trang chủ
          </button>
          <button onClick={() => setActiveTab('leaderboard')} className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}>
            <Star size={18} /> Bảng xếp hạng
          </button>
          <button onClick={() => setActiveTab('history')} className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}>
            <History size={18} /> Lịch sử dự đoán
          </button>
          <button onClick={() => setActiveTab('chat')} className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}>
            <MessageSquare size={18} /> Phòng Chat
            {unreadChatCount > 0 && <span className="notif-count-badge">{unreadChatCount}</span>}
          </button>
          <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
            <Settings size={18} /> Cài đặt hồ sơ
          </button>

          {user?.role === 'admin' && (
            <>
              <div style={{ margin: '20px 0', borderTop: '1px solid var(--border-color)' }}></div>
              <div style={{ margin: '10px 0', fontSize: '0.65rem', color: '#555', padding: '0 16px', fontWeight: 800 }}>QUẢN TRỊ VIÊN</div>
              <button onClick={() => setActiveTab('admin_matches')} className={`nav-item ${activeTab === 'admin_matches' ? 'active' : ''}`}>
                <Edit3 size={18} /> Quản lý trận đấu
              </button>
              <button onClick={() => setActiveTab('admin_teams')} className={`nav-item ${activeTab === 'admin_teams' ? 'active' : ''}`}>
                <Settings size={18} /> Quản lý đội bóng
              </button>
            </>
          )}

          <button onClick={() => { setShowNotifications(true); requestNotificationPermission(); }} className={`nav-item ${showNotifications ? 'active' : ''}`}>
            <Bell size={18} /> Thông báo
            {notifications.some(n => !n.is_read) && <span className="notif-count-badge">{notifications.filter(n => !n.is_read).length}</span>}
          </button>

          <button onClick={handleLogout} className="nav-item" style={{ marginTop: 'auto', color: '#ff4d4d' }}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </nav>
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
              />
            </motion.div>
          )}
          {activeTab === 'leaderboard' && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LeaderboardView leaderboard={leaderboard} />
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div key="hi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <HistoryView predictions={predictions} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsView user={user} onUpdateUser={handleUpdateUser} />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChatView />
            </motion.div>
          )}
          {activeTab === 'admin_matches' && (
            <motion.div key="am" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminView 
                matches={matches} 
                onUpdateScore={updateMatchScore} 
                onSync={syncMatches}
              />
            </motion.div>
          )}
          {activeTab === 'admin_teams' && (
            <motion.div key="at" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TeamsAdminView teams={teams} onRefresh={fetchData} />
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

      {/* Mobile Nav */}
      <nav className="mobile-nav-container">
        <div className="bottom-nav-bet">
          <button onClick={() => setActiveTab('home')} className={`nav-item-bet ${activeTab === 'home' ? 'active' : ''}`}>
            <Home size={20} />
            <span>Trận đấu</span>
          </button>
          <button onClick={() => setActiveTab('leaderboard')} className={`nav-item-bet ${activeTab === 'leaderboard' ? 'active' : ''}`}>
            <Star size={20} />
            <span>Xếp hạng</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`nav-item-bet ${activeTab === 'history' ? 'active' : ''}`}>
            <History size={20} />
            <span>Lịch sử</span>
          </button>
          <button onClick={() => setActiveTab('chat')} className={`nav-item-bet ${activeTab === 'chat' ? 'active' : ''}`} style={{ position: 'relative' }}>
            <MessageSquare size={20} />
            <span>Chat</span>
            {unreadChatCount > 0 && <span className="notif-badge-mini" style={{ top: '5px', right: '15px' }}></span>}
          </button>
          <button onClick={() => setActiveTab('settings')} className={`nav-item-bet ${activeTab === 'settings' ? 'active' : ''}`}>
            <Settings size={20} />
            <span>Cài đặt</span>
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => setActiveTab('admin_matches')} className={`nav-item-bet ${activeTab === 'admin_matches' ? 'active' : ''}`}>
              <Shield size={20} />
              <span>Admin</span>
            </button>
          )}
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
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #0d121d;
          border-bottom: 1px solid var(--border-color);
          z-index: 2000;
          padding-top: env(safe-area-inset-top, 20px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .mobile-header-content {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        }
        .mobile-logout-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          color: #ff4d4d;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mobile-notif-btn {
          background: rgba(58, 134, 255, 0.1);
          border: 1px solid rgba(58, 134, 255, 0.2);
          color: #3b82f6;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .notif-badge-mini {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #ff4d4d;
          border-radius: 50%;
          border: 2px solid #0d121d;
        }
        .notif-count-badge {
          background: #ff4d4d;
          color: white;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: auto;
        }
        .notif-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 4900;
        }
        @media (max-width: 1024px) {
          .mobile-header { display: block; }
          .main-content { 
            padding-top: calc(80px + env(safe-area-inset-top, 20px)); 
            padding-bottom: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
