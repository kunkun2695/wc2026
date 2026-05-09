import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Trophy, Calendar, Settings, Menu, X, Shield, Globe, User, LogOut } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, activeTab, setActiveTab, user, onLogout }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="sidebar-overlay"
        />
        <motion.div 
          initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="sidebar"
        >
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <h2 className="text-xl font-black leading-none tracking-tighter">WC 2026</h2>
                <span className="text-[10px] font-black text-accent-green uppercase tracking-widest">Tracker</span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
          </div>

          <div className="flex flex-col flex-1 gap-1">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 ml-4">Menu chính</p>
            <button onClick={() => { setActiveTab('home'); onClose(); }} className={`sidebar-item ${activeTab === 'home' ? 'active' : ''}`}>
              <Home size={18} /> Trang chủ
            </button>
            <button onClick={() => { setActiveTab('standings'); onClose(); }} className={`sidebar-item ${activeTab === 'standings' ? 'active' : ''}`}>
              <Trophy size={18} /> Bảng xếp hạng
            </button>
            
            {user?.role === 'admin' && (
              <div className="mt-6">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 ml-4">Hệ thống Quản trị</p>
                <button onClick={() => { setActiveTab('admin_matches'); onClose(); }} className={`sidebar-item ${activeTab === 'admin_matches' ? 'active' : ''}`}>
                  <Shield size={18} /> Quản trị Trận đấu
                </button>
                <button onClick={() => { setActiveTab('admin_teams'); onClose(); }} className={`sidebar-item ${activeTab === 'admin_teams' ? 'active' : ''}`}>
                  <Globe size={18} /> Quản lý Đội bóng
                </button>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-accent-green flex items-center justify-center overflow-hidden text-xl shadow-lg border border-white/10">
                {user?.avatar && user.avatar.startsWith('data:image') ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.avatar || '👤'
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-xs truncate">{user?.name || user?.username}</p>
                <p className="text-[10px] text-white/40 truncate">@{user?.username}</p>
              </div>
            </div>
            <div className="mt-4 px-3">
              <div className={`flex items-center gap-2 p-2 rounded-lg ${user ? 'bg-accent-green/10' : 'bg-red-500/10'}`}>
                <div className={`w-2 h-2 rounded-full ${user ? 'bg-accent-green' : 'bg-red-500'} animate-pulse`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
                  {user ? 'Connected to PostgreSQL' : 'Database Offline'}
                </span>
              </div>
            </div>
            <button onClick={onLogout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-xs hover:bg-red-500/20 transition-all mt-4">
              <LogOut size={14} /> Đăng xuất
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default Sidebar;
