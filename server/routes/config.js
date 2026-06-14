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
    const trimmedKey = apiKey.trim();
    await db.query(`
      INSERT INTO system_config (key, value) 
      VALUES ('OPENAI_API_KEY', $1) 
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [trimmedKey]);
    
    // Cập nhật luôn vào process.env để có hiệu lực ngay lập tức
    process.env.OPENAI_API_KEY = trimmedKey;
    process.env.GEMINI_API_KEY = trimmedKey;
    
    res.json({ message: 'Cập nhật API Key thành công!' });
  } catch (err) {
    console.error('Config Error:', err);
    res.status(500).json({ error: 'Lỗi lưu cấu hình' });
  }
});

// Lấy cấu hình ngân hàng
router.get('/bank', authenticateUser, async (req, res) => {
  try {
    const keys = ['BANK_ID', 'BANK_ACCOUNT_NO', 'BANK_ACCOUNT_NAME', 'BANK_NAME', 'MEMO_PREFIX', 'MEMO_TEMPLATE'];
    const result = await db.query(
      "SELECT key, value FROM system_config WHERE key = ANY($1)",
      [keys]
    );
    
    const config = {};
    result.rows.forEach(row => {
      config[row.key] = row.value;
    });
    
    const defaults = {
      BANK_ID: 'MB',
      BANK_ACCOUNT_NO: '1234567890',
      BANK_ACCOUNT_NAME: 'NGUYEN VAN A',
      BANK_NAME: 'MB Bank',
      MEMO_PREFIX: 'KBPAY',
      MEMO_TEMPLATE: 'KBPAY {username}'
    };
    
    res.json({ ...defaults, ...config });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy cấu hình ngân hàng' });
  }
});

// Cập nhật cấu hình ngân hàng
router.post('/bank', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền' });
  const { bankId, bankAccountNo, bankAccountName, bankName, memoPrefix, memoTemplate } = req.body;
  try {
    const updates = [
      ['BANK_ID', bankId],
      ['BANK_ACCOUNT_NO', bankAccountNo],
      ['BANK_ACCOUNT_NAME', bankAccountName],
      ['BANK_NAME', bankName],
      ['MEMO_PREFIX', memoPrefix],
      ['MEMO_TEMPLATE', memoTemplate]
    ];
    
    for (const [key, val] of updates) {
      if (val !== undefined) {
        await db.query(`
          INSERT INTO system_config (key, value) 
          VALUES ($1, $2) 
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [key, val.toString().trim()]);
      }
    }
    res.json({ message: 'Cập nhật cấu hình ngân hàng thành công!' });
  } catch (err) {
    console.error('Save Bank Config Error:', err);
    res.status(500).json({ error: 'Lỗi lưu cấu hình ngân hàng: ' + err.message });
  }
});

module.exports = router;
