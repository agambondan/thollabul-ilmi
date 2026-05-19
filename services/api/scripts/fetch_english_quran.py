"""
Fetch English Quran translations (Saheeh International) from alquran.cloud API
and update data/quran_base.json in-place.

Source: https://alquran.cloud/api
Edition: en.saheeh (Saheeh International)

Usage:
    python scripts/fetch_english_quran.py
    python scripts/fetch_english_quran.py -o data/quran_base.json
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

API_BASE = "https://api.alquran.cloud/v1"
EN_EDITION = "en.sahih"  # Saheeh International
DELAY = 0.35  # seconds between requests


def fetch_json(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())


def get_surah_list():
    """Get list of all surahs."""
    data = fetch_json(f"{API_BASE}/surah")
    return data["data"]


def get_english(surah_number):
    """Fetch English edition for one surah."""
    url = f"{API_BASE}/surah/{surah_number}/{EN_EDITION}"
    data = fetch_json(url)
    return data["data"]["ayahs"]


def main():
    out_path = "data/quran_base.json"
    if len(sys.argv) > 2 and sys.argv[1] == "-o":
        out_path = sys.argv[2]

    if not os.path.exists(out_path):
        print(f"ERROR: {out_path} not found", file=sys.stderr)
        sys.exit(1)

    print(f"Loading {out_path}...")
    with open(out_path) as f:
        quran = json.load(f)

    print("Fetching surah list...")
    surah_list = get_surah_list()

    # Count current English coverage
    total_ayahs = sum(len(s["ayahs"]) for s in quran["surahs"])
    filled = sum(
        1 for s in quran["surahs"] for a in s["ayahs"] if a.get("english", "").strip()
    )
    print(f"Total ayahs: {total_ayahs}, English already filled: {filled}")

    updated = 0
    skipped = 0

    for surah_meta in surah_list:
        num = surah_meta["number"]
        name = surah_meta["englishName"]

        # Find matching surah in our data
        surah_data = next((s for s in quran["surahs"] if s["number"] == num), None)
        if not surah_data:
            print(f"  Surah {num:3d} ({name}): not found in data, skipping")
            continue

        # Check if English already filled for this surah
        if all(a.get("english", "").strip() for a in surah_data["ayahs"]):
            print(f"  Surah {num:3d} ({name}): already complete, skipping")
            skipped += 1
            continue

        try:
            print(f"  Fetching surah {num:3d} ({name})...", end=" ", flush=True)
            eng_ayahs = get_english(num)

            if len(eng_ayahs) != len(surah_data["ayahs"]):
                print(
                    f"WARNING: ayah count mismatch ({len(eng_ayahs)} vs {len(surah_data['ayahs'])})"
                )
                # Use minimum
                count = min(len(eng_ayahs), len(surah_data["ayahs"]))
            else:
                count = len(eng_ayahs)

            for i in range(count):
                if eng_ayahs[i]["text"]:
                    surah_data["ayahs"][i]["english"] = eng_ayahs[i]["text"]

            updated += 1
            print(f"{count} ayahs filled")

        except Exception as e:
            print(f"ERROR: {e}")

        time.sleep(DELAY)

    # Update generated_at
    quran["generated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    # Count final coverage
    new_filled = sum(
        1 for s in quran["surahs"] for a in s["ayahs"] if a.get("english", "").strip()
    )

    print(f"\nDone! Updated {updated} surahs, skipped {skipped}")
    print(f"English coverage: {new_filled}/{total_ayahs} ayahs")

    print(f"Saving to {out_path}...")
    with open(out_path, "w") as f:
        json.dump(quran, f, indent=2, ensure_ascii=False)

    print("Done!")


if __name__ == "__main__":
    main()
