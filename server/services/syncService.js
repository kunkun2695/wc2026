const axios = require('axios');
const db = require('../config/db');
const { sendPushNotification } = require('../routes/notifications');
const { updateBracket } = require('./bracketService');

const FOOTBALL_DATA_API_KEY = '545cbd97d6964d96bdc65580d348674b';

const calculateMatchPoints = async (matchId, hScore, aScore) => {
  const matchResult = await db.query('SELECT team1_name, team2_name, handicap_favorite, handicap_value FROM matches WHERE id = $1', [matchId]);
  if (matchResult.rows.length === 0) return;
  const match = matchResult.rows[0];
  const handicapFavorite = match.handicap_favorite;
  const handicapValue = parseFloat(match.handicap_value) || 0;
  const team1Name = match.team1_name;
  const team2Name = match.team2_name;

  const predictions = await db.query('SELECT * FROM predictions WHERE match_id = $1', [matchId]);
  for (const p of predictions.rows) {
    let points = 30; // Mặc định đoán sai: phạt 30k
    const pred_h = p.predicted_home_score;
    const pred_a = p.predicted_away_score;

    const getHandicapSign = (scoreHome, scoreAway) => {
      if (!handicapFavorite || handicapValue === 0) {
        const diff = scoreHome - scoreAway;
        return diff > 0 ? 1 : (diff < 0 ? -1 : 0);
      }
      
      let diff;
      if (handicapFavorite === team1Name) {
        diff = scoreHome - scoreAway - handicapValue;
      } else {
        diff = scoreAway - scoreHome - handicapValue;
      }
      
      return diff > 0 ? 1 : (diff < 0 ? -1 : 0);
    };

    const actualSign = getHandicapSign(hScore, aScore);
    
    let isCorrect = false;
    if (!handicapFavorite || handicapValue === 0) {
      // Kèo đồng banh / không chấp: so sánh trực tiếp lựa chọn với kết quả thực tế
      const userChoice = pred_h > pred_a ? 1 : (pred_h < pred_a ? -1 : 0);
      isCorrect = (userChoice === actualSign);
    } else {
      // Kèo có chấp:
      if (actualSign === 0) {
        // Hòa kèo: cả làng được tính đúng (phạt 10k)
        isCorrect = true;
      } else {
        const favIsTeam1 = (handicapFavorite === team1Name);
        const userChoseFav = favIsTeam1 ? (pred_h > pred_a) : (pred_h < pred_a);
        const userChoseUnderdog = favIsTeam1 ? (pred_h < pred_a) : (pred_h > pred_a);
        
        if (actualSign === 1 && userChoseFav) {
          isCorrect = true; // Cửa trên thắng và người dùng chọn cửa trên
        } else if (actualSign === -1 && userChoseUnderdog) {
          isCorrect = true; // Cửa dưới thắng và người dùng chọn cửa dưới
        }
      }
    }

    if (isCorrect) {
      points = 10;
    }
    
    await db.query('UPDATE predictions SET points = $1 WHERE id = $2', [points, p.id]);
    
    // Gửi Push Notification thông báo kết quả và điểm phạt ăn nhậu
    const matchTitle = `${team1Name} ${hScore}-${aScore} ${team2Name}`;
    const resultText = points === 10 ? 'ĐÚNG (Phạt 10k)' : 'SAI (Phạt 30k)';
    const message = `Trận đấu đã kết thúc! Tỉ số: ${matchTitle}. Dự đoán của bạn: ${resultText}.`;
    
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
      const date = new Date(m.utcDate);
      // Cộng 7 tiếng cho múi giờ Việt Nam (UTC+7)
      const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
      const day = String(vnDate.getUTCDate()).padStart(2, '0');
      const month = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
      const hours = String(vnDate.getUTCHours()).padStart(2, '0');
      const minutes = String(vnDate.getUTCMinutes()).padStart(2, '0');
      const matchTime = `${day}/${month} - ${hours}:${minutes}`;
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
          await updateBracket();
        }
      } else {
        const newMatch = await db.query(
          'INSERT INTO matches (team1_name, team2_name, team1_score, team2_score, status, match_time, group_name, venue) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
          [h.name, a.name, homeScore, awayScore, status, matchTime, 'A', competition]
        );
        if (status === 'FT') {
          await calculateMatchPoints(newMatch.rows[0].id, homeScore, awayScore);
          await updateBracket();
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
