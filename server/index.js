// Thiết lập múi giờ Việt Nam mặc định cho Node.js
process.env.TZ = 'Asia/Ho_Chi_Minh';

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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

    // Tạo bảng prediction_history lưu vết lịch sử đổi kèo
    await db.query(`
      CREATE TABLE IF NOT EXISTS prediction_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        old_choice VARCHAR(10),
        new_choice VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng payments
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        transfer_code VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP,
        verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT
      )
    `);

    // Đảm bảo bảng system_config tồn tại
    await db.query(`CREATE TABLE IF NOT EXISTS system_config (key TEXT PRIMARY KEY, value TEXT)`);

    // Khởi tạo các cấu hình ngân hàng mặc định nếu chưa có
    const defaultConfigs = [
      ['BANK_ID', 'MB'],
      ['BANK_ACCOUNT_NO', '1234567890'],
      ['BANK_ACCOUNT_NAME', 'NGUYEN VAN A'],
      ['BANK_NAME', 'MB Bank'],
      ['MEMO_PREFIX', 'KBPAY'],
      ['MEMO_TEMPLATE', 'KBPAY {username}']
    ];
    for (const [key, value] of defaultConfigs) {
      await db.query(`
        INSERT INTO system_config (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING
      `, [key, value]);
    }

    console.log('✅ [DB Fix] Đã cập nhật bảng notifications, matches, mạng xã hội, Chat Image, bảo mật tài khoản, kèo cược, lịch sử đổi kèo và bảng thanh toán thành công.');
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
const paymentsRoutes = require('./routes/payments');

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
app.use('/api/payments', paymentsRoutes);

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

const parseMatchTimeStr = (timeStr) => {
  if (!timeStr) return new Date(0);
  try {
    let day, month, hour, min;
    if (timeStr.includes('/')) {
      const [datePart, timePart] = timeStr.split(' - ');
      [day, month] = datePart.split('/');
      [hour, min] = timePart.split(':');
    } else if (timeStr.includes('.')) {
      const [datePart, timePart] = timeStr.split(' - ');
      [day, month] = datePart.split('.');
      [hour, min] = timePart.split(':');
    } else {
      const parts = timeStr.split(/[\s-]/);
      const [time, d, m] = parts.filter(Boolean);
      [hour, min] = time.split(':');
      day = d;
      month = m;
    }
    const isoStr = `2026-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${min.padStart(2, '0')}:00+07:00`;
    return new Date(isoStr);
  } catch (e) {
    return new Date(0);
  }
};

const runBackgroundSync = async () => {
  let hasLiveOrActiveMatch = false;
  try {
    const result = await db.query('SELECT status, match_time FROM matches');
    const nowTime = new Date();
    
    for (const m of result.rows) {
      if (m.status === 'LIVE') {
        hasLiveOrActiveMatch = true;
        break;
      }
      if (m.status !== 'FT' && m.status !== 'FINISHED') {
        const matchDate = parseMatchTimeStr(m.match_time);
        const timeDiff = nowTime - matchDate;
        if (timeDiff > -15 * 60 * 1000 && timeDiff < 4 * 60 * 60 * 1000) {
          hasLiveOrActiveMatch = true;
          break;
        }
      }
    }
    
    console.log(`[BACKGROUND SYNC WORKER] Bắt đầu đồng bộ tự động (Có trận Live/Active: ${hasLiveOrActiveMatch})...`);
    global.lastAttemptTime = Date.now();
    const synced = await syncMatches();
    global.lastSuccessfulSyncTime = Date.now();
    console.log(`[BACKGROUND SYNC WORKER] Đồng bộ thành công! Đã cập nhật ${synced} trận đấu.`);
  } catch (err) {
    console.error('[BACKGROUND SYNC WORKER ERROR] Lỗi đồng bộ nền:', err.message);
  } finally {
    // Lên lịch đồng bộ tiếp theo: nếu có trận LIVE/Active thì sau 1 phút, ngược lại sau 30 phút.
    const nextInterval = hasLiveOrActiveMatch ? 1 * 60 * 1000 : 30 * 60 * 1000;
    console.log(`[BACKGROUND SYNC WORKER] Lên lịch đồng bộ tiếp theo sau ${nextInterval / 1000}s`);
    setTimeout(runBackgroundSync, nextInterval);
  }
};

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
  
  // Tự động nạp API Key từ Database khi khởi động
  try {
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
  
  // Kích hoạt worker đồng bộ nền tự động
  console.log('[BACKGROUND WORKER] Bắt đầu kích hoạt Worker đồng bộ động...');
  runBackgroundSync();
});
