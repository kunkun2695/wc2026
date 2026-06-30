const express = require('express');
const router = express.Router();
const db = require('../config/db');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { updateBracket } = require('../services/bracketService');
const { sendBroadcastNotification, sendPushNotification } = require('./notifications');
const { syncMatches } = require('../services/syncService');
const { calculateMatchPoints } = require('../services/pointsService');

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
    res.json(result.rows);
  } catch (error) {
    console.error('[MATCHES ROUTE ERROR]', error);
    res.status(500).json({ error: error.message || 'Lỗi không xác định' });
  }
});

// calculateMatchPoints function is imported from pointsService

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
    ou_text,
    penalties_team1,
    penalties_team2,
    is_knockout
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
           ou_text = $9,
           penalties_team1 = $10,
           penalties_team2 = $11,
           is_knockout = $12
       WHERE id = $13 
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
        penalties_team1 === undefined ? null : penalties_team1,
        penalties_team2 === undefined ? null : penalties_team2,
        is_knockout === undefined ? false : is_knockout,
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

      if (isNewHandicapEntered && (isOldHandicapEmpty || handicapChanged)) {
        let title = '';
        let body = '';
        const team1 = oldMatch.team1_name;
        const team2 = oldMatch.team2_name;
        
        const handicapStr = handicap_text 
          ? (handicap_favorite === team1 ? `${team1} chấp ${team2} ${handicap_text}` : `${team2} chấp ${team1} ${handicap_text}`)
          : 'Đồng banh';
        if (isOldHandicapEmpty) {
          title = `🏆 Kèo mới: ${team1} vs ${team2}`;
          body = `Admin đã vào kèo trận ${team1} vs ${team2}. Kèo chấp: ${handicapStr}. Vào chốt kèo ngay!`;
        } else {
          title = `⚡ Cập nhật kèo: ${team1} vs ${team2}`;
          body = `Admin đã thay đổi tỷ lệ kèo trận ${team1} vs ${team2}. Kèo mới: ${handicapStr}. Hãy kiểm tra lại lựa chọn của bạn!`;
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

router.delete('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM matches WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy trận đấu' });
    }
    await updateBracket();
    res.json({ message: 'Xoá trận đấu thành công', match: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
