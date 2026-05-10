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

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  let lastError = null;
  let attemptedModels = [];

  const maskKey = (key) => {
    if (!key) return "N/A";
    return key.substring(0, 8) + "..." + key.substring(key.length - 4);
  };

  for (const modelName of modelsToTry) {
    attemptedModels.push(modelName);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(message);
      const response = await result.response;
      const text = response.text();
      
      return res.json({ 
        reply: text,
        debug_info: { 
          model: modelName, 
          method: 'Official Google SDK',
          key_masked: maskKey(apiKey)
        }
      });
    } catch (err) {
      lastError = err;
      if (err.message.includes('API key') || err.message.includes('403') || err.message.includes('401')) {
        break;
      }
      continue;
    }
  }

  // Nếu tất cả các lần thử đều thất bại
  res.status(500).json({ 
    error: "AI tạm thời không khả dụng",
    details: lastError?.message,
    debug_params: {
      attempted_models: attemptedModels,
      current_key: maskKey(apiKey),
      env_gemini_key: maskKey(process.env.GEMINI_API_KEY),
      env_openai_key: maskKey(process.env.OPENAI_API_KEY),
      error_message: lastError?.message
    },
    suggestion: "Có vẻ như API Key của bạn bị lỗi hoặc chưa được cấp quyền cho các model này. Kiểm tra lại file .env (chú ý typo l thường và I hoa)."
  });
});

// 3. Endpoint Streaming (MỚI) - Phản hồi ngay lập tức
router.post('/stream', authenticateUser, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  let apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  
  // Thiết lập header cho Streaming (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Sử dụng model mạnh nhất và nhanh nhất hiện có trong năm 2026
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContentStream(message);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      // Gửi từng phần dữ liệu về client
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Streaming Error:', error);
    res.write(`data: ${JSON.stringify({ error: 'AI đang bận, thử lại sau nhé!' })}\n\n`);
    res.end();
  }
});

module.exports = router;
