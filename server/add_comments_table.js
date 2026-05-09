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

async function addCommentsTable() {
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Bảng "comments" đã được tạo thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi tạo bảng:', err);
  } finally {
    await client.end();
  }
}

addCommentsTable();
