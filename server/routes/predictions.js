const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';
const { sendBroadcastNotification } = require('./notifications');

// Middleware xác thực người dùng
const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Unauthorized' });
  }
};

// Helper to parse match time string to Vietnam Time (UTC+7) Date
const parseMatchTimeToVnDate = (timeStr) => {
  if (!timeStr) return new Date(0);
  try {
    let day, month, hour, min;
    if (timeStr.includes('/')) {
      const [datePart, timePart] = timeStr.split(' - ');
      [day, month] = datePart.split('/');
      [hour, min] = timePart.split(':');
    } else if (timeStr.includes('.')) {
      const [datePart, timePart] = timeStr.split(' - ');
      [day, month] = datePart.split('.');
      [hour, min] = timePart.split(':');
    } else {
      const parts = timeStr.split(/[\s-]/);
      const [time, d, m] = parts.filter(Boolean);
      [hour, min] = time.split(':');
      day = d;
      month = m;
    }
    const pad = (n) => String(n).padStart(2, '0');
    const isoString = `2026-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:00+07:00`;
    return new Date(isoString);
  } catch (e) {
    return new Date(0);
  }
};

// 1. Tạo hoặc cập nhật dự đoán (chặn nếu trận đấu đã bắt đầu hoặc quá giờ)
router.post('/', authenticateUser, async (req, res) => {
  const { match_id, home_score, away_score } = req.body;
  const user_id = req.user.id;

  try {
    // Lấy thông tin trận đấu
    const matchRes = await db.query(
      'SELECT status, match_time, team1_name, team2_name, handicap_favorite, handicap_text FROM matches WHERE id = $1',
      [match_id]
    );
    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy trận đấu' });
    }
    const match = matchRes.rows[0];

    const matchTime = parseMatchTimeToVnDate(match.match_time);
    const now = new Date();

    if (match.status !== 'UPCOMING' || now >= matchTime) {
      return res.status(400).json({ error: 'Trận đấu đã bắt đầu hoặc quá giờ thi đấu, không thể chốt kèo nữa!' });
    }

    const oldPredRes = await db.query(
      'SELECT predicted_home_score, predicted_away_score FROM predictions WHERE user_id = $1 AND match_id = $2',
      [user_id, match_id]
    );
    let oldChoice = null;
    if (oldPredRes.rows.length > 0) {
      const op = oldPredRes.rows[0];
      if (op.predicted_home_score !== -1) {
        oldChoice = op.predicted_home_score > op.predicted_away_score ? '1' :
                    (op.predicted_home_score < op.predicted_away_score ? '2' : 'X');
      }
    }

    const result = await db.query(
      `INSERT INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, match_id)
       DO UPDATE SET predicted_home_score = $3, predicted_away_score = $4, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, match_id, home_score, away_score]
    );

    // Ghi nhận lịch sử đổi cược
    const newChoice = home_score > away_score ? '1' :
                      (home_score < away_score ? '2' : 'X');

    if (oldChoice && oldChoice !== newChoice) {
      await db.query(
        'INSERT INTO prediction_history (user_id, match_id, old_choice, new_choice) VALUES ($1, $2, $3, $4)',
        [user_id, match_id, oldChoice, newChoice]
      );

      // Phát cảnh báo hệ thống và push notification cho tất cả user
      const userRes = await db.query('SELECT name FROM users WHERE id = $1', [user_id]);
      const userName = userRes.rows[0]?.name || 'Thành viên';
      const team1 = match.team1_name;
      const team2 = match.team2_name;

      const getChoiceName = (c) => {
        if (c === '1') return team1;
        if (c === '2') return team2;
        return 'Hòa';
      };

      const title = `🔄 Thay đổi bình chọn: ${userName}`;
      const body = `${userName} đã THAY ĐỔI bình chọn trận ${team1} vs ${team2} từ cửa [${getChoiceName(oldChoice)}] sang [${getChoiceName(newChoice)}]`;
      
      sendBroadcastNotification(title, body, `/`, user_id).catch(err => {
        console.error('Error sending prediction change broadcast:', err);
      });
    }

    // Gửi thông báo nếu Admin bình chọn/dự đoán
    if (req.user.role === 'admin') {
      const team1 = match.team1_name;
      const team2 = match.team2_name;
      const hFav = match.handicap_favorite;
      const hTxt = match.handicap_text;

      let choiceLabel = '';
      if (home_score > away_score) {
        if (hFav && hTxt) {
          choiceLabel = hFav === team1 ? `${team1} (-${hTxt})` : `${team1} (+${hTxt})`;
        } else {
          choiceLabel = team1;
        }
      } else if (home_score < away_score) {
        if (hFav && hTxt) {
          choiceLabel = hFav === team2 ? `${team2} (-${hTxt})` : `${team2} (+${hTxt})`;
        } else {
          choiceLabel = team2;
        }
      } else {
        choiceLabel = 'Hòa';
      }

      const title = `📢 Admin đã chốt kèo: ${team1} vs ${team2}`;
      const body = `Admin đã bình chọn cửa [${choiceLabel}] cho trận ${team1} vs ${team2}. Hãy tham khảo và chốt kèo ngay!`;

      // Gửi thông báo đẩy và lưu vào DB cho mọi người (sender là admin)
      sendBroadcastNotification(title, body, `/`, user_id).catch(err => {
        console.error('Error sending admin prediction broadcast notification:', err);
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint lấy toàn bộ dự đoán (mã hóa đối với trận chưa đá)
router.get('/all', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id as prediction_id,
        p.user_id,
        p.match_id,
        p.predicted_home_score,
        p.predicted_away_score,
        p.points,
        p.created_at,
        u.name as user_name,
        u.avatar as user_avatar,
        m.team1_name,
        m.team2_name,
        m.team1_score,
        m.team2_score,
        m.status,
        m.match_time,
        m.handicap_favorite,
        m.handicap_value,
        m.handicap_text,
        m.ou_value,
        m.ou_text
      FROM predictions p
      JOIN users u ON p.user_id = u.id
      JOIN matches m ON p.match_id = m.id
      ORDER BY m.id DESC, p.created_at DESC
    `);

    const currentUserId = req.user.id;
    const now = new Date();

    const predictions = result.rows.map(row => {
      return {
        ...row,
        is_hidden: false
      };
    });

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Lấy dự đoán của tôi (kèm thông tin trận đấu)
router.get('/my', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*, 
        m.team1_name, m.team2_name, m.team1_score, m.team2_score, 
        m.status, m.match_time, m.venue,
        m.team1_flag, m.team2_flag,
        m.handicap_favorite, m.handicap_value, m.handicap_text,
        m.ou_value, m.ou_text
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = $1
      ORDER BY m.id DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Bảng xếp hạng
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.avatar, 
        COALESCE(SUM(CASE WHEN m.status = 'FT' AND p.points = 10 THEN 1 ELSE 0 END), 0) as total_points,
        COALESCE(SUM(CASE WHEN m.status = 'FT' THEN p.points * 1000 ELSE 0 END), 0) as total_fines
      FROM users u
      LEFT JOIN predictions p ON u.id = p.user_id
      LEFT JOIN matches m ON p.match_id = m.id
      GROUP BY u.id, u.name, u.avatar
      ORDER BY total_points DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lấy lịch sử thay đổi bình chọn của một trận đấu
router.get('/history/:matchId', authenticateUser, async (req, res) => {
  const { matchId } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        h.id,
        h.user_id,
        h.match_id,
        h.old_choice,
        h.new_choice,
        h.created_at,
        u.name as user_name,
        u.avatar as user_avatar
      FROM prediction_history h
      JOIN users u ON h.user_id = u.id
      WHERE h.match_id = $1
      ORDER BY h.created_at DESC
    `, [matchId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
