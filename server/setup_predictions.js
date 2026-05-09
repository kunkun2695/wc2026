const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/worldcup2026' });

async function setup() {
  try {
    await client.connect();
    
    // 1. Tạo bảng predictions
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        match_id INTEGER REFERENCES matches(id),
        predicted_home_score INTEGER,
        predicted_away_score INTEGER,
        points INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, match_id)
      )
    `);

    // 2. Cập nhật thêm các đội bóng mới từ ảnh
    const newTeams = [
      ['Bỉ', '🇧🇪', 'G'], ['Ai Cập', '🇪🇬', 'G'], ['Iran', '🇮🇷', 'G'], ['New Zealand', '🇳🇿', 'G'],
      ['Tây Ban Nha', '🇪🇸', 'H'], ['Cape Verde', '🇨🇻', 'H'], ['Saudi Arabia', '🇸🇦', 'H'], ['Uruguay', '🇺🇾', 'H'],
      ['Pháp', '🇫🇷', 'I'], ['Senegal', '🇸🇳', 'I'], ['Iraq', '🇮🇶', 'I'], ['Na Uy', '🇳🇴', 'I'],
      ['Argentina', '🇦🇷', 'J'], ['Algeria', '🇩🇿', 'J'], ['Áo', '🇦🇹', 'J'], ['Jordan', '🇯🇴', 'J'],
      ['Bồ Đào Nha', '🇵🇹', 'K'], ['CHDC Congo', '🇨🇩', 'K'], ['Uzbekistan', '🇺🇿', 'K'], ['Colombia', '🇨🇴', 'K'],
      ['Anh', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'L'], ['Croatia', '🇭🇷', 'L'], ['Ghana', '🇬🇭', 'L'], ['Panama', '🇵🇦', 'L']
    ];

    for (const [name, flag, group] of newTeams) {
      await client.query(
        'INSERT INTO teams (name, flag, group_name) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET flag = EXCLUDED.flag, group_name = EXCLUDED.group_name',
        [name, flag, group]
      );
    }

    console.log('✅ Hệ thống dự đoán đã sẵn sàng và đã nạp 48 đội bóng!');
  } catch (err) {
    console.error('Lỗi setup:', err);
  } finally {
    await client.end();
  }
}

setup();
