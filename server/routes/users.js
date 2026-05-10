const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác' });
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
  const { username, password, name, avatar } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO users (username, password, name, avatar, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, role',
      [username, password, name, avatar, 'user']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY);
    res.status(201).json({ token, user });
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

// Cập nhật thông tin cá nhân
router.put('/me', authenticateUser, async (req, res) => {
  const { name, avatar, password } = req.body;
  const userId = req.user.id;
  try {
    let result;
    if (password) {
      result = await db.query(
        'UPDATE users SET name = $1, avatar = $2, password = $3 WHERE id = $4 RETURNING id, username, name, role, avatar',
        [name, avatar, password, userId]
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

module.exports = router;
