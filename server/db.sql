-- Tạo cơ sở dữ liệu
-- CREATE DATABASE worldcup2026;

-- Bảng Người dùng
CREATE TABLE users (
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
CREATE TABLE matches (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dữ liệu mẫu cho người dùng quản trị
-- Mật khẩu đã được hash cho 'Long26@8865' sẽ được backend xử lý, 
-- nhưng tạm thời ta có thể chèn trực tiếp nếu backend chưa hỗ trợ hash.
INSERT INTO users (username, password, name, avatar, role) 
VALUES ('admin', 'Long26@8865', 'Quản trị viên', '🛡️', 'admin');

-- Bảng Đội bóng
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    flag TEXT,
    group_name VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nạp sẵn 48 đội tham gia WC 2026 (dự kiến)
INSERT INTO teams (name, flag, group_name) VALUES
('USA', '🇺🇸', 'A'), ('MEXICO', '🇲🇽', 'B'), ('CANADA', '🇨🇦', 'C'),
('VIETNAM', '🇻🇳', 'A'), ('ARGENTINA', '🇦🇷', 'D'), ('BRAZIL', '🇧🇷', 'E'),
('FRANCE', '🇫🇷', 'B'), ('ENGLAND', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'E'), ('JAPAN', '🇯🇵', 'D'),
('NIGERIA', '🇳🇬', 'C'), ('GERMANY', '🇩🇪', 'F'), ('SPAIN', '🇪🇸', 'F'),
('PORTUGAL', '🇵🇹', 'G'), ('ITALY', '🇮🇹', 'G'), ('NETHERLANDS', '🇳🇱', 'H'),
('BELGIUM', '🇧🇪', 'H'), ('SOUTH KOREA', '🇰🇷', 'I'), ('AUSTRALIA', '🇦🇺', 'I'),
('MOROCCO', '🇲🇦', 'J'), ('SENEGAL', '🇸🇳', 'J'), ('COLOMBIA', '🇨🇴', 'K'),
('URUGUAY', '🇺🇾', 'K'), ('CROATIA', '🇭🇷', 'L'), ('SWITZERLAND', '🇨🇭', 'L'),
('DENMARK', '🇩🇰', 'A'), ('POLAND', '🇵🇱', 'B'), ('SWEDEN', '🇸🇪', 'C'),
('UKRAINE', '🇺🇦', 'D'), ('EGYPT', '🇪🇬', 'E'), ('GHANA', '🇬🇭', 'F'),
('CAMEROON', '🇨🇲', 'G'), ('TUNISIA', '🇹🇳', 'H'), ('ALGERIA', '🇩🇿', 'I'),
('SAUDI ARABIA', '🇸🇦', 'J'), ('IRAN', '🇮🇷', 'K'), ('IRAQ', '🇮🇶', 'L'),
('PERU', '🇵🇪', 'A'), ('CHILE', '🇨🇱', 'B'), ('ECUADOR', '🇪🇨', 'C'),
('PARAGUAY', '🇵🇾', 'D'), ('COSTA RICA', '🇨🇷', 'E'), ('PANAMA', '🇵🇦', 'F'),
('JAMAICA', '🇯🇲', 'G'), ('IVORY COAST', '🇨🇮', 'H'), ('MALI', '🇲🇱', 'I'),
('SOUTH AFRICA', '🇿🇦', 'J'), ('UZBEKISTAN', '🇺🇿', 'K'), ('QATAR', '🇶🇦', 'L');

-- Dữ liệu mẫu cho trận đấu
INSERT INTO matches (group_name, team1_name, team1_flag, team1_score, team2_name, team2_flag, team2_score, status, match_time)
VALUES 
('Group A', 'USA', '🇺🇸', 2, 'VIETNAM', '🇻🇳', 1, 'LIVE', '75'''),
('Group B', 'MEXICO', '🇲🇽', 0, 'FRANCE', '🇫🇷', 0, 'UPCOMING', '20:00'),
('Group C', 'CANADA', '🇨🇦', 3, 'NIGERIA', '🇳🇬', 2, 'FINISHED', 'Final'),
('Group D', 'ARGENTINA', '🇦🇷', 1, 'JAPAN', '🇯🇵', 1, 'LIVE', '45'''),
('Group E', 'BRAZIL', '🇧🇷', 0, 'ENGLAND', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 0, 'UPCOMING', 'Tomorrow');
