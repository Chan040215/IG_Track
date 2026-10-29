import os
import sys
import io
import re
import json
import time
import datetime
import subprocess
import requests
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CONFIG_PATH = os.path.join(BASE_DIR, "backend", "ig_config.json")

def get_cookie():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f).get("cookie", "").strip()
        except Exception:
            pass
    return ""

def clean_dash_url(u: str) -> str:
    """去除 DASH 分片切片参数，获取完整媒体流"""
    if not u:
        return ""
    u = re.sub(r'&bytestart=\d+&byteend=\d+', '', u)
    u = re.sub(r'bytestart=\d+&byteend=\d+&?', '', u)
    return u

def download_stream(url: str, dest_path: str, log_fn=print) -> bool:
    try:
        with requests.get(url, stream=True, timeout=30) as r:
            r.raise_for_status()
            with open(dest_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=32768):
                    f.write(chunk)
        return True
    except Exception as e:
        log_fn(f"  [!] 下载失败 ({os.path.basename(dest_path)}): {e}")
        return False

def merge_video_audio(video_path: str, audio_path: str, output_path: str, log_fn=print) -> bool:
    """使用 ffmpeg 将视频轨与音频轨无缝合成为一个完整的 mp4 影片"""
    try:
        cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            output_path
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
            return True
        else:
            log_fn(f"  [!] ffmpeg 合并返回码异常: {result.returncode}")
    except Exception as e:
        log_fn(f"  [!] ffmpeg 执行异常: {e}")
    return False

def format_relative_time(taken_at_ts: int) -> str:
    """计算相对发布时间（精确区分 24h 内与历史归档）"""
    dt = datetime.datetime.fromtimestamp(taken_at_ts)
    now = datetime.datetime.now()
    diff = int((now - dt).total_seconds())
    if diff < 60:
        return "刚刚"
    elif diff < 3600:
        return f"{diff // 60}分钟前"
    elif diff < 86400:
        return f"{diff // 3600}小时前"
    elif diff < 86400 * 2:
        return "昨天 (历史归档)"
    else:
        days = diff // 86400
        return f"{days}天前 (历史归档)"

def load_existing_stories(out_dir: str, clean_un: str):
    """读取本地已保存的全部快拍历史记录（包括超过24h的），保证永不丢失"""
    items_map = {}
    meta_path = os.path.join(out_dir, "metadata.json")
    saved_pic_url = ""
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as fp:
                old_data = json.load(fp)
                saved_pic_url = old_data.get("profile_pic_url", "")
                for it in old_data.get("items", []):
                    fn = it.get("filename")
                    if fn and os.path.exists(os.path.join(out_dir, fn)):
                        items_map[fn] = it
        except Exception:
            pass

    # 扫描磁盘中所有实际存在的 mp4 和 jpg 文件，防止遗漏
    if os.path.exists(out_dir):
        for f in os.listdir(out_dir):
            if (f.endswith(".mp4") or f.endswith(".jpg") or f.endswith(".png")) and not f.startswith("temp"):
                if f not in items_map:
                    fpath = os.path.join(out_dir, f)
                    stat = os.stat(fpath)
                    mtime = int(stat.st_mtime)
                    items_map[f] = {
                        "pk": f.split("_")[-1].split(".")[0],
                        "code": "",
                        "type": "video" if f.endswith(".mp4") else "image",
                        "filename": f,
                        "url": f"/data/{clean_un}/stories/{f}",
                        "taken_at": mtime,
                        "time_display": datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S"),
                        "relative_time": "历史归档",
                        "bgm": "",
                        "caption": "",
                        "reshared_story_author": None,
                        "mentions": [],
                        "feed_media": [],
                        "link_stickers": [],
                        "size_kb": round(stat.st_size / 1024, 1)
                    }

    # 动态刷新相对时间
    for it in items_map.values():
        t = it.get("taken_at")
        if t:
            it["relative_time"] = format_relative_time(t)

    return items_map, saved_pic_url

def find_story_items_in_json(obj, collected: list, seen_pks: set):
    """递归遍历 JSON 树，精准抓取快拍 item 实体，绝不混入杂质"""
    if isinstance(obj, dict):
        # 识别标准的 Instagram Story Item 特征
        if "taken_at" in obj and "pk" in obj and ("video_versions" in obj or "image_versions2" in obj or "video_dash_manifest" in obj):
            pk = str(obj["pk"])
            if pk not in seen_pks:
                seen_pks.add(pk)
                collected.append(obj)
        for v in obj.values():
            find_story_items_in_json(v, collected, seen_pks)
    elif isinstance(obj, list):
        for item in obj:
            find_story_items_in_json(item, collected, seen_pks)

def extract_reshared_story_author(item: dict):
    """提取快拍转发的他人快拍原作者 (reshared_story_media_author)"""
    reshare = item.get("reshared_story_media_author")
    if reshare and isinstance(reshare, dict):
        un = reshare.get("username")
        if un:
            return {
                "username": str(un).lower().strip().lstrip("@"),
                "full_name": reshare.get("full_name") or "",
                "profile_pic_url": reshare.get("profile_pic_url") or "",
                "id": str(reshare.get("id") or "")
            }
    return None

def extract_mentions_from_story_item(item: dict, reshared_author=None) -> list:
    """从 Instagram 快拍原生数据中深度提取所有 @ 提及/艾特的用户列表（自动剔除转发原作者）"""
    mentions = []
    seen = set()
    reshared_un = reshared_author.get("username") if isinstance(reshared_author, dict) else None

    def add_m(un, fn="", pic="", m_type="mention"):
        if not un:
            return
        clean = str(un).lower().strip().lstrip("@")
        # 如果是转发快拍的原作者，归入转发身份，不混入普通@提及
        if reshared_un and clean == reshared_un:
            return
        if clean and clean not in seen:
            seen.add(clean)
            mentions.append({
                "username": clean,
                "full_name": fn or "",
                "profile_pic_url": pic or "",
                "type": m_type
            })

    # 1. 现代 Bloks Stickers (story_bloks_stickers: ig_mention)
    bloks = item.get("story_bloks_stickers") or []
    if isinstance(bloks, list):
        for b in bloks:
            s_data = b.get("bloks_sticker", {}).get("sticker_data", {})
            if isinstance(s_data, dict):
                ig_m = s_data.get("ig_mention")
                if isinstance(ig_m, dict):
                    add_m(ig_m.get("username"), ig_m.get("full_name"), m_type="mention")

    # 2. 传统快拍提及 stickers (reel_mentions)
    reel_m = item.get("reel_mentions") or []
    if isinstance(reel_m, list):
        for rm in reel_m:
            u = rm.get("user") or {}
            add_m(u.get("username"), u.get("full_name"), u.get("profile_pic_url"), m_type="mention")

    # 3. 商业合作品牌 (sponsor_tags)
    sponsors = item.get("sponsor_tags") or []
    if isinstance(sponsors, list):
        for sp in sponsors:
            u = sp.get("sponsor") or sp.get("user") or {}
            add_m(u.get("username"), u.get("full_name"), u.get("profile_pic_url"), m_type="sponsor")

    # 4. 配文中手打的 @username
    cap = item.get("caption") or {}
    text = cap.get("text", "") if isinstance(cap, dict) else str(cap or "")
    if text:
        for at_un in re.findall(r'@([a-zA-Z0-9._]+)', text):
            add_m(at_un, m_type="caption")

    return mentions

def extract_feed_media(item: dict) -> list:
    """提取快拍中引用的 Reels 或帖子原帖"""
    feeds = item.get("story_feed_media") or []
    res = []
    if isinstance(feeds, list):
        for f in feeds:
            code = f.get("media_code")
            if code:
                p_type = f.get("product_type", "clips")
                res.append({
                    "code": code,
                    "type": p_type,
                    "url": f"https://www.instagram.com/reel/{code}/" if p_type == "clips" else f"https://www.instagram.com/p/{code}/"
                })
    return res

def extract_link_stickers(item: dict) -> list:
    """提取快拍中的外链贴纸"""
    links = item.get("story_link_stickers") or []
    res = []
    if isinstance(links, list):
        for lk in links:
            story_link = lk.get("story_link") or {}
            url = story_link.get("url") or lk.get("url")
            title = story_link.get("link_title") or story_link.get("display_url") or url
            if url:
                res.append({"url": url, "title": title})
    return res

def crawl_user_stories(target_username: str, log_fn=print):
    clean_un = target_username.lower().strip().lstrip("@")
    out_dir = os.path.join(DATA_DIR, clean_un, "stories")
    temp_dir = os.path.join(out_dir, "temp")
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)

    cookie_str = get_cookie()
    if not cookie_str:
        log_fn("[错误] 未在 ig_config.json 中找到有效 Cookie！")
        return {"status": "error", "message": "缺少 Cookie", "count": 0}

    cookies = []
    for item in cookie_str.split(";"):
        if "=" in item:
            k, v = item.strip().split("=", 1)
            cookies.append({"name": k, "value": v, "domain": ".instagram.com", "path": "/"})

    log_fn(f"🚀 启动无头浏览器，检索 @{clean_un} 官方快拍数据源...")
    existing_items_map, saved_author_pic = load_existing_stories(out_dir, clean_un)

    html_content = ""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        )
        context.add_cookies(cookies)
        page = context.new_page()

        target_url = f"https://www.instagram.com/stories/{clean_un}/"
        page.goto(target_url, timeout=30000)
        page.wait_for_timeout(3500)

        # 检查是否有未登录或不可用提示
        page_text = page.inner_text("body")
        if "This story is unavailable" in page_text or "抱歉，无法查看此快拍" in page_text:
            browser.close()
            sorted_existing = sorted(existing_items_map.values(), key=lambda x: x.get("taken_at", 0), reverse=True)
            log_fn(f"[*] @{clean_un} 当前没有可用的 24 小时新快拍，已为你完整保留本地历史归档的 {len(sorted_existing)} 条快拍。")
            return {"status": "ok", "count": len(sorted_existing), "items": sorted_existing}

        # 提取整页包含的 JSON 数据包与博主真实头像
        html_content = page.content()
        try:
            h_img = page.eval_on_selector('header img', 'el => el.src') if page.query_selector('header img') else None
            if not h_img:
                h_img = page.eval_on_selector('meta[property="og:image"]', 'el => el.content') if page.query_selector('meta[property="og:image"]') else None
            if h_img and '573323465' not in h_img:
                saved_author_pic = h_img
        except Exception:
            pass
        browser.close()

    # 从页面注入的 Script 标签中解析出所有官方快拍对象
    scripts = re.findall(r'<script type="application/json"[^>]*>(.*?)</script>', html_content)
    raw_story_items = []
    seen_pks = set()

    for s in scripts:
        if "taken_at" in s and ("video_dash_manifest" in s or "video_versions" in s or "image_versions2" in s):
            try:
                js_obj = json.loads(s)
                find_story_items_in_json(js_obj, raw_story_items, seen_pks)
            except Exception:
                pass

    if not raw_story_items:
        sorted_existing = sorted(existing_items_map.values(), key=lambda x: x.get("taken_at", 0), reverse=True)
        log_fn(f"[*] 未在页面中检测到 @{clean_un} 的最新快拍（当前未发布或已过24h），已为你保留历史已归档的 {len(sorted_existing)} 条快拍。")
        return {"status": "ok", "count": len(sorted_existing), "items": sorted_existing}

    # 按发布时间升序排列（最早发布的排前面，最新的排后面）
    raw_story_items.sort(key=lambda x: x.get("taken_at", 0))
    total_count = len(raw_story_items)
    log_fn(f"✅ 精准定位到 {total_count} 条已发布快拍！开始音视频合并与原图下载...")

    processed_items = []

    for idx, item in enumerate(raw_story_items, 1):
        pk = str(item.get("pk", idx))
        code = item.get("code", "")
        taken_at = item.get("taken_at", int(time.time()))
        media_type = item.get("media_type", 1) # 1: 图, 2: 视频

        dt = datetime.datetime.fromtimestamp(taken_at)
        time_str = dt.strftime("%Y%m%d_%H%M%S")
        time_display = dt.strftime("%Y-%m-%d %H:%M:%S")
        rel_time = format_relative_time(taken_at)

        # 提取 BGM 音乐标签
        bgm_info = ""
        music_stickers = item.get("story_music_stickers", [])
        if music_stickers and isinstance(music_stickers, list):
            asset = music_stickers[0].get("music_asset_info", {})
            if asset:
                artist = asset.get("display_artist", "")
                title = asset.get("title", "")
                bgm_info = f"{artist} · {title}".strip(" ·")

        # 提取文字配文
        caption_text = ""
        cap = item.get("caption")
        if cap and isinstance(cap, dict):
            caption_text = cap.get("text", "")

        # 提取转发快拍作者、@ 提及用户与贴纸链接
        reshared_author = extract_reshared_story_author(item)
        mentions = extract_mentions_from_story_item(item, reshared_author=reshared_author)
        feed_media = extract_feed_media(item)
        link_stickers = extract_link_stickers(item)

        log_fn(f"\n[{idx}/{total_count}] 处理快拍 #{pk} (发布于: {time_display} · {rel_time})")
        if reshared_author:
            log_fn(f"    🔄 转发快拍: @{reshared_author['username']} ({reshared_author.get('full_name', '')})")
        if bgm_info:
            log_fn(f"    🎵 配乐: {bgm_info}")
        if mentions:
            m_str = ", ".join([f"@{m['username']}" for m in mentions])
            log_fn(f"    👤 @提及标签: {m_str}")
        if feed_media:
            log_fn(f"    🔗 引用原帖: {feed_media[0]['url']}")

        # === 视频快拍 (media_type == 2) ===
        if media_type == 2:
            out_filename = f"{clean_un}_{time_str}_{code or pk}.mp4"
            final_path = os.path.join(out_dir, out_filename)

            # 如果本地已经完整下载过该文件，直接复用，绝不重复下载或覆盖！
            if os.path.exists(final_path) and os.path.getsize(final_path) > 1024:
                file_size_kb = round(os.path.getsize(final_path) / 1024, 1)
                log_fn(f"    ⚡ 视频快拍 #{pk} 已在本地归档 ({out_filename})，保留历史原件。")
                processed_items.append({
                    "pk": pk,
                    "code": code,
                    "type": "video",
                    "filename": out_filename,
                    "url": f"/data/{clean_un}/stories/{out_filename}",
                    "taken_at": taken_at,
                    "time_display": time_display,
                    "relative_time": rel_time,
                    "bgm": bgm_info,
                    "caption": caption_text,
                    "reshared_story_author": reshared_author,
                    "mentions": mentions,
                    "feed_media": feed_media,
                    "link_stickers": link_stickers,
                    "size_kb": file_size_kb
                })
                continue

            manifest = item.get("video_dash_manifest", "")

            video_url = ""
            audio_url = ""

            # 优先从 MPEG-DASH manifest 中提取高清视频轨和对应音频轨
            if manifest:
                try:
                    root = ET.fromstring(manifest)
                    for rep in root.iter("{urn:mpeg:dash:schema:mpd:2011}Representation"):
                        mime = rep.attrib.get("mimeType", "")
                        b_elem = rep.find("{urn:mpeg:dash:schema:mpd:2011}BaseURL")
                        if b_elem is not None and b_elem.text:
                            b_url = b_elem.text
                            if "video" in mime and not video_url:
                                video_url = b_url
                            elif "audio" in mime and not audio_url:
                                audio_url = b_url
                except Exception as e:
                    log_fn(f"    [!] 解析 DASH manifest 出错: {e}")

            # 备用：从 video_versions 提取
            if not video_url and item.get("video_versions"):
                video_url = item["video_versions"][0].get("url", "")

            # 执行合成下载
            v_clean = clean_dash_url(video_url)
            a_clean = clean_dash_url(audio_url)

            if v_clean and a_clean:
                temp_v = os.path.join(temp_dir, f"temp_{pk}_v.mp4")
                temp_a = os.path.join(temp_dir, f"temp_{pk}_a.mp4")
                log_fn("    -> 正在下载高清视频轨与音频轨...")
                v_ok = download_stream(v_clean, temp_v, log_fn)
                a_ok = download_stream(a_clean, temp_a, log_fn)
                if v_ok and a_ok:
                    log_fn("    -> 执行 ffmpeg 音画完美合成...")
                    merged_ok = merge_video_audio(temp_v, temp_a, final_path, log_fn)
                    if merged_ok:
                        size_kb = round(os.path.getsize(final_path) / 1024, 1)
                        log_fn(f"    ✅ 合成成功 (含完整配乐与画面): {out_filename} ({size_kb} KB)")
                    else:
                        os.replace(temp_v, final_path)
                elif v_ok:
                    os.replace(temp_v, final_path)
            elif v_clean:
                log_fn("    -> 下载无音轨视频...")
                download_stream(v_clean, final_path, log_fn)

            file_size_kb = round(os.path.getsize(final_path) / 1024, 1) if os.path.exists(final_path) else 0
            processed_items.append({
                "pk": pk,
                "code": code,
                "type": "video",
                "filename": out_filename,
                "url": f"/data/{clean_un}/stories/{out_filename}",
                "taken_at": taken_at,
                "time_display": time_display,
                "relative_time": rel_time,
                "bgm": bgm_info,
                "caption": caption_text,
                "reshared_story_author": reshared_author,
                "mentions": mentions,
                "feed_media": feed_media,
                "link_stickers": link_stickers,
                "size_kb": file_size_kb
            })

        # === 图片快拍 (media_type == 1) ===
        else:
            out_filename = f"{clean_un}_{time_str}_{code or pk}.jpg"
            final_path = os.path.join(out_dir, out_filename)

            # 如果本地已经完整下载过该图片，直接复用，绝不重复下载或覆盖！
            if os.path.exists(final_path) and os.path.getsize(final_path) > 512:
                file_size_kb = round(os.path.getsize(final_path) / 1024, 1)
                log_fn(f"    ⚡ 图片快拍 #{pk} 已在本地归档 ({out_filename})，保留历史原件。")
                processed_items.append({
                    "pk": pk,
                    "code": code,
                    "type": "image",
                    "filename": out_filename,
                    "url": f"/data/{clean_un}/stories/{out_filename}",
                    "taken_at": taken_at,
                    "time_display": time_display,
                    "relative_time": rel_time,
                    "bgm": bgm_info,
                    "caption": caption_text,
                    "reshared_story_author": reshared_author,
                    "mentions": mentions,
                    "feed_media": feed_media,
                    "link_stickers": link_stickers,
                    "size_kb": file_size_kb
                })
                continue

            candidates = item.get("image_versions2", {}).get("candidates", [])
            img_url = candidates[0].get("url") if candidates else ""

            if img_url:
                log_fn("    -> 正在下载无损全尺寸原图...")
                download_stream(img_url, final_path, log_fn)
                file_size_kb = round(os.path.getsize(final_path) / 1024, 1) if os.path.exists(final_path) else 0
                log_fn(f"    ✅ 保存图片快拍: {out_filename} ({file_size_kb} KB)")
                processed_items.append({
                    "pk": pk,
                    "code": code,
                    "type": "image",
                    "filename": out_filename,
                    "url": f"/data/{clean_un}/stories/{out_filename}",
                    "taken_at": taken_at,
                    "time_display": time_display,
                    "relative_time": rel_time,
                    "bgm": bgm_info,
                    "caption": caption_text,
                    "reshared_story_author": reshared_author,
                    "mentions": mentions,
                    "feed_media": feed_media,
                    "link_stickers": link_stickers,
                    "size_kb": file_size_kb
                })

    # 清理 temp
    try:
        for f in os.listdir(temp_dir):
            os.remove(os.path.join(temp_dir, f))
        os.rmdir(temp_dir)
    except Exception:
        pass

    # 提取博主高清头像链接（仅存 URL 用于前端直接展示，不存图进本地硬盘）
    author_pic = ""
    for r_item in raw_story_items:
        u_obj = r_item.get("user", {})
        if u_obj and u_obj.get("profile_pic_url"):
            author_pic = u_obj.get("profile_pic_url")
            break

    # 增量去重合并：新爬取的快拍合并进历史已归档快拍集合，绝不覆盖删除历史
    for p_item in processed_items:
        existing_items_map[p_item["filename"]] = p_item

    all_merged = list(existing_items_map.values())
    all_merged.sort(key=lambda x: x.get("taken_at", 0), reverse=True)

    final_pic = author_pic if (author_pic and "573323465" not in author_pic) else (saved_author_pic or author_pic)

    meta_path = os.path.join(out_dir, "metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({
            "username": clean_un,
            "profile_pic_url": final_pic,
            "count": len(all_merged),
            "updated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "items": all_merged
        }, f, indent=2, ensure_ascii=False)

    try:
        user_root_dir = os.path.dirname(out_dir)
        prof_path = os.path.join(user_root_dir, "profile.json")
        if final_pic:
            with open(prof_path, "w", encoding="utf-8") as pf:
                json.dump({"username": clean_un, "profile_pic_url": final_pic}, pf, indent=2, ensure_ascii=False)
    except Exception:
        pass

    log_fn(f"\n🎉 增量同步完成！共收录 {len(all_merged)} 条快拍（含已归档与最新），无任何数据丢失！")
    return {"status": "ok", "count": len(all_merged), "items": all_merged}

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "kohyingliew"
    crawl_user_stories(target)
