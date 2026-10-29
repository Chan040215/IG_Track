import asyncio
import json
from playwright.async_api import async_playwright

CONFIG_PATH = "D:/IG_Track/backend/ig_config.json"
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    cookie_str = json.load(f)["cookie"]

cookies = []
for item in cookie_str.split(";"):
    if "=" in item:
        name, val = item.strip().split("=", 1)
        cookies.append({
            "name": name,
            "value": val,
            "domain": ".instagram.com",
            "path": "/"
        })

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        await context.add_cookies(cookies)
        page = await context.new_page()

        endpoints_found = []

        async def on_response(response):
            url = response.url
            if "graphql" in url or "comments" in url or "likers" in url or "api/v1" in url:
                try:
                    req = response.request
                    post_data = req.post_data
                    headers = await req.all_headers()
                    status = response.status
                    print(f"[{status}] {req.method} {url[:100]}", flush=True)
                    if "graphql" in url and post_data:
                        params = dict(urllib_parse(post_data))
                        print(f"   doc_id: {params.get('doc_id')}, op_name: {params.get('fb_api_req_friendly_name')}", flush=True)
                    if "comments" in url or "likers" in url:
                        print(f"   MATCHED: {url}", flush=True)
                        body = await response.text()
                        print(f"   Body snippet: {body[:150]}", flush=True)
                except Exception as e:
                    pass

        page.on("response", on_response)

        print("Navigating to Instagram post https://www.instagram.com/p/De1Ad8MExpx/ ...", flush=True)
        await page.goto("https://www.instagram.com/p/De1Ad8MExpx/", wait_until="networkidle")
        await page.wait_for_timeout(3000)

        # Also test another post that definitely has comments, e.g. a popular reel or post
        # Let's check reposts from xiaoskrren826
        # Let's open one of the reposted reels:
        repost_meta_path = "D:/IG_Track/data/xiaoskrren826/reposts/metadata.json"
        try:
            with open(repost_meta_path, "r", encoding="utf-8") as rf:
                rdata = json.load(rf)
                if rdata.get("items"):
                    r_code = rdata["items"][0].get("code")
                    if r_code:
                        print(f"Navigating to reposted item https://www.instagram.com/p/{r_code}/ ...", flush=True)
                        await page.goto(f"https://www.instagram.com/p/{r_code}/", wait_until="networkidle")
                        await page.wait_for_timeout(3000)
        except Exception as e:
            print("Error loading reposts:", e, flush=True)

        await browser.close()

def urllib_parse(s):
    import urllib.parse
    return urllib.parse.parse_qsl(s)

if __name__ == "__main__":
    asyncio.run(run())
