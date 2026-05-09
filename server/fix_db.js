const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/worldcup2026' });

async function fix() {
  try {
    await client.connect();
    
    // 1. Thêm cột avatar nếu chưa có
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '👤'");
    
    // 2. Thêm cột points nếu chưa có
    await client.query("ALTER TABLE predictions ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0");

    // 3. Đảm bảo bảng matches có các cột cần thiết cho việc tính điểm
    await client.query("ALTER TABLE matches ADD COLUMN IF NOT EXISTS team1_score INTEGER DEFAULT 0");
    await client.query("ALTER TABLE matches ADD COLUMN IF NOT EXISTS team2_score INTEGER DEFAULT 0");
    await client.query("ALTER TABLE matches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'UPCOMING'");

    console.log('✅ Cấu trúc Database đã được sửa lỗi và đồng bộ hóa!');
  } catch (err) {
    console.error('Lỗi DB:', err);
  } finally {
    await client.end();
  }
}

fix();
