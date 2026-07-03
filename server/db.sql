-- Bảng Người dùng
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(100),
    avatar TEXT,
    dob DATE,
    role VARCHAR(20) DEFAULT 'user',
    security_question VARCHAR(255),
    security_answer VARCHAR(255),
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
    handicap_favorite VARCHAR(100),
    handicap_value NUMERIC(4,2) DEFAULT 0.0,
    handicap_text VARCHAR(50),
    ou_value NUMERIC(4,2) DEFAULT 0.0,
    ou_text VARCHAR(50),
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

-- Bảng Đăng ký Thông báo đẩy
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    auth TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dữ liệu mẫu Admin (Mật khẩu mặc định: Long26@8865)
INSERT INTO users (username, password, name, avatar, role) 
VALUES ('admin', 'Long26@8865', 'Quản trị viên', '🛡️', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Chỉ mục để tối ưu hiệu năng truy vấn
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_match_id ON comments(match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
