import os
import sqlite3
import json
import time
import datetime
from typing import Optional, List, Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "database")
DB_PATH = os.path.join(DB_DIR, "ig_tracker.db")
SCHEMA_PATH = os.path.join(DB_DIR, "schema.sql")
DATA_DIR = os.path.join(BASE_DIR, "data")
USERS_DB_DIR = DB_DIR
USERS_DIR = os.path.join(DB_DIR, "users")
SESSIONS_FILE = os.path.join(DB_DIR, "sessions.json")

# 主理人专属指定 ID
PRIMARY_USER_ID = "user_760501527"
PRIMARY_USER_EMAIL = "chankahhao0215@gmail.com"

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """初始化 SQLite 数据库与表结构"""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = get_connection()
    try:
        if os.path.exists(SCHEMA_PATH):
            with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            conn.executescript(schema_sql)
            conn.commit()
    finally:
        conn.close()

def upsert_user(user_id: str, email: str, name: str, picture: str = "", role: str = "business_user", google_sub: str = "") -> dict:
    """创建或更新用户资料"""
    conn = get_connection()
    try:
        now_iso = datetime.datetime.now().isoformat()
        cursor = conn.cursor()
        
        # 针对主理人邮箱，强制映射锁定至固定 ID: user_760501527
        if email.lower() == PRIMARY_USER_EMAIL.lower():
            target_id = PRIMARY_USER_ID
            role = "admin"
        else:
            target_id = user_id

        cursor.execute("SELECT * FROM users WHERE id = ? OR email = ?", (target_id, email.lower()))
        row = cursor.fetchone()

        if row:
            real_id = row["id"]
            cursor.execute("""
                UPDATE users 
                SET email = ?, name = ?, picture = ?, last_login = ?, google_sub = COALESCE(NULLIF(?, ''), google_sub)
                WHERE id = ?
            """, (email.lower(), name, picture or row["picture"], now_iso, google_sub, real_id))
            conn.commit()
            return {
                "id": real_id,
                "email": email.lower(),
                "name": name,
                "picture": picture or row["picture"],
                "role": row["role"],
                "last_login": now_iso,
                "created_at": row["created_at"]
            }
        else:
            cursor.execute("""
                INSERT INTO users (id, email, name, picture, role, google_sub, created_at, last_login)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (target_id, email.lower(), name, picture, role, google_sub, now_iso, now_iso))
            conn.commit()
            return {
                "id": target_id,
                "email": email.lower(),
                "name": name,
                "picture": picture,
                "role": role,
                "created_at": now_iso,
                "last_login": now_iso
            }
    finally:
        conn.close()

def get_user_by_id(user_id: str) -> Optional[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ? OR google_sub = ?", (user_id, user_id))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        conn.close()

def get_user_by_email(email: str) -> Optional[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        conn.close()

def save_session(token: str, user_id: str, expires_at: float):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO sessions (token, user_id, created_at, expires_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, ?)
        """, (token, user_id, expires_at))
        conn.commit()
    finally:
        conn.close()

def get_session_user(token: str) -> Optional[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        now_ts = time.time()
        cursor.execute("""
            SELECT u.*, s.expires_at 
            FROM sessions s 
            JOIN users u ON s.user_id = u.id 
            WHERE s.token = ? AND s.expires_at > ?
        """, (token, now_ts))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None
    finally:
        conn.close()

def delete_session(token: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()

# -----------------------------------------------------------------------------
# 用户专属追踪博主列表 (User Tracked Creators)
# -----------------------------------------------------------------------------
def get_user_tracked_creators(user_id: str) -> List[str]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT creator_username 
            FROM user_tracked_creators 
            WHERE user_id = ? 
            ORDER BY added_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
        return [r["creator_username"].lower().strip() for r in rows]
    finally:
        conn.close()

def add_user_tracked_creator(user_id: str, creator_username: str, notes: str = "") -> bool:
    clean = creator_username.lower().strip().lstrip("@")
    if not clean:
        return False
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR IGNORE INTO user_tracked_creators (user_id, creator_username, notes, added_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, (user_id, clean, notes))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def remove_user_tracked_creator(user_id: str, creator_username: str) -> bool:
    clean = creator_username.lower().strip().lstrip("@")
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM user_tracked_creators 
            WHERE user_id = ? AND creator_username = ?
        """, (user_id, clean))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

# -----------------------------------------------------------------------------
# 用户专属私密搜索记录 (User Search History)
# -----------------------------------------------------------------------------
def get_user_search_history(user_id: str, limit: int = 50) -> List[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT query, searched_at as timestamp 
            FROM user_search_history 
            WHERE user_id = ? 
            ORDER BY id DESC 
            LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def add_user_search_history(user_id: str, query: str) -> List[dict]:
    clean_q = query.strip()
    if not clean_q:
        return get_user_search_history(user_id)
    conn = get_connection()
    try:
        cursor = conn.cursor()
        # 删除重复项
        cursor.execute("DELETE FROM user_search_history WHERE user_id = ? AND LOWER(query) = LOWER(?)", (user_id, clean_q))
        cursor.execute("""
            INSERT INTO user_search_history (user_id, query, searched_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        """, (user_id, clean_q))
        conn.commit()
    finally:
        conn.close()
    return get_user_search_history(user_id)

def clear_user_search_history(user_id: str, query: Optional[str] = None) -> List[dict]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        if query:
            clean_q = query.strip().lower()
            cursor.execute("DELETE FROM user_search_history WHERE user_id = ? AND LOWER(query) = ?", (user_id, clean_q))
        else:
            cursor.execute("DELETE FROM user_search_history WHERE user_id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()
    return get_user_search_history(user_id)

# -----------------------------------------------------------------------------
# 博主资料元数据 (Creators)
# -----------------------------------------------------------------------------
def upsert_creator(username: str, **kwargs):
    clean = username.lower().strip().lstrip("@")
    if not clean:
        return
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM creators WHERE username = ?", (clean,))
        existing = cursor.fetchone()
        
        full_name = kwargs.get("full_name", existing["full_name"] if existing else "")
        profile_pic_url = kwargs.get("profile_pic_url", existing["profile_pic_url"] if existing else "")
        biography = kwargs.get("biography", existing["biography"] if existing else "")
        external_url = kwargs.get("external_url", existing["external_url"] if existing else "")
        following_count = kwargs.get("following_count", existing["following_count"] if existing else 0)
        followers_count = kwargs.get("followers_count", existing["followers_count"] if existing else 0)
        posts_count = kwargs.get("posts_count", existing["posts_count"] if existing else 0)
        stories_count = kwargs.get("stories_count", existing["stories_count"] if existing else 0)
        last_active = kwargs.get("last_active", existing["last_active"] if existing else None)
        
        cursor.execute("""
            INSERT OR REPLACE INTO creators (
                username, full_name, profile_pic_url, biography, external_url,
                following_count, followers_count, posts_count, stories_count,
                last_active, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (clean, full_name, profile_pic_url, biography, external_url,
              following_count, followers_count, posts_count, stories_count, last_active))
        conn.commit()
    finally:
        conn.close()

# -----------------------------------------------------------------------------
# 导出完整的真实 SQL Dump (兼容 MySQL / PostgreSQL / Supabase)
# -----------------------------------------------------------------------------
def export_database_to_sql(output_file: Optional[str] = None) -> str:
    """将整个 SQLite 数据库转储为可直接执行的 SQL 文件 (便于一键导入云端 PostgreSQL / MySQL / Supabase)"""
    if not output_file:
        output_file = os.path.join(DB_DIR, "ig_tracker_dump.sql")
    conn = get_connection()
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("-- =============================================================================\n")
            f.write(f"-- Instagram Tracker 真实数据库全量导出 (SQL DUMP)\n")
            f.write(f"-- 导出时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"-- 目标兼容: PostgreSQL / MySQL / SQLite / Supabase\n")
            f.write("-- =============================================================================\n\n")
            for line in conn.iterdump():
                f.write(f"{line}\n")
        return output_file
    finally:
        conn.close()
