import os
import sys
import time
import subprocess
import re
import json
import threading
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLOUDFLARED_BIN = os.path.join(BASE_DIR, "cloudflared.exe")
TUNNEL_URL_FILE = os.path.join(BASE_DIR, "data", "tunnel_url.txt")

# Cloudflare Worker 动态寻址与心跳同步配置
WORKER_SYNC_URL = "https://still-sea-4a4c.ts-chank.workers.dev/api/sync_tunnel"
SYNC_SECRET = "ig_tracker_secret_2026"

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

def sync_tunnel_to_worker(tunnel_url, is_heartbeat=False):
    """向 Cloudflare Worker 自动汇报最新的隧道公网网址"""
    try:
        payload = json.dumps({
            "tunnel_url": tunnel_url,
            "secret": SYNC_SECRET
        }).encode("utf-8")
        req = urllib.request.Request(
            WORKER_SYNC_URL,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "IG-Tracker-Tunnel-Sync/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status == 200:
                print(f"  [⚡ 自动同步] 最新隧道已成功同步至 Cloudflare Worker！")
                return True
    except Exception as e:
        # 心跳周期静默，不反复刷屏
        if not is_heartbeat:
            print(f"  [!] 提示: Cloudflare Worker 暂未部署动态反代接口 (纯静态托管)，可忽略此提示。")
        return False

def start_heartbeat_loop(tunnel_url):
    """后台保活线程：每 3 分钟自动向 Worker 刷新一次心跳"""
    def loop():
        while True:
            time.sleep(180)
            sync_tunnel_to_worker(tunnel_url, is_heartbeat=True)
    t = threading.Thread(target=loop, daemon=True)
    t.start()

def main():
    print("=" * 66)
    print("       Instagram Tracker Cloudflare Tunnel 智能隧道启动器      ")
    print("=" * 66)

    if not os.path.exists(CLOUDFLARED_BIN):
        print(f"[x] 未找到 cloudflared.exe: {CLOUDFLARED_BIN}")
        print("请检查文件是否存在。")
        input("按回车键退出...")
        return

    backend_proc = ensure_backend()

    print("[*] 正在向 Cloudflare 全球边缘节点申请免费 HTTPS 穿透隧道...")
    cmd = [CLOUDFLARED_BIN, "tunnel", "--url", "http://127.0.0.1:8000"]
    tunnel_proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        encoding="utf-8",
        errors="ignore"
    )

    tunnel_url = None
    start_time = time.time()
    
    # 从输出中读取 trycloudflare.com 链接
    while time.time() - start_time < 20:
        line = tunnel_proc.stderr.readline()
        if not line:
            time.sleep(0.1)
            continue
        m = re.search(r"https://[a-zA-Z0-9\-\.]+\.trycloudflare\.com", line)
        if m:
            tunnel_url = m.group(0)
            break

    if not tunnel_url:
        print("[!] 无法自动获取隧道链接，请检查网络连接或稍后重试。")
        return

    os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    with open(TUNNEL_URL_FILE, "w", encoding="utf-8") as f:
        f.write(tunnel_url.strip())

    print("\n" + "#" * 66)
    print("  🎉 Cloudflare 安全隧道已成功连通！")
    print(f"  👉 本机专属穿透通道: {tunnel_url}")
    print("#" * 66 + "\n")

    # 全自动同步到 Cloudflare Worker
    sync_tunnel_to_worker(tunnel_url)
    # 启动后台心跳保活线程
    start_heartbeat_loop(tunnel_url)

    print("\n" + "-" * 66)
    print("【使用指南】:")
    print("1. 你的永久前端固定网址: https://still-sea-4a4c.ts-chank.workers.dev/")
    print("   👉 手机、平板、任何电脑只要打开上面这个网址，全自动连通本机数据！")
    print("2. 无论断网或重启分配了什么新链接，本机脚本会自动上报给 Worker，手机永不失效！")
    print("3. 保持本窗口开启即可持续提供服务，按 Ctrl + C 可关闭退出。")
    print("-" * 66)

    try:
        tunnel_proc.wait()
    except KeyboardInterrupt:
        print("\n[*] 正在关闭隧道并退出...")
        tunnel_proc.terminate()
        if backend_proc:
            backend_proc.terminate()

if __name__ == "__main__":
    main()
