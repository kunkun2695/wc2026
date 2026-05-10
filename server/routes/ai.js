const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./users');

// Đây là nơi bạn sẽ cấu hình Gemini hoặc OpenAI vào buổi tối
// const { GoogleGenerativeAI } = require("@google/generative-ai");
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', authenticateToken, async (req, res) => {
  const { message } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Nội dung trống' });

  try {
    // Giả lập logic xử lý của "Bench Guru"
    const msg = message.toLowerCase();
    let reply = "";

    if (msg.includes('brazil')) {
      reply = "Theo dữ liệu mới nhất, **Brazil** đang có phong độ cực cao với chuỗi 4 trận thắng liên tiếp. Tại World Cup 2026, họ vẫn là ứng cử viên số 1. Nếu bạn định chốt kèo tối nay, hãy tin vào những vũ công Samba!";
    } else if (msg.includes('vô địch') || msg.includes('ai thắng')) {
      reply = "Dự đoán nhà vô địch sớm là một thử thách, nhưng AI của tôi đang chấm điểm cao cho **Pháp** và **Argentina**. Tuy nhiên, đừng quên các 'ngựa ô' từ Châu Phi nhé!";
    } else if (msg.includes('vua phá lưới')) {
      reply = "Cuộc đua **Vua phá lưới** đang gọi tên Haaland và Mbappe. Nhưng với phong độ hiện tại của các cầu thủ trẻ, tôi dự đoán sẽ có một cái tên bất ngờ từ đội tuyển Việt Nam (nếu chúng ta lọt vào vòng trong! 😉)";
    } else if (msg.includes('lịch sử') || msg.includes('vô địch nhiều nhất')) {
      reply = "**Brazil** vẫn là 'vị vua' với 5 lần nâng cúp. Nhưng Argentina đang bám đuổi rất gắt sau thành công ở Qatar 2022.";
    } else {
      reply = `Chào bạn! Câu hỏi về **"${message}"** rất thú vị. Với tư cách là Trợ lý AI, tôi đánh giá cao sự quan tâm của bạn. Buổi tối nay khi đại ca tích hợp API xịn vào, tôi sẽ trả lời chi tiết hơn gấp 10 lần nhé!`;
    }

    // Giả lập độ trễ suy nghĩ của AI
    setTimeout(() => {
      res.json({ reply });
    }, 1000);

  } catch (err) {
    res.status(500).json({ error: 'Lỗi hệ thống AI' });
  }
});

module.exports = router;
