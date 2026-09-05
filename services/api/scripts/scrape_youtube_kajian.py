#!/usr/bin/env python3
import argparse
import glob
import json
import os
import re
import subprocess
import sys
import tempfile
import time

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

def ytdlp_cookie_args(cookies):
    if not cookies:
        return []
    if cookies in {"chrome", "firefox", "brave", "chromium", "edge"}:
        return ["--cookies-from-browser", cookies]
    return ["--cookies", cookies]

def get_channel_videos(channel_url, max_videos=50, cookies=""):
    cookie_args = ytdlp_cookie_args(cookies)
    candidates = [
        channel_url.rstrip('/') + '/videos',
        channel_url.rstrip('/') + '/streams',
        channel_url.rstrip('/')
    ]
    target_url = None
    for u in candidates:
        try:
            cmd = ['yt-dlp', *cookie_args, '--flat-playlist', '--no-warnings', '--dump-json', '--playlist-end', '1', u]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
            if res.stdout.strip():
                target_url = u
                break
        except Exception:
            continue
    if not target_url:
        return []

    cmd = ['yt-dlp', *cookie_args, '--flat-playlist', '--no-warnings', '--dump-json']
    if max_videos > 0:
        cmd.extend(['--playlist-end', str(max_videos)])
    cmd.append(target_url)

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        videos = []
        for line in res.stdout.strip().split('\n'):
            if not line:
                continue
            try:
                d = json.loads(line)
                vid = d.get('id')
                title = d.get('title')
                duration = int(d.get('duration') or 0)
                if vid and title and len(vid) == 11:
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
        print(f"Error fetching channel videos from {channel_url}: {e}", file=sys.stderr)
        return []

class Snippet:
    def __init__(self, text, start, duration):
        self.text = text
        self.start = start
        self.duration = duration

def _dedupe_rolling_captions(segments):
    result = []
    prev_words = []
    for seg in segments:
        words = (seg.text or "").split()
        if not words:
            continue
        max_overlap = 0
        max_k = min(len(prev_words), len(words))
        for k in range(max_k, 0, -1):
            if prev_words[-k:] == words[:k]:
                max_overlap = k
                break
        new_words = words[max_overlap:]
        if new_words:
            clean_str = " ".join(new_words)
            result.append(Snippet(clean_str, seg.start, seg.duration))
            prev_words = words
    return result

def fetch_transcript_vtt(video_id, cookies=""):
    cookie_args = ytdlp_cookie_args(cookies)
    with tempfile.TemporaryDirectory() as tmpdir:
        stem = os.path.join(tmpdir, "caption_tmp")
        base_cmd = [
            "yt-dlp",
            *cookie_args,
            "--skip-download",
            "--sub-langs", "id.*,en.*,id,en",
            "--sub-format", "vtt/best",
            "--extractor-args", "youtube:player_client=android,ios,web",
            "--no-warnings",
            "-o", stem,
            f"https://www.youtube.com/watch?v={video_id}"
        ]
        
        vtt_files = []
        for mode in ("--write-subs", "--write-auto-subs"):
            subprocess.run([base_cmd[0], mode, *base_cmd[1:]], capture_output=True, timeout=60)
            vtt_files = sorted(glob.glob(os.path.join(tmpdir, "caption_tmp*.vtt")))
            if vtt_files:
                break

        if not vtt_files:
            return []

        # Prefer id-orig or id if multiple
        target_vtt = vtt_files[0]
        for vf in vtt_files:
            if "id" in os.path.basename(vf):
                target_vtt = vf
                break

        snippets = []
        with open(target_vtt, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()

        time_pattern = re.compile(r"(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})")
        current_start = None
        current_dur = 2.0
        for line in lines:
            line = line.strip()
            if not line or line.startswith("WEBVTT") or line.startswith("NOTE") or line.startswith("Kind:") or line.startswith("Language:"):
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

        if snippets:
            return _dedupe_rolling_captions(snippets)
        return []

def fetch_transcript(video_id, cookies=""):
    # Always prioritize robust yt-dlp android/ios player extraction matching youtube-clipper
    res = fetch_transcript_vtt(video_id, cookies=cookies)
    if res:
        return res
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        api = YouTubeTranscriptApi()
        return api.fetch(video_id, languages=['id', 'en'])
    except Exception:
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

def scrape_channel(channel_url, speaker, topic, max_videos=50, cookies="", only_with_transcript=True, out_file=None, existing_map=None):
    print(f"\n[SCAN] {speaker} ({channel_url})...")
    videos = get_channel_videos(channel_url, max_videos=max_videos, cookies=cookies)
    print(f"       Ditemukan {len(videos)} video.")

    results = []
    for idx, v in enumerate(videos, 1):
        vid = v["video_id"]
        if existing_map and vid in existing_map and existing_map[vid].get("transcripts"):
            print(f"       [{idx}/{len(videos)}] ↷ {v['title'][:45]}... (Sudah ada di database - skip)")
            continue

        snippets = fetch_transcript(vid, cookies=cookies)
        chunks = chunk_transcript(snippets) if snippets else []

        if only_with_transcript and not chunks:
            print(f"       [{idx}/{len(videos)}] ✗ {v['title'][:45]}... (Tanpa transkrip - skip)")
            time.sleep(1.0)
            continue

        item = {
            "title": v["title"],
            "speaker": speaker,
            "topic": topic,
            "type": "video",
            "url": v["url"],
            "video_id": vid,
            "description": f"Kajian oleh {speaker}: {v['title']}",
            "duration": v["duration"],
            "thumbnail_url": v["thumbnail_url"],
            "published_at": "2024-01-01",
            "transcripts": chunks
        }
        results.append(item)
        print(f"       [{idx}/{len(videos)}] ✓ {v['title'][:45]}... ({len(chunks)} chunks transkrip)")

        # Save checkpoint immediately
        if out_file and existing_map is not None:
            existing_map[vid] = item
            try:
                with open(out_file, "w", encoding="utf-8") as f:
                    json.dump(list(existing_map.values()), f, ensure_ascii=False, indent=4)
            except Exception:
                pass

        time.sleep(1.5)

    return results

def main():
    parser = argparse.ArgumentParser(description="Scrape all YouTube videos from a channel with transcripts for seeder")
    parser.add_argument("--channel", type=str, default="", help="Single channel URL (e.g. https://www.youtube.com/@SyafiqRizaBasalamahOfficial)")
    parser.add_argument("--speaker", type=str, default="", help="Speaker name when using --channel")
    parser.add_argument("--topic", type=str, default="", help="Topic/focus when using --channel")
    parser.add_argument("--max", type=int, default=50, help="Max videos per channel (0 for unlimited)")
    parser.add_argument("--cookies", type=str, default="", help="Browser name (e.g. chrome, firefox) or path to cookies.txt")
    parser.add_argument("--allow-empty-transcript", action="store_true", help="Include videos even without transcript")
    parser.add_argument("--out", type=str, default="", help="Output JSON path (defaults to services/api/data/static/kajian.json)")
    args = parser.parse_args()

    default_out = os.path.join(os.path.dirname(__file__), "../data/static/kajian.json")
    out_file = args.out if args.out else default_out

    # Load existing to merge/update
    existing = []
    if os.path.exists(out_file):
        try:
            with open(out_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except Exception:
            existing = []

    existing_map = {item.get("video_id") or item.get("url"): item for item in existing}

    targets = []
    if args.channel:
        if not args.speaker:
            print("Error: Harap sertakan --speaker saat memakai --channel", file=sys.stderr)
            sys.exit(1)
        targets.append({
            "nama": args.speaker,
            "fokus_kajian": [args.topic] if args.topic else ["Kajian Umum"],
            "channel_url": args.channel
        })
    else:
        targets = CHANNELS

    total_new = 0
    for t in targets:
        items = scrape_channel(
            channel_url=t["channel_url"],
            speaker=t["nama"],
            topic=", ".join(t["fokus_kajian"]),
            max_videos=args.max,
            cookies=args.cookies,
            only_with_transcript=not args.allow_empty_transcript,
            out_file=out_file,
            existing_map=existing_map
        )
        for it in items:
            key = it["video_id"]
            if key not in existing_map:
                total_new += 1
            existing_map[key] = it

    final_list = list(existing_map.values())

    os.makedirs(os.path.dirname(os.path.abspath(out_file)), exist_ok=True)
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(final_list, f, ensure_ascii=False, indent=4)

    print(f"\n[DONE] Berhasil menyimpan {len(final_list)} video ({total_new} baru) ke {out_file}")
    print("Jalankan `make thollabul` untuk menerapkan langsung sebagai seeder di database!")

if __name__ == "__main__":
    main()
