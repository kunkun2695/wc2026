const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser } = require('../middleware/auth');

// Lấy cấu hình AI
router.get('/ai', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền' });
  try {
    const result = await db.query("SELECT value FROM system_config WHERE key = 'OPENAI_API_KEY'");
    res.json({ apiKey: result.rows[0]?.value || '' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy cấu hình' });
  }
});

// Cập nhật cấu hình AI
router.post('/ai', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền' });
  const { apiKey } = req.body;
  try {
    // Đảm bảo bảng tồn tại
    await db.query(`CREATE TABLE IF NOT EXISTS system_config (key TEXT PRIMARY KEY, value TEXT)`);
    
    // Lưu hoặc cập nhật
    await db.query(`
      INSERT INTO system_config (key, value) 
      VALUES ('OPENAI_API_KEY', $1) 
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [apiKey]);
    
    // Cập nhật luôn vào process.env để có hiệu lực ngay lập tức mà không cần restart server
    process.env.OPENAI_API_KEY = apiKey;
    
    res.json({ message: 'Cập nhật API Key thành công!' });
  } catch (err) {
    console.error('Config Error:', err);
    res.status(500).json({ error: 'Lỗi lưu cấu hình' });
  }
});

module.exports = router;
