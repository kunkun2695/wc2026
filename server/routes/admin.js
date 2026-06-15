const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { syncOdds } = require('../services/oddsService');

const SECRET_KEY = process.env.JWT_SECRET || 'worldcup2026-secret-key';

// Middleware xác thực Admin
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Không tìm thấy Token' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền Admin' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// API Reset Hệ Thống
router.post('/reset-system', authenticateAdmin, async (req, res) => {
  const { confirmation_code } = req.body;

  // Yêu cầu nhập mã xác nhận đặc biệt để tránh bấm nhầm
  if (confirmation_code !== 'RESET_WC2026_FINAL') {
    return res.status(400).json({ error: 'Mã xác nhận Reset không chính xác!' });
  }

  try {
    console.log('⚠️ Bắt đầu quá trình Reset hệ thống bởi Admin:', req.user.id);

    // Bắt đầu một Transaction để đảm bảo tính toàn vẹn
    await db.query('BEGIN');

    // 1. Xóa tất cả tin nhắn (Chat & DM)
    await db.query('DELETE FROM chat_messages');
    await db.query('DELETE FROM direct_messages');

    // 2. Xóa bài đăng và bình luận
    await db.query('DELETE FROM comments');
    await db.query('DELETE FROM posts');

    // 3. Xóa các kèo dự đoán và lịch sử điểm
    await db.query('DELETE FROM predictions');
    
    // 4. Xóa thông báo
    await db.query('DELETE FROM notifications');

    // 5. Cập nhật lại điểm của toàn bộ người dùng về 0
    await db.query('UPDATE users SET points = 0');

    // 6. Reset lại trạng thái các trận đấu về UPCOMING (tùy chọn)
    await db.query('UPDATE matches SET team1_score = 0, team2_score = 0, status = \'UPCOMING\'');

    await db.query('COMMIT');

    res.json({ message: 'Hệ thống đã được Reset sạch sẽ! Toàn bộ bài đăng, tin nhắn và lịch sử đã bị xóa.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Reset System Error:', error);
    res.status(500).json({ error: 'Lỗi trong quá trình Reset: ' + error.message });
  }
});

// API Nạp lại Dữ liệu World Cup 2026
router.post('/seed-wc2026', authenticateAdmin, async (req, res) => {
  const groupMatches = [
    { team1_name: 'Mexico', team1_flag: '🇲🇽', team2_name: 'Nam Phi', team2_flag: '🇿🇦', match_time: '12/06 - 02:00', group_name: 'A', competition_name: 'Bảng A' },
    { team1_name: 'Hàn Quốc', team1_flag: '🇰🇷', team2_name: 'CH Séc', team2_flag: '🇨🇿', match_time: '12/06 - 09:00', group_name: 'A', competition_name: 'Bảng A' },
    { team1_name: 'Canada', team1_flag: '🇨🇦', team2_name: 'Bosnia', team2_flag: '🇧🇦', match_time: '13/06 - 02:00', group_name: 'B', competition_name: 'Bảng B' },
    { team1_name: 'Qatar', team1_flag: '🇶🇦', team2_name: 'Thụy Sĩ', team2_flag: '🇨🇭', match_time: '14/06 - 02:00', group_name: 'B', competition_name: 'Bảng B' },
    { team1_name: 'Brazil', team1_flag: '🇧🇷', team2_name: 'Morocco', team2_flag: '🇲🇦', match_time: '14/06 - 05:00', group_name: 'C', competition_name: 'Bảng C' },
    { team1_name: 'Haiti', team1_flag: '🇭🇹', team2_name: 'Scotland', team2_flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', match_time: '14/06 - 08:00', group_name: 'C', competition_name: 'Bảng C' },
    { team1_name: 'Mỹ', team1_flag: '🇺🇸', team2_name: 'Paraguay', team2_flag: '🇵🇾', match_time: '13/06 - 08:00', group_name: 'D', competition_name: 'Bảng D' },
    { team1_name: 'Australia', team1_flag: '🇦🇺', team2_name: 'Thổ Nhĩ Kỳ', team2_flag: '🇹🇷', match_time: '14/06 - 11:00', group_name: 'D', competition_name: 'Bảng D' },
    { team1_name: 'Đức', team1_flag: '🇩🇪', team2_name: 'Curacao', team2_flag: '🇨🇼', match_time: '15/06 - 00:00', group_name: 'E', competition_name: 'Bảng E' },
    { team1_name: 'Bờ Biển Ngà', team1_flag: '🇨🇮', team2_name: 'Ecuador', team2_flag: '🇪🇨', match_time: '15/06 - 06:00', group_name: 'E', competition_name: 'Bảng E' },
    { team1_name: 'Hà Lan', team1_flag: '🇳🇱', team2_name: 'Nhật Bản', team2_flag: '🇯🇵', match_time: '15/06 - 03:00', group_name: 'F', competition_name: 'Bảng F' },
    { team1_name: 'Thụy Điển', team1_flag: '🇸🇪', team2_name: 'Tunisia', team2_flag: '🇹🇳', match_time: '15/06 - 09:00', group_name: 'F', competition_name: 'Bảng F' },
    { team1_name: 'Bỉ', team1_flag: '🇧🇪', team2_name: 'Ai Cập', team2_flag: '🇪🇬', match_time: '16/06 - 02:00', group_name: 'G', competition_name: 'Bảng G' },
    { team1_name: 'Iran', team1_flag: '🇮🇷', team2_name: 'New Zealand', team2_flag: '🇳🇿', match_time: '16/06 - 06:00', group_name: 'G', competition_name: 'Bảng G' },
    { team1_name: 'Tây Ban Nha', team1_flag: '🇪🇸', team2_name: 'Cabo Verde', team2_flag: '🇨🇻', match_time: '15/06 - 23:00', group_name: 'H', competition_name: 'Bảng H' },
    { team1_name: 'Saudi Arabia', team1_flag: '🇸🇦', team2_name: 'Uruguay', team2_flag: '🇺🇾', match_time: '16/06 - 02:00', group_name: 'H', competition_name: 'Bảng H' },
    { team1_name: 'Pháp', team1_flag: '🇫🇷', team2_name: 'Senegal', team2_flag: '🇸🇳', match_time: '17/06 - 00:00', group_name: 'I', competition_name: 'Bảng I' },
    { team1_name: 'Iraq', team1_flag: '🇮🇶', team2_name: 'Na Uy', team2_flag: '🇳🇴', match_time: '17/06 - 03:00', group_name: 'I', competition_name: 'Bảng I' },
    { team1_name: 'Argentina', team1_flag: '🇦🇷', team2_name: 'Algeria', team2_flag: '🇩🇿', match_time: '17/06 - 08:00', group_name: 'J', competition_name: 'Bảng J' },
    { team1_name: 'Áo', team1_flag: '🇦🇹', team2_name: 'Jordan', team2_flag: '🇯🇴', match_time: '17/06 - 11:00', group_name: 'J', competition_name: 'Bảng J' },
    { team1_name: 'Bồ Đào Nha', team1_flag: '🇵🇹', team2_name: 'CHDC Congo', team2_flag: '🇨🇩', match_time: '17/06 - 22:00', group_name: 'K', competition_name: 'Bảng K' },
    { team1_name: 'Uzbekistan', team1_flag: '🇺🇿', team2_name: 'Colombia', team2_flag: '🇨🇴', match_time: '18/06 - 01:00', group_name: 'K', competition_name: 'Bảng K' },
    { team1_name: 'Anh', team1_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', team2_name: 'Croatia', team2_flag: '🇭🇷', match_time: '18/06 - 03:00', group_name: 'L', competition_name: 'Bảng L' },
    { team1_name: 'Ghana', team1_flag: '🇬🇭', team2_name: 'Panama', team2_flag: '🇵🇦', match_time: '18/06 - 06:00', group_name: 'L', competition_name: 'Bảng L' }
  ];

  const knockoutMatches = [
    { team1_name: 'Thắng Vòng 32 (1)', team1_flag: '⚽', team2_name: 'Thắng Vòng 32 (2)', team2_flag: '⚽', match_time: '01/07 - 01:00', group_name: 'KO', competition_name: 'Vòng 1/8' },
    { team1_name: 'Thắng Vòng 32 (3)', team1_flag: '⚽', team2_name: 'Thắng Vòng 32 (4)', team2_flag: '⚽', match_time: '01/07 - 04:00', group_name: 'KO', competition_name: 'Vòng 1/8' },
    { team1_name: 'Thắng Vòng 32 (5)', team1_flag: '⚽', team2_name: 'Thắng Vòng 32 (6)', team2_flag: '⚽', match_time: '02/07 - 01:00', group_name: 'KO', competition_name: 'Vòng 1/8' },
    { team1_name: 'Thắng Vòng 32 (7)', team1_flag: '⚽', team2_name: 'Thắng Vòng 32 (8)', team2_flag: '⚽', match_time: '02/07 - 04:00', group_name: 'KO', competition_name: 'Vòng 1/8' },
    { team1_name: 'Thắng Vòng 32 (9)', team1_flag: '⚽', team2_name: 'Thắng Vòng 32 (10)', team2_flag: '⚽', match_time: '03/07 - 01:00', group_name: 'KO', competition_name: 'Vòng 1/8' },
    { team1_name: 'Thắng Vòng 32 (11)', team1_flag: '⚽', team2_name: 'Thắng Vòng 32 (12)', team2_flag: '⚽', match_time: '03/07 - 04:00', group_name: 'KO', competition_name: 'Vòng 1/8' },
    { team1_name: 'Thắng Vòng 32 (13)', team1_flag: '⚽', team2_name: 'Thắng Vòng 32 (14)', team2_flag: '⚽', match_time: '04/07 - 01:00', group_name: 'KO', competition_name: 'Vòng 1/8' },
    { team1_name: 'Thắng Vòng 32 (15)', team1_flag: '⚽', team2_name: 'Thắng Vòng 32 (16)', team2_flag: '⚽', match_time: '04/07 - 04:00', group_name: 'KO', competition_name: 'Vòng 1/8' },

    { team1_name: 'Thắng Vòng 1/8 (1)', team1_flag: '⚽', team2_name: 'Thắng Vòng 1/8 (2)', team2_flag: '⚽', match_time: '08/07 - 01:00', group_name: 'KO', competition_name: 'Tứ kết' },
    { team1_name: 'Thắng Vòng 1/8 (3)', team1_flag: '⚽', team2_name: 'Thắng Vòng 1/8 (4)', team2_flag: '⚽', match_time: '08/07 - 04:00', group_name: 'KO', competition_name: 'Tứ kết' },
    { team1_name: 'Thắng Vòng 1/8 (5)', team1_flag: '⚽', team2_name: 'Thắng Vòng 1/8 (6)', team2_flag: '⚽', match_time: '09/07 - 01:00', group_name: 'KO', competition_name: 'Tứ kết' },
    { team1_name: 'Thắng Vòng 1/8 (7)', team1_flag: '⚽', team2_name: 'Thắng Vòng 1/8 (8)', team2_flag: '⚽', match_time: '09/07 - 04:00', group_name: 'KO', competition_name: 'Tứ kết' },

    { team1_name: 'Thắng Tứ kết (1)', team1_flag: '⚽', team2_name: 'Thắng Tứ kết (2)', team2_flag: '⚽', match_time: '13/07 - 03:00', group_name: 'KO', competition_name: 'Bán kết' },
    { team1_name: 'Thắng Tứ kết (3)', team1_flag: '⚽', team2_name: 'Thắng Tứ kết (4)', team2_flag: '⚽', match_time: '14/07 - 03:00', group_name: 'KO', competition_name: 'Bán kết' },

    { team1_name: 'Thắng Bán kết (1)', team1_flag: '⚽', team2_name: 'Thắng Bán kết (2)', team2_flag: '⚽', match_time: '20/07 - 03:00', group_name: 'KO', competition_name: 'Chung kết' }
  ];

  try {
    await db.query('BEGIN');

    // 1. Chỉ xóa các trận đấu KHÔNG có dự đoán của người chơi để giữ lại dữ liệu dự đoán
    const matchesWithPredictionsRes = await db.query('SELECT DISTINCT match_id FROM predictions');
    const matchIdsWithPredictions = matchesWithPredictionsRes.rows.map(r => r.match_id);

    if (matchIdsWithPredictions.length > 0) {
      await db.query('DELETE FROM matches WHERE id NOT IN (' + matchIdsWithPredictions.join(',') + ')');
    } else {
      await db.query('DELETE FROM predictions');
      await db.query('DELETE FROM comments');
      await db.query('DELETE FROM notifications');
      await db.query('DELETE FROM matches');
    }

    // 2. Thêm hoặc cập nhật các trận vòng bảng
    for (const m of groupMatches) {
      const existRes = await db.query(
        'SELECT id FROM matches WHERE (team1_name = $1 AND team2_name = $2) OR (team1_name = $2 AND team2_name = $1)',
        [m.team1_name, m.team2_name]
      );
      if (existRes.rows.length > 0) {
        const matchId = existRes.rows[0].id;
        const predCheck = await db.query('SELECT COUNT(*) FROM predictions WHERE match_id = $1', [matchId]);
        const hasPred = parseInt(predCheck.rows[0].count) > 0;

        if (hasPred) {
          // Nếu đã có dự đoán, chỉ cập nhật thông tin bổ trợ như cờ, giờ đấu, bảng đấu, địa điểm (không reset điểm số/trạng thái)
          await db.query(
            'UPDATE matches SET team1_flag = $1, team2_flag = $2, match_time = $3, group_name = $4, competition_name = $5 WHERE id = $6',
            [m.team1_flag, m.team2_flag, m.match_time, m.group_name, m.competition_name, matchId]
          );
        } else {
          // Nếu không có dự đoán, có thể cập nhật và reset trạng thái về mặc định
          await db.query(
            'UPDATE matches SET team1_flag = $1, team2_flag = $2, match_time = $3, group_name = $4, status = $5, team1_score = $6, team2_score = $7, competition_name = $8 WHERE id = $9',
            [m.team1_flag, m.team2_flag, m.match_time, m.group_name, 'UPCOMING', 0, 0, m.competition_name, matchId]
          );
        }
      } else {
        await db.query(
          'INSERT INTO matches (team1_name, team1_flag, team2_name, team2_flag, match_time, group_name, status, team1_score, team2_score, competition_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [m.team1_name, m.team1_flag, m.team2_name, m.team2_flag, m.match_time, m.group_name, 'UPCOMING', 0, 0, m.competition_name]
        );
      }
    }

    // 3. Thêm hoặc cập nhật các trận knockout
    for (const m of knockoutMatches) {
      const existRes = await db.query(
        'SELECT id FROM matches WHERE (team1_name = $1 AND team2_name = $2) OR (team1_name = $2 AND team2_name = $1)',
        [m.team1_name, m.team2_name]
      );
      if (existRes.rows.length > 0) {
        const matchId = existRes.rows[0].id;
        const predCheck = await db.query('SELECT COUNT(*) FROM predictions WHERE match_id = $1', [matchId]);
        const hasPred = parseInt(predCheck.rows[0].count) > 0;

        if (hasPred) {
          await db.query(
            'UPDATE matches SET team1_flag = $1, team2_flag = $2, match_time = $3, group_name = $4, competition_name = $5 WHERE id = $6',
            [m.team1_flag, m.team2_flag, m.match_time, m.group_name, m.competition_name, matchId]
          );
        } else {
          await db.query(
            'UPDATE matches SET team1_flag = $1, team2_flag = $2, match_time = $3, group_name = $4, status = $5, team1_score = $6, team2_score = $7, competition_name = $8 WHERE id = $9',
            [m.team1_flag, m.team2_flag, m.match_time, m.group_name, 'UPCOMING', 0, 0, m.competition_name, matchId]
          );
        }
      } else {
        await db.query(
          'INSERT INTO matches (team1_name, team1_flag, team2_name, team2_flag, match_time, group_name, status, team1_score, team2_score, competition_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [m.team1_name, m.team1_flag, m.team2_name, m.team2_flag, m.match_time, m.group_name, 'UPCOMING', 0, 0, m.competition_name]
        );
      }
    }

    await db.query('COMMIT');
    res.json({ message: 'Đã nạp lại dữ liệu World Cup 2026 thực tế thành công!' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Seed WC2026 Error:', error);
    res.status(500).json({ error: 'Lỗi nạp dữ liệu: ' + error.message });
  }
});

// API Lấy danh sách toàn bộ người dùng
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.name, 
        u.role, 
        u.avatar, 
        u.is_verified,
        COALESCE(SUM(CASE WHEN m.status = 'FT' AND p.points = 10 THEN 1 ELSE 0 END), 0) as points,
        u.created_at 
      FROM users u
      LEFT JOIN predictions p ON u.id = p.user_id
      LEFT JOIN matches m ON p.match_id = m.id
      GROUP BY u.id
      ORDER BY points DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách user: ' + error.message });
  }
});

// API Phê duyệt/Xác thực người dùng
router.put('/users/:id/verify', authenticateAdmin, async (req, res) => {
  const userId = req.params.id;
  const { isVerified } = req.body; // boolean
  
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'Bạn không thể tự xác thực/hủy xác thực chính mình!' });
  }

  try {
    const checkUser = await db.query('SELECT id, username, name FROM users WHERE id = $1', [userId]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    await db.query('UPDATE users SET is_verified = $1 WHERE id = $2', [isVerified, userId]);
    
    // Gửi thông báo hệ thống nếu được phê duyệt thành công
    if (isVerified) {
      const title = '🎉 Tài khoản đã được phê duyệt';
      const message = 'Chào mừng bạn! Tài khoản của bạn đã được phê duyệt thành công và hiện tại đã có thể truy cập toàn bộ chức năng.';
      await db.query(
        `INSERT INTO notifications (user_id, sender_id, type, title, message, content, url)
         VALUES ($1, $2, 'system', $3, $4, $4, '/')`,
        [userId, req.user.id, title, message]
      ).catch(e => console.error('Lỗi tạo thông báo khi phê duyệt user:', e.message));
    }

    res.json({ message: isVerified ? 'Đã phê duyệt người dùng thành công' : 'Đã hủy phê duyệt người dùng' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái người dùng: ' + error.message });
  }
});

// API Xóa một người dùng
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  const userId = req.params.id;
  
  // Không cho phép xóa chính mình
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ error: 'Bạn không thể tự xóa chính mình!' });
  }

  try {
    await db.query('BEGIN');

    // Xóa các dữ liệu liên quan trước khi xóa user (tránh lỗi khóa ngoại)
    await db.query('DELETE FROM chat_messages WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM direct_messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);
    await db.query('DELETE FROM comments WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM posts WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM predictions WHERE user_id = $1', [userId]);
    await db.query('DELETE FROM notifications WHERE user_id = $1 OR sender_id = $1', [userId]);
    
    // Cuối cùng xóa User
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING username', [userId]);
    
    if (result.rowCount === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'Không tìm thấy người dùng này' });
    }

    await db.query('COMMIT');
    res.json({ message: `Đã xóa người dùng ${result.rows[0].username} thành công!` });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa người dùng: ' + error.message });
  }
});

// API Đặt lại mật khẩu của một người dùng
router.put('/users/:id/reset-password', authenticateAdmin, async (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.trim().length === 0) {
    return res.status(400).json({ error: 'Mật khẩu mới không được để trống' });
  }

  try {
    const result = await db.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING username',
      [newPassword, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng này' });
    }

    res.json({ message: `Đặt lại mật khẩu cho người dùng ${result.rows[0].username} thành công!` });
  } catch (error) {
    console.error('Reset User Password Error:', error);
    res.status(500).json({ error: 'Lỗi khi đặt lại mật khẩu: ' + error.message });
  }
});

// API Đồng bộ kèo cược từ kqbd.mobi thủ công
router.post('/matches/sync-odds', authenticateAdmin, async (req, res) => {
  try {
    const updatedCount = await syncOdds();
    res.json({ message: `Đồng bộ tỷ lệ kèo cược thành công! Đã cập nhật ${updatedCount} trận đấu.` });
  } catch (error) {
    console.error('Odds manual sync error:', error);
    res.status(500).json({ error: 'Lỗi đồng bộ tỷ lệ kèo: ' + error.message });
  }
});

module.exports = router;
