const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/db');

router.post('/chat', authenticateUser, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  let apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY; 
  if (!apiKey || apiKey === 'sk-xxxx' || apiKey === 'AIzaSyCdHbmJwC_LID-iKkDALNoufbodDzsG1XU') {
    // Nếu là key mẫu hoặc key bị lỗi typo chữ I hoa
    if (apiKey === 'AIzaSyCdHbmJwC_LID-iKkDALNoufbodDzsG1XU') {
       return res.json({ reply: "⚠️ **Thông báo:** API Key hiện tại của bạn bị lỗi đánh máy (Typo). \n\n**Cách khắc phục:**\n1. Mở file `.env`.\n2. Tìm dòng `GEMINI_API_KEY`.\n3. Đổi đoạn `_LID` thành `_LlD` (chữ **l** thường thay vì **I** hoa).\n4. Khởi động lại Server." });
    }
  }

  if (!apiKey) {
    return res.json({ reply: "Chào bạn! Tôi là Bench Guru. Hiện tại tôi đang chạy ở chế độ offline (Thiếu API Key). Hãy nhắc Admin cấu hình Gemini API Key nhé!" });
  }

  // LẤY DỮ LIỆU NGƯỜI DÙNG ĐỂ LÀM BỐI CẢNH (CONTEXT)
  let userContext = "";
  try {
    const userResult = await db.query('SELECT username, points FROM users WHERE id = $1', [req.user.id]);
    const userData = userResult.rows[0];
    
    const predResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN p.prediction = (CASE WHEN m.team1_score > m.team2_score THEN '1' WHEN m.team1_score < m.team2_score THEN '2' ELSE 'X' END) AND m.status = 'FT' THEN 1 END) as won,
        COUNT(CASE WHEN p.prediction != (CASE WHEN m.team1_score > m.team2_score THEN '1' WHEN m.team1_score < m.team2_score THEN '2' ELSE 'X' END) AND m.status = 'FT' THEN 1 END) as lost
      FROM predictions p
      JOIN matches m ON p.match_id = m.id
      WHERE p.user_id = $1
    `, [req.user.id]);
    const stats = predResult.rows[0];

    userContext = `\n\n[BỐI CẢNH NGƯỜI DÙNG]: 
    - Tên: ${userData.username}
    - Điểm hiện tại: ${userData.points}
    - Thống kê dự đoán: Tổng ${stats.total} trận, Thắng ${stats.won} trận, Thua ${stats.lost} trận.
    Hãy sử dụng dữ liệu này nếu người dùng hỏi về bản thân họ. Trả lời thân thiện, hài hước như một chuyên gia bóng đá.`;
  } catch (err) {
    console.error('Lỗi lấy bối cảnh người dùng:', err);
  }
  
  console.log(`[AI DEBUG] Bắt đầu xử lý Chat. Key prefix: ${apiKey.substring(0, 8)}`);
  const fullMessage = message + userContext;

  // 1. Xử lý OpenAI
  if (apiKey.startsWith('sk-')) {
    console.log('[AI DEBUG] Sử dụng luồng OpenAI...');
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      });
      console.log('[AI DEBUG] OpenAI phản hồi thành công.');
      return res.json({ reply: completion.choices[0].message.content });
    } catch (err) {
      console.error('[AI DEBUG] OpenAI Error:', err.message);
      return res.status(500).json({ error: `OpenAI Error: ${err.message}` });
    }
  }

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  let lastError = null;
  let attemptedModels = [];

  const maskKey = (key) => {
    if (!key) return "N/A";
    return key.substring(0, 8) + "..." + key.substring(key.length - 4);
  };

  for (const modelName of modelsToTry) {
    console.log(`[AI DEBUG] Đang thử Model: ${modelName}...`);
    attemptedModels.push(modelName);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      console.log(`[AI DEBUG] Đang gửi yêu cầu tới ${modelName}...`);
      const result = await model.generateContent(fullMessage);
      const response = await result.response;
      const text = response.text();
      
      console.log(`[AI DEBUG] ${modelName} phản hồi THÀNH CÔNG.`);
      return res.json({ 
        reply: text,
        debug_info: { 
          model: modelName, 
          method: 'Official Google SDK',
          key_masked: maskKey(apiKey)
        }
      });
    } catch (err) {
      console.error(`[AI DEBUG] Model ${modelName} THẤT BẠI:`, err.message);
      lastError = err;
      if (err.message.includes('API key') || err.message.includes('403') || err.message.includes('401')) {
        console.log('[AI DEBUG] Lỗi API Key, dừng thử các model khác.');
        break;
      }
      continue;
    }
  }

  console.log('[AI DEBUG] TẤT CẢ model đều thất bại.');
  // Nếu tất cả các lần thử đều thất bại
  res.status(500).json({ 
    error: "AI tạm thời không khả dụng",
    details: lastError?.message,
    debug_params: {
      attempted_models: attemptedModels,
      current_key: maskKey(apiKey),
      error_message: lastError?.message
    },
    suggestion: "Kiểm tra lại API Key trong file .env và đảm bảo model này được hỗ trợ trong vùng của bạn."
  });
});

// 3. Endpoint Streaming (MỚI) - Phản hồi ngay lập tức
router.post('/stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  let apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Thiếu API Key' });

  console.log(`[AI STREAM DEBUG] Bắt đầu Stream. Key prefix: ${apiKey.substring(0, 8)}`);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  let success = false;
  let lastError = null;

  // Lấy bối cảnh người dùng
  let userContext = "";
  try {
    const userResult = await db.query('SELECT username, points FROM users WHERE id = $1', [req.user.id]);
    const userData = userResult.rows[0];
    const predResult = await db.query(`
      SELECT COUNT(*) as total,
      COUNT(CASE WHEN p.prediction = (CASE WHEN m.team1_score > m.team2_score THEN '1' WHEN m.team1_score < m.team2_score THEN '2' ELSE 'X' END) AND m.status = 'FT' THEN 1 END) as won,
      COUNT(CASE WHEN p.prediction != (CASE WHEN m.team1_score > m.team2_score THEN '1' WHEN m.team1_score < m.team2_score THEN '2' ELSE 'X' END) AND m.status = 'FT' THEN 1 END) as lost
      FROM predictions p JOIN matches m ON p.match_id = m.id WHERE p.user_id = $1
    `, [req.user.id]);
    const stats = predResult.rows[0];
    userContext = `\n\n[Dữ liệu người dùng: Tên ${userData.username}, Điểm ${userData.points}, Thắng ${stats.won}, Thua ${stats.lost}]. Hãy trả lời dựa trên thông tin này nếu cần.`;
    console.log('[AI STREAM DEBUG] Đã lấy xong bối cảnh người dùng.');
  } catch (e) {
    console.error('[AI STREAM DEBUG] Lỗi bối cảnh:', e.message);
  }

  for (const modelName of modelsToTry) {
    console.log(`[AI STREAM DEBUG] Đang thử Model: ${modelName}...`);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      console.log(`[AI STREAM DEBUG] Đang yêu cầu Stream từ ${modelName}...`);
      const result = await model.generateContentStream(message + userContext);

      let chunkCount = 0;
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
        chunkCount++;
      }
      
      console.log(`[AI STREAM DEBUG] Stream THÀNH CÔNG với ${modelName}. Tổng cộng ${chunkCount} chunks.`);
      success = true;
      res.write('data: [DONE]\n\n');
      res.end();
      break; 
    } catch (error) {
      console.error(`[AI STREAM DEBUG] Model ${modelName} LỖI:`, error.message);
      lastError = error;
      if (error.message.includes('API key') || error.message.includes('403') || error.message.includes('401')) {
        break;
      }
      continue;
    }
  }

  if (!success) {
    console.log('[AI STREAM DEBUG] TẤT CẢ model stream đều thất bại.');
    res.write(`data: ${JSON.stringify({ error: `AI lỗi: ${lastError?.message || 'Hết lượt thử'}` })}\n\n`);
    res.end();
  }
});

module.exports = router;
