const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser } = require('../middleware/auth');

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
  const { content, image_url } = req.body;
  const userId = req.user.id;

  if (!content && !image_url) {
    return res.status(400).json({ error: 'Nội dung hoặc ảnh không được để trống' });
  }

  try {
    const result = await db.query(
      'INSERT INTO chat_messages (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING *',
      [userId, content, image_url]
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
    res.status(500).json({ error: 'Lỗi gửi tin nhắn: ' + (error.message || 'Lỗi không xác định') });
  }
});

module.exports = router;
