const axios = require('axios');
const db = require('../config/db');
const { sendPushNotification, sendBroadcastNotification, sendAdminNotification } = require('../routes/notifications');
const { updateBracket } = require('./bracketService');
const { calculateMatchPoints } = require('./pointsService');

const FOOTBALL_DATA_API_KEY = '545cbd97d6964d96bdc65580d348674b';

// calculateMatchPoints function is imported from pointsService

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
    
    let response;
    let retries = 3;
    let delay = 2000;
    
    for (let i = 0; i < retries; i++) {
      try {
        response = await axios.get('https://api.football-data.org/v4/competitions/WC/matches', {
          headers: { 
            'X-Auth-Token': FOOTBALL_DATA_API_KEY,
            'Connection': 'close'
          },
          timeout: 15000
        });
        break;
      } catch (err) {
        if (err.response && err.response.status === 429) {
          console.error(`⚠️ [RATE LIMIT] Bị giới hạn cuộc gọi API (HTTP 429)! Chi tiết:`, err.response.data?.message || err.message);
          
          if (!global.isAdminNotifiedRateLimit) {
            global.isAdminNotifiedRateLimit = true;
            const resetSecs = err.response.headers['x-requestcounter-reset'] || err.response.headers['X-RequestCounter-Reset'] || '60';
            const alertTitle = '⚠️ Lỗi API Rate Limit!';
            const alertBody = `API cập nhật tỉ số bóng đá đã bị chặn (HTTP 429). Hệ thống sẽ tự động tạm ngưng đồng bộ trong ${resetSecs} giây tiếp theo.`;
            sendAdminNotification(alertTitle, alertBody, '/').catch(e => console.error('[SYNC] Không thể gửi thông báo lỗi cho admin:', e.message));
          }

          const resetTime = err.response.headers['x-requestcounter-reset'] || err.response.headers['X-RequestCounter-Reset'];
          if (resetTime) {
            console.warn(`[RATE LIMIT] Khoảng thời gian reset còn: ${resetTime} giây.`);
          }
        } else {
          console.warn(`[SYNC] API request failed (attempt ${i + 1}/${retries}): ${err.message}`);
        }
        if (i === retries - 1) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }

    // Reset cảnh báo admin khi gọi thành công
    global.isAdminNotifiedRateLimit = false;

    const reqRemaining = response.headers['x-requests-available-minute'] || response.headers['X-Requests-Available-Minute'];
    if (reqRemaining !== undefined) {
      console.log(`[SYNC] Rate Limit còn lại: ${reqRemaining} yêu cầu/phút.`);
    }

    const matches = response.data.matches;
    let synced = 0;

    for (const m of matches) {
      const h = m.homeTeam;
      const a = m.awayTeam;

      const homeName = h && h.name ? translateTeamName(h.name) : null;
      const awayName = a && a.name ? translateTeamName(a.name) : null;

      // Chỉ đồng bộ World Cup hoặc các trận đấu có cả 2 đội bóng tồn tại trong hệ thống
      const isWorldCup = m.competition?.code === 'WC';
      
      const teamCheck1 = homeName ? await db.query('SELECT id FROM teams WHERE name = $1', [homeName]) : { rows: [] };
      const teamCheck2 = awayName ? await db.query('SELECT id FROM teams WHERE name = $1', [awayName]) : { rows: [] };

      const teamsExist = (teamCheck1.rows.length > 0 && teamCheck2.rows.length > 0);

      if (!isWorldCup && !teamsExist) {
        continue; // Bỏ qua trận đấu không liên quan
      }

      const isKnockoutMatch = m.stage && m.stage !== 'GROUP_STAGE';
      const groupName = isKnockoutMatch ? 'KO' : (m.group ? m.group.replace('GROUP_', '') : 'A');

      // 1. Đảm bảo Đội bóng tồn tại nếu có tên
      if (homeName && teamCheck1.rows.length === 0) {
        await db.query('INSERT INTO teams (name, flag, group_name) VALUES ($1, $2, $3)', [homeName, h.crest || '⚽', groupName]);
      }
      if (awayName && teamCheck2.rows.length === 0) {
        await db.query('INSERT INTO teams (name, flag, group_name) VALUES ($1, $2, $3)', [awayName, a.crest || '⚽', groupName]);
      }

      // 2. Cập nhật hoặc Thêm trận đấu
      let matchCheck = await db.query(
        'SELECT id, status, team1_score, team2_score FROM matches WHERE api_match_id = $1',
        [m.id]
      );

      if (matchCheck.rows.length === 0 && homeName && awayName) {
        matchCheck = await db.query(
          'SELECT id, status, team1_score, team2_score FROM matches WHERE team1_name = $1 AND team2_name = $2',
          [homeName, awayName]
        );
      }

      // Nếu trận đấu đã kết thúc nhưng API trả về tỷ số null (lỗi cache của API), bỏ qua không cập nhật tỷ số
      if (m.status === 'FINISHED' && (m.score.fullTime.home === null || m.score.fullTime.away === null)) {
        console.warn(`[SYNC] Bỏ qua trận đấu ${homeName} vs ${awayName} do trạng thái FINISHED nhưng tỷ số từ API trả về null (lỗi cache API).`);
        continue;
      }

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

      const translateStageName = (stage, group) => {
        if (stage === 'GROUP_STAGE') {
          if (group) {
            const groupLetter = group.replace('GROUP_', '');
            return `Bảng ${groupLetter}`;
          }
          return 'Vòng bảng';
        }
        const stageMapping = {
          'LAST_32': 'Vòng 32',
          'LAST_16': 'Vòng 1/8',
          'QUARTER_FINALS': 'Tứ kết',
          'SEMI_FINALS': 'Bán kết',
          'THIRD_PLACE': 'Tranh hạng ba',
          'FINAL': 'Chung kết'
        };
        return stageMapping[stage] || stage;
      };

      const competitionName = translateStageName(m.stage, m.group);
      const penaltiesHome = m.score.penalties?.home ?? null;
      const penaltiesAway = m.score.penalties?.away ?? null;

      if (matchCheck.rows.length > 0) {
        const matchId = matchCheck.rows[0].id;
        const oldStatus = matchCheck.rows[0].status;
        const oldHomeScore = matchCheck.rows[0].team1_score ?? 0;
        const oldAwayScore = matchCheck.rows[0].team2_score ?? 0;

        // Phòng chống lỗi giật lùi trạng thái (ví dụ từ FT quay lại UPCOMING/LIVE do lỗi dữ liệu API)
        if (oldStatus === 'FT' && status !== 'FT') {
          console.warn(`[SYNC] Ngăn chặn cập nhật trạng thái từ FT về ${status} cho trận ID ${m.id}`);
          continue;
        }

        const scoreChanged = oldHomeScore !== homeScore || oldAwayScore !== awayScore;

        await db.query(
          `UPDATE matches 
           SET team1_name = $1,
               team1_flag = $2,
               team2_name = $3,
               team2_flag = $4,
               team1_score = $5, 
               team2_score = $6, 
               status = $7, 
               match_time = $8, 
               venue = $9,
               group_name = $10,
               is_knockout = $11,
               penalties_team1 = $12,
               penalties_team2 = $13,
               competition_name = $14,
               api_match_id = $15
           WHERE id = $16`,
          [
            homeName, h?.crest || '⚽',
            awayName, a?.crest || '⚽',
            homeScore, awayScore, status, matchTime, competition, groupName, isKnockoutMatch, penaltiesHome, penaltiesAway, competitionName, m.id, matchId
          ]
        );

        if (scoreChanged && homeName && awayName) {
          const statusText = status === 'FT' ? 'KẾT THÚC' : (status === 'LIVE' ? 'LIVE' : 'UPCOMING');
          const title = `⚽ Tỷ số mới: ${homeName} ${homeScore} - ${awayScore} ${awayName}`;
          const body = `Cập nhật tỷ số trận đấu ${homeName} vs ${awayName}: ${oldHomeScore}-${oldAwayScore} ➔ ${homeScore}-${awayScore} (${statusText}).`;
          sendBroadcastNotification(title, body, '/').catch(err => {
            console.error('[SYNC] Error broadcasting score change:', err.message);
          });
        }

        if (status === 'FT' && (oldStatus !== 'FT' || scoreChanged)) {
          await calculateMatchPoints(matchId, homeScore, awayScore);
          await updateBracket();
        }
      } else {
        const newMatch = await db.query(
          `INSERT INTO matches (
             team1_name, team1_flag, team2_name, team2_flag, 
             team1_score, team2_score, status, match_time, 
             group_name, venue, is_knockout, 
             penalties_team1, penalties_team2, competition_name, api_match_id
           ) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
           RETURNING id`,
          [
            homeName, h?.crest || '⚽', awayName, a?.crest || '⚽', 
            homeScore, awayScore, status, matchTime, 
            groupName, competition, isKnockoutMatch, 
            penaltiesHome, penaltiesAway, competitionName, m.id
          ]
        );
        if (status === 'FT') {
          await calculateMatchPoints(newMatch.rows[0].id, homeScore, awayScore);
          await updateBracket();
        }
      }
      synced++;
    }
    console.log(`[SYNC] Hoàn tất! Đã cập nhật ${synced} trận đấu.`);
    global.lastSuccessfulSyncTime = Date.now();
    return synced;
  } catch (error) {
    console.error('[SYNC] Lỗi:', error.message);
    throw error;
  }
};

module.exports = { syncMatches };
