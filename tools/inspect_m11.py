import urllib.request
import json
import re

CONFIG_PATH = "D:/IG_Track/backend/ig_config.json"
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    cookie = json.load(f)["cookie"]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Cookie": cookie,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

shortcode = "De27DoxkvAF"
url = f"https://www.instagram.com/p/{shortcode}/"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req, timeout=15) as resp:
    html = resp.read().decode('utf-8')

matches = re.findall(r'<script type="application/json"[^>]*>(.*?)</script>', html)
m11 = matches[11]
js = json.loads(m11)

# Recursive search for comments or items
def search_comments(obj, depth=0):
    if depth > 12:
        return
    if isinstance(obj, dict):
        if "comments" in obj and isinstance(obj["comments"], list):
            print(f"Found 'comments' list with {len(obj['comments'])} items! Depth: {depth}")
            for c in obj["comments"][:3]:
                print("   Comment:", c.get("text", c.get("pk", c)))
        if "edge_media_to_parent_comment" in obj:
            edges = obj["edge_media_to_parent_comment"].get("edges", [])
            print(f"Found edge_media_to_parent_comment with {len(edges)} edges!")
            for e in edges[:3]:
                node = e.get("node", {})
                print("   Node text:", node.get("text"), "Owner:", node.get("owner", {}).get("username"))
        if "edge_media_preview_comment" in obj:
            edges = obj["edge_media_preview_comment"].get("edges", [])
            print(f"Found edge_media_preview_comment with {len(edges)} edges!")
        for k, v in obj.items():
            search_comments(v, depth + 1)
    elif isinstance(obj, list):
        for item in obj:
            search_comments(item, depth + 1)

search_comments(js)
