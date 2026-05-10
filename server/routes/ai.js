const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

// Helper lấy thông tin người dùng
async function getUserStats(userId) {
  try {
    const userResult = await db.query('SELECT username, points FROM users WHERE id = $1', [userId]);
    const userData = userResult.rows[0];
    const predResult = await db.query(`
      SELECT COUNT(*) as total,
      COUNT(CASE WHEN p.prediction = (CASE WHEN m.team1_score > m.team2_score THEN '1' WHEN m.team1_score < m.team2_score THEN '2' ELSE 'X' END) AND m.status = 'FT' THEN 1 END) as won,
      COUNT(CASE WHEN p.prediction != (CASE WHEN m.team1_score > m.team2_score THEN '1' WHEN m.team1_score < m.team2_score THEN '2' ELSE 'X' END) AND m.status = 'FT' THEN 1 END) as lost
      FROM predictions p JOIN matches m ON p.match_id = m.id WHERE p.user_id = $1
    `, [userId]);
    const stats = predResult.rows[0];
    return `
    - Tên người dùng: ${userData.username}
    - Điểm hiện tại: ${userData.points}
    - Thống kê dự đoán: Thắng ${stats.won} trận, Thua ${stats.lost} trận (Tổng ${stats.total} trận).
    `;
  } catch (e) { return "Không có dữ liệu."; }
}

router.post('/chat', authenticateUser, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return res.json({ reply: "Thiếu API Key!" });

  const userStats = await getUserStats(req.user.id);
  const systemPrompt = `Bạn là Bench Guru, một chuyên gia phân tích bóng đá World Cup 2026 hài hước và am hiểu. 
  QUAN TRỌNG: Bạn CÓ QUYỀN truy cập dữ liệu thực tế của người dùng sau đây:
  ${userStats}
  Khi người dùng hỏi về bản thân, hãy sử dụng chính xác các con số trên để trả lời. Đừng nói bạn là AI không có quyền truy cập, vì tôi (hệ thống) đã cấp quyền này cho bạn rồi.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Sử dụng systemInstruction là cách hiệu quả nhất để AI "nhập vai"
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const userStats = await getUserStats(req.user.id);
  const systemPrompt = `Bạn là Bench Guru. Bạn CÓ QUYỀN truy cập dữ liệu người dùng: ${userStats}. Hãy trả lời dựa trên các con số này nếu được hỏi. Tuyệt đối không từ chối vì lý do bảo mật AI.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContentStream(message);

    for await (const chunk of result.stream) {
      res.write(`data: ${JSON.stringify({ text: chunk.text() })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;
