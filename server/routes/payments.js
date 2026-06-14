const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser } = require('../middleware/auth');

// 1. Tạo yêu cầu thanh toán (Đóng quỹ)
router.post('/', authenticateUser, async (req, res) => {
  const { amount, memo, notes } = req.body;
  const userId = req.user.id;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Số tiền chuyển khoản không hợp lệ.' });
  }
  if (!memo || !memo.trim()) {
    return res.status(400).json({ error: 'Nội dung chuyển khoản không được bỏ trống.' });
  }

  const cleanMemo = memo.trim();

  try {
    // Kiểm tra trùng lặp mã chuyển khoản đang hoạt động
    const existing = await db.query(
      "SELECT id FROM payments WHERE transfer_code = $1 AND status != 'REJECTED'",
      [cleanMemo]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'Nội dung chuyển khoản này đã được sử dụng hoặc đang chờ duyệt. Vui lòng chỉnh sửa nội dung để phân biệt.'
      });
    }

    const result = await db.query(
      `INSERT INTO payments (user_id, amount, status, transfer_code, notes) 
       VALUES ($1, $2, 'PENDING', $3, $4) 
       RETURNING *`,
      [userId, parseInt(amount), cleanMemo, notes || '']
    );

    // Gửi thông báo đến Admin
    const adminUsers = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of adminUsers.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, sender_id, type, title, message, content, url) 
         VALUES ($1, $2, 'payment', $3, $4, $5, $6)`,
        [
          admin.id,
          userId,
          'payment',
          'Yêu cầu đóng quỹ mới',
          `${req.user.username} đã gửi yêu cầu đóng quỹ ${parseInt(amount).toLocaleString('vi-VN')}đ`,
          `${req.user.username} đã gửi yêu cầu đóng quỹ ${parseInt(amount).toLocaleString('vi-VN')}đ`,
          '/admin_payments'
        ]
      ).catch(e => console.error('Lỗi tạo thông báo Admin:', e.message));
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// 2. Lấy lịch sử đóng quỹ cá nhân
router.get('/my', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT p.*, v.name as verifier_name 
       FROM payments p 
       LEFT JOIN users v ON p.verified_by = v.id 
       WHERE p.user_id = $1 
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Admin lấy toàn bộ yêu cầu thanh toán
router.get('/admin', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền truy cập.' });
  }

  try {
    const result = await db.query(
      `SELECT p.*, u.username, u.name as user_name, u.avatar as user_avatar, v.name as verifier_name 
       FROM payments p 
       JOIN users u ON p.user_id = u.id 
       LEFT JOIN users v ON p.verified_by = v.id 
       ORDER BY CASE WHEN p.status = 'PENDING' THEN 0 ELSE 1 END, p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Admin phê duyệt / từ chối thanh toán
router.put('/:id/verify', authenticateUser, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Không có quyền thực hiện.' });
  }

  const { id } = req.params;
  const { status, notes } = req.body; // status: COMPLETED hoặc REJECTED

  if (!['COMPLETED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái phê duyệt không hợp lệ.' });
  }

  try {
    const paymentCheck = await db.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Yêu cầu thanh toán không tồn tại.' });
    }

    const currentPayment = paymentCheck.rows[0];
    if (currentPayment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Giao dịch này đã được xử lý trước đó.' });
    }

    const result = await db.query(
      `UPDATE payments 
       SET status = $1, verified_by = $2, verified_at = CURRENT_TIMESTAMP, notes = $3 
       WHERE id = $4 
       RETURNING *`,
      [status, req.user.id, notes || null, id]
    );

    // Gửi thông báo kết quả phê duyệt cho người dùng
    const statusText = status === 'COMPLETED' ? 'được phê duyệt thành công' : 'bị từ chối';
    const amountFormatted = currentPayment.amount.toLocaleString('vi-VN');
    
    await db.query(
      `INSERT INTO notifications (user_id, sender_id, type, title, message, content, url) 
       VALUES ($1, $2, 'payment', $3, $4, $5, $6)`,
      [
        currentPayment.user_id,
        req.user.id,
        'payment',
        status === 'COMPLETED' ? 'Đóng quỹ thành công 🎉' : 'Đóng quỹ không thành công ❌',
        `Yêu cầu đóng quỹ ${amountFormatted}đ của bạn đã ${statusText}.`,
        `Yêu cầu đóng quỹ ${amountFormatted}đ của bạn đã ${statusText}.`,
        '/payment'
      ]
    ).catch(e => console.error('Lỗi tạo thông báo kết quả phê duyệt:', e.message));

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi máy chủ: ' + error.message });
  }
});

// 5. Lấy lịch sử đóng quỹ công khai cho mọi thành viên (đảm bảo tính minh bạch)
router.get('/public-history', authenticateUser, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.amount, p.status, p.transfer_code, p.created_at, p.verified_at, p.notes,
              u.username, u.name as user_name, u.avatar as user_avatar, v.name as verifier_name 
       FROM payments p 
       JOIN users u ON p.user_id = u.id 
       LEFT JOIN users v ON p.verified_by = v.id 
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
