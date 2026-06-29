const db = require('../config/db');
const { sendPushNotification } = require('../routes/notifications');

const calculateMatchPoints = async (matchId, hScore, aScore) => {
  const matchResult = await db.query(
    'SELECT team1_name, team2_name, handicap_favorite, handicap_value, penalties_team1, penalties_team2, is_knockout, group_name, competition_name FROM matches WHERE id = $1',
    [matchId]
  );
  if (matchResult.rows.length === 0) return;
  const match = matchResult.rows[0];
  const team1Name = match.team1_name;
  const team2Name = match.team2_name;
  const isKnockout = match.is_knockout || match.group_name === 'KO' || ['Vòng 1/8', 'Tứ kết', 'Bán kết', 'Chung kết'].includes(match.competition_name);

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
      const message = `Trận đấu ${team1Name} vs ${team2Name} đã kết thúc (Tỉ số: ${hScore}-${aScore}). Bạn đã bỏ lỡ không dự đoán và đóng góp 30 bánh lương khô.`;
      sendPushNotification(p.user_id, '🏆 Bỏ lỡ dự đoán!', message, `/match/${matchId}`);
      continue;
    }

    let points = 30; // Mặc định đoán sai: phạt 30k
    const pred_h = p.predicted_home_score;
    const pred_a = p.predicted_away_score;

    let isCorrect = false;

    if (isKnockout) {
      // Kèo knockout: chỉ chọn thắng/thua để đi tiếp, không có kèo chấp và không có hòa.
      // userChoice: 1 (Home thắng/đi tiếp) hoặc -1 (Away thắng/đi tiếp)
      const userChoice = pred_h > pred_a ? 1 : -1;
      
      let actualWinner = 1;
      if (hScore > aScore) {
        actualWinner = 1;
      } else if (aScore > hScore) {
        actualWinner = -1;
      } else {
        // Hòa sau 90 phút / extra time -> Xét luân lưu
        const p1 = match.penalties_team1 ?? 0;
        const p2 = match.penalties_team2 ?? 0;
        if (p1 > p2) {
          actualWinner = 1;
        } else if (p2 > p1) {
          actualWinner = -1;
        } else {
          actualWinner = 1; // Mặc định nếu không có luân lưu
        }
      }
      isCorrect = (userChoice === actualWinner);
    } else {
      // Kèo chấp thông thường (vòng bảng)
      const handicapFavorite = match.handicap_favorite;
      const handicapValue = parseFloat(match.handicap_value) || 0;

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
      isCorrect = (userChoice === actualSign);
    }

    if (isCorrect) {
      points = 10; // Đoán đúng: phạt 10k
    }

    await db.query('UPDATE predictions SET points = $1 WHERE id = $2', [points, p.id]);

    const matchTitle = `${team1Name} ${hScore}-${aScore} ${team2Name}`;
    const resultText = points === 10 ? 'ĐÚNG (Đóng góp 10 bánh)' : 'SAI (Đóng góp 30 bánh)';
    const message = `Trận đấu đã kết thúc! Tỉ số: ${matchTitle}. Kết quả dự đoán của bạn: ${resultText}.`;
    sendPushNotification(p.user_id, '🏆 Kết quả trận đấu!', message, `/match/${matchId}`);
  }
};

module.exports = {
  calculateMatchPoints
};
