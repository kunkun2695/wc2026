-- Tạo cơ sở dữ liệu (Nếu dùng PostgreSQL trên Server riêng)
-- CREATE DATABASE worldcup2026;

-- Bảng Người dùng
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(100),
    avatar TEXT,
    dob DATE,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Trận đấu
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(50),
    team1_name VARCHAR(100),
    team1_flag TEXT,
    team1_score INTEGER DEFAULT 0,
    team2_name VARCHAR(100),
    team2_flag TEXT,
    team2_score INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'UPCOMING', -- UPCOMING, LIVE, FINISHED
    match_time VARCHAR(50),
    penalties_team1 INTEGER,
    penalties_team2 INTEGER,
    venue VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Đội bóng
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    flag TEXT,
    group_name VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Dự đoán
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    predicted_home_score INTEGER NOT NULL,
    predicted_away_score INTEGER NOT NULL,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, match_id)
);

-- Bảng Bình luận (Gáy)
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Thông báo
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dữ liệu mẫu Admin (Mật khẩu mặc định: Long26@8865)
INSERT INTO users (username, password, name, avatar, role) 
VALUES ('admin', 'Long26@8865', 'Quản trị viên', '🛡️', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Nạp sẵn đội tham gia (Ví dụ)
INSERT INTO teams (name, flag, group_name) VALUES
('USA', '🇺🇸', 'A'), ('MEXICO', '🇲🇽', 'B'), ('CANADA', '🇨🇦', 'C'),
('VIETNAM', '🇻🇳', 'A'), ('ARGENTINA', '🇦🇷', 'D'), ('BRAZIL', '🇧🇷', 'E')
ON CONFLICT (name) DO NOTHING;

-- Dữ liệu mẫu Trận đấu
INSERT INTO matches (group_name, team1_name, team1_flag, team1_score, team2_name, team2_flag, team2_score, status, match_time)
VALUES 
('Group A', 'USA', '🇺🇸', 2, 'VIETNAM', '🇻🇳', 1, 'LIVE', '75'''),
('Group B', 'MEXICO', '🇲🇽', 0, 'FRANCE', '🇫🇷', 0, 'UPCOMING', '20:00')
ON CONFLICT DO NOTHING;
