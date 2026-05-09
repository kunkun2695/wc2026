const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'worldcup2026-secret-key';

// Middleware xác thực Admin
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') throw new Error();
    next();
  } catch (err) {
    res.status(403).json({ error: 'Unauthorized admin access' });
  }
};

// Lấy danh sách đội bóng
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM teams ORDER BY group_name ASC, name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Thêm đội bóng
router.post('/', authenticateAdmin, async (req, res) => {
  const { name, flag, group_name } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO teams (name, flag, group_name) VALUES ($1, $2, $3) RETURNING *',
      [name, flag, group_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật đội bóng
router.put('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, flag, group_name } = req.body;
  try {
    const result = await db.query(
      'UPDATE teams SET name = $1, flag = $2, group_name = $3 WHERE id = $4 RETURNING *',
      [name, flag, group_name, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Xóa đội bóng
router.delete('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM teams WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
