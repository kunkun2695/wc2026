const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';

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

// 1. Tạo hoặc cập nhật dự đoán
router.post('/', authenticateUser, async (req, res) => {
  const { match_id, home_score, away_score } = req.body;
  const user_id = req.user.id;

  try {
    const result = await db.query(
      `INSERT INTO predictions (user_id, match_id, predicted_home_score, predicted_away_score)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, match_id)
       DO UPDATE SET predicted_home_score = $3, predicted_away_score = $4, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, match_id, home_score, away_score]
    );
    res.json(result.rows[0]);
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
        m.team1_flag, m.team2_flag
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

module.exports = router;
