const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");

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
  
  apiKey = apiKey.trim();

  // 1. Xử lý OpenAI
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

  // 2. Xử lý Google Gemini bằng SDK chính thức (Tốt hơn Axios)
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(message);
      const response = await result.response;
      const text = response.text();
      
      return res.json({ 
        reply: text,
        debug_info: { model: modelName, method: 'Official Google SDK' }
      });
    } catch (err) {
      lastError = err;
      // Nếu lỗi là do API Key thì dừng luôn không thử model khác
      if (err.message.includes('API key') || err.message.includes('403') || err.message.includes('401')) {
        break;
      }
      continue;
    }
  }

  // Nếu tất cả các lần thử đều thất bại
  res.status(500).json({ 
    error: "AI tạm thời không khả dụng",
    details: [lastError?.message],
    suggestion: "Có vẻ như API Key của bạn chưa được cấp quyền cho các model này hoặc bị giới hạn vùng địa lý. Hãy thử tạo lại Key mới tại Google AI Studio."
  });
});

module.exports = router;
