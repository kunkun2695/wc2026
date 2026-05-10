const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendPushNotification } = require('./notifications');
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

// Lấy danh sách bình luận (gáy) theo trận đấu
router.get('/:matchId', async (req, res) => {
  const { matchId } = req.params;
  try {
    const result = await db.query(`
      SELECT 
        c.*, 
        u.username, 
        u.name, 
        u.avatar 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.match_id = $1
      ORDER BY c.created_at ASC
    `, [matchId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy bình luận: ' + error.message });
  }
});

// Đăng bình luận (gáy) mới
router.post('/', authenticateUser, async (req, res) => {
  const { match_id, content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Nội dung không được để trống' });
  }

  try {
    const result = await db.query(
      'INSERT INTO comments (match_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [match_id, userId, content]
    );
    
    // Lấy thông tin user để trả về đầy đủ
    const fullComment = await db.query(`
      SELECT 
        c.*, 
        u.username, 
        u.name, 
        u.avatar 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(fullComment.rows[0]);

    // --- TẠO THÔNG BÁO ---
    try {
      // 1. Tìm tất cả người dùng đã bình chọn trận này
      const voters = await db.query('SELECT user_id FROM predictions WHERE match_id = $1 AND user_id != $2', [match_id, userId]);
      
      // 2. Tìm tất cả người dùng đã gáy (comment) trận này
      const commenters = await db.query('SELECT DISTINCT user_id FROM comments WHERE match_id = $1 AND user_id != $2', [match_id, userId]);
      
      // Gộp danh sách user cần thông báo (không trùng lặp)
      const userIdsToNotify = new Set([
        ...voters.rows.map(r => r.user_id),
        ...commenters.rows.map(r => r.user_id)
      ]);

      const senderName = fullComment.rows[0].name || fullComment.rows[0].username;
      const matchInfo = await db.query('SELECT team1_name, team2_name FROM matches WHERE id = $1', [match_id]);
      const matchTitle = matchInfo.rows[0] ? `${matchInfo.rows[0].team1_name} vs ${matchInfo.rows[0].team2_name}` : 'trận đấu';

      for (const targetUserId of userIdsToNotify) {
        const message = `${senderName} vừa gáy ở trận ${matchTitle}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
        await db.query(
          'INSERT INTO notifications (user_id, match_id, sender_id, content) VALUES ($1, $2, $3, $4)',
          [targetUserId, match_id, userId, message]
        );

        // Gửi Push Notification
        sendPushNotification(targetUserId, '🔥 Có người gáy mới!', message, `/match/${match_id}`);
      }
    } catch (notifyErr) {
      console.error('[NOTIFY ERROR]', notifyErr.message);
    }
  } catch (error) {
    res.status(500).json({ error: 'Lỗi đăng bình luận: ' + error.message });
  }
});

// Xóa bình luận (chỉ dành cho người tạo hoặc admin)
router.delete('/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const comment = await db.query('SELECT * FROM comments WHERE id = $1', [id]);
    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Bình luận không tồn tại' });
    }

    if (comment.rows[0].user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bình luận này' });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Xóa bình luận thành công' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi xóa bình luận: ' + error.message });
  }
});

module.exports = router;
