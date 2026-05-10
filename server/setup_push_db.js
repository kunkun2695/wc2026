const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load .env to get DB credentials
dotenv.config({ path: path.join(__dirname, '../.env') });

async function setupPush() {
  const client = new Client({
    user: 'macbook', // Use macbook as confirmed by lsof and server/.env
    host: 'localhost',
    database: 'worldcup2026',
    password: '',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected to database on port 5432');

    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        auth TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Bảng "push_subscriptions" đã được tạo thành công!');

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Bảng "notifications" đã được kiểm tra/tạo thành công!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupPush();
