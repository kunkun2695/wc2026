const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/worldcup2026' });

async function updateData() {
  try {
    await client.connect();
    
    // Clear old matches
    await client.query('DELETE FROM matches');

    const matches = [
      ['Thụy Sĩ', '🇨🇭', 'Canada', '🇨🇦', '25.6 - 09:00', 'A'],
      ['Bosnia', '🇧🇦', 'Qatar', '🇶🇦', '25.6 - 09:00', 'B'],
      ['Scotland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Brazil', '🇧🇷', '25.6 - 12:00', 'C'],
      ['Morocco', '🇲🇦', 'Haiti', '🇭🇹', '25.6 - 12:00', 'D'],
      ['CH Séc', '🇨🇿', 'Mexico', '🇲🇽', '25.6 - 15:00', 'E'],
      ['Nam Phi', '🇿🇦', 'Hàn Quốc', '🇰🇷', '25.6 - 15:00', 'F'],
      ['Curacao', '🇨🇼', 'Bờ Biển Ngà', '🇨🇮', '26.6 - 10:00', 'G'],
      ['Ecuador', '🇪🇨', 'Đức', '🇩🇪', '26.6 - 10:00', 'H'],
      ['Nhật Bản', '🇯🇵', 'Thụy Điển', '🇸🇪', '26.6 - 13:00', 'I'],
      ['Tunisia', '🇹🇳', 'Hà Lan', '🇳🇱', '26.6 - 13:00', 'J'],
      ['Thổ Nhĩ Kỳ', '🇹🇷', 'Mỹ', '🇺🇸', '26.6 - 16:00', 'K'],
      ['Paraguay', '🇵🇾', 'Australia', '🇦🇺', '26.6 - 16:00', 'L']
    ];

    for (const [t1, f1, t2, f2, time, group] of matches) {
      await client.query(
        'INSERT INTO matches (team1_name, team1_flag, team2_name, team2_flag, match_time, group_name, status, team1_score, team2_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [t1, f1, t2, f2, time, group, 'UPCOMING', 0, 0]
      );
    }

    console.log(`Successfully updated ${matches.length} matches!`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

updateData();
