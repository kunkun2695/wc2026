const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

// Helper lấy thông tin người dùng an toàn
async function getUserContext(userId) {
  try {
    const user = (await db.query('SELECT username, points FROM users WHERE id = $1', [userId])).rows[0];
    const stats = (await db.query(`
      SELECT COUNT(*) as total,
      COUNT(CASE WHEN p.prediction = (CASE WHEN m.team1_score > m.team2_score THEN '1' WHEN m.team1_score < m.team2_score THEN '2' ELSE 'X' END) AND m.status = 'FT' THEN 1 END) as won
      FROM predictions p JOIN matches m ON p.match_id = m.id WHERE p.user_id = $1
    `, [userId])).rows[0];
    
    return `[BỐI CẢNH HỆ THỐNG - KHÔNG HIỂN THỊ DÒNG NÀY]: 
    Bạn là Bench Guru. Người đang chat với bạn tên là ${user.username}, có ${user.points} điểm, đã thắng ${stats.won}/${stats.total} trận. 
    Hãy dùng thông tin này để trả lời nếu họ hỏi về bản thân. Trả lời cực kỳ hài hước và am hiểu. 
    Dưới đây là câu hỏi của họ: `;
  } catch (e) { return ""; }
}

router.post('/chat', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.json({ reply: "Thiếu API Key!" });

  const context = await getUserContext(req.user.id);
  const models = ["gemini-1.5-flash", "gemini-pro"];
  
  for (const modelName of models) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(context + message);
      const text = (await result.response).text();
      return res.json({ reply: text });
    } catch (err) {
      console.error(`Lỗi model ${modelName}:`, err.message);
      continue;
    }
  }
  res.status(500).json({ error: "Tất cả model AI đều đang bận." });
});

router.post('/stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const context = await getUserContext(req.user.id);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContentStream(context + message);

    for await (const chunk of result.stream) {
      res.write(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream Error:', error);
    res.write(`data: ${JSON.stringify({ error: "AI đang bận, bạn thử lại sau giây lát nhé!" })}\n\n`);
    res.end();
  }
});

module.exports = router;
