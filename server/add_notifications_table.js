const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
  user: process.env.DB_USER || 'macbook',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'worldcup2026',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function addNotificationsTable() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Tạo bảng với đầy đủ các cột mới
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        type VARCHAR(50) DEFAULT 'general',
        title VARCHAR(255),
        message TEXT NOT NULL,
        url VARCHAR(255) DEFAULT '/',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Lệnh này để bổ sung cột nếu bảng đã tồn tại nhưng thiếu cột
    await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general'`);
    await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255)`);
    await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT`);
    await client.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS url VARCHAR(255) DEFAULT '/'`);
    
    // Nếu có cột content cũ thì chuyển dữ liệu sang message (nếu cần)
    try {
      await client.query(`UPDATE notifications SET message = content WHERE message IS NULL AND content IS NOT NULL`);
    } catch (e) {}

    console.log('✅ Bảng "notifications" đã được cập nhật thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật bảng:', err);
  } finally {
    await client.end();
  }
}

addNotificationsTable();
