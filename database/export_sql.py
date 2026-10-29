"""
=============================================================================
Instagram Tracker - 一键导出生产级 SQL 数据库脚本
=============================================================================
使用方法:
  python database/export_sql.py
将自动生成:
  database/ig_tracker_dump.sql
可直接导入至 Supabase, PostgreSQL, MySQL 等真正的云端数据库。
"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from database.db import export_database_to_sql, init_db, DB_PATH

def main():
    print("=" * 60)
    print("   Instagram Tracker 生产级 SQL 数据库导出工具")
    print("=" * 60)

    if not os.path.exists(DB_PATH):
        print("[*] 数据库未初始化，正在初始化...")
        init_db()

    dump_path = export_database_to_sql()
    size_bytes = os.path.getsize(dump_path)
    print(f"[+] 导出成功！")
    print(f"    SQL 文件路径: {dump_path}")
    print(f"    文件大小: {size_bytes} 字节 ({size_bytes / 1024:.2f} KB)")
    print("\n可直接使用 psql 或 mysql 导入至云端数据库：")
    print(f"  psql -U <user> -d <database> -f {dump_path}")
    print("=" * 60)

if __name__ == "__main__":
    main()
