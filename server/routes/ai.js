const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');

const OpenAI = require('openai');

// Khởi tạo hàm lấy Client OpenAI một cách an toàn
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-xxxx') return null;
  return new OpenAI({ apiKey });
};

router.post('/chat', authenticateUser, async (req, res) => {
  const { message } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  const openai = getOpenAIClient();

  // Nếu không có API Key hoặc lỗi khởi tạo, dùng bộ não giả lập
  if (!openai) {
    return simulateAiResponse(message, res);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Bạn là Bench Guru, một chuyên gia phân tích bóng đá chuyên nghiệp cho World Cup 2026. Bạn am hiểu sâu sắc về chiến thuật, lịch sử và các ngôi sao. Phong cách của bạn là nhiệt huyết, đôi khi có chút hài hước (văn hóa 'gáy' bóng đá), nhưng luôn dựa trên dữ liệu. Trả lời bằng tiếng Việt, ngắn gọn nhưng chất lượng." 
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('OpenAI Error:', err.message);
    const errorMessage = err.response?.data?.error?.message || err.message || 'Lỗi không xác định từ OpenAI';
    res.status(500).json({ error: `OpenAI: ${errorMessage}` });
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
