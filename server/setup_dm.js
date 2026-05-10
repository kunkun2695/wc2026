const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setupDirectMessages() {
  try {
    // Tạo bảng tin nhắn riêng
    await pool.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id),
        receiver_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo index để truy vấn nhanh hơn
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id)`);

    console.log('✅ Đã khởi tạo bảng direct_messages thành công!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khởi tạo database:', err);
    process.exit(1);
  }
}

setupDirectMessages();
