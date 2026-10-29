-- =============================================================================
-- Instagram Tracker 商业版统一数据库结构 (SQL Schema DDL)
-- 兼容: SQLite 3 / PostgreSQL 14+ / MySQL 8.0+ / Supabase
-- 生成时间: 2026-10-29
-- =============================================================================

-- 1. 用户主表 (Users)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,                   -- 用户全局唯一 ID (如 user_760501527)
    email VARCHAR(255) NOT NULL UNIQUE,          -- 用户邮箱 (如 chankahhao0215@gmail.com)
    name VARCHAR(255) NOT NULL,                  -- 用户昵称 / 姓名 (如 Kah Hao / 陈嘉豪)
    picture TEXT DEFAULT '',                     -- Google 官方头像 URL
    role VARCHAR(32) DEFAULT 'business_user',    -- 角色: admin / business_user
    google_sub VARCHAR(64) DEFAULT '',           -- 绑定的 Google OAuth Sub ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 会话令牌表 (Sessions)
CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(128) PRIMARY KEY,              -- 安全 Session Token
    user_id VARCHAR(64) NOT NULL,                -- 关联用户 ID (外键 -> users.id)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at REAL NOT NULL,                    -- 会话过期时间戳 (Unix Timestamp)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. 用户专属博主追踪看板表 (User Tracked Creators - 核心多租户数据隔离)
CREATE TABLE IF NOT EXISTS user_tracked_creators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(64) NOT NULL,                -- 拥有该博主卡片的用户 ID (外键 -> users.id)
    creator_username VARCHAR(128) NOT NULL,      -- 被追踪博主的 Instagram 用户名
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT '',                       -- 个人备注/分组
    UNIQUE(user_id, creator_username),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 用户专属私密搜索记录表 (User Search History - 核心私密隔离)
CREATE TABLE IF NOT EXISTS user_search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(64) NOT NULL,                -- 拥有该搜索词的用户 ID (外键 -> users.id)
    query VARCHAR(255) NOT NULL,                 -- 搜索关键词 (如 vivian.myy)
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. 博主主体资料库 (Creators Master Metadata - 共享抓取缓存加速)
CREATE TABLE IF NOT EXISTS creators (
    username VARCHAR(128) PRIMARY KEY,           -- Instagram 博主用户名
    full_name VARCHAR(255) DEFAULT '',           -- 官方主页全名
    profile_pic_url TEXT DEFAULT '',             -- 头像原图链接
    biography TEXT DEFAULT '',                   -- 简介内容
    external_url TEXT DEFAULT '',                -- 个人主页外链
    following_count INTEGER DEFAULT 0,           -- 关注数
    followers_count INTEGER DEFAULT 0,           -- 粉丝数
    posts_count INTEGER DEFAULT 0,               -- 帖子数
    stories_count INTEGER DEFAULT 0,             -- 24h 快拍数
    highlights_count INTEGER DEFAULT 0,          -- 精选专辑数
    reposts_count INTEGER DEFAULT 0,             -- 转帖数
    tagged_count INTEGER DEFAULT 0,              -- 被标记数
    last_active TIMESTAMP,                       -- 最新动态发布时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 快拍媒体表 (Creator Stories)
CREATE TABLE IF NOT EXISTS creator_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_username VARCHAR(128) NOT NULL,
    media_id VARCHAR(64) NOT NULL,
    media_type VARCHAR(32) DEFAULT 'video',      -- video / image
    media_url TEXT,
    local_path TEXT,                             -- 本地保存相对路径
    duration REAL DEFAULT 0,                     -- 视频时长 (秒)
    has_audio INTEGER DEFAULT 1,
    taken_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_username) REFERENCES creators(username) ON DELETE CASCADE
);

-- 7. 关注与粉丝抓取快照归档表 (Creator Snapshots)
CREATE TABLE IF NOT EXISTS creator_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_username VARCHAR(128) NOT NULL,
    mode VARCHAR(32) NOT NULL,                   -- following / followers
    file_path TEXT NOT NULL,                     -- 快照文件存储路径
    user_count INTEGER DEFAULT 0,                -- 快照包含的实际有效账号总数
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_username) REFERENCES creators(username) ON DELETE CASCADE
);

-- 索引配置 (加速高频多租户查询与看板检索)
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_creators ON user_tracked_creators(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches ON user_search_history(user_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_creator ON creator_stories(creator_username);
CREATE INDEX IF NOT EXISTS idx_snapshots_creator ON creator_snapshots(creator_username, mode);
