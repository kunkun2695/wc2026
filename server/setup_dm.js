const db = require('./config/db');

async function setupDirectMessages() {
  try {
    // Tạo bảng tin nhắn riêng
    await db.query(`
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
    await db.query(`CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id)`);

    console.log('✅ Đã khởi tạo bảng direct_messages thành công!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi khởi tạo database DM:', err.message);
    process.exit(1);
  }
}

setupDirectMessages();
