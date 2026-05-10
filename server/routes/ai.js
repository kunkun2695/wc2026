const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');

const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Khởi tạo hàm lấy Client AI một cách an toàn
const getAIClient = () => {
  let apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY; 
  if (!apiKey || apiKey === 'sk-xxxx') return { type: 'none' };
  
  apiKey = apiKey.trim(); // Tự động xóa khoảng trắng thừa
  
  // Nếu là key của Google (thường không bắt đầu bằng sk-)
  if (!apiKey.startsWith('sk-')) {
    const genAI = new GoogleGenerativeAI(apiKey);
    return { type: 'gemini', client: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) };
  }
  
  // Nếu là key của OpenAI
  return { type: 'openai', client: new OpenAI({ apiKey }) };
};

router.post('/chat', authenticateUser, async (req, res) => {
  const { message } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  const ai = getAIClient();

  // Nếu không có API Key, dùng bộ não giả lập
  if (ai.type === 'none') {
    return simulateAiResponse(message, res);
  }

  try {
    if (ai.type === 'gemini') {
      const prompt = `Bạn là Bench Guru, một chuyên gia phân tích bóng đá chuyên nghiệp cho World Cup 2026. 
      Bạn am hiểu sâu sắc về chiến thuật, lịch sử và các ngôi sao. 
      Phong cách của bạn là nhiệt huyết, đôi khi có chút hài hước (văn hóa 'gáy' bóng đá), nhưng luôn dựa trên dữ liệu. 
      Trả lời bằng tiếng Việt, ngắn gọn nhưng chất lượng.
      
      Người dùng hỏi: ${message}`;
      
      const result = await ai.client.generateContent(prompt);
      const response = await result.response;
      const reply = response.text();
      return res.json({ reply });
    } else {
      // Logic OpenAI cũ
      const completion = await ai.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Bạn là Bench Guru, chuyên gia bóng đá World Cup 2026." },
          { role: "user", content: message }
        ]
      });
      res.json({ reply: completion.choices[0].message.content });
    }
  } catch (err) {
    console.error('AI Error:', err.message);
    res.status(500).json({ error: `AI: ${err.message}` });
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
