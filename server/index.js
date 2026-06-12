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
    
    // Tạo bảng posts cho mạng xã hội thu nhỏ
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng post_likes
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        UNIQUE(user_id, post_id)
      )
    `);

    // Tạo bảng post_comments
    await db.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bổ sung cột image_url cho Chat và DM
    await db.query(`ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT`);
    await db.query(`ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS image_url TEXT`);
    
    // Vá bảng users để hỗ trợ tích lũy điểm
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`);
    await db.query(`ALTER TABLE predictions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`);
    
    // Vá bảng users hỗ trợ phục hồi mật khẩu bằng câu hỏi bảo mật
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question VARCHAR(255)`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer VARCHAR(255)`);

    // Vá bảng matches hỗ trợ kèo chấp (Handicap) & Tài xỉu (Over/Under)
    await db.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS handicap_favorite VARCHAR(100)`);
    await db.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS handicap_value NUMERIC(4,2) DEFAULT 0.0`);
    await db.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS handicap_text VARCHAR(50)`);
    await db.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS ou_value NUMERIC(4,2) DEFAULT 0.0`);
    await db.query(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS ou_text VARCHAR(50)`);

    console.log('✅ [DB Fix] Đã cập nhật bảng notifications, matches, mạng xã hội, Chat Image, bảo mật tài khoản và kèo cược thành công.');
  } catch (err) {
    console.error('⚠️ [DB Fix Error]', err.message);
  }
}

async function initDatabaseAndCleanup() {
  await patchDatabase();
  try {
    const { cleanDuplicateTeamsAndMatches } = require('./services/dbCleanupService');
    await cleanDuplicateTeamsAndMatches();
  } catch (err) {
    console.error('⚠️ [DB Cleanup Error]', err.message);
  }
}
initDatabaseAndCleanup();

// Modules
const teamsRoutes = require('./routes/teams');
const matchesRoutes = require('./routes/matches');
const usersRoutes = require('./routes/users');
const predictionsRoutes = require('./routes/predictions');
const commentsRoutes = require('./routes/comments');
const { router: notificationsRoutes } = require('./routes/notifications');
const chatRoutes = require('./routes/chat');
const dmRoutes = require('./routes/dm');
const postsRoutes = require('./routes/posts');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/teams', teamsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);

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

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  
  // Tự động nạp API Key từ Database khi khởi động
  try {
    const db = require('./config/db');
    const result = await db.query("SELECT value FROM system_config WHERE key = 'OPENAI_API_KEY'");
    if (result.rows[0]?.value) {
      process.env.OPENAI_API_KEY = result.rows[0].value;
      console.log('✅ Đã nạp OpenAI API Key từ Database.');
    }
  } catch (err) {
    console.log('ℹ️ Chưa có cấu hình API Key trong Database.');
  }
  
  console.log(`🌐 TRUY CẬP LAN: http://192.168.1.101:${PORT}`);
  console.log('✅ Đã kích hoạt Module: Teams, Matches, Users');
  
  // Tự động đồng bộ mỗi 30 phút
  cron.schedule('*/30 * * * *', () => {
    syncMatches().catch(err => console.error('[CRON ERROR]', err.message));
  });
  console.log('⏰ Đã kích hoạt Lịch trình: Tự động cập nhật mỗi 30 phút\n');

  // Thực hiện đồng bộ ngay khi khởi động server
  console.log('[STARTUP] Đang thực hiện đồng bộ trận đấu lần đầu...');
  global.lastAttemptTime = Date.now();
  syncMatches()
    .then(synced => {
      console.log(`[STARTUP] Đồng bộ thành công! Đã cập nhật ${synced} trận đấu.`);
      global.lastSuccessfulSyncTime = Date.now();
    })
    .catch(err => console.error('[STARTUP ERROR] Lỗi đồng bộ lần đầu:', err.message));
});
