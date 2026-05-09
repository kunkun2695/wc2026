const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'worldcup2026-secret-key';

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

// Xóa tất cả thông báo
router.delete('/', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  try {
    await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    res.json({ message: 'Đã xóa tất cả thông báo' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa thông báo: ' + error.message });
  }
});

module.exports = router;
