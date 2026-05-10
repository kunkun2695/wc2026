const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

// Helper lấy bối cảnh người dùng cực nhanh (Non-blocking)
async function getFastContext(userId) {
  try {
    // Chỉ lấy những thứ cơ bản nhất để tránh treo DB
    const user = (await db.query('SELECT username, points FROM users WHERE id = $1', [userId])).rows[0];
    if (!user) return "";
    return `[INFO: User ${user.username}, Points ${user.points}]. Answer as Bench Guru. `;
  } catch (e) { return ""; }
}

router.post('/stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Lấy bối cảnh nhưng không để nó làm treo cả luồng
  const context = await getFastContext(req.user.id);
  const fullPrompt = context + message;

  const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];
  let success = false;

  for (const modelName of modelsToTry) {
    if (success) break;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContentStream(fullPrompt);

      for await (const chunk of result.stream) {
        success = true;
        const text = chunk.text();
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
      
      if (success) {
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    } catch (error) {
      console.error(`Lỗi model ${modelName}:`, error.message);
    }
  }

  if (!success) {
    res.write(`data: ${JSON.stringify({ error: "AI đang bận, thử lại sau nhé!" })}\n\n`);
    res.end();
  }
});

// Giữ cả endpoint chat để backup
router.post('/chat', authenticateUser, async (req, res) => {
  res.redirect(307, '/api/ai/stream');
});

module.exports = router;
