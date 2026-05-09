const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const webpush = require('web-push');

const SECRET_KEY = 'worldcup2026-secret-key';

// Cấu hình Web Push
webpush.setVapidDetails(
  'mailto:hajong953@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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

// Lấy danh sách thông báo của người dùng
router.get('/', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(`
      SELECT 
        n.*, 
        u.avatar as sender_avatar,
        u.name as sender_name
      FROM notifications n
      JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy thông báo: ' + error.message });
  }
});

// Đánh dấu đã đọc tất cả
router.put('/read-all', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
    res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật thông báo: ' + error.message });
  }
});

// Đánh dấu một thông báo đã đọc
router.put('/:id/read', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Đã đọc thông báo' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật thông báo: ' + error.message });
  }
});

// Đăng ký nhận thông báo đẩy
router.post('/subscribe', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const subscription = req.body;

  try {
    const { endpoint, keys } = subscription;
    await db.query(`
      INSERT INTO push_subscriptions (user_id, endpoint, auth, p256dh)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        auth = EXCLUDED.auth,
        p256dh = EXCLUDED.p256dh
    `, [userId, endpoint, keys.auth, keys.p256dh]);

    res.status(201).json({ message: 'Đã đăng ký nhận thông báo đẩy' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi đăng ký push: ' + error.message });
  }
});

// Hàm hỗ trợ gửi thông báo đẩy
const sendPushNotification = async (userId, title, body, url = '/') => {
  try {
    const result = await db.query('SELECT * FROM push_subscriptions WHERE user_id = $1', [userId]);
    const subscriptions = result.rows;

    const payload = JSON.stringify({ title, body, url });

    const sendPromises = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      };
      return webpush.sendNotification(pushConfig, payload).catch(err => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Xóa subscription hết hạn
          return db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
        }
      });
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('Send Push Error:', error);
  }
};

module.exports = {
  router,
  sendPushNotification
};
