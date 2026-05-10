const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

router.post('/stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  
  // Thiết lập header chống đệm (Buffering) mạnh mẽ nhất
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Ép Nginx/Cloudflare đẩy dữ liệu ngay

  // Gửi ngay một gói tin trống để "đánh thức" đường truyền
  res.write(': keep-alive\n\n');
  res.flushHeaders && res.flushHeaders();

  // Thử lấy thông tin cơ bản nhanh nhất có thể
  let context = "";
  try {
    const userRes = await db.query('SELECT username FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows[0]) context = `[User: ${userRes.rows[0].username}]. `;
  } catch (e) {}

  const fullPrompt = context + message;
  const modelsToTry = ["gemini-1.5-flash", "gemini-pro"];
  let success = false;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Ưu tiên flash cho tốc độ nhanh nhất
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContentStream(fullPrompt);

    for await (const chunk of result.stream) {
      success = true;
      const text = chunk.text();
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
      // Đảm bảo dữ liệu được đẩy đi ngay
      res.flush && res.flush();
    }
    
    if (success) {
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      throw new Error("Không nhận được dữ liệu từ AI");
    }
  } catch (error) {
    console.error('Stream error:', error.message);
    // Nếu lỗi, thử dùng chat thường để cứu vãn
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(fullPrompt);
      const text = (await result.response).text();
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: "AI đang bận, thử lại sau nhé!" })}\n\n`);
      res.end();
    }
  }
});

router.post('/chat', authenticateUser, async (req, res) => {
  res.redirect(307, '/api/ai/stream');
});

module.exports = router;
