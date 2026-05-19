#!/usr/bin/env python3
"""
Scrape Arabic text dari hadits.in untuk hadith yang masih kosong Arabic-nya.
Pakai Playwright (headless Chromium) karena Arabic di-render via JavaScript.

Usage:
    python3 scripts/scrape_arabic_gaps.py                     # Semua kitab
    python3 scripts/scrape_arabic_gaps.py --imam ahmad         # Hanya Ahmad
    python3 scripts/scrape_arabic_gaps.py --imam darimi        # Hanya Darimi
    python3 scripts/scrape_arabic_gaps.py --start 5000 --end 6000  # Range tertentu
    python3 scripts/scrape_arabic_gaps.py --resume             # Lanjut dari yg udah ada
"""
import json
import os
import sys
import time
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

BASE_URL = "https://hadits.in"
DATA_DIR = Path(__file__).parent.parent / "data"

BOOKS = [
    {"imam": "ahmad",  "slug": "ahmad",  "name": "Musnad Ahmad",      "jumlah": 26363},
    {"imam": "darimi", "slug": "darimi", "name": "Sunan Darimi",      "jumlah": 2949},
]


def load_existing(imam):
    """Load existing hadith data from JSON file."""
    path = DATA_DIR / f"hadits_{imam}.json"
    if not path.exists():
        print(f"[ERROR] {path} not found!")
        return []
    with open(path) as f:
        return json.load(f)


def save_progress(imam, data):
    """Save the updated data back to JSON file."""
    path = DATA_DIR / f"hadits_{imam}.json"
    data.sort(key=lambda x: x.get("number", 0))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  [SAVE] {len(data)} hadits saved to {path}")


def needs_arabic(entry):
    """Check if an entry needs Arabic scraping."""
    return not entry.get("ar") or not entry["ar"].strip()


def get_missing_numbers(data):
    """Get list of hadith numbers that are missing Arabic text."""
    return [d["number"] for d in data if needs_arabic(d)]


def scrape_hadith(page, imam, number):
    """Scrape one hadith page, return Arabic text and kitab/bab if found."""
    url = f"{BASE_URL}/{imam}/{number}"
    try:
        page.goto(url, wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(2000)  # Extra wait for JS rendering

        # Extract Arabic
        arabic = ""
        try:
            arab_el = page.wait_for_selector("#arabic_container", timeout=5000)
            if arab_el:
                arabic = arab_el.inner_text().strip()
        except (PwTimeout, Exception):
            pass

        # Also try alternative selectors
        if not arabic:
            try:
                arab_el = page.query_selector(".arabic_container")
                if arab_el:
                    arabic = arab_el.inner_text().strip()
            except Exception:
                pass

        # Extract terjemah
        terjemah = ""
        try:
            terj_el = page.query_selector("#terjemah_container")
            if terj_el:
                terjemah = terj_el.inner_text().strip()
        except Exception:
            pass

        # Extract kitab & bab from page text/javascript
        kitab = ""
        bab = ""
        try:
            kitab = page.evaluate("""() => {
                const m = document.body.innerHTML.match(/kitab\\s*:\\s*'([^']+)'/);
                return m ? m[1] : '';
            }""")
            bab = page.evaluate("""() => {
                const m = document.body.innerHTML.match(/bab\\s*:\\s*'([^']+)'/);
                return m ? m[1] : '';
            }""")
        except Exception:
            pass

        return {
            "arabic": arabic,
            "terjemah": terjemah,
            "kitab": kitab,
            "bab": bab,
            "success": bool(arabic),
        }
    except Exception as e:
        return {
            "arabic": "",
            "terjemah": "",
            "kitab": "",
            "bab": "",
            "success": False,
            "error": str(e),
        }


def scrape_book(imam, data, start_num=None, end_num=None, resume=False, max_workers=3):
    """Scrape missing Arabic for a book."""
    missing = get_missing_numbers(data)
    if not missing:
        print(f"[{imam}] Semua hadits sudah punya Arabic! Tidak perlu scraping.")
        return data

    # Filter by range if specified
    if start_num and end_num:
        missing = [n for n in missing if start_num <= n <= end_num]
    elif start_num:
        missing = [n for n in missing if n >= start_num]
    elif end_num:
        missing = [n for n in missing if n <= end_num]

    # Build index for quick lookup
    data_by_number = {d["number"]: d for d in data}

    print(f"[{imam}] Target: {len(missing)} hadits perlu Arabic")
    print(f"[{imam}] Range: {min(missing)} - {max(missing)}")

    # Count existing data
    stats = {
        "with_ar": sum(1 for d in data if d.get("ar", "").strip()),
        "with_kitab": sum(1 for d in data if d.get("kitab", "")),
    }
    print(f"[{imam}] Existing dalam file: {stats['with_ar']} have Arabic, {stats['with_kitab']} have kitab")

    updated = 0
    errors = 0
    skipped = 0
    start_time = time.time()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )

        # Use a single browser context for all pages
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            viewport={"width": 1280, "height": 720},
        )

        for idx, number in enumerate(missing):
            hadith = data_by_number.get(number)
            if hadith is None:
                print(f"  [{imam}#{number}] SKIP: not in data file")
                skipped += 1
                continue

            # If resuming and already has Arabic, skip
            if resume and not needs_arabic(hadith):
                continue

            page = context.new_page()
            result = scrape_hadith(page, imam, number)
            page.close()

            arabic = result.get("arabic", "")
            terjemah = result.get("terjemah", "")
            kitab = result.get("kitab", "")
            bab = result.get("bab", "")

            if arabic:
                hadith["ar"] = arabic
                updated += 1

            # Also update terjemah if it was missing and we got it
            if terjemah and not hadith.get("idn", ""):
                hadith["idn"] = terjemah
            elif terjemah and not hadith.get("terjemah", ""):
                hadith["terjemah"] = terjemah

            # Update kitab/bab metadata (always from page, more accurate)
            if kitab and not hadith.get("kitab", ""):
                hadith["kitab"] = kitab
            if bab and not hadith.get("bab", ""):
                hadith["bab"] = bab

            if not result["success"]:
                errors += 1

            # Progress
            elapsed = time.time() - start_time
            rate = (idx + 1) / elapsed if elapsed > 0 else 0
            remaining = ((len(missing) - idx - 1) / rate) if rate > 0 else 0
            status = "✅" if arabic else "❌"
            err_info = f" - {result.get('error', '')}" if not result["success"] else ""
            print(f"  [{imam}#{number}] {status} ({idx+1}/{len(missing)}) "
                  f"{rate:.1f}/s, ETA {remaining:.0f}s{err_info}")

            # Periodic save every 50 entries
            if (idx + 1) % 50 == 0:
                save_progress(imam, data)

            # Rate limiting: be respectful to the server
            time.sleep(0.3)

        context.close()
        browser.close()

    # Final save
    save_progress(imam, data)

    total_time = time.time() - start_time
    print(f"\n[{imam}] SELESAI!")
    print(f"  Updated: {updated} hadits dengan Arabic")
    print(f"  Errors: {errors}")
    print(f"  Skipped: {skipped}")
    print(f"  Time: {total_time:.0f}s ({total_time/3600:.1f} jam)")
    print(f"  Rate: {len(missing)/total_time:.1f} hadits/s")

    return data


def main():
    parser = argparse.ArgumentParser(description="Scrape Arabic dari hadits.in pakai Playwright")
    parser.add_argument("--imam", help="Hanya scrape satu imam (ahmad, darimi)")
    parser.add_argument("--start", type=int, help="Nomor hadits awal (range)")
    parser.add_argument("--end", type=int, help="Nomor hadits akhir (range)")
    parser.add_argument("--resume", action="store_true", help="Skip yg udah punya Arabic")
    parser.add_argument("--max-workers", type=int, default=3, help="Workers (default: 3)")
    args = parser.parse_args()

    books = [b for b in BOOKS if b["imam"] == args.imam] if args.imam else BOOKS
    if not books:
        print(f"Imam '{args.imam}' tidak ditemukan. Pilihan: {[b['imam'] for b in BOOKS]}")
        sys.exit(1)

    for book in books:
        print(f"\n{'='*60}")
        print(f"Mulai scrape {book['name']} ({book['imam']})")
        print(f"{'='*60}")
        data = load_existing(book["imam"])
        if not data:
            print(f"[ERROR] Tidak ada data untuk {book['imam']}")
            continue
        data = scrape_book(
            imam=book["imam"],
            data=data,
            start_num=args.start,
            end_num=args.end,
            resume=args.resume,
            max_workers=args.max_workers,
        )


if __name__ == "__main__":
    main()
