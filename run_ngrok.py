import os
import sys
import time
import subprocess
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PERMANENT_DOMAIN = "approval-shifty-game.ngrok-free.dev"

def is_backend_running(port=8000):
    try:
        req = urllib.request.urlopen(f"http://127.0.0.1:{port}/api/users", timeout=2)
        return req.status == 200
    except Exception:
        return False

def ensure_backend():
    if is_backend_running(8000):
        print("[+] 检获本地后端服务正在运行 (端口 8000 OK)")
        return None
    print("[*] 本地后端尚未启动，正在启动 FastAPI 后端服务...")
    server_py = os.path.join(BASE_DIR, "backend", "server.py")
    proc = subprocess.Popen(
        [sys.executable, server_py],
        cwd=BASE_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    for _ in range(15):
        time.sleep(1)
        if is_backend_running(8000):
            print("[+] 后端服务已成功启动！")
            return proc
    print("[!] 警告: 后端服务启动响应超时，尝试继续连接隧道...")
    return proc

def kill_existing_ngrok():
    """清理后台可能残留的旧 ngrok 进程，避免 ERR_NGROK_334 endpoint already online"""
    try:
        if sys.platform == 'win32':
            subprocess.run(["taskkill", "/F", "/IM", "ngrok.exe", "/T"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1)
    except Exception:
        pass

def main():
    print("=" * 66)
    print("       Instagram Tracker Ngrok 专属永久固定隧道启动器          ")
    print("=" * 66)

    # 启动前先自动清理后台冲突的旧实例
    kill_existing_ngrok()
    backend_proc = ensure_backend()

    print(f"\n[*] 正在启动专属永久穿透隧道: https://{PERMANENT_DOMAIN} ...")
    cmd = ["ngrok", "http", f"--url={PERMANENT_DOMAIN}", "8000"]
    
    print("\n" + "#" * 66)
    print("  🎉 Ngrok 永久固定服务器通道已就绪！")
    print(f"  👉 永久后端接口: https://{PERMANENT_DOMAIN}")
    print(f"  👉 手机访问前端: https://still-sea-4a4c.ts-chank.workers.dev/")
    print("#" * 66)
    print("【使用提示】:")
    print("1. 这个域名是永久属于你的，断网、重启电脑 100 次也永远不会改变！")
    print("2. 保持本窗口开启即可持续提供服务，按 Ctrl + C 可关闭退出。")
    print("-" * 66 + "\n")

    try:
        proc = subprocess.Popen(cmd)
        proc.wait()
    except KeyboardInterrupt:
        print("\n[*] 正在关闭隧道并退出...")
    finally:
        if backend_proc:
            backend_proc.terminate()

if __name__ == "__main__":
    main()
