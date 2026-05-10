const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require('openai');
const db = require('../config/db');

// 1. Helper kiểm tra lỗi API Key (Khôi phục từ bản cũ)
const checkApiKeyIssues = (apiKey) => {
  if (apiKey === 'AIzaSyCdHbmJwC_LID-iKkDALNoufbodDzsG1XU') {
    return "⚠️ **Thông báo:** API Key hiện tại bị lỗi đánh máy (Typo). Hãy đổi `_LID` thành `_LlD` (chữ l thường) trong file .env và khởi động lại server.";
  }
  return null;
};

const maskKey = (key) => {
  if (!key) return "N/A";
  return key.substring(0, 8) + "..." + key.substring(key.length - 4);
};

// 2. Helper lấy bối cảnh đầy đủ & an toàn (Hợp nhất: Chi tiết + Timeout)
async function getSafeContext(userId) {
  return new Promise(async (resolve) => {
    const timeout = setTimeout(() => resolve(""), 2000);
    try {
      const userRes = await db.query('SELECT username, points FROM users WHERE id = $1', [userId]);
      const user = userRes.rows[0];
      if (!user) return resolve("");

      // Khôi phục công thức tính Thắng/Thua chi tiết của bạn
      const statsRes = await db.query(`
        SELECT COUNT(*) as total,
        COUNT(CASE WHEN p.prediction = (CASE WHEN m.team1_score > m.team2_score THEN '1' WHEN m.team1_score < m.team2_score THEN '2' ELSE 'X' END) AND m.status = 'FT' THEN 1 END) as won,
        COUNT(CASE WHEN p.prediction != (CASE WHEN m.team1_score > m.team2_score THEN '1' WHEN m.team1_score < m.team2_score THEN '2' ELSE 'X' END) AND m.status = 'FT' THEN 1 END) as lost
        FROM predictions p JOIN matches m ON p.match_id = m.id WHERE p.user_id = $1
      `, [userId]);
      const stats = statsRes.rows[0];

      clearTimeout(timeout);
      resolve(`\n[BỐI CẢNH]: Bạn tên là ${user.username}, có ${user.points} điểm. Dự đoán: Thắng ${stats.won}, Thua ${stats.lost} (Tổng ${stats.total}). Hãy dùng dữ liệu này để trả lời hài hước. `);
    } catch (e) {
      clearTimeout(timeout);
      resolve("");
    }
  });
}

router.post('/stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  
  // Kiểm tra lỗi Key ngay lập tức
  const keyIssue = checkApiKeyIssues(apiKey);
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (keyIssue) {
    res.write(`data: ${JSON.stringify({ text: keyIssue })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  res.write(': wake-up\n\n');

  try {
    const context = await getSafeContext(req.user.id);
    const fullPrompt = context + message;

    // Khôi phục vòng lặp thử nhiều model như ảnh 2
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
    const genAI = new GoogleGenerativeAI(apiKey);
    
    let success = false;
    for (const modelName of modelsToTry) {
      if (success) break;
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContentStream(fullPrompt);
        for await (const chunk of result.stream) {
          success = true;
          res.write(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`);
        }
      } catch (e) { console.error(`Thử model ${modelName} thất bại.`); }
    }

    if (success) {
      res.write('data: [DONE]\n\n');
    } else {
      res.write(`data: ${JSON.stringify({ error: "Tất cả các model đều đang bận. Thử lại sau nhé!" })}\n\n`);
    }
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Khôi phục endpoint chat thường và hỗ trợ OpenAI
router.post('/chat', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "").trim();
  
  if (apiKey.startsWith('sk-')) {
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      });
      return res.json({ reply: completion.choices[0].message.content });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // Nếu không phải OpenAI thì redirect sang luồng stream cho đồng nhất
  res.redirect(307, '/api/ai/stream');
});

module.exports = router;
