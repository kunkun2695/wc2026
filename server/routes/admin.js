const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';

// Middleware xác thực Admin
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Không tìm thấy Token' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền Admin' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// API Reset Hệ Thống
router.post('/reset-system', authenticateAdmin, async (req, res) => {
  const { confirmation_code } = req.body;

  // Yêu cầu nhập mã xác nhận đặc biệt để tránh bấm nhầm
  if (confirmation_code !== 'RESET_WC2026_FINAL') {
    return res.status(400).json({ error: 'Mã xác nhận Reset không chính xác!' });
  }

  try {
    console.log('⚠️ Bắt đầu quá trình Reset hệ thống bởi Admin:', req.user.id);

    // Bắt đầu một Transaction để đảm bảo tính toàn vẹn
    await db.query('BEGIN');

    // 1. Xóa tất cả tin nhắn (Chat & DM)
    await db.query('DELETE FROM chat_messages');
    await db.query('DELETE FROM direct_messages');

    // 2. Xóa bài đăng và bình luận
    await db.query('DELETE FROM comments');
    await db.query('DELETE FROM posts');

    // 3. Xóa các kèo dự đoán và lịch sử điểm
    await db.query('DELETE FROM predictions');
    
    // 4. Xóa thông báo
    await db.query('DELETE FROM notifications');

    // 5. Cập nhật lại điểm của toàn bộ người dùng về 0
    await db.query('UPDATE users SET points = 0');

    // 6. Reset lại trạng thái các trận đấu về UPCOMING (tùy chọn)
    await db.query('UPDATE matches SET team1_score = 0, team2_score = 0, status = \'UPCOMING\'');

    await db.query('COMMIT');

    res.json({ message: 'Hệ thống đã được Reset sạch sẽ! Toàn bộ bài đăng, tin nhắn và lịch sử đã bị xóa.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Reset System Error:', error);
    res.status(500).json({ error: 'Lỗi trong quá trình Reset: ' + error.message });
  }
});

// API Lấy danh sách toàn bộ người dùng
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, name, role, avatar, points, created_at FROM users ORDER BY points DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách user: ' + error.message });
  }
});

// API Xóa một người dùng
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  const userId = req.params.id;
  
  // Không cho phép xóa chính mình
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'Bạn không thể tự xóa chính mình!' });
  }

  try {
    await db.query('BEGIN');

    // Xóa các dữ liệu liên quan trước khi xóa user (tránh lỗi khóa ngoại)
    await db.query('DELETE FROM chat_messages WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM direct_messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);
    await db.query('DELETE FROM comments WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM posts WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM predictions WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM notifications WHERE user_id = $1 OR sender_id = $1', [userId]);
    
    // Cuối cùng xóa User
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING username', [userId]);
    
    if (result.rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Không tìm thấy người dùng này' });
    }

    await db.query('COMMIT');
    res.json({ message: `Đã xóa người dùng ${result.rows[0].username} thành công!` });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa người dùng: ' + error.message });
  }
});

module.exports = router;
