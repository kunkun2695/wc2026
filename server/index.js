const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');

// Nạp cấu hình ENV ngay đầu tiên
dotenv.config({ path: path.join(__dirname, '../.env') });

const { syncMatches } = require('./services/syncService');
const db = require('./config/db');

// Tự động vá Database khi khởi động
async function patchDatabase() {
  try {
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general'`);
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255)`);
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT`);
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS url VARCHAR(255) DEFAULT '/'`);
    // Chuyển content cũ sang message nếu cần
    await db.query(`UPDATE notifications SET message = content WHERE message IS NULL AND content IS NOT NULL`).catch(() => {});
    
    // Vá bảng matches để hỗ trợ phân loại giải đấu
    await db.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS competition_name TEXT DEFAULT 'Cúp C1 Châu Âu'`);
    
    console.log('✅ [DB Fix] Đã cập nhật bảng notifications và matches thành công.');
  } catch (err) {
    console.error('⚠️ [DB Fix Error]', err.message);
  }
}
patchDatabase();

// Modules
const teamsRoutes = require('./routes/teams');
const matchesRoutes = require('./routes/matches');
const usersRoutes = require('./routes/users');
const predictionsRoutes = require('./routes/predictions');
const commentsRoutes = require('./routes/comments');
const { router: notificationsRoutes } = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const dmRoutes = require('./routes/dm');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/teams', teamsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dm', dmRoutes);

// Serve Static Files
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-all route for React SPA
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 SERVER ĐANG CHẠY TẠI: http://localhost:${PORT}`);
  console.log(`🌐 TRUY CẬP LAN: http://192.168.1.101:${PORT}`);
  console.log('✅ Đã kích hoạt Module: Teams, Matches, Users');
  
  // Tự động đồng bộ mỗi 30 phút
  cron.schedule('*/30 * * * *', () => {
    syncMatches().catch(err => console.error('[CRON ERROR]', err.message));
  });
  console.log('⏰ Đã kích hoạt Lịch trình: Tự động cập nhật mỗi 30 phút\n');
});
