const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';

// Middleware xác thực
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

// Lấy danh sách tin nhắn chat
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        m.*, 
        u.username, 
        u.name, 
        u.avatar 
      FROM chat_messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at ASC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy tin nhắn: ' + error.message });
  }
});

// Gửi tin nhắn mới
router.post('/', authenticateUser, async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Nội dung không được để trống' });
  }

  try {
    const result = await db.query(
      'INSERT INTO chat_messages (user_id, content) VALUES ($1, $2) RETURNING *',
      [userId, content]
    );
    
    // Lấy thông tin user để trả về đầy đủ
    const fullMessage = await db.query(`
      SELECT 
        m.*, 
        u.username, 
        u.name, 
        u.avatar 
      FROM chat_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(fullMessage.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi gửi tin nhắn: ' + error.message });
  }
});

module.exports = router;
