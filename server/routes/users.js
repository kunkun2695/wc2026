const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    const user = result.rows[0];
    
    if (!user) {
      const { logSuspiciousActivity, getClientIp } = require('../middleware/security');
      const ip = getClientIp(req);
      await logSuspiciousActivity(ip, 'FAILED_LOGIN', `Đăng nhập thất bại: Tài khoản "${username}" không tồn tại`);
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }
    
    // Kiểm tra xem mật khẩu hiện tại trong DB đã được mã hóa bằng bcrypt hay chưa
    const isBcrypt = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
    let isMatch = false;
    
    if (isBcrypt) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Cơ chế Graceful Migration: Nếu mật khẩu thô trùng khớp, thực hiện mã hóa và lưu lại
      isMatch = (user.password === password);
      if (isMatch) {
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
          console.log(`[Bảo mật] Tự động mã hóa mật khẩu thô cho tài khoản: ${user.username}`);
        } catch (hashErr) {
          console.error('[Mã hóa mật khẩu tự động lỗi]', hashErr);
        }
      }
    }

    if (!isMatch) {
      const { logSuspiciousActivity, getClientIp } = require('../middleware/security');
      const ip = getClientIp(req);
      await logSuspiciousActivity(ip, 'FAILED_LOGIN', `Đăng nhập thất bại: Sai mật khẩu tài khoản "${username}"`);
      return res.status(401).json({ error: 'Mật khẩu không chính xác' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Tài khoản của bạn chưa được Admin xác thực. Vui lòng liên hệ Admin để được phê duyệt.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY);
    res.json({ 
      token, 
      user: { id: user.id, username: user.username, name: user.name, role: user.role, avatar: user.avatar } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi hệ thống: ' + error.message });
  }
});

router.post('/register', async (req, res) => {
  const { username, password, name, avatar, security_question, security_answer } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, password, name, avatar, role, security_question, security_answer, is_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, username, name, role',
      [username, hashedPassword, name, avatar, 'user', security_question, security_answer, false]
    );
    res.status(201).json({ message: 'Đăng ký thành công! Tài khoản của bạn đang chờ Admin xác thực.' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi đăng ký: ' + error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, name, role FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { authenticateUser } = require('../middleware/auth');

// Cập nhật thông tin cá nhân
router.put('/me', authenticateUser, async (req, res) => {
  const { name, avatar, password } = req.body;
  const userId = req.user.id;
  try {
    let result;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      result = await db.query(
        'UPDATE users SET name = $1, avatar = $2, password = $3 WHERE id = $4 RETURNING id, username, name, role, avatar',
        [name, avatar, hashedPassword, userId]
      );
    } else {
      result = await db.query(
        'UPDATE users SET name = $1, avatar = $2 WHERE id = $3 RETURNING id, username, name, role, avatar',
        [name, avatar, userId]
      );
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Lỗi DB:', error);
    res.status(500).json({ error: 'Lỗi cập nhật: ' + error.message });
  }
});

// Lấy câu hỏi bảo mật của người dùng
router.get('/forgot-password/question', async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Thiếu tên đăng nhập' });
  }
  try {
    const result = await db.query('SELECT security_question FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }
    if (!user.security_question) {
      return res.status(400).json({ error: 'Tài khoản này chưa cài đặt câu hỏi bảo mật' });
    }
    res.json({ security_question: user.security_question });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi hệ thống: ' + error.message });
  }
});

// Xác minh câu trả lời bảo mật và đặt lại mật khẩu
router.post('/forgot-password/reset', async (req, res) => {
  const { username, security_answer, newPassword } = req.body;
  if (!username || !security_answer || !newPassword) {
    return res.status(400).json({ error: 'Thiếu thông tin yêu cầu' });
  }
  try {
    const result = await db.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại' });
    }
    
    // So sánh không phân biệt hoa thường và khoảng trắng thừa cho câu trả lời
    const cleanAnswer = security_answer.trim().toLowerCase();
    const cleanDbAnswer = (user.security_answer || '').trim().toLowerCase();
    
    if (cleanAnswer !== cleanDbAnswer) {
      return res.status(400).json({ error: 'Câu trả lời bảo mật không chính xác' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
    res.json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi hệ thống: ' + error.message });
  }
});

module.exports = router;
