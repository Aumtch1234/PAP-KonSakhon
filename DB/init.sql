-- PostgreSQL Database initialization script
-- Converted from MySQL to PostgreSQL

START TRANSACTION;
SET timezone = 'UTC';

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile_image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Insert users data
INSERT INTO users (id, name, email, password, profile_image, created_at, updated_at, last_login, email_verified, status)
VALUES
  (4, 'นาย เปา', 'zoro@gmail.com', '$2a$12$rMYgjqJblUFcXaUe4Sx/ZujftXaUrxI4mFSgrY7638F9YvseIZzdC', '/uploads/profiles/profile_1758474250472.jpeg', '2025-09-21 17:04:11', '2025-09-21 17:28:33', '2025-09-21 17:28:33', false, 'active'),
  (5, 'KhonThai', 'test@gmail.com', '$2a$12$T9yYLvRHFRChtxb7LVlOqOzLj2tuZtzi9SuwtB9eYoEa5COx12jVW', '/uploads/profiles/profile_1758476520470.jpg', '2025-09-21 17:42:00', '2025-09-21 18:05:06', '2025-09-21 18:05:06', false, 'active'),
  (6, 'แรมซี่ ขยี้ใจ', 'test1@gmail.com', '$2a$12$w1yD2SN0BgDNRTNbOIoLIe/DVM1oTafUJI8WZZZBENq7fgQi7UZ02', '/uploads/profiles/profile_6_1758476872268.jpg', '2025-09-21 17:46:11', '2025-09-21 17:48:59', '2025-09-21 17:48:59', false, 'active');

-- Set the sequence for users table
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users) + 1);

-- ============================================
-- Table: posts
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert posts data
INSERT INTO posts (id, user_id, content, image_url, created_at, updated_at)
VALUES
  (9, 4, 'สวัสดี ทุกคน กับเช้าที่ สดใส !!', '/uploads/1758474326430-tjr9djtld0r.jpg', '2025-09-21 17:05:26', '2025-09-21 17:05:26'),
  (10, 6, 'สวัสดี วันจันทร์ครับทุกคนที่น่ารัก 🥰', '/uploads/1758477486106-l9cis7gcwvm.jpg', '2025-09-21 17:58:06', '2025-09-21 17:58:06'),
  (11, 6, 'POV:', '/uploads/1758477880711-jgoaor1il9s.jpg', '2025-09-21 18:04:40', '2025-09-21 18:04:40'),
  (12, 5, 'POV : เมื่อคุณเบื่อ ข้างบ้าน', '/uploads/1758478002730-wy9im861s9.jpeg', '2025-09-21 18:06:42', '2025-09-21 18:06:42'),
  (13, 5, 'เมื่อเราไม่ไหว 😵‍💫' || chr(13) || 'แต่ใจสั่งมา 🤯', '/uploads/1758478152587-mfrvvosrjo.jpg', '2025-09-21 18:09:12', '2025-09-21 18:09:12');

-- Set the sequence for posts table
SELECT setval('posts_id_seq', (SELECT MAX(id) FROM posts) + 1);

-- ============================================
-- Table: post_likes
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);

-- Insert post_likes data
INSERT INTO post_likes (id, user_id, post_id, created_at)
VALUES
  (4, 4, 9, '2025-09-21 17:37:39'),
  (5, 5, 9, '2025-09-21 17:42:17'),
  (6, 5, 12, '2025-09-21 18:12:20');

-- Set the sequence for post_likes table
SELECT setval('post_likes_id_seq', (SELECT MAX(id) FROM post_likes) + 1);

-- ============================================
-- Table: post_comments
-- ============================================
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  image_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert post_comments data
INSERT INTO post_comments (id, user_id, post_id, content, created_at, updated_at)
VALUES
  (4, 4, 9, 'ขอให้เป็นวันที่ดีนะจ้ะ', '2025-09-21 17:38:05', '2025-09-21 17:38:05'),
  (5, 5, 9, 'เหมือนกันนะจ้ะ ตะเอง', '2025-09-21 17:42:41', '2025-09-21 17:42:41'),
  (6, 5, 12, 'ตลกจังเลย555 🤣', '2025-09-21 18:12:38', '2025-09-21 18:12:38');

-- Set the sequence for post_comments table
SELECT setval('post_comments_id_seq', (SELECT MAX(id) FROM post_comments) + 1);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);

COMMIT;