const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

// Helper lấy bối cảnh an toàn (Không bao giờ làm treo AI)
async function getSafeContext(userId) {
  return new Promise(async (resolve) => {
    // Đặt timeout 1.5 giây, quá thời gian này sẽ bỏ qua DB
    const timeout = setTimeout(() => resolve(""), 1500);
    
    try {
      const userRes = await db.query('SELECT username, points FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0];
      if (!user) {
        clearTimeout(timeout);
        return resolve("");
      }

      // Lấy thống kê đơn giản
      const statsRes = await db.query('SELECT COUNT(*) as total FROM predictions WHERE user_id = $1', [userId]);
      const total = statsRes.rows[0]?.total || 0;

      clearTimeout(timeout);
      resolve(`[User: ${user.username}, Points: ${user.points}, Total Predictions: ${total}]. Rules: +3 pts for win. `);
    } catch (e) {
      clearTimeout(timeout);
      resolve("");
    }
  });
}

router.post('/stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  
  // Header quan trọng
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Gửi heartbeat ngay
  res.write(': wake-up\n\n');

  try {
    // Lấy context một cách an toàn (có timeout)
    const context = await getSafeContext(req.user.id);
    const fullPrompt = context + message;

    const genAI = new GoogleGenerativeAI(apiKey);
    // Thử flash trước cho nhanh
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContentStream(fullPrompt);

    let hasData = false;
    for await (const chunk of result.stream) {
      hasData = true;
      res.write(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`);
    }
    
    if (hasData) {
      res.write('data: [DONE]\n\n');
    } else {
      res.write(`data: ${JSON.stringify({ error: "AI không có phản hồi." })}\n\n`);
    }
    res.end();

  } catch (error) {
    console.error('Final Stream Error:', error.message);
    res.write(`data: ${JSON.stringify({ error: "Kết nối AI gặp sự cố, hãy thử lại." })}\n\n`);
    res.end();
  }
});

router.post('/chat', authenticateUser, async (req, res) => {
  res.redirect(307, '/api/ai/stream');
});

module.exports = router;
