const db = require('./config/db');

async function addNotificationsTable() {
  try {
    console.log('Connected to database via central config');

    // Tạo bảng với đầy đủ các cột mới
    await db.query(`
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
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'general'`);
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255)`);
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT`);
    await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS url VARCHAR(255) DEFAULT '/'`);
    
    // Nếu có cột content cũ thì chuyển dữ liệu sang message (nếu cần)
    try {
      await db.query(`UPDATE notifications SET message = content WHERE message IS NULL AND content IS NOT NULL`);
    } catch (e) {}

    console.log('✅ Bảng "notifications" đã được cập nhật thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật bảng:', err.message);
  }
}

addNotificationsTable();
