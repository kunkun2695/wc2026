const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser } = require('../middleware/auth');
const { sendPushNotification } = require('./notifications');

// Lấy số lượng tin nhắn chưa đọc
router.get('/unread-count', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*)::int as unread_count FROM direct_messages WHERE receiver_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy số tin nhắn chưa đọc' });
  }
});

// Lấy danh sách TOÀN BỘ thành viên để chat (trừ bản thân)
router.get('/users', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, name, avatar, role FROM users WHERE id != $1 ORDER BY name ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách thành viên' });
  }
});

// Lấy tin nhắn giữa mình và một người khác
router.get('/history/:otherId', authenticateUser, async (req, res) => {
  const myId = req.user.id;
  const otherId = req.params.otherId;
  try {
    const result = await db.query(`
      SELECT * FROM direct_messages 
      WHERE (sender_id = $1 AND receiver_id = $2) 
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [myId, otherId]);
    
    // Đánh dấu đã đọc cho các tin nhắn gửi đến mình
    await db.query(
      'UPDATE direct_messages SET is_read = TRUE WHERE receiver_id = $1 AND sender_id = $2',
      [myId, otherId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy lịch sử chat' });
  }
});

// Gửi tin nhắn riêng (Hỗ trợ ảnh)
router.post('/send', authenticateUser, async (req, res) => {
  const { receiver_id, content, image_url } = req.body;
  const sender_id = req.user.id;

  if (!content && !image_url && !receiver_id) {
    return res.status(400).json({ error: 'Thiếu thông tin tin nhắn' });
  }

  try {
    const result = await db.query(
      'INSERT INTO direct_messages (sender_id, receiver_id, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [sender_id, receiver_id, content, image_url]
    );
    const newMessage = result.rows[0];

    // Nội dung thông báo
    const displayContent = content ? content : '📷 Đã gửi một ảnh';
    const notificationMessage = `${req.user.username}: ${displayContent.substring(0, 50)}${displayContent.length > 50 ? '...' : ''}`;

    // Tạo thông báo trong hệ thống
    await db.query(`
      INSERT INTO notifications (user_id, sender_id, type, title, message, content, url, is_read)
      VALUES ($1, $2, $3, $4, $5, $5, $6, FALSE)
    `, [receiver_id, sender_id, 'dm', 'Tin nhắn mới', notificationMessage, '/chat']);

    // Gửi Push Notification
    sendPushNotification(
      receiver_id, 
      'Tin nhắn mới từ ' + req.user.username, 
      displayContent.length > 100 ? displayContent.substring(0, 97) + '...' : displayContent, 
      '/chat'
    ).catch(err => console.error('Lỗi gửi push DM:', err));

    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi gửi tin nhắn: ' + (err.message || 'Lỗi không xác định') });
  }
});

module.exports = router;
