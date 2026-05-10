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

### 6. Hệ Thống Thông Báo Đẩy (Web Push Notifications)
- **Web Push**: Tích hợp VAPID Keys để gửi thông báo hệ thống trực tiếp lên màn hình khóa điện thoại.
- **Service Worker**: Triển khai `sw.js` để nhận tin nhắn ngay cả khi ứng dụng đang chạy ngầm.
- **Thông báo gáy**: Tự động gửi thông báo khi có người bình luận ("gáy") vào trận đấu bạn đang quan tâm.
- **Thông báo điểm**: Gửi tin nhắn chúc mừng kèm số điểm nhận được ngay khi trận đấu kết thúc.

### 7. Tính Năng Tương Tác (Social Interaction)
- **Hệ thống Gáy (Comments)**: Cho phép người dùng thảo luận, cà khịa nhau dưới mỗi trận đấu.
- **Real-time Notifications**: Tự động tạo thông báo trong ứng dụng và thông báo đẩy khi có tương tác mới.

---

## 🛠 Thông Số Kỹ Thuật (Technical Stack)

- **Frontend**: React (Vite), Framer Motion, Lucide React, Vanilla CSS.
- **Backend**: Node.js, Express, PostgreSQL, **Web-Push**.
- **Containerization**: **Docker & Docker Compose** (Đã tối ưu hóa cho môi trường Production).
- **Deployment**: **Cloudflare Tunnel** (Bỏ qua port forwarding, hỗ trợ HTTPS tự động).
- **Automation**: `node-cron`, `axios`.
- **Database Schema**:
    - `users`: (id, username, password, name, avatar, role, points)
    - `matches`: (id, team1_name, team2_name, team1_score, team2_score, status, match_time, group_name, team1_flag, team2_flag)
    - `predictions`: (id, user_id, match_id, predicted_home_score, predicted_away_score, points)
    - `comments`: (id, match_id, user_id, content, created_at)
    - `push_subscriptions`: (id, user_id, endpoint, p256dh, auth)

---

## 🚀 Môi Trường Vận Hành (Infrastructure)
- **Môi trường song song**: Hỗ trợ 2 stack độc lập (Test & Production) chạy trên cùng một máy chủ.
- **Auto-Config**: Tự động nhận diện môi trường (Local Dev vs Production Docker) để trỏ API và DB chính xác.
- **PWA Ready**: Hỗ trợ cài đặt làm ứng dụng trên iOS/Android với Service Worker và Manifest.

---
### 8. Tối Ưu Hóa Trình Duyệt & Sửa Lỗi Hệ Thống (10/05/2026)
- **Tái cấu trúc Comment Section**: Di chuyển phần bình luận lên cấp Global (`App.jsx`) để giải quyết lỗi bị che khuất (`stacking context`) do các thẻ `motion.div` gây ra trên trình duyệt máy tính.
- **Tương thích Safari & iOS**:
    - Sửa lỗi cú pháp CSS `z-index` sang `zIndex` trong React styles.
    - Cố định lỗi layout bị co giãn hoặc không nhấn được trên Safari bằng cách thêm `cursor: pointer` và `flex-shrink: 0`.
    - Hỗ trợ phím Enter để gửi bình luận nhanh trên trình duyệt di động.
- **Nâng cấp Hệ thống Thông báo**:
    - **Cấp quyền chủ động**: Chuyển yêu cầu cấp quyền thông báo sang sự kiện nhấn nút (Bell/Toggle) để vượt qua rào cản bảo mật của Safari/iOS.
    - **PWA Enhancement**: Thêm hướng dẫn và nút "Cho phép ngay" bên trong Drawer để hỗ trợ người dùng iPhone bật thông báo dễ dàng hơn.
    - **Sửa lỗi Logic Push**: Khắc phục lỗi sai khóa Token (`wc2026_token`) khiến việc đăng ký thông báo với server bị thất bại.
- **Debug & Feedback**: Thêm các bảng thông báo lỗi (Alert) chi tiết để người dùng biết nguyên nhân khi không bật được thông báo (do thiếu HTTPS hoặc bị chặn quyền).

### 9. Nâng Cấp Trải Nghiệm Premium & Ổn Định Đa Phương Tiện (10/05/2026 - Chiều)
- **Multimedia Reliability (Độ tin cậy đa phương tiện)**:
    - **Trigger Hình ảnh**: Chuyển đổi toàn bộ nút chọn ảnh sang cơ chế `label/id` bản ngữ. Đảm bảo cửa sổ chọn ảnh luôn hiện ra ngay lập tức trên mọi trình duyệt (Safari, Chrome, Mobile) mà không bị chặn.
    - **Server Payload**: Tăng giới hạn Payload của Express Server lên **50MB** (từ 100KB), cho phép gửi ảnh độ phân giải cao dạng Base64 mà không bị lỗi `413 Payload Too Large`.
- **Premium Sidebar Redesign**:
    - **Cấu trúc High-End**: Chuyển đổi Sidebar sang phong cách Glassmorphism với các nhóm điều hướng rõ ràng (Trang chủ, Cá nhân, Quản trị).
    - **User Profile Card**: Thêm thẻ danh tính người dùng (Avatar + Tên + Chức danh) ở chân Sidebar, tạo cảm giác chuyên nghiệp như một Dashboard thực thụ.
    - **Hiệu ứng Glow**: Tích hợp các chỉ báo "Active" dạng Neon phát sáng và hiệu ứng trượt mượt mà.
- **Responsive Layout Expansion (Mở rộng không gian)**:
    - **Workstation Layout**: Loại bỏ giới hạn 600px cũ, mở rộng không gian nội dung lên tới **1200px** trên màn hình lớn.
    - **Xóa bỏ lề thừa**: Loại bỏ khoảng trống "màu vàng" (Centered margins) để nội dung bám sát Sidebar một cách liền mạch, tận dụng tối đa diện tích màn hình máy tính.
- **Ổn Định Hệ Thống Chat**:
    - **Đồng bộ danh tính (Identity Sync)**: Khắc phục lỗi tin nhắn "không biết của ai" bằng cách sử dụng so sánh tương đối (`==`) cho ID người dùng, giải quyết triệt để sự sai khác kiểu dữ liệu (String vs Number) từ DB.
    - **Seamless UI**: Sửa lỗi "rò rỉ ánh sáng" (Light leakage) và khoảng hở giữa Sidebar và nội dung Chat trên Desktop.

### 10. Tích Hợp Trợ Lý AI "Guru" (10/05/2026 - Chiều Muộn)
- **AI View (Frontend)**: Phát triển trang Chat chuyên dụng cho AI với hiệu ứng Glassmorphism, Typing indicator (đang gõ) và các nút gợi ý câu hỏi nhanh (Quick suggestions).
- **AI Engine (Backend)**: Thiết lập Route `/api/ai/chat` hỗ trợ xử lý ngôn ngữ tự nhiên.
- **Phân tích thông minh**: AI đóng vai chuyên gia World Cup, có khả năng phân tích phong độ Brazil, dự đoán nhà vô địch và tra cứu lịch sử bóng đá.
- **Kiến trúc sẵn sàng**: Cấu trúc backend đã được tối ưu để bạn có thể cắm trực tiếp **Gemini API** hoặc **OpenAI API** vào ngay trong buổi tối.

### 11. Hệ Thống Quản Trị & Cấu Hình AI Động (10/05/2026 - Tối)
- **Admin Config Dashboard**: Xây dựng giao diện quản trị chuyên dụng cho việc thiết lập hệ thống AI. Cho phép lưu trữ và cập nhật API Key trực tiếp từ trình duyệt mà không cần chỉnh sửa file `.env`.
- **Database Persistence**: Tích hợp bảng `system_config` trong Database để lưu trữ các cài đặt hệ thống. Tự động nạp cấu hình vào bộ nhớ (Memory) ngay khi Server khởi động (Cold Start Recovery).
- **Security Logic**: Mã hóa ẩn Key trên giao diện và bảo vệ API Config bằng Middleware xác thực quyền Admin (`isAdmin`).

### 12. Chuyển Đổi Sang Google Gemini AI & Kiến Trúc "Nuclear"
- **Direct REST API Integration**: Chuyển đổi từ SDK sang gọi trực tiếp API Google qua Axios để khắc phục lỗi 404 Model Not Found. Đây là giải pháp ổn định nhất, không phụ thuộc vào thư viện bên ngoài.
- **Multi-Model Fallback**: Hệ thống thông minh tự động thử lần lượt các mô hình (`gemini-1.5-flash`, `gemini-pro`) để đảm bảo AI luôn phản hồi.
- **Advanced Diagnostics**: Tích hợp hệ thống "Báo cáo chẩn đoán" chi tiết ngay trên giao diện Chat. Guru sẽ liệt kê chi tiết các lần thử và mã lỗi từ Google để Admin dễ dàng "bắt bệnh".

### 13. Đại Tu Giao Diện Di Động & Sửa Lỗi Critical (10/05/2026 - Đêm)
- **Mobile Navigation 2.0**:
    - **AI Tab Integration**: Thêm nút "Trợ lý AI" (Sparkles icon) vào thanh điều hướng dưới (Bottom Nav).
    - **Header Cleanup**: Sắp xếp lại Thông báo, Cài đặt và Đăng xuất nằm ngang hàng, gọn gàng trên Mobile.
- **Notification Hardening**:
    - **10s Polling**: Thiết lập cơ chế tự động quét thông báo và tin nhắn chưa đọc mỗi 10 giây.
    - **Badge Sync**: Sửa lỗi thuộc tính `unread_count` và đồng bộ biểu tượng thông báo đỏ trên toàn hệ thống.
- **Critical Fixes**: 
    - Khắc phục lỗi "Màn hình đen" ở trang Cộng đồng.
    - Sửa lỗi hiển thị `NaN%` trên thẻ trận đấu và đồng bộ biểu tượng Cúp (Trophy) cho mục Xếp hạng.

---
*Cập nhật lần cuối: 10/05/2026 - 16:22*
