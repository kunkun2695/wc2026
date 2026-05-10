const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Khởi tạo hàm lấy Client AI một cách an toàn
const getAIClient = () => {
  let apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY; 
  if (!apiKey || apiKey === 'sk-xxxx') return { type: 'none' };
  
  apiKey = apiKey.trim();
  
  if (!apiKey.startsWith('sk-')) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Trả về một đối tượng có khả năng thử nhiều model
    return { 
      type: 'gemini', 
      genAI,
      getModel: (name) => genAI.getGenerativeModel({ model: name })
    };
  }
  
  return { type: 'openai', client: new OpenAI({ apiKey }) };
};

router.post('/chat', authenticateUser, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  const ai = getAIClient();

  if (ai.type === 'none') {
    return res.json({ reply: "Chào bạn! Tôi là Bench Guru. Hiện tại tôi đang chạy ở chế độ offline (Thiếu API Key). Hãy nhắc Admin cấu hình Gemini API Key để tôi có thể phân tích sâu hơn nhé!" });
  }

  try {
    if (ai.type === 'gemini') {
      const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
      let attemptLogs = [];
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          const model = ai.getModel(modelName);
          const result = await model.generateContent(message);
          const response = await result.response;
          return res.json({ 
            reply: response.text(),
            debug_info: { model_used: modelName, attempts: attemptLogs } 
          });
        } catch (err) {
          const errorDetail = `Model ${modelName}: [${err.name}] ${err.message}`;
          console.error(errorDetail);
          attemptLogs.push(errorDetail);
          lastError = err;
          
          // Nếu lỗi là do Vùng (Region) hoặc Key không quyền, thường sẽ có mã 400 hoặc 403
          if (err.message.includes('404') || err.message.includes('not found')) continue; 
          break; 
        }
      }
      
      // Nếu thất bại hoàn toàn, trả về lịch sử các lần thử
      return res.status(500).json({ 
        error: "AI tạm thời không khả dụng",
        details: attemptLogs,
        suggestion: "Hãy kiểm tra API Key tại Google AI Studio và đảm bảo Vùng (Region) của bạn được hỗ trợ."
      });
    } else {
      const completion = await ai.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      });
      res.json({ reply: completion.choices[0].message.content });
    }
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: `AI: [${error.name}]: ${error.message}. Vui lòng kiểm tra lại cấu hình Admin hoặc Token đăng nhập.` });
  }
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
