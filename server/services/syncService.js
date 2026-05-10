const axios = require('axios');
const db = require('../config/db');
const { sendPushNotification } = require('../routes/notifications');

const FOOTBALL_DATA_API_KEY = '545cbd97d6964d96bdc65580d348674b';

const calculateMatchPoints = async (matchId, hScore, aScore) => {
  const predictions = await db.query('SELECT * FROM predictions WHERE match_id = $1', [matchId]);
  for (const p of predictions.rows) {
    let points = 0;
    const pred_h = p.predicted_home_score;
    const pred_a = p.predicted_away_score;

    if ((hScore > aScore && pred_h > pred_a) ||
        (hScore < aScore && pred_h < pred_a) ||
        (hScore === aScore && pred_h === pred_a)) {
      points = 3;
    }
    await db.query('UPDATE predictions SET points = $1 WHERE id = $2', [points, p.id]);
    
    // Gửi Push Notification thông báo kết quả và điểm
    const matchInfo = await db.query('SELECT team1_name, team2_name FROM matches WHERE id = $1', [matchId]);
    const matchTitle = `${matchInfo.rows[0].team1_name} ${hScore}-${aScore} ${matchInfo.rows[0].team2_name}`;
    const message = `Trận đấu đã kết thúc! Tỉ số: ${matchTitle}. Bạn nhận được ${points} điểm dự đoán.`;
    
    sendPushNotification(p.user_id, '🏆 Kết quả trận đấu!', message, `/match/${matchId}`);
  }
};

const syncMatches = async () => {
  try {
    console.log('[SYNC] Đang bắt đầu đồng bộ tự động...');
    const response = await axios.get('https://api.football-data.org/v4/matches', {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
    });

    const matches = response.data.matches;
    let synced = 0;

    for (const m of matches) {
      const h = m.homeTeam;
      const a = m.awayTeam;

      // 1. Đảm bảo Đội bóng tồn tại
      const teamCheck1 = await db.query('SELECT id FROM teams WHERE name = $1', [h.name]);
      if (teamCheck1.rows.length === 0) {
        await db.query('INSERT INTO teams (name, flag, group_name) VALUES ($1, $2, $3)', [h.name, h.crest || '⚽', 'A']);
      }
      const teamCheck2 = await db.query('SELECT id FROM teams WHERE name = $1', [a.name]);
      if (teamCheck2.rows.length === 0) {
        await db.query('INSERT INTO teams (name, flag, group_name) VALUES ($1, $2, $3)', [a.name, a.crest || '⚽', 'A']);
      }

      // 2. Cập nhật hoặc Thêm trận đấu
      const matchCheck = await db.query(
        'SELECT id, status FROM matches WHERE team1_name = $1 AND team2_name = $2',
        [h.name, a.name]
      );

      const homeScore = m.score.fullTime.home ?? 0;
      const awayScore = m.score.fullTime.away ?? 0;
      const status = m.status === 'FINISHED' ? 'FT' : (m.status === 'IN_PLAY' ? 'LIVE' : 'UPCOMING');
      const matchTime = new Date(m.utcDate).toLocaleString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit', 
        minute: '2-digit', 
        day: '2-digit', 
        month: '2-digit' 
      }).replace(',', ' -');
      const competition = m.competition?.name || 'International';

      if (matchCheck.rows.length > 0) {
        const matchId = matchCheck.rows[0].id;
        const oldStatus = matchCheck.rows[0].status;
        await db.query(
          'UPDATE matches SET team1_score = $1, team2_score = $2, status = $3, match_time = $4, venue = $5 WHERE id = $6',
          [homeScore, awayScore, status, matchTime, competition, matchId]
        );
        if (status === 'FT' && oldStatus !== 'FT') {
          await calculateMatchPoints(matchId, homeScore, awayScore);
        }
      } else {
        const newMatch = await db.query(
          'INSERT INTO matches (team1_name, team2_name, team1_score, team2_score, status, match_time, group_name, venue) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
          [h.name, a.name, homeScore, awayScore, status, matchTime, 'A', competition]
        );
        if (status === 'FT') {
          await calculateMatchPoints(newMatch.rows[0].id, homeScore, awayScore);
        }
      }
      synced++;
    }
    console.log(`[SYNC] Hoàn tất! Đã cập nhật ${synced} trận đấu.`);
    return synced;
  } catch (error) {
    console.error('[SYNC] Lỗi:', error.message);
    throw error;
  }
};

module.exports = { syncMatches };
