const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

// 1. Bộ quy tắc của ứng dụng
const APP_RULES = `
QUY TẮC WORLD CUP 2026 TRACKER:
- Dự đoán tỉ số trận đấu.
- Thắng kèo (Đúng kết quả Thắng/Thua/Hòa): +3 điểm.
- Thua kèo: 0 điểm.
- Thời hạn: Trước khi bóng lăn.
`;

// 2. Helper lấy bối cảnh người dùng
async function getUserContext(userId) {
  try {
    const user = (await db.query('SELECT username, points FROM users WHERE id = $1', [userId])).rows[0];
    const stats = (await db.query(`
      SELECT COUNT(*) as total,
      COUNT(CASE WHEN (m.team1_score > m.team2_score AND p.predicted_home_score > p.predicted_away_score) OR 
                     (m.team1_score < m.team2_score AND p.predicted_home_score < p.predicted_away_score) OR 
                     (m.team1_score = m.team2_score AND p.predicted_home_score = p.predicted_away_score) 
                 AND m.status = 'FT' THEN 1 END) as won
      FROM predictions p JOIN matches m ON p.match_id = m.id WHERE p.user_id = $1
    `, [userId])).rows[0];

    return `\n[HỆ THỐNG]: Người dùng tên ${user.username}, có ${user.points} điểm, thắng ${stats.won}/${stats.total} trận.\n${APP_RULES}\nHãy dùng thông tin này để trả lời nếu họ hỏi về bản thân.`;
  } catch (e) { return APP_RULES; }
}

const maskKey = (key) => {
  if (!key) return "N/A";
  return key.substring(0, 8) + "..." + key.substring(key.length - 4);
};

router.post('/chat', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.json({ reply: "Thiếu API Key!" });

  const context = await getUserContext(req.user.id);
  const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(context + message);
      const text = (await result.response).text();
      return res.json({
        reply: text,
        debug: { model: modelName, key: maskKey(apiKey) }
      });
    } catch (err) {
      lastError = err;
      if (err.message.includes('API key') || err.message.includes('403')) break;
    }
  }

  res.status(500).json({
    error: "AI tạm thời không khả dụng",
    details: lastError?.message,
    debug: { attempted: modelsToTry, key: maskKey(apiKey) }
  });
});

router.post('/stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const context = await getUserContext(req.user.id);
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];


  let success = false;
  for (const modelName of modelsToTry) {
    if (success) break;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContentStream(context + message);

      for await (const chunk of result.stream) {
        success = true;
        res.write(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    } catch (error) {
      console.error(`Stream error on ${modelName}:`, error.message);
    }
  }

  if (!success) {
    res.write(`data: ${JSON.stringify({ error: "Tất cả model đều lỗi. Kiểm tra API Key!" })}\n\n`);
    res.end();
  }
});

module.exports = router;
