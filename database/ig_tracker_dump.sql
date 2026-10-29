-- =============================================================================
-- Instagram Tracker 真实数据库全量导出 (SQL DUMP)
-- 导出时间: 2026-10-29 22:07:40
-- 目标兼容: PostgreSQL / MySQL / SQLite / Supabase
-- =============================================================================

BEGIN TRANSACTION;
CREATE TABLE creator_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_username VARCHAR(128) NOT NULL,
    mode VARCHAR(32) NOT NULL,                   -- following / followers
    file_path TEXT NOT NULL,                     -- 快照文件存储路径
    user_count INTEGER DEFAULT 0,                -- 快照包含的实际有效账号总数
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_username) REFERENCES creators(username) ON DELETE CASCADE
);
CREATE TABLE creator_stories (
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
CREATE TABLE creators (
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
INSERT INTO "creators" VALUES('blublublubleble_boom','','','','',0,0,0,0,0,0,0,NULL,'2026-10-29 14:01:54');
INSERT INTO "creators" VALUES('buzhidaoah_','','https://instagram.fkul8-4.fna.fbcdn.net/v/t51.82787-19/729275243_18128379718625484_4753600668264475551_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=gsBDgJK7fOQQ7kNvwHzdziv&_nc_oc=Adpi-VopjIAJgkGdjLxoT7H2p8ckwh1IAYfJLSnLrW_kqDWESrAvW-yXL97tAFmcroty3dHx_V976jlEmfSUfDJq&_nc_zt=24&_nc_ht=instagram.fkul8-4.fna&_nc_gid=5zTnpuJei3YAz_TscuMx4g&_nc_ss=7b6a8&oh=00_AQP-wxx1OibzWxMVciDlancsJ_yDIDJrwpKlyLFz_7C7Fg&oe=6AE6C459','','',189,233,12,0,0,0,0,NULL,'2026-10-29 14:01:54');
INSERT INTO "creators" VALUES('charlenetoo','','','','',0,0,0,0,0,0,0,NULL,'2026-10-29 14:01:54');
INSERT INTO "creators" VALUES('ckh02_15','','https://instagram.fkul16-2.fna.fbcdn.net/v/t51.82787-19/670916099_18046950809772209_7639308269576121483_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=S0RLPXaoW9UQ7kNvwEnenaV&_nc_oc=AdoJvapKWXXol7uudYt9pmbCfCzPtgWUP9zk8l0A4DZS_9H3-8avEeYbnAFR1ZN1Bm-FSbPrQQs4W-tJhP9Ts6fa&_nc_zt=24&_nc_ht=instagram.fkul16-2.fna&_nc_gid=smhWihy0XwA1AMwtdcnfJg&_nc_ss=7b6a8&oh=00_AQTWfl6e7wiidhqIMohFBicLAhhVQqZN0hv2I-DTTyD6cA&oe=6AE934DC','','',348,4,NULL,0,0,0,0,NULL,'2026-10-29 14:01:54');
INSERT INTO "creators" VALUES('jiale.1003','家乐','https://instagram.fpen1-1.fna.fbcdn.net/v/t51.82787-19/609933033_18073039766601866_6712200464891618361_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4xMDgwLkMzIn0%3D&_nc_ohc=hxB1p3cxImEQ7kNvwH2uxLf&_nc_oc=AdpUfx8adVKvgo17wmntPq2g7cTtcAio9pyRqx_6lG0s1fxkOwcr4YFT4m4qlvRRfzEoOMPmIdJBBKvv2UJwpzhO&_nc_zt=24&_nc_ht=instagram.fpen1-1.fna&_nc_gid=dM0NMMgn3sAuEKRn96MBPQ&_nc_ss=7b6a8&oh=00_AQQ6sispg96BgRNVBdNeaexZ_uVGMhkhMPwudCo2fO2FNw&oe=6AE82758','','',269,183,3,0,0,0,0,NULL,'2026-10-29 14:01:54');
INSERT INTO "creators" VALUES('sheepwesay','','','','',0,0,0,0,0,0,0,NULL,'2026-10-29 14:01:54');
INSERT INTO "creators" VALUES('vivian.myy','','','','',0,0,0,0,0,0,0,NULL,'2026-10-29 14:01:54');
INSERT INTO "creators" VALUES('vivianstudysmart','','','','',0,0,0,0,0,0,0,NULL,'2026-10-29 14:01:54');
INSERT INTO "creators" VALUES('xiaoskrren826','哈','https://instagram.fkul8-2.fna.fbcdn.net/v/t51.2885-19/327984076_1254667388817823_8134138156673237491_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=107&_nc_map=urlgen_bucketless&ccb=7-5&_nc_sid=f7ccc5&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLnd3dy4zMjAuQzMifQ%3D%3D&_nc_ohc=ZGWOCS6Q0_4Q7kNvwFaPFFl&_nc_oc=AdqYoHvzZrepxWNKP2a5g7r63-5xX__luj9IfcrEu5obmNq324tzArrVLSYAA5RpcJUiqG22jqDjkbX075U0qX-e&_nc_zt=24&_nc_ht=instagram.fkul8-2.fna&_nc_ss=7b6a8&oh=00_AQRBEkYoeCvjN21zfWffeiRnTJCYzqfq7bOTzrHck883MA&oe=6AE91CFD','芷璇','',0,0,3,0,0,0,0,NULL,'2026-10-29 14:01:54');
CREATE TABLE sessions (
    token VARCHAR(128) PRIMARY KEY,              -- 安全 Session Token
    user_id VARCHAR(64) NOT NULL,                -- 关联用户 ID (外键 -> users.id)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at REAL NOT NULL,                    -- 会话过期时间戳 (Unix Timestamp)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE user_search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(64) NOT NULL,                -- 拥有该搜索词的用户 ID (外键 -> users.id)
    query VARCHAR(255) NOT NULL,                 -- 搜索关键词 (如 vivian.myy)
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO "user_search_history" VALUES(1,'user_760501527','vivian.myy','2026-10-29 14:01:54');
INSERT INTO "user_search_history" VALUES(2,'user_760501527','xiaoskrren826','2026-10-29 14:01:54');
CREATE TABLE user_tracked_creators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(64) NOT NULL,                -- 拥有该博主卡片的用户 ID (外键 -> users.id)
    creator_username VARCHAR(128) NOT NULL,      -- 被追踪博主的 Instagram 用户名
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT DEFAULT '',                       -- 个人备注/分组
    UNIQUE(user_id, creator_username),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO "user_tracked_creators" VALUES(1,'user_760501527','blublublubleble_boom','2026-10-29 14:01:54','');
INSERT INTO "user_tracked_creators" VALUES(2,'user_760501527','buzhidaoah_','2026-10-29 14:01:54','');
INSERT INTO "user_tracked_creators" VALUES(3,'user_760501527','charlenetoo','2026-10-29 14:01:54','');
INSERT INTO "user_tracked_creators" VALUES(4,'user_760501527','ckh02_15','2026-10-29 14:01:54','');
INSERT INTO "user_tracked_creators" VALUES(5,'user_760501527','jiale.1003','2026-10-29 14:01:54','');
INSERT INTO "user_tracked_creators" VALUES(6,'user_760501527','sheepwesay','2026-10-29 14:01:54','');
INSERT INTO "user_tracked_creators" VALUES(7,'user_760501527','vivian.myy','2026-10-29 14:01:54','');
INSERT INTO "user_tracked_creators" VALUES(8,'user_760501527','vivianstudysmart','2026-10-29 14:01:54','');
INSERT INTO "user_tracked_creators" VALUES(9,'user_760501527','xiaoskrren826','2026-10-29 14:01:54','');
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,                   -- 用户全局唯一 ID (如 user_760501527)
    email VARCHAR(255) NOT NULL UNIQUE,          -- 用户邮箱 (如 chankahhao0215@gmail.com)
    name VARCHAR(255) NOT NULL,                  -- 用户昵称 / 姓名 (如 Kah Hao / 陈嘉豪)
    picture TEXT DEFAULT '',                     -- Google 官方头像 URL
    role VARCHAR(32) DEFAULT 'business_user',    -- 角色: admin / business_user
    google_sub VARCHAR(64) DEFAULT '',           -- 绑定的 Google OAuth Sub ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "users" VALUES('user_760501527','chankahhao0215@gmail.com','Kah Hao','https://lh3.googleusercontent.com/a/default-user','admin','user_760501527','2026-10-29T22:01:54.680435','2026-10-29T22:07:40.024296');
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_user_creators ON user_tracked_creators(user_id);
CREATE INDEX idx_user_searches ON user_search_history(user_id, searched_at DESC);
CREATE INDEX idx_stories_creator ON creator_stories(creator_username);
CREATE INDEX idx_snapshots_creator ON creator_snapshots(creator_username, mode);
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('user_tracked_creators',9);
INSERT INTO "sqlite_sequence" VALUES('user_search_history',2);
COMMIT;
