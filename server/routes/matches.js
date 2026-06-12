const express = require('express');
const router = express.Router();
const db = require('../config/db');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { updateBracket } = require('../services/bracketService');
const { sendBroadcastNotification } = require('./notifications');
const { syncMatches } = require('../services/syncService');

const parseMatchTimeStr = (timeStr) => {
  if (!timeStr) return new Date(0);
  try {
    if (timeStr.includes('/')) {
      const [datePart, timePart] = timeStr.split(' - ');
      const [day, month] = datePart.split('/');
      const [hour, min] = timePart.split(':');
      return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    }
    if (timeStr.includes('.')) {
      const [datePart, timePart] = timeStr.split(' - ');
      const [day, month] = datePart.split('.');
      const [hour, min] = timePart.split(':');
      return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
    }
    const parts = timeStr.split(/[\s-]/);
    const [time, day, month] = parts.filter(Boolean);
    const [hour, min] = time.split(':');
    return new Date(2026, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min));
  } catch (e) {
    return new Date(0);
  }
};

const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') throw new Error();
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Unauthorized' });
  }
};

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        m.*, 
        COALESCE(m.team1_flag, t1.flag) as team1_flag, 
        COALESCE(m.team2_flag, t2.flag) as team2_flag,
        (SELECT COUNT(*) FROM predictions WHERE match_id = m.id) as total_votes,
        (SELECT COUNT(*) FROM predictions WHERE match_id = m.id AND predicted_home_score > predicted_away_score) as home_votes,
        (SELECT COUNT(*) FROM predictions WHERE match_id = m.id AND predicted_home_score = predicted_away_score) as draw_votes,
        (SELECT COUNT(*) FROM predictions WHERE match_id = m.id AND predicted_home_score < predicted_away_score) as away_votes,
        (SELECT COUNT(*) FROM comments WHERE match_id = m.id) as comment_count
      FROM matches m
      LEFT JOIN teams t1 ON m.team1_name = t1.name
      LEFT JOIN teams t2 ON m.team2_name = t2.name
      ORDER BY m.id DESC
    `);

    // Kiểm tra tự động đồng bộ nền (Self-healing Dynamic Auto Sync)
    const now = Date.now();
    const lastSync = global.lastSuccessfulSyncTime || 0;
    const lastAttempt = global.lastAttemptTime || 0;
    
    // Kiểm tra xem có trận đấu nào đang đá (LIVE) hoặc chuẩn bị bắt đầu
    let hasLiveOrActiveMatch = false;
    const nowTime = new Date();
    
    for (const m of result.rows) {
      if (m.status === 'LIVE') {
        hasLiveOrActiveMatch = true;
        break;
      }
      
      // Nếu chưa kết thúc, kiểm tra xem có bắt đầu trong 15 phút tới hoặc đã đá được dưới 4 tiếng không
      if (m.status !== 'FT' && m.status !== 'FINISHED') {
        const matchDate = parseMatchTimeStr(m.match_time);
        const timeDiff = nowTime - matchDate;
        if (timeDiff > -15 * 60 * 1000 && timeDiff < 4 * 60 * 60 * 1000) {
          hasLiveOrActiveMatch = true;
          break;
        }
      }
    }
    
    // Nếu có trận LIVE/Active: đồng bộ mỗi 1 phút. Nếu không: đồng bộ mỗi 30 phút.
    const syncInterval = hasLiveOrActiveMatch ? 1 * 60 * 1000 : 30 * 60 * 1000;
    const attemptInterval = hasLiveOrActiveMatch ? 30 * 1000 : 5 * 60 * 1000; // Thử lại sau 30s nếu có trận LIVE
    
    if (now - lastSync > syncInterval && now - lastAttempt > attemptInterval) {
      global.lastAttemptTime = now;
      console.log(`[AUTO SYNC] Đã quá hạn đồng bộ (Khoảng cách: ${syncInterval / 1000}s, Live/Active: ${hasLiveOrActiveMatch}). Kích hoạt đồng bộ nền...`);
      syncMatches()
        .then(synced => {
          console.log(`[AUTO SYNC] Đồng bộ nền hoàn tất thành công! Đã cập nhật ${synced} trận đấu.`);
        })
        .catch(err => {
          console.error('[AUTO SYNC ERROR] Lỗi đồng bộ nền:', err.message);
        });
    }
    res.json(result.rows);
  } catch (error) {
    console.error('[MATCHES ROUTE ERROR]', error);
    res.status(500).json({ error: error.message || 'Lỗi không xác định' });
  }
});

// Hàm tính điểm cho tất cả người chơi khi trận đấu kết thúc theo tỷ lệ chấp
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
    if (p.predicted_home_score === -1) continue; // Bỏ qua vì đã phạt 30k mặc định do không dự đoán

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
      points = 10; // Đoán đúng (bao gồm chọn Hòa và hòa kèo): phạt 10k
    }

    await db.query('UPDATE predictions SET points = $1 WHERE id = $2', [points, p.id]);
  }
};

const parseHandicapVal = (text) => {
  if (!text) return 0;
  text = text.trim();
  if (text === '0') return 0;
  if (text.includes('/')) {
    const parts = text.split('/');
    const val1 = parseFloat(parts[0]);
    const val2 = parseFloat(parts[1]);
    return (val1 + val2) / 2;
  }
  return parseFloat(text) || 0;
};

const parseOuVal = (text) => {
  if (!text) return 0;
  text = text.trim().toLowerCase().replace('u', '');
  if (text.includes('/')) {
    const parts = text.split('/');
    const val1 = parseFloat(parts[0]);
    const val2 = parseFloat(parts[1]);
    return (val1 + val2) / 2;
  }
  return parseFloat(text) || 0;
};

router.put('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { 
    team1_score, 
    team2_score, 
    status, 
    match_time,
    handicap_favorite,
    handicap_text,
    ou_text
  } = req.body;

  const handicap_value = parseHandicapVal(handicap_text);
  const ou_value = parseOuVal(ou_text);

  try {
    // Lấy thông tin trận đấu cũ trước khi cập nhật để so sánh
    const oldMatchRes = await db.query(
      'SELECT team1_name, team2_name, handicap_favorite, handicap_text, ou_text FROM matches WHERE id = $1',
      [id]
    );
    const oldMatch = oldMatchRes.rows[0];

    const result = await db.query(
      `UPDATE matches 
       SET team1_score = $1, 
           team2_score = $2, 
           status = $3, 
           match_time = $4,
           handicap_favorite = $5,
           handicap_value = $6,
           handicap_text = $7,
           ou_value = $8,
           ou_text = $9
       WHERE id = $10 
       RETURNING *`,
      [
        team1_score, 
        team2_score, 
        status, 
        match_time, 
        handicap_favorite || null, 
        handicap_value, 
        handicap_text || '', 
        ou_value, 
        ou_text || '',
        id
      ]
    );

    if (status === 'FT') {
      await calculateMatchPoints(id, team1_score, team2_score);
      await updateBracket();
    }

    // Gửi thông báo nếu Admin vào kèo mới hoặc cập nhật tỷ lệ chấp
    if (oldMatch) {
      const isOldHandicapEmpty = !oldMatch.handicap_favorite && !oldMatch.handicap_text;
      const isNewHandicapEntered = handicap_favorite || handicap_text;
      
      const handicapChanged = oldMatch.handicap_favorite !== (handicap_favorite || null) || 
                              oldMatch.handicap_text !== (handicap_text || '');
                              
      const ouChanged = oldMatch.ou_text !== (ou_text || '');

      if (isNewHandicapEntered && (isOldHandicapEmpty || handicapChanged || ouChanged)) {
        let title = '';
        let body = '';
        const team1 = oldMatch.team1_name;
        const team2 = oldMatch.team2_name;
        
        const handicapStr = handicap_text 
          ? (handicap_favorite === team1 ? `${team1} chấp ${team2} ${handicap_text}` : `${team2} chấp ${team1} ${handicap_text}`)
          : 'Đồng banh';
        const ouStr = ou_text || 'Chưa có';

        if (isOldHandicapEmpty) {
          title = `🏆 Kèo mới: ${team1} vs ${team2}`;
          body = `Admin đã vào kèo trận ${team1} vs ${team2}. Kèo chấp: ${handicapStr}. Tài Xỉu: ${ouStr}. Vào chốt kèo ngay!`;
        } else {
          title = `⚡ Cập nhật kèo: ${team1} vs ${team2}`;
          body = `Admin đã thay đổi tỷ lệ kèo trận ${team1} vs ${team2}. Kèo mới: ${handicapStr}. Tài Xỉu: ${ouStr}. Hãy kiểm tra lại lựa chọn của bạn!`;
        }
        
        // Gửi thông báo đẩy và lưu vào DB cho mọi người (sender là admin hiện tại)
        sendBroadcastNotification(title, body, `/`, req.user.id).catch(err => {
          console.error('Error sending handicap update notification:', err);
        });
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const synced = await syncMatches();
    res.json({ message: `Đồng bộ thành công ${synced} trận đấu!` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi đồng bộ: ' + error.message });
  }
});

module.exports = router;
