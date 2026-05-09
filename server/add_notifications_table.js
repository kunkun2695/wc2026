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

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Bảng "notifications" đã được tạo thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi tạo bảng:', err);
  } finally {
    await client.end();
  }
}

addNotificationsTable();
