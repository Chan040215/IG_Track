import urllib.request
import json
import re
import os
import glob

CONFIG_PATH = 'D:/IG_Track/backend/ig_config.json'
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    cookie = json.load(f)['cookie']

csrf_match = re.search(r'csrftoken=([^;]+)', cookie)
csrf_token = csrf_match.group(1) if csrf_match else ''
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Cookie': cookie,
    'X-CSRFToken': csrf_token,
    'X-IG-App-ID': '936619743392459',
    'X-ASBD-ID': '359341',
    'X-Requested-With': 'XMLHttpRequest',
    'X-IG-WWW-Claim': '0',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Accept': '*/*'
}

def extract_music(node):
    mm = node.get('music_metadata') or {}
    music_info = mm.get('music_info') or {}
    asset = music_info.get('music_asset_info') or {}
    orig = mm.get('original_sound_info') or node.get('original_sound_info') or {}
    clips = node.get('clips_metadata') or {}
    clips_music = (clips.get('music_info') or {}).get('music_asset_info') or {}
    clips_orig = clips.get('original_sound_info') or {}

    title = asset.get('title') or clips_music.get('title') or orig.get('original_audio_title') or clips_orig.get('original_audio_title') or ''
    artist = asset.get('display_artist') or clips_music.get('display_artist') or (orig.get('ig_artist') or {}).get('full_name') or ''
    audio_url = (
        asset.get('fast_start_progressive_download_url') or 
        asset.get('progressive_download_url') or 
        clips_music.get('fast_start_progressive_download_url') or
        clips_music.get('progressive_download_url') or
        orig.get('progressive_download_url') or
        clips_orig.get('progressive_download_url') or ''
    )
    cover = asset.get('cover_artwork_uri') or clips_music.get('cover_artwork_uri') or ''
    start_time_ms = (music_info.get('music_consumption_info') or {}).get('audio_asset_start_time_in_ms', 0)
    duration_ms = asset.get('duration_in_ms') or 0

    if title or audio_url:
        return {
            'has_audio': True,
            'title': title,
            'artist': artist,
            'audio_url': audio_url,
            'cover_artwork_uri': cover,
            'start_time_ms': start_time_ms,
            'duration_ms': duration_ms
        }
    return None

for meta_path in glob.glob('D:/IG_Track/data/*/posts/metadata.json'):
    print(f"Checking {meta_path}...")
    try:
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta = json.load(f)

        updated = False
        for item in meta.get('items', []):
            pk = item.get('pk')
            code = item.get('code')
            if pk and not item.get('music'):
                try:
                    req = urllib.request.Request(f'https://www.instagram.com/api/v1/media/{pk}/info/', headers=headers)
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        d = json.loads(resp.read().decode('utf-8'))
                        raw_item = d['items'][0]
                        m = extract_music(raw_item)
                        if m:
                            item['music'] = m
                            updated = True
                            print(f"  [+] Post {code}: Music attached -> {m['title']} - {m['artist']}")
                except Exception as e:
                    print(f"  [-] Error for {code}: {e}")

        if updated:
            with open(meta_path, 'w', encoding='utf-8') as f:
                json.dump(meta, f, ensure_ascii=False, indent=2)
            print(f"Saved updated {meta_path}")
    except Exception as e:
        print(f"Error reading {meta_path}: {e}")

print("All posts processed!")
