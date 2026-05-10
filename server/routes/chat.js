const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser } = require('../middleware/auth');
const { sendBroadcastNotification } = require('./notifications');

// Lấy danh sách tin nhắn chat
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  try {
    const result = await db.query(`
      SELECT 
        m.*, 
        u.username, 
        u.name, 
        u.avatar 
      FROM chat_messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
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

    const msgData = fullMessage.rows[0];

    // Xử lý thông báo toàn quốc nếu là Admin và có cờ broadcast
    if (req.body.broadcast && req.user.role === 'admin') {
      const displayContent = content ? content : '📷 Đã gửi một ảnh mới';
      sendBroadcastNotification(
        'Thông báo từ Admin: ' + (req.user.name || req.user.username),
        displayContent,
        '/chat'
      ).catch(err => console.error('Lỗi broadcast từ chat:', err));
    }

    res.status(201).json(msgData);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi gửi tin nhắn: ' + (error.message || 'Lỗi không xác định') });
  }
});

module.exports = router;
