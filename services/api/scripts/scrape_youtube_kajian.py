#!/usr/bin/env python3
import json
import os
import subprocess
import sys
import time
from youtube_transcript_api import YouTubeTranscriptApi

CHANNELS = [
    {
        "nama": "Ust. Dr. Khalid Basalamah, Lc., M.A.",
        "fokus_kajian": ["Sirah Nabawiyah", "Tazkiyatun nufus", "Adab", "Fikih praktis"],
        "channel_url": "https://www.youtube.com/@khalidbasalamah"
    },
    {
        "nama": "Ust. Dr. Syafiq Riza Basalamah, Lc., M.A.",
        "fokus_kajian": ["Keharmonisan keluarga", "Pernikahan", "Adab bermasyarakat", "Akhlak keseharian"],
        "channel_url": "https://www.youtube.com/@SyafiqRizaBasalamahOfficial"
    },
    {
        "nama": "Ust. Dr. Firanda Andirja, Lc., M.A.",
        "fokus_kajian": ["Akidah", "Syarah kitab ulama", "Tafsir Al-Qur'an"],
        "channel_url": "https://www.youtube.com/@FirandaAndirjaOfficial"
    },
    {
        "nama": "Ust. Muhammad Nuzul Dzikri, Lc.",
        "fokus_kajian": ["Penyucian jiwa", "Adab penuntut ilmu", "Isu kehidupan pemuda"],
        "channel_url": "https://www.youtube.com/@MuhammadNuzulDzikri"
    },
    {
        "nama": "Ust. Dr. Erwandi Tarmizi, Lc., M.A.",
        "fokus_kajian": ["Fikih muamalah kontemporer", "Hukum perbankan", "Investasi dan bisnis syariah"],
        "channel_url": "https://www.youtube.com/@AshiilTV"
    },
    {
        "nama": "Ust. Ammi Nur Baits, S.T., B.A.",
        "fokus_kajian": ["Fikih muamalah dasar", "Fikih ibadah harian", "Konsultasi syariah praktis"],
        "channel_url": "https://www.youtube.com/@anbchannel"
    },
    {
        "nama": "Ust. Abu Yahya Badrusalam, Lc.",
        "fokus_kajian": ["Hadis tematik", "Akidah", "Dakwah media sunnah"],
        "channel_url": "https://www.youtube.com/@rodjatv"
    },
    {
        "nama": "Ust. Dr. Abdullah Roy, M.A.",
        "fokus_kajian": ["Akidah dan tauhid terstruktur (HSI)", "Pembelajaran silsilah ilmiyyah"],
        "channel_url": "https://www.youtube.com/@AbdullahRoy"
    },
    {
        "nama": "Ust. Subhan Bawazier, Lc.",
        "fokus_kajian": ["Kajian tematik sosial", "Nasihat praktis hijrah", "Binaan komunitas pemuda/otomotif"],
        "channel_url": "https://www.youtube.com/@AladzievieChannel"
    }
]

class Snippet:
    def __init__(self, text, start, duration):
        self.text = text
        self.start = start
        self.duration = duration


def fetch_transcript_via_ytdlp(video_id, cookies=""):
    import tempfile, glob, re
    cookie_args = ytdlp_cookie_args(cookies)
    with tempfile.TemporaryDirectory() as tmpdir:
        out_tmpl = os.path.join(tmpdir, "%(id)s.%(ext)s")
        cmd = [
            "yt-dlp",
            *cookie_args,
            "--skip-download",
            "--write-sub",
            "--write-auto-sub",
            "--sub-lang", "id,en",
            "--sub-format", "vtt",
            "--no-warnings",
            "-o", out_tmpl,
            f"https://www.youtube.com/watch?v={video_id}"
        ]
        subprocess.run(cmd, capture_output=True, timeout=60)
        vtt_files = glob.glob(os.path.join(tmpdir, "*.vtt"))
        if not vtt_files:
            return []

        # Read first vtt file found
        snippets = []
        with open(vtt_files[0], "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()

        time_pattern = re.compile(r"(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})")
        current_start = None
        current_dur = 2.0
        for line in lines:
            line = line.strip()
            if not line or line.startswith("WEBVTT") or line.startswith("NOTE"):
                continue
            m = time_pattern.search(line)
            if m:
                h, mi, s, ms = map(int, m.groups()[:4])
                current_start = h * 3600 + mi * 60 + s + (ms / 1000.0)
                continue
            if current_start is not None and line:
                clean_text = re.sub(r"<[^>]+>", "", line).strip()
                if clean_text:
                    snippets.append(Snippet(clean_text, current_start, current_dur))
                    current_start = None
        return snippets


def fetch_transcript(video_id, cookies=""):
    try:
        return api.fetch(video_id, languages=['id', 'en'])
    except Exception:
        return fetch_transcript_via_ytdlp(video_id, cookies=cookies)

def ytdlp_cookie_args(cookies):
    if not cookies:
        return []
    if cookies in {"chrome", "firefox", "brave", "chromium", "edge"}:
        return ["--cookies-from-browser", cookies]
    return ["--cookies", cookies]


def get_channel_videos(channel_url, max_videos=20, cookies=""):
    cookie_args = ytdlp_cookie_args(cookies)
    candidates = [
        channel_url.rstrip('/') + '/videos',
        channel_url.rstrip('/') + '/streams',
        channel_url.rstrip('/')
    ]
    cmd = None
    for url in candidates:
        try:
            test_cmd = ['yt-dlp', *cookie_args, '--flat-playlist', '--no-warnings', '--dump-json', '--playlist-end', '1', url]
            res = subprocess.run(test_cmd, capture_output=True, text=True, timeout=30)
            if res.stdout.strip():
                cmd = ['yt-dlp', *cookie_args, '--flat-playlist', '--no-warnings', '--dump-json', '--playlist-end', str(max_videos), url]
                break
        except Exception:
            continue
    if cmd is None:
        return []
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        videos = []
        for line in res.stdout.strip().split('\n'):
            if not line:
                continue
            try:
                d = json.loads(line)
                vid = d.get('id')
                title = d.get('title')
                duration = int(d.get('duration') or 0)
                if vid and title:
                    videos.append({
                        "video_id": vid,
                        "title": title,
                        "duration": duration,
                        "url": f"https://www.youtube.com/watch?v={vid}",
                        "thumbnail_url": f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
                    })
            except Exception:
                continue
        return videos
    except Exception as e:
        print(f"Error extracting videos from {channel_url}: {e}", file=sys.stderr)
        return []

def chunk_transcript(snippets, chunk_duration=60):
    chunks = []
    current_chunk = {
        "start_seconds": 0,
        "end_seconds": 0,
        "text": []
    }
    for s in snippets:
        start = int(s.start)
        duration = int(s.duration)
        end = start + duration
        if not current_chunk["text"]:
            current_chunk["start_seconds"] = start
            current_chunk["end_seconds"] = end
            current_chunk["text"].append(s.text.strip())
        elif start - current_chunk["start_seconds"] < chunk_duration:
            current_chunk["end_seconds"] = max(current_chunk["end_seconds"], end)
            current_chunk["text"].append(s.text.strip())
        else:
            chunks.append({
                "start_seconds": current_chunk["start_seconds"],
                "end_seconds": current_chunk["end_seconds"],
                "text": " ".join(current_chunk["text"])
            })
            current_chunk = {
                "start_seconds": start,
                "end_seconds": end,
                "text": [s.text.strip()]
            }
    if current_chunk["text"]:
        chunks.append({
            "start_seconds": current_chunk["start_seconds"],
            "end_seconds": current_chunk["end_seconds"],
            "text": " ".join(current_chunk["text"])
        })
    return chunks

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Scrape YouTube Kajian Transcripts")
    parser.add_argument("--max", type=int, default=5, help="Max videos per channel")
    parser.add_argument("--cookies", type=str, default="", help="Path to cookies.txt or browser name (e.g. chrome)")
    args = parser.parse_args()

    max_videos_per_channel = args.max
    output_dir = os.path.join(os.path.dirname(__file__), "../data/static/kajian_transcripts")
    os.makedirs(output_dir, exist_ok=True)
    out_file = os.path.join(output_dir, "scraped_kajian.json")

    # Load existing if any so we can append/update incrementally
    all_data = []
    if os.path.exists(out_file):
        try:
            with open(out_file, "r", encoding="utf-8") as f:
                all_data = json.load(f)
        except Exception:
            all_data = []

    existing_vids = {item.get("video_id") for item in all_data if item.get("video_id")}

    for c in CHANNELS:
        speaker = c["nama"]
        topic = ", ".join(c["fokus_kajian"])
        print(f"\n[SCAN] {speaker} ({c['channel_url']})...")
        videos = get_channel_videos(c["channel_url"], max_videos=max_videos_per_channel, cookies=args.cookies)
        print(f"       Ditemukan {len(videos)} video metadata.")

        valid_count = 0
        for v in videos:
            vid = v["video_id"]
            if vid in existing_vids:
                continue
            try:
                snippets = fetch_transcript(vid, cookies=args.cookies)
                chunks = chunk_transcript(snippets)
                if not chunks:
                    continue

                video_entry = {
                    "title": v["title"],
                    "speaker": speaker,
                    "topic": topic,
                    "type": "video",
                    "url": v["url"],
                    "video_id": vid,
                    "duration_seconds": v["duration"],
                    "thumbnail_url": v["thumbnail_url"],
                    "published_at": "2024-01-01",
                    "transcripts": chunks
                }
                all_data.append(video_entry)
                valid_count += 1
                print(f"       ✓ {v['title'][:45]}... ({len(chunks)} chunks)")
            except Exception as e:
                print(f"       ✗ {v['title'][:45]}... skip ({e})")
                continue
            time.sleep(0.5)

        print(f"       -> {valid_count} video dengan transkrip.")

    if not all_data:
        print("\n[DONE] Tidak ada transkrip baru. File output tidak diubah.")
        return

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n[DONE] Disimpan ke {out_file} (Total video: {len(all_data)})")

if __name__ == "__main__":
    main()
