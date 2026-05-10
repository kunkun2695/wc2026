const db = require('./config/db');

async function setupChat() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Đã tạo bảng chat_messages thành công!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi tạo bảng chat:', err.message);
    process.exit(1);
  }
}

setupChat();
