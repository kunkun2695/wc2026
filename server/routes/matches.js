const express = require('express');
const router = express.Router();
const db = require('../config/db');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { updateBracket } = require('../services/bracketService');

const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';

const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') throw new Error();
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

// Hàm tính điểm cho tất cả người chơi khi trận đấu kết thúc theo tỷ lệ chấp
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

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { syncMatches } = require('../services/syncService');

router.post('/sync', async (req, res) => {
  try {
    const synced = await syncMatches();
    res.json({ message: `Đồng bộ thành công ${synced} trận đấu!` });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi đồng bộ: ' + error.message });
  }
});

module.exports = router;
