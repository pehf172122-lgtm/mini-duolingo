-- Migration: convert numeric INT user_id values to UUIDs safely
-- Strategy:
-- 1) Build mapping table `user_id_map(old_id, new_id)` where numeric old_id -> new UUID, non-numeric -> preserved
-- 2) Create new tables users_new, user_profiles_new, user_streaks_new, refresh_tokens_new with user_id VARCHAR(36)
-- 3) Copy data into new tables joining via mapping
-- 4) Drop old tables and rename new tables

SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE IF NOT EXISTS user_id_map (
  old_id VARCHAR(255) NOT NULL PRIMARY KEY,
  new_id VARCHAR(36) NOT NULL
);

-- Populate mapping: numeric ids -> UUID(), others copy
INSERT INTO user_id_map (old_id, new_id)
SELECT u.user_id AS old_id,
       CASE WHEN u.user_id REGEXP '^[0-9]+$' THEN UUID() ELSE u.user_id END AS new_id
FROM users u
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);

-- Create new users table
CREATE TABLE IF NOT EXISTS users_new (
  user_id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username)
);

-- Copy users into users_new using map
INSERT INTO users_new (user_id, username, email, password_hash, is_active, created_at)
SELECT m.new_id, u.username, u.email, u.password_hash, u.is_active, u.created_at
FROM users u
JOIN user_id_map m ON m.old_id = u.user_id;

-- user_profiles_new
CREATE TABLE IF NOT EXISTS user_profiles_new (
  user_id VARCHAR(36) PRIMARY KEY,
  display_name VARCHAR(100),
  native_language VARCHAR(10),
  learning_language VARCHAR(10),
  avatar_url VARCHAR(500),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO user_profiles_new (user_id, display_name, native_language, learning_language, avatar_url, updated_at)
SELECT m.new_id, p.display_name, p.native_language, p.learning_language, p.avatar_url, p.updated_at
FROM user_profiles p
JOIN user_id_map m ON m.old_id = p.user_id;

-- user_streaks_new
CREATE TABLE IF NOT EXISTS user_streaks_new (
  user_id VARCHAR(36) PRIMARY KEY,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  streak_freeze TINYINT(1) DEFAULT 0
);

INSERT INTO user_streaks_new (user_id, current_streak, longest_streak, last_activity_date, streak_freeze)
SELECT m.new_id, s.current_streak, s.longest_streak, s.last_activity_date, s.streak_freeze
FROM user_streaks s
JOIN user_id_map m ON m.old_id = s.user_id;

-- refresh_tokens_new
CREATE TABLE IF NOT EXISTS refresh_tokens_new (
  token_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_revoked TINYINT(1) DEFAULT 0
);

INSERT INTO refresh_tokens_new (token_id, user_id, token, expires_at, created_at, is_revoked)
SELECT rt.token_id, m.new_id, rt.token, rt.expires_at, rt.created_at, rt.is_revoked
FROM refresh_tokens rt
JOIN user_id_map m ON m.old_id = rt.user_id;

-- At this point we have new tables built. Replace old tables with new ones.
-- Backup old tables
RENAME TABLE users TO users_bak, users_new TO users;
RENAME TABLE user_profiles TO user_profiles_bak, user_profiles_new TO user_profiles;
RENAME TABLE user_streaks TO user_streaks_bak, user_streaks_new TO user_streaks;
RENAME TABLE refresh_tokens TO refresh_tokens_bak, refresh_tokens_new TO refresh_tokens;

SET FOREIGN_KEY_CHECKS=1;

-- Verify and then drop backups manually after validation
-- DROP TABLE users_bak, user_profiles_bak, user_streaks_bak, refresh_tokens_bak;

-- Optional: keep user_id_map for auditing
