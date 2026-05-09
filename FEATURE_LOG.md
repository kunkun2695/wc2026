# 🏆 Nhật Ký Phát Triển World Cup 2026 Prediction Arena

Tài liệu này lưu lại các tính năng đã hoàn thiện và cấu trúc kỹ thuật để phục vụ việc bảo trì và nâng cấp sau này.

---

## ✅ Các Tính Năng Đã Hoàn Thành

### 1. Hệ Thống Dự Đoán Thông Minh (Core Engine)
- **Luật chơi 1X2**: Chuyển đổi từ dự đoán tỉ số sang dự đoán kết quả Thắng - Hòa - Thua (1X2) để tăng tính cạnh tranh.
- **Tính điểm tự động**: Cộng thẳng **+3 điểm** cho mỗi dự đoán chính xác ngay khi trận đấu kết thúc.
- **Cơ chế "Chốt kèo"**: Khóa lựa chọn ngay sau khi xác nhận, không cho phép chỉnh sửa để đảm bảo tính công bằng.
- **Xác nhận (Confirm)**: Hiển thị thông báo xác nhận trước khi lưu dự đoán.

### 2. Tự Động Hóa & API (Automation)
- **Đồng bộ hóa API**: Kết nối với `football-data.org` để lấy dữ liệu trận đấu thời gian thực.
- **Lịch trình tự động (Cron Job)**: Hệ thống tự động kiểm tra tỉ số mỗi **30 phút**.
- **Xử lý kết quả FT**: Tự động quét và tính điểm cho toàn bộ người chơi khi trận đấu chuyển sang trạng thái `FINISHED`.
- **Dịch vụ đồng bộ (Sync Service)**: Tách biệt logic đồng bộ vào `syncService.js` để tối ưu hiệu suất.

### 3. Giao Diện Mobile Cao Cấp (Premium UI/UX)
- **Thiết kế Mobile-First**: Layout dạng ngang, gọn gàng, tối ưu cho màn hình điện thoại.
- **Nút chọn Logo**: Thay đổi các con số 1-X-2 khô khan thành Logo đội bóng và chữ "HÒA" trực quan.
- **Thống kê phiếu bầu**: Hiển thị tỉ lệ % người chơi chọn mỗi cửa và tổng số phiếu bầu cho mỗi trận.
- **Dọn dẹp UI**: Loại bỏ các thông tin địa điểm không cần thiết (như MEXICO CITY) để màn hình sạch sẽ hơn.

### 4. Quản Lý Người Dùng & Hồ Sơ (Social & Profile)
- **Avatar Upload**: Cho phép tải ảnh cá nhân từ thiết bị làm ảnh đại diện (lưu trữ dạng TEXT Base64 trong DB).
- **Persistence**: Sửa lỗi mất ảnh khi F5, đảm bảo đồng bộ hoàn toàn giữa LocalStorage và Database.
- **Bảng xếp hạng (Leaderboard)**: Hiển thị thứ hạng kèm ảnh đại diện và tổng điểm của toàn bộ người chơi.

### 5. Minh Bạch & Lịch Sử (Transparency)
- **Trang Lịch Sử (HistoryView)**: Tab riêng biệt để xem lại toàn bộ các dự đoán cũ, kết quả thực tế và số điểm đã nhận.
- **Trạng thái Real-time**: Hiển thị tỉ số thực tế ngay trên thẻ dự đoán của người dùng.

---

## 🛠 Thông Số Kỹ Thuật (Technical Stack)

- **Frontend**: React (Vite), Framer Motion (Hiệu ứng), Lucide React (Icons), Vanilla CSS.
- **Backend**: Node.js, Express, PostgreSQL.
- **Bảo mật**: JWT Authentication, Password hashing (plaintext for current testing).
- **Tự động hóa**: `node-cron`, `axios`.
- **Database Schema**:
    - `users`: (id, username, password, name, avatar, role, points)
    - `matches`: (id, team1_name, team2_name, team1_score, team2_score, status, match_time, group_name, team1_flag, team2_flag)
    - `predictions`: (id, user_id, match_id, predicted_home_score, predicted_away_score, points)

---

## 🚀 Định Hướng Nâng Cấp (Roadmap)
- [ ] **Thông báo (Push Notifications)**: Gửi thông báo khi có điểm hoặc khi trận đấu sắp diễn ra.
- [ ] **Bình luận (Comments)**: Cho phép mọi người "gáy" với nhau dưới mỗi trận đấu.
- [ ] **Giải thưởng (Rewards)**: Hệ thống danh hiệu cho những "Nhà tiên tri" xuất sắc nhất.
- [ ] **Bảo mật**: Chuyển API Key và Secret Key vào file `.env` (Đã chuẩn bị sẵn).

---
*Cập nhật lần cuối: 09/05/2026*
