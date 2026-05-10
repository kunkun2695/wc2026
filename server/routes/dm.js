const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../index'); // Giả sử middleware này đã có

// Lấy danh sách thành viên để chat (trừ bản thân)
router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, name, avatar, role FROM users ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách thành viên' });
  }
});

// Lấy tin nhắn giữa mình và một người khác
router.get('/history/:otherId', async (req, res) => {
  const myId = req.user.id;
  const otherId = req.params.otherId;
  try {
    const result = await db.query(`
      SELECT * FROM direct_messages 
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [myId, otherId]);
    
    // Đánh dấu đã đọc
    await db.query(
      'UPDATE direct_messages SET is_read = TRUE WHERE receiver_id = $1 AND sender_id = $2',
      [myId, otherId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy lịch sử chat' });
  }
});

// Gửi tin nhắn riêng
router.post('/send', async (req, res) => {
  const { receiver_id, content } = req.body;
  const sender_id = req.user.id;
  try {
    const result = await db.query(
      'INSERT INTO direct_messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [sender_id, receiver_id, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi gửi tin nhắn' });
  }
});

// Lấy số tin nhắn chưa đọc
router.get('/unread-count', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM direct_messages WHERE receiver_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.json({ count: 0 });
  }
});

module.exports = router;
