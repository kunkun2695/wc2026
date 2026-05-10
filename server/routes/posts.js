const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser } = require('../middleware/auth');

// 1. Lấy danh sách bài viết (kèm thông tin user, số like, comment và trạng thái mình đã like chưa)
router.get('/', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*, 
        u.username, u.name, u.avatar,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = $1) as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách bài viết' });
  }
});

// 2. Đăng bài viết mới
router.post('/', authenticateUser, async (req, res) => {
  const { content, image_url } = req.body;
  if (!content) return res.status(400).json({ error: 'Nội dung bài viết không được để trống' });

  try {
    const result = await db.query(
      'INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, content, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi đăng bài viết' });
  }
});

// 3. Like/Unlike bài viết
router.post('/:id/like', authenticateUser, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;

  try {
    const check = await db.query('SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
    if (check.rows.length > 0) {
      await db.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [userId, postId]);
      res.json({ liked: false });
    } else {
      await db.query('INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)', [userId, postId]);
      res.json({ liked: true });
    }
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tương tác bài viết' });
  }
});

// 4. Lấy danh sách bình luận của 1 bài viết
router.get('/:id/comments', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT c.*, u.username, u.name, u.avatar
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy bình luận' });
  }
});

// 5. Bình luận bài viết
router.post('/:id/comments', authenticateUser, async (req, res) => {
  const { content } = req.body;
  const postId = req.params.id;
  if (!content) return res.status(400).json({ error: 'Nội dung bình luận trống' });

  try {
    const result = await db.query(
      'INSERT INTO post_comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [postId, req.user.id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi gửi bình luận' });
  }
});

module.exports = router;
