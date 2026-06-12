const axios = require('axios');
const db = require('../config/db');
const { sendPushNotification, sendBroadcastNotification } = require('../routes/notifications');
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

  // 1. Tự động phạt 30k cho người dùng chưa dự đoán khi trận đấu kết thúc
  const usersRes = await db.query('SELECT id FROM users');
  for (const u of usersRes.rows) {
    const predCheck = await db.query('SELECT id FROM predictions WHERE user_id = $1 AND match_id = $2', [u.id, matchId]);
    if (predCheck.rows.length === 0) {
      await db.query(
        'INSERT INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score, points) VALUES ($1, $2, $3, $4, $5)',
        [u.id, matchId, -1, -1, 30]
      );
    }
  }

  const predictions = await db.query('SELECT * FROM predictions WHERE match_id = $1', [matchId]);
  for (const p of predictions.rows) {
    if (p.predicted_home_score === -1) {
      // Gửi Push Notification thông báo phạt do bỏ lỡ dự đoán
      const message = `Trận đấu ${team1Name} vs ${team2Name} đã kết thúc (Tỉ số: ${hScore}-${aScore}). Bạn đã bỏ lỡ không dự đoán và đóng góp 30 bánh lương khô.`;
      sendPushNotification(p.user_id, '🏆 Bỏ lỡ dự đoán!', message, `/match/${matchId}`);
      continue;
    }

    let points = 30; // Mặc định đoán sai: phạt 30k
    const pred_h = p.predicted_home_score;
    const pred_a = p.predicted_away_score;

    // Tính kết quả thực tế sau kèo chấp
    let adjustedDiff;
    if (!handicapFavorite || handicapValue === 0) {
      adjustedDiff = hScore - aScore;
    } else if (handicapFavorite === team1Name) {
      adjustedDiff = hScore - handicapValue - aScore;
    } else {
      adjustedDiff = hScore - (aScore - handicapValue);
    }

    const actualSign = adjustedDiff > 0 ? 1 : (adjustedDiff < 0 ? -1 : 0);
    const userChoice = pred_h > pred_a ? 1 : (pred_h < pred_a ? -1 : 0);

    const isCorrect = (userChoice === actualSign);

    if (isCorrect) {
      points = 10;
    }
    
    await db.query('UPDATE predictions SET points = $1 WHERE id = $2', [points, p.id]);
    
    // Gửi Push Notification thông báo kết quả và điểm phạt ăn nhậu
    const matchTitle = `${team1Name} ${hScore}-${aScore} ${team2Name}`;
    const resultText = points === 10 ? 'ĐÚNG (Đóng góp 10 bánh)' : 'SAI (Đóng góp 30 bánh)';
    const message = `Trận đấu đã kết thúc! Tỉ số: ${matchTitle}. Kết quả dự đoán của bạn: ${resultText}.`;
    
    sendPushNotification(p.user_id, '🏆 Kết quả trận đấu!', message, `/match/${matchId}`);
  }
};

const translateTeamName = (engName) => {
  if (!engName) return '';
  const mapping = {
    // English name from API -> Vietnamese name in DB
    'South Africa': 'Nam Phi',
    'Cape Verde Islands': 'Cabo Verde',
    'South Korea': 'Hàn Quốc',
    'Korea Republic': 'Hàn Quốc',
    'Korea, Republic of': 'Hàn Quốc',
    'Czech Republic': 'CH Séc',
    'Czechia': 'CH Séc',
    'Bosnia and Herzegovina': 'Bosnia',
    'Bosnia-Herzegovina': 'Bosnia',
    'Switzerland': 'Thụy Sĩ',
    'United States': 'Mỹ',
    'USA': 'Mỹ',
    'Turkey': 'Thổ Nhĩ Kỳ',
    'Türkiye': 'Thổ Nhĩ Kỳ',
    'Germany': 'Đức',
    'Curaçao': 'Curacao',
    'Curacao': 'Curacao',
    "Côte d'Ivoire": 'Bờ Biển Ngà',
    'Côte d’Ivoire': 'Bờ Biển Ngà',
    'Ivory Coast': 'Bờ Biển Ngà',
    'Netherlands': 'Hà Lan',
    'Japan': 'Nhật Bản',
    'Sweden': 'Thụy Điển',
    'Belgium': 'Bỉ',
    'Egypt': 'Ai Cập',
    'Spain': 'Tây Ban Nha',
    'Cape Verde': 'Cabo Verde',
    'Cabo Verde': 'Cabo Verde',
    'France': 'Pháp',
    'Norway': 'Na Uy',
    'Austria': 'Áo',
    'Portugal': 'Bồ Đào Nha',
    'DR Congo': 'CHDC Congo',
    'Congo DR': 'CHDC Congo',
    'Democratic Republic of the Congo': 'CHDC Congo',
    'England': 'Anh',
    'Croatia': 'Croatia',
    'Ghana': 'Ghana',
    'Panama': 'Panama',
    'Mexico': 'Mexico',
    'Canada': 'Canada',
    'Qatar': 'Qatar',
    'Brazil': 'Brazil',
    'Morocco': 'Morocco',
    'Haiti': 'Haiti',
    'Scotland': 'Scotland',
    'Paraguay': 'Paraguay',
    'Australia': 'Australia',
    'Ecuador': 'Ecuador',
    'Tunisia': 'Tunisia',
    'New Zealand': 'New Zealand',
    'Saudi Arabia': 'Saudi Arabia',
    'Uruguay': 'Uruguay',
    'Senegal': 'Senegal',
    'Iraq': 'Iraq',
    'Argentina': 'Argentina',
    'Algeria': 'Algeria',
    'Jordan': 'Jordan',
    'Uzbekistan': 'Uzbekistan',
    'Colombia': 'Colombia',
    'Iran': 'Iran'
  };

  const name = engName.trim();
  if (mapping[name]) return mapping[name];

  for (const key of Object.keys(mapping)) {
    if (key.toLowerCase() === name.toLowerCase()) {
      return mapping[key];
    }
  }
  return name;
};

const syncMatches = async () => {
  try {
    console.log('[SYNC] Đang bắt đầu đồng bộ tự động...');
    const response = await axios.get('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
    });

    const matches = response.data.matches;
    let synced = 0;

    for (const m of matches) {
      const h = m.homeTeam;
      const a = m.awayTeam;

      if (!h || !a || !h.name || !a.name) {
        continue; // Bỏ qua các trận đấu chưa xác định đủ 2 đội bóng (null)
      }

      const homeName = translateTeamName(h.name);
      const awayName = translateTeamName(a.name);

      // Chỉ đồng bộ World Cup hoặc các trận đấu có cả 2 đội bóng tồn tại trong hệ thống
      const isWorldCup = m.competition?.code === 'WC';
      
      const teamCheck1 = await db.query('SELECT id FROM teams WHERE name = $1', [homeName]);
      const teamCheck2 = await db.query('SELECT id FROM teams WHERE name = $1', [awayName]);

      const teamsExist = teamCheck1.rows.length > 0 && teamCheck2.rows.length > 0;

      if (!isWorldCup && !teamsExist) {
        continue; // Bỏ qua trận đấu không liên quan
      }

      // 1. Đảm bảo Đội bóng tồn tại
      if (teamCheck1.rows.length === 0) {
        await db.query('INSERT INTO teams (name, flag, group_name) VALUES ($1, $2, $3)', [homeName, h.crest || '⚽', 'A']);
      }
      if (teamCheck2.rows.length === 0) {
        await db.query('INSERT INTO teams (name, flag, group_name) VALUES ($1, $2, $3)', [awayName, a.crest || '⚽', 'A']);
      }

      // 2. Cập nhật hoặc Thêm trận đấu
      const matchCheck = await db.query(
        'SELECT id, status, team1_score, team2_score FROM matches WHERE team1_name = $1 AND team2_name = $2',
        [homeName, awayName]
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
        const oldHomeScore = matchCheck.rows[0].team1_score ?? 0;
        const oldAwayScore = matchCheck.rows[0].team2_score ?? 0;

        const scoreChanged = oldHomeScore !== homeScore || oldAwayScore !== awayScore;

        await db.query(
          'UPDATE matches SET team1_score = $1, team2_score = $2, status = $3, match_time = $4, venue = $5 WHERE id = $6',
          [homeScore, awayScore, status, matchTime, competition, matchId]
        );

        if (scoreChanged) {
          const statusText = status === 'FT' ? 'KẾT THÚC' : (status === 'LIVE' ? 'LIVE' : 'UPCOMING');
          const title = `⚽ Tỷ số mới: ${homeName} ${homeScore} - ${awayScore} ${awayName}`;
          const body = `Cập nhật tỷ số trận đấu ${homeName} vs ${awayName}: ${oldHomeScore}-${oldAwayScore} ➔ ${homeScore}-${awayScore} (${statusText}).`;
          sendBroadcastNotification(title, body, '/').catch(err => {
            console.error('[SYNC] Error broadcasting score change:', err.message);
          });
        }

        if (status === 'FT' && oldStatus !== 'FT') {
          await calculateMatchPoints(matchId, homeScore, awayScore);
          await updateBracket();
        }
      } else {
        const newMatch = await db.query(
          'INSERT INTO matches (team1_name, team1_flag, team2_name, team2_flag, team1_score, team2_score, status, match_time, group_name, venue) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
          [homeName, h.crest || '⚽', awayName, a.crest || '⚽', homeScore, awayScore, status, matchTime, 'A', competition]
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
