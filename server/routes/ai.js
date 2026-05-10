const express = require('express');
const axios = require('axios');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const OpenAI = require('openai');

// Hàm gọi trực tiếp API Google Gemini (Không dùng SDK)
const callGeminiAPI = async (apiKey, modelName, message) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: message }] }]
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (response.data && response.data.candidates && response.data.candidates[0].content) {
    return response.data.candidates[0].content.parts[0].text;
  }
  throw new Error('Cấu trúc phản hồi từ Google không hợp lệ');
};

const getErrorMessage = (err) => {
  if (err.response) {
    const data = err.response.data;
    if (data.error) {
      if (data.error.message.includes('API key not valid')) return 'API Key không hợp lệ hoặc đã hết hạn.';
      if (data.error.status === 'PERMISSION_DENIED') return 'API Key không có quyền truy cập Gemini API.';
      return data.error.message;
    }
    return JSON.stringify(data);
  }
  return err.message;
};

router.post('/chat', authenticateUser, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  let apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY; 
  if (!apiKey || apiKey === 'sk-xxxx') {
    return res.json({ reply: "Chào bạn! Tôi là Bench Guru. Hiện tại tôi đang chạy ở chế độ offline (Thiếu API Key). Hãy nhắc Admin cấu hình Gemini API Key nhé!" });
  }
  apiKey = apiKey.trim();

  // Kiểm tra nếu là OpenAI
  if (apiKey.startsWith('sk-')) {
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      });
      return res.json({ reply: completion.choices[0].message.content });
    } catch (err) {
      return res.status(500).json({ error: `OpenAI Error: ${err.message}` });
    }
  }

  // Xử lý Google Gemini bằng cách thử trực tiếp API
  const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
  let attemptLogs = [];

  for (const modelName of modelsToTry) {
    try {
      const reply = await callGeminiAPI(apiKey, modelName, message);
      return res.json({ 
        reply,
        debug_info: { model: modelName, method: 'Direct REST API' }
      });
    } catch (err) {
      const errMsg = getErrorMessage(err);
      attemptLogs.push(`Model ${modelName}: ${errMsg}`);
      
      // Nếu là lỗi Key không hợp lệ thì không cần thử model khác
      if (errMsg.includes('API Key không hợp lệ')) break;
      
      continue;
    }
  }

  res.status(500).json({ 
    error: "AI tạm thời không khả dụng (Lỗi API trực tiếp)",
    details: attemptLogs,
    suggestion: "Hãy kiểm tra xem API Key có đúng là tạo từ Google AI Studio không."
  });
});

// Hàm giả lập (Fallback)
function simulateAiResponse(message, res) {
  const msg = message.toLowerCase();
  let reply = "";
  if (msg.includes('brazil')) reply = "Brazil vẫn là ứng cử viên số 1 cho World Cup 2026!";
  else if (msg.includes('pháp')) reply = "Pháp đang sở hữu chiều sâu đội hình đáng nể nhất thế giới.";
  else reply = `Chào bạn! Bạn hỏi về "${message}" rất hay. Hãy điền API Key OpenAI vào .env để tôi trả lời thông minh hơn nhé!`;
  
  setTimeout(() => res.json({ reply }), 1000);
}

module.exports = router;
