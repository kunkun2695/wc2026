import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, Trophy, Search, Edit3, Settings, 
  Play, Star, LogOut, Shield, History, Bell, MessageSquare, Users, Sparkles, GitBranch
} from 'lucide-react';
import BracketView from './views/BracketView';
import NotificationsDrawer from './components/NotificationsDrawer';
import HomeView from './views/HomeView';
import AdminView from './views/AdminView';
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
import CommentSection from './components/CommentSection';
import UserAvatar from './components/UserAvatar';
import { mockAuth } from './data/mockAuth';
import API_URL from './config';
import { subscribeToPush } from './utils/pushNotifications';

const App = () => {
  const [activeTab, setActiveTab] = useState('home'); // home, social, leaderboard, chat, history, settings, admin_matches, admin_teams, ai, bracket
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
      setUnreadChatCount(data.unread_count || 0);
    } catch (err) {}
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
            <div className="brand-logo-glow" style={{ width: '32px', height: '32px' }}>
              <Trophy size={18} className="brand-icon" />
            </div>
            <span className="font-outfit" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Bench-Bets</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
      </header>

      {/* Sidebar - Modern Professional Version */}
      <aside className={`sidebar ${activeTab === 'notifications' ? 'sidebar-minimized' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-glow">
            <Trophy className="brand-icon" size={24} />
          </div>
          <h1 className="brand-name">Bench-<span>Bets</span></h1>
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
            <button onClick={() => setActiveTab('settings')} className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>
              <div className="active-indicator" />
              <Settings size={18} className="nav-icon" /> <span>Cài đặt hồ sơ</span>
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
                <Edit3 size={18} className="nav-icon" /> <span>Quản lý trận đấu</span>
              </button>
              <button onClick={() => setActiveTab('admin_teams')} className={`nav-item ${activeTab === 'admin_teams' ? 'active' : ''}`}>
                <div className="active-indicator" />
                <Shield size={18} className="nav-icon" /> <span>Quản lý đội bóng</span>
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
              <HistoryView predictions={predictions} matches={matches} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SettingsView user={user} onUpdateUser={handleUpdateUser} />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ChatView user={user} />
            </motion.div>
          )}
          {activeTab === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
              <BracketView matches={matches} />
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
          <button onClick={() => setActiveTab('ai')} className={`nav-item-bet ${activeTab === 'ai' ? 'active' : ''}`}>
            <Sparkles size={20} color={activeTab === 'ai' ? '#00d2ff' : 'currentColor'} />
            <span>Trợ lý AI</span>
          </button>
          <button onClick={() => setActiveTab('social')} className={`nav-item-bet ${activeTab === 'social' ? 'active' : ''}`}>
            <Users size={20} />
            <span>Cộng đồng</span>
          </button>
          <button onClick={() => setActiveTab('bracket')} className={`nav-item-bet ${activeTab === 'bracket' ? 'active' : ''}`}>
            <GitBranch size={20} />
            <span>Nhánh đấu</span>
          </button>
          <button onClick={() => setActiveTab('chat')} className={`nav-item-bet ${activeTab === 'chat' ? 'active' : ''}`} style={{ position: 'relative' }}>
            <MessageSquare size={20} />
            <span>Chat</span>
            {unreadChatCount > 0 && <span className="notif-badge-mini" style={{ top: '5px', right: '15px' }}></span>}
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
        .app-layout { display: flex; min-height: 100vh; background: #0a0e17; }
        
        .sidebar {
          width: 280px; height: 100vh; background: #0f172a; border-right: 1px solid rgba(255,255,255,0.03);
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
          overflow-y: auto;
        }

        .mobile-header { display: none; }
        .notif-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 4900; }

        @media (max-width: 1024px) {
          .sidebar { display: none; }
          .main-content { padding-bottom: 100px; }
          .mobile-header {
            display: block; position: fixed; top: 0; left: 0; right: 0;
            background: #0f172a; z-index: 2000; border-bottom: 1px solid rgba(255,255,255,0.05);
            padding-top: env(safe-area-inset-top, 20px);
          }
        }
      `}</style>
    </div>
  );
};

export default App;
