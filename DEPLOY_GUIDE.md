# Hướng dẫn triển khai World Cup 2026 Tracker lên Server riêng

Tài liệu này hướng dẫn bạn cách chạy dự án trên Server riêng (Linux/Ubuntu) sử dụng Docker và Nginx cho tên miền **estrip.fun**.

## 1. Chuẩn bị trên Server
Đảm bảo server đã cài đặt:
- **Docker**: `sudo apt install docker.io`
- **Docker Compose**: `sudo apt install docker-compose`
- **Nginx**: `sudo apt install nginx`

## 2. Các bước triển khai

### Bước 1: Clone code từ GitHub
Dùng Token bạn đã tạo để clone dự án:
```bash
git clone https://github.com/kunkun2695/wc2026.git
cd wc2026
```

### Bước 2: Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc:
```bash
nano .env
```
Nội dung:
```env
CORS_ORIGIN=https://estrip.fun
DATABASE_URL=postgres://user:pass@db:5432/worldcup2026
```

### Bước 3: Khởi chạy ứng dụng bằng Docker
```bash
docker-compose up -d --build
```

### Bước 4: Khởi tạo Database ban đầu
```bash
docker exec -i $(docker ps -qf "name=app") psql postgres://user:pass@db:5432/worldcup2026 < server/db.sql
```

### Bước 5: Cấu hình Nginx (Reverse Proxy)
1. Tạo file cấu hình: `sudo nano /etc/nginx/sites-available/estrip.fun`
2. Nội dung:
```nginx
server {
    listen 80;
    server_name estrip.fun www.estrip.fun;

    location / {
        proxy_pass http://localhost:5005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
3. Kích hoạt: 
```bash
sudo ln -s /etc/nginx/sites-available/estrip.fun /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Bước 6: Cài đặt SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d estrip.fun -d www.estrip.fun
```


## 3. Quản lý ứng dụng
- **Xem log**: `docker-compose logs -f app`
- **Dừng app**: `docker-compose down`
- **Cập nhật code mới**:
```bash
git pull
docker-compose up -d --build
```
