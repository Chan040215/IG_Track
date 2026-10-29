import os
import sys
import io
import re
import json
import time
import datetime
import urllib.parse
import urllib.request
import urllib.error
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

def parse_post_node(node: dict) -> dict:
    """标准化单个帖子数据结构"""
    code = node.get("code") or node.get("shortcode") or ""
    pk = str(node.get("pk") or node.get("id") or "")
    media_type = node.get("media_type", 1) # 1: 图, 2: 视频, 8: 轮播相册
    product_type = node.get("product_type", "feed")
    taken_at = node.get("taken_at") or node.get("device_timestamp") or 0
    like_count = node.get("like_count") or 0
    comment_count = node.get("comment_count") or 0
    view_count = node.get("view_count")

    # 提取配文
    caption_obj = node.get("caption") or {}
    caption_text = ""
    if isinstance(caption_obj, dict):
        caption_text = caption_obj.get("text", "")
    elif isinstance(caption_obj, str):
        caption_text = caption_obj

    # 提取最佳图片
    image_url = ""
    img_v2 = node.get("image_versions2") or {}
    candidates = img_v2.get("candidates") or []
    if candidates and isinstance(candidates, list):
        image_url = candidates[0].get("url", "")
    elif node.get("display_url"):
        image_url = node.get("display_url")

    # 提取视频
    video_url = ""
    video_versions = node.get("video_versions") or []
    if video_versions and isinstance(video_versions, list):
        video_url = video_versions[0].get("url", "")

    # 提取轮播相册 (Carousel)
    carousel_media = []
    c_list = node.get("carousel_media") or []
    if isinstance(c_list, list) and c_list:
        for c in c_list:
            c_type = c.get("media_type", 1)
            c_img = ""
            c_candidates = (c.get("image_versions2") or {}).get("candidates") or []
            if c_candidates:
                c_img = c_candidates[0].get("url", "")
            c_vid = ""
            c_vids = c.get("video_versions") or []
            if c_vids:
                c_vid = c_vids[0].get("url", "")
            carousel_media.append({
                "pk": str(c.get("pk", "")),
                "media_type": c_type,
                "image_url": c_img,
                "video_url": c_vid
            })

    # 提取艾特的人
    usertags = []
    ut_list = (node.get("usertags") or {}).get("in") or []
    if isinstance(ut_list, list):
        for ut in ut_list:
            u_info = ut.get("user") or {}
            if u_info.get("username"):
                usertags.append({
                    "username": u_info.get("username"),
                    "full_name": u_info.get("full_name", ""),
                    "profile_pic_url": u_info.get("profile_pic_url", "")
                })

    # 作者信息
    user_info = node.get("user") or {}
    author = {
        "username": user_info.get("username", ""),
        "full_name": user_info.get("full_name", ""),
        "profile_pic_url": user_info.get("profile_pic_url", ""),
        "is_verified": user_info.get("is_verified", False)
    }

    # 提取背景音乐 / 配乐 (Music & Audio)
    music_data = None
    mm = node.get("music_metadata") or {}
    music_info = mm.get("music_info") or {}
    asset = music_info.get("music_asset_info") or {}
    orig = mm.get("original_sound_info") or node.get("original_sound_info") or {}
    clips = node.get("clips_metadata") or {}
    clips_music = (clips.get("music_info") or {}).get("music_asset_info") or {}
    clips_orig = clips.get("original_sound_info") or {}

    m_title = asset.get("title") or clips_music.get("title") or orig.get("original_audio_title") or clips_orig.get("original_audio_title") or ""
    m_artist = asset.get("display_artist") or clips_music.get("display_artist") or (orig.get("ig_artist") or {}).get("full_name") or ""
    m_audio_url = (
        asset.get("fast_start_progressive_download_url") or 
        asset.get("progressive_download_url") or 
        clips_music.get("fast_start_progressive_download_url") or
        clips_music.get("progressive_download_url") or
        orig.get("progressive_download_url") or
        clips_orig.get("progressive_download_url") or ""
    )
    m_cover = asset.get("cover_artwork_uri") or clips_music.get("cover_artwork_uri") or ""
    m_start_ms = (music_info.get("music_consumption_info") or {}).get("audio_asset_start_time_in_ms", 0)
    m_duration_ms = asset.get("duration_in_ms") or 0

    if m_title or m_audio_url:
        music_data = {
            "has_audio": True,
            "title": m_title,
            "artist": m_artist,
            "audio_url": m_audio_url,
            "cover_artwork_uri": m_cover,
            "start_time_ms": m_start_ms,
            "duration_ms": m_duration_ms
        }

    # 地点
    location_name = ""
    if node.get("location"):
        location_name = (node.get("location") or {}).get("name", "")

    dt = datetime.datetime.fromtimestamp(taken_at) if taken_at else datetime.datetime.now()
    time_display = dt.strftime("%Y-%m-%d %H:%M:%S")

    return {
        "pk": pk,
        "code": code,
        "url": f"https://www.instagram.com/p/{code}/" if product_type != "clips" else f"https://www.instagram.com/reel/{code}/",
        "media_type": media_type,
        "product_type": product_type,
        "taken_at": taken_at,
        "time_display": time_display,
        "caption": caption_text,
        "like_count": like_count,
        "comment_count": comment_count,
        "view_count": view_count,
        "image_url": image_url,
        "video_url": video_url,
        "carousel_media": carousel_media,
        "carousel_media_count": len(carousel_media) or (1 if media_type != 8 else 0),
        "usertags": usertags,
        "location": location_name,
        "author": author,
        "music": music_data
    }

def crawl_all_profile_media(target_username: str, log_fn=print) -> dict:
    """一次性自动化检索并采集博主的全量媒体数据：
       1. 官方帖子 (Posts)
       2. 精选快拍 (Highlights)
       3. 转帖别人 (Reposts)
       4. 被他人标记 (Tagged)
    """
    clean_un = target_username.lower().strip().lstrip("@")
    cookie_str = get_cookie()
    if not cookie_str:
        log_fn("[错误] 未配置 Cookie，无法抓取媒体数据")
        return {"status": "error", "message": "缺少 Cookie"}

    cookies = []
    for item in cookie_str.split(";"):
        if "=" in item:
            k, v = item.strip().split("=", 1)
            cookies.append({"name": k, "value": v, "domain": ".instagram.com", "path": "/"})

    posts_list = []
    highlights_trays = []
    reposts_list = []
    tagged_list = []
    profile_bio_data = {}

    log_fn(f"🚀 启动无头浏览器，深度检索 @{clean_un} 官方主页全量媒体数据源...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
        )
        context.add_cookies(cookies)
        page = context.new_page()

        def handle_response(res):
            if "graphql" not in res.url:
                return
            try:
                pd = res.request.post_data or ""
                parsed = urllib.parse.parse_qs(pd)
                name = parsed.get("fb_api_req_friendly_name", [""])[0]
                if not name:
                    return

                # 1. 帖子查询
                if name == "PolarisProfilePostsQuery":
                    data = res.json()
                    conn = data.get("data", {}).get("xdt_api__v1__feed__user_timeline_graphql_connection") or {}
                    for edge in conn.get("edges", []):
                        node = edge.get("node")
                        if node:
                            parsed_post = parse_post_node(node)
                            if not any(x["code"] == parsed_post["code"] for x in posts_list):
                                posts_list.append(parsed_post)

                # 2. 精选快拍专辑
                elif name == "PolarisProfileStoryHighlightsTrayContentQuery":
                    data = res.json()
                    edges = (data.get("data", {}).get("highlights") or {}).get("edges", [])
                    for e in edges:
                        node = e.get("node") or {}
                        hid = node.get("id") or ""
                        htitle = node.get("title") or "精选"
                        cover = ((node.get("cover_media") or {}).get("cropped_image_version") or {}).get("url") or ""
                        if hid and not any(x["id"] == hid for x in highlights_trays):
                            highlights_trays.append({
                                "id": hid,
                                "numeric_id": hid.replace("highlight:", ""),
                                "title": htitle,
                                "cover_url": cover,
                                "items": []
                            })

                # 3. 个人主页资料
                elif name == "PolarisProfilePageContentQuery":
                    data = res.json()
                    u = data.get("data", {}).get("user") or {}
                    if u:
                        profile_bio_data["biography"] = u.get("biography", "")
                        profile_bio_data["external_url"] = u.get("external_url", "")
                        profile_bio_data["category_name"] = u.get("category_name", "")
                        profile_bio_data["full_name"] = u.get("full_name", "")
                        profile_bio_data["profile_pic_url"] = u.get("profile_pic_url", "")
                        profile_bio_data["posts_count"] = (u.get("edge_owner_to_timeline_media") or {}).get("count")
                        profile_bio_data["followers_count"] = (u.get("edge_followed_by") or {}).get("count")
                        profile_bio_data["following_count"] = (u.get("edge_follow") or {}).get("count")

                # 4. 转帖专栏 (Reposts)
                elif name == "PolarisProfileRepostsTabContentQuery":
                    data = res.json()
                    fetch_dict = data.get("data", {}).get("fetch__XDTUserDict") or {}
                    timeline = fetch_dict.get("user_reposts_timeline") or {}
                    grid_items = timeline.get("repost_grid_items") or []
                    for item in grid_items:
                        media = item.get("media") or {}
                        if media:
                            parsed_media = parse_post_node(media)
                            if not any(x["code"] == parsed_media["code"] for x in reposts_list):
                                reposts_list.append(parsed_media)

                # 5. 被标记专栏 (Tagged)
                elif name == "PolarisProfileTaggedTabContentQuery":
                    data = res.json()
                    conn = data.get("data", {}).get("xdt_api__v1__usertags__user_id__feed_connection") or {}
                    for edge in conn.get("edges", []):
                        node = edge.get("node") or {}
                        if node:
                            parsed_tag = parse_post_node(node)
                            if not any(x["code"] == parsed_tag["code"] for x in tagged_list):
                                tagged_list.append(parsed_tag)

            except Exception:
                pass

        page.on("response", handle_response)

        # 阶段 1: 访问主页获取 Posts 与 Highlights
        log_fn(f"[*] 正在检索主页帖子与精选专辑...")
        page.goto(f"https://www.instagram.com/{clean_un}/", timeout=30000)
        page.wait_for_timeout(3500)

        # 阶段 2: 访问转帖专栏 (Reposts)
        log_fn(f"[*] 正在检索 @{clean_un} 转发的他人的 Reels 与帖子...")
        page.goto(f"https://www.instagram.com/{clean_un}/reposts/", timeout=30000)
        page.wait_for_timeout(3500)

        # 阶段 3: 访问被标记专栏 (Tagged)
        log_fn(f"[*] 正在检索他人标记 @{clean_un} 的帖子与 Reels...")
        page.goto(f"https://www.instagram.com/{clean_un}/tagged/", timeout=30000)
        page.wait_for_timeout(3500)

        # 阶段 4: 如果有精选相册，抓取每个精选相册内的快拍条目
        if highlights_trays:
            log_fn(f"[*] 发现 {len(highlights_trays)} 个精选专辑，正在解析专辑快拍流...")
            for ht in highlights_trays:
                nid = ht["numeric_id"]
                try:
                    ht_url = f"https://www.instagram.com/stories/highlights/{nid}/"
                    page.goto(ht_url, timeout=25000)
                    page.wait_for_timeout(2500)
                    html = page.content()
                    scripts = re.findall(r'<script type="application/json"[^>]*>(.*?)</script>', html)
                    found_stories = []
                    seen_pks = set()
                    for s in scripts:
                        if "taken_at" in s and ("video_versions" in s or "image_versions2" in s):
                            try:
                                js_obj = json.loads(s)
                                # 寻找快拍项目
                                def find_h_items(o):
                                    if isinstance(o, dict):
                                        if "taken_at" in o and ("video_versions" in o or "image_versions2" in o):
                                            pk = str(o.get("pk") or o.get("id"))
                                            if pk and pk not in seen_pks:
                                                seen_pks.add(pk)
                                                img_url = ""
                                                candidates = (o.get("image_versions2") or {}).get("candidates") or []
                                                if candidates:
                                                    img_url = candidates[0].get("url", "")
                                                vid_url = ""
                                                v_versions = o.get("video_versions") or []
                                                if v_versions:
                                                    vid_url = v_versions[0].get("url", "")
                                                found_stories.append({
                                                    "pk": pk,
                                                    "media_type": o.get("media_type", 1),
                                                    "taken_at": o.get("taken_at", 0),
                                                    "image_url": img_url,
                                                    "video_url": vid_url
                                                })
                                        for v in o.values():
                                            find_h_items(v)
                                    elif isinstance(o, list):
                                        for el in o:
                                            find_h_items(el)
                                find_h_items(js_obj)
                            except:
                                pass
                    ht["items"] = found_stories
                    ht["items_count"] = len(found_stories)
                    log_fn(f"  - 专辑 [{ht['title']}]: 解析到 {len(found_stories)} 条快拍")
                except Exception as e:
                    log_fn(f"  [!] 专辑 [{ht['title']}] 解析跳过: {e}")

        browser.close()

    # 持久化存储到 data/{username}/ 各子目录
    user_dir = os.path.join(DATA_DIR, clean_un)
    os.makedirs(user_dir, exist_ok=True)

    # 1. 帖子存储
    posts_dir = os.path.join(user_dir, "posts")
    os.makedirs(posts_dir, exist_ok=True)
    with open(os.path.join(posts_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump({"updated_at": int(time.time()), "count": len(posts_list), "items": posts_list}, f, ensure_ascii=False, indent=2)

    # 2. 精选快拍存储
    hl_dir = os.path.join(user_dir, "highlights")
    os.makedirs(hl_dir, exist_ok=True)
    with open(os.path.join(hl_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump({"updated_at": int(time.time()), "count": len(highlights_trays), "trays": highlights_trays}, f, ensure_ascii=False, indent=2)

    # 3. 转帖存储
    rp_dir = os.path.join(user_dir, "reposts")
    os.makedirs(rp_dir, exist_ok=True)
    with open(os.path.join(rp_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump({"updated_at": int(time.time()), "count": len(reposts_list), "items": reposts_list}, f, ensure_ascii=False, indent=2)

    # 4. 被标记存储
    tag_dir = os.path.join(user_dir, "tagged")
    os.makedirs(tag_dir, exist_ok=True)
    with open(os.path.join(tag_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump({"updated_at": int(time.time()), "count": len(tagged_list), "items": tagged_list}, f, ensure_ascii=False, indent=2)

    # 5. 更新 profile.json 中的计数与 Bio
    prof_path = os.path.join(user_dir, "profile.json")
    old_prof = {}
    if os.path.exists(prof_path):
        try:
            old_prof = json.load(open(prof_path, encoding="utf-8"))
        except:
            pass
    old_prof.update({
        "username": clean_un,
        "biography": profile_bio_data.get("biography", old_prof.get("biography", "")),
        "external_url": profile_bio_data.get("external_url", old_prof.get("external_url", "")),
        "category_name": profile_bio_data.get("category_name", old_prof.get("category_name", "")),
        "full_name": profile_bio_data.get("full_name", old_prof.get("full_name", "")),
        "profile_pic_url": profile_bio_data.get("profile_pic_url", old_prof.get("profile_pic_url", "")),
        "posts_count": profile_bio_data.get("posts_count") if profile_bio_data.get("posts_count") is not None else len(posts_list),
        "highlights_count": len(highlights_trays),
        "reposts_count": len(reposts_list),
        "tagged_count": len(tagged_list)
    })
    with open(prof_path, "w", encoding="utf-8") as f:
        json.dump(old_prof, f, ensure_ascii=False, indent=2)

    log_fn(f"🎉 @{clean_un} 全量媒体抓取归档完成！")
    log_fn(f"  - 帖子 (Posts): {len(posts_list)} 条")
    log_fn(f"  - 精选快拍 (Highlights): {len(highlights_trays)} 个专辑")
    log_fn(f"  - 转帖 (Reposts): {len(reposts_list)} 条")
    log_fn(f"  - 被标记 (Tagged): {len(tagged_list)} 条")

    return {
        "status": "ok",
        "posts_count": len(posts_list),
        "highlights_count": len(highlights_trays),
        "reposts_count": len(reposts_list),
        "tagged_count": len(tagged_list),
        "posts": posts_list,
        "highlights": highlights_trays,
        "reposts": reposts_list,
        "tagged": tagged_list
    }

def shortcode_to_media_id(shortcode: str) -> str:
    """将 Instagram 短代码 (shortcode) 转换为数字媒体 ID (media_id / pk)"""
    if not shortcode:
        return ""
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    media_id = 0
    for char in shortcode:
        if char in alphabet:
            media_id = media_id * 64 + alphabet.index(char)
    return str(media_id) if media_id > 0 else ""

def media_id_to_shortcode(media_id: str) -> str:
    """将数字媒体 ID 转换为 shortcode"""
    try:
        num = int(media_id)
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        chars = []
        while num > 0:
            chars.append(alphabet[num % 64])
            num //= 64
        return "".join(reversed(chars))
    except Exception:
        return ""

def fetch_post_interactions(username: str, code_or_pk: str, force_refresh: bool = False, log_fn=print) -> dict:
    """
    抓取指定帖子详情：
    1. 真实评论列表 (包含评论者账号、头像、文本、点赞数、子回复)
    2. 点赞者用户列表 (包含点赞者账号、昵称、头像、认证标识、总点赞人数)
    本地缓存于 data/{username}/posts/{shortcode}_interactions.json
    """
    clean_un = username.lower().strip().lstrip("@")
    user_posts_dir = os.path.join(DATA_DIR, clean_un, "posts")
    os.makedirs(user_posts_dir, exist_ok=True)

    # 确定 media_id 与 shortcode
    if str(code_or_pk).isdigit():
        media_id = str(code_or_pk)
        shortcode = media_id_to_shortcode(media_id)
    else:
        shortcode = str(code_or_pk).strip()
        media_id = shortcode_to_media_id(shortcode)

    cache_file = os.path.join(user_posts_dir, f"{shortcode}_interactions.json")
    if not force_refresh and os.path.exists(cache_file):
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cached = json.load(f)
                cached_comments = cached.get("comments", [])
                total_in_cache = len(cached_comments) + sum(len(c.get("child_comments", [])) for c in cached_comments)
                reported_count = cached.get("total_comments_reported") or cached.get("comments_count", 0)
                # 只有当缓存中评论数完整（包含完整子级回复）且点赞数据已抓取时，才复用缓存；若存在缺失则自动重新抓取
                if cached.get("likers") is not None and (total_in_cache >= reported_count or reported_count == 0):
                    return {"status": "ok", "source": "cache", "data": cached}
        except Exception:
            pass

    cookie_str = get_cookie()
    if not cookie_str:
        return {"status": "error", "message": "未配置 Instagram Cookie，无法抓取评论与点赞。"}

    csrf_match = re.search(r"csrftoken=([^;]+)", cookie_str)
    csrf_token = csrf_match.group(1) if csrf_match else ""

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Cookie": cookie_str,
        "X-CSRFToken": csrf_token,
        "X-IG-App-ID": "936619743392459",
        "X-ASBD-ID": "359341",
        "X-Requested-With": "XMLHttpRequest",
        "X-IG-WWW-Claim": "0",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "Referer": f"https://www.instagram.com/p/{shortcode}/",
        "Accept": "*/*"
    }

    comments_list = []
    has_more_comments = False
    total_comments_reported = 0

    # 1. 深度穿透抓取顶层评论 (包括置顶评论与多页翻页)
    all_raw_comments = []
    seen_comment_ids = set()
    comm_base_url = f"https://www.instagram.com/api/v1/media/{media_id}/comments/?can_support_threading=true&permalink_enabled=false"
    next_comm_url = comm_base_url
    page_count = 0
    max_comm_pages = 20

    while next_comm_url and page_count < max_comm_pages:
        page_count += 1
        try:
            req1 = urllib.request.Request(next_comm_url, headers=headers)
            with urllib.request.urlopen(req1, timeout=12) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if not total_comments_reported:
                    total_comments_reported = data.get("comment_count", 0)

                # 置顶评论 (pinned_comments) 与普通评论 (comments)
                page_comments = data.get("pinned_comments", []) + data.get("comments", [])
                new_in_page = 0
                for rc in page_comments:
                    cid = str(rc.get("pk") or rc.get("id", ""))
                    if cid and cid not in seen_comment_ids:
                        seen_comment_ids.add(cid)
                        all_raw_comments.append(rc)
                        new_in_page += 1

                # 翻页逻辑 (处理 Instagram 顶层评论的 max_id 与 min_id 分页)
                next_comm_url = None
                has_more_comments = data.get("has_more_comments", False)
                if has_more_comments and data.get("next_max_id"):
                    next_max_id = data.get("next_max_id")
                    next_comm_url = f"{comm_base_url}&max_id={urllib.parse.quote(str(next_max_id))}"
                elif data.get("has_more_headload_comments") and data.get("next_min_id") and new_in_page > 0:
                    next_min_id = data.get("next_min_id")
                    next_comm_url = f"{comm_base_url}&min_id={urllib.parse.quote(str(next_min_id))}"
        except Exception as e:
            log_fn(f"  [-] 抓取贴文 [{shortcode}] 顶层评论第 {page_count} 页异常: {e}")
            break

    # 2. 深度穿透抓取每一条评论的全部子级回复 (Child comments / Replies)
    for rc in all_raw_comments:
        cid = str(rc.get("pk") or rc.get("id", ""))
        child_count = rc.get("child_comment_count", 0)
        preview_children = rc.get("preview_child_comments", []) or []

        raw_children = []
        # 如果子评论数大于 preview_child_comments（或官方标记还有更多回复），调用 child_comments 专属接口获取全量
        if child_count > len(preview_children) or rc.get("has_more_child_comments") or rc.get("has_more_headload_child_comments"):
            child_url = f"https://www.instagram.com/api/v1/media/{media_id}/comments/{cid}/child_comments/"
            try:
                time.sleep(0.12)  # 轻量防刷间隔
                creq = urllib.request.Request(child_url, headers=headers)
                with urllib.request.urlopen(creq, timeout=10) as cresp:
                    cdata = json.loads(cresp.read().decode("utf-8"))
                    raw_children = cdata.get("child_comments", []) or cdata.get("comments", [])
            except Exception as ce:
                log_fn(f"  [-] 获取评论 {cid} 的子级回复异常，降级使用 preview: {ce}")
                raw_children = preview_children
        else:
            raw_children = preview_children

        # 整理与去重子级评论
        children = []
        seen_child_ids = set()
        for cc in raw_children:
            ccid = str(cc.get("pk") or cc.get("id", ""))
            if ccid and ccid in seen_child_ids:
                continue
            seen_child_ids.add(ccid)
            cu = cc.get("user", {})
            cdt = datetime.datetime.fromtimestamp(cc.get("created_at", 0)) if cc.get("created_at") else None
            children.append({
                "id": ccid,
                "text": cc.get("text", ""),
                "created_at": cc.get("created_at", 0),
                "time_display": cdt.strftime("%Y-%m-%d %H:%M") if cdt else "",
                "like_count": cc.get("comment_like_count", 0),
                "user": {
                    "id": str(cu.get("pk") or cu.get("id", "")),
                    "username": cu.get("username", ""),
                    "full_name": cu.get("full_name", ""),
                    "profile_pic_url": cu.get("profile_pic_url", ""),
                    "is_verified": cu.get("is_verified", False)
                }
            })

        u = rc.get("user", {})
        dt = datetime.datetime.fromtimestamp(rc.get("created_at", 0)) if rc.get("created_at") else None
        comments_list.append({
            "id": cid,
            "text": rc.get("text", ""),
            "created_at": rc.get("created_at", 0),
            "time_display": dt.strftime("%Y-%m-%d %H:%M") if dt else "",
            "like_count": rc.get("comment_like_count", 0),
            "user": {
                "id": str(u.get("pk") or u.get("id", "")),
                "username": u.get("username", ""),
                "full_name": u.get("full_name", ""),
                "profile_pic_url": u.get("profile_pic_url", ""),
                "is_verified": u.get("is_verified", False)
            },
            "child_comments": children
        })

    actual_comments_count = len(comments_list) + sum(len(c["child_comments"]) for c in comments_list)
    log_fn(f"  [+] 贴文 [{shortcode}] 评论深度穿透抓取完成: 顶层 {len(comments_list)} 条，含回复全量共 {actual_comments_count} 条 (官方统计: {total_comments_reported})")

    # 2. 抓取点赞者列表
    likers_list = []
    total_likers_reported = 0
    likers_url = f"https://www.instagram.com/api/v1/media/{media_id}/likers/"
    try:
        req2 = urllib.request.Request(likers_url, headers=headers)
        with urllib.request.urlopen(req2, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            total_likers_reported = data.get("user_count", 0)
            for lu in data.get("users", []):
                likers_list.append({
                    "id": str(lu.get("pk") or lu.get("id", "")),
                    "username": lu.get("username", ""),
                    "full_name": lu.get("full_name", ""),
                    "profile_pic_url": lu.get("profile_pic_url", ""),
                    "is_verified": lu.get("is_verified", False),
                    "is_private": lu.get("is_private", False)
                })
        log_fn(f"  [+] 贴文 [{shortcode}] 抓取到 {len(likers_list)} 位点赞用户 (总赞数: {total_likers_reported})")
    except Exception as e:
        log_fn(f"  [-] 贴文 [{shortcode}] 点赞列表获取异常: {e}")

    actual_comments_count = len(comments_list) + sum(len(c.get("child_comments", [])) for c in comments_list)
    result_data = {
        "media_id": media_id,
        "shortcode": shortcode,
        "comments_count": max(total_comments_reported, actual_comments_count),
        "total_comments_reported": total_comments_reported or actual_comments_count,
        "actual_comments_count": actual_comments_count,
        "top_level_comments_count": len(comments_list),
        "has_more_comments": has_more_comments,
        "comments": comments_list,
        "likers_count": len(likers_list),
        "total_likers_count": total_likers_reported or len(likers_list),
        "likers": likers_list,
        "updated_at": int(time.time()),
        "updated_at_display": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    # 持久化到本地磁盘
    try:
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        log_fn(f"  [-] 写入本地互动缓存文件失败: {e}")

    # 同步更新 metadata.json 中的点赞与评论计数
    meta_path = os.path.join(user_posts_dir, "metadata.json")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
            items = meta.get("items", [])
            for item in items:
                if str(item.get("code")) == shortcode or str(item.get("pk")) == media_id:
                    if total_likers_reported:
                        item["like_count"] = total_likers_reported
                    if total_comments_reported or actual_comments_count:
                        item["comment_count"] = max(total_comments_reported, actual_comments_count)
                    break
            with open(meta_path, "w", encoding="utf-8") as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    return {"status": "ok", "source": "live", "data": result_data}

def crawl_all_posts_interactions(username: str, log_fn=print) -> dict:
    """批量自动化抓取该博主所有帖子的评论与点赞用户数据"""
    clean_un = username.lower().strip().lstrip("@")
    meta_path = os.path.join(DATA_DIR, clean_un, "posts", "metadata.json")
    if not os.path.exists(meta_path):
        return {"status": "error", "message": f"博主 @{clean_un} 尚未抓取过帖子"}

    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        posts = meta.get("items", [])
    except Exception as e:
        return {"status": "error", "message": f"读取帖子元数据失败: {e}"}

    log_fn(f"🚀 开始批量抓取 @{clean_un} 共 {len(posts)} 条帖子的互动数据 (评论 + 点赞)...")
    results = []
    for idx, post in enumerate(posts):
        code = post.get("code") or ""
        pk = post.get("pk") or ""
        log_fn(f"[{idx+1}/{len(posts)}] 正在抓取贴文 {code} 的评论与点赞...")
        res = fetch_post_interactions(clean_un, code or pk, force_refresh=True, log_fn=log_fn)
        results.append(res)
        time.sleep(1.0) # 礼貌延时

    log_fn(f"🎉 @{clean_un} 全量贴文互动数据抓取完毕！")
    return {"status": "ok", "total_posts": len(posts), "results": results}

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "xiaoskrren826"
    crawl_all_profile_media(target)
