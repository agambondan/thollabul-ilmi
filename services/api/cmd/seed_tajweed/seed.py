#!/usr/bin/env python3
"""
Seeds three fields in the translations table:
  ar_html  - tajweed-colored HTML from alquran.cloud
  ar       - Uthmani Arabic script from quran.com
  en       - English translation from quran.com (default: Saheeh International, id=20)

Usage:
    python3 seed.py [options]

Options:
    --run             Pipe generated SQL directly into docker exec psql
    --from-surah N    Resume from surah N (default: 1)
    --translation ID  quran.com translation ID for English (default: 20 = Saheeh International)
                      Other options: 19=Pickthall, 22=Yusuf Ali, 85=Abdel Haleem
    --skip-tajweed    Skip fetching ar_html from alquran.cloud
    --skip-quran      Skip fetching ar/en from quran.com
    --output PATH     SQL file output path (default: /tmp/tajweed_seed.sql)
    --container NAME  Docker container name (default: tholabul-ilmi-tholabul-ilmi-postgres-1)
    --db NAME         PostgreSQL database (default: thullabul_ilmi)
"""

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.request
from html.parser import HTMLParser

# ── Config ────────────────────────────────────────────────────────────────────

TOTAL_SURAHS = 114
CLOUD_URL = "https://api.alquran.cloud/v1/surah/{}/quran-tajweed"
QURAN_URL = (
    "https://api.quran.com/api/v4/verses/by_chapter/{}"
    "?fields=text_uthmani&translations={}&per_page=300"
)
DELAY_CLOUD = 0.5   # seconds between alquran.cloud requests
DELAY_QURAN = 0.3   # seconds between quran.com requests

# ── Tajweed bracket → CSS class mapping ──────────────────────────────────────
SHORTCODE_MAP = {
    "p": "madda_permissible",
    "m": "madda_necessary",
    "o": "madda_obligatory",
    "n": "madda_normal",
    "q": "qlq",
    "s": "slnt",
    "h": "ham_wasl",
    "g": "ghn",
    "a": "idgh_ghn",
    "u": "idgh_w_ghn",
    "f": "ikhf",
    "i": "iqlb",
    "c": "ikhf_shfw",
    "w": "idghm_shfw",
    "e": "idgh_mus",
    # "l" = lam shamsiyah — no CSS class, emit plain text
}

TAG_RE = re.compile(r'\[([a-z]+)(?::\d+)?\[([^\]]*)\]')
SUP_RE = re.compile(r'<sup\b[^>]*>.*?</sup>', re.IGNORECASE | re.DOTALL)
BASMALAH_PREFIXES = (
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ",
    "بسم الله الرحمن الرحيم",
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def decode_brackets(text: str) -> str:
    """Convert alquran.cloud bracket format to <tajweed class="…"> HTML."""
    result = []
    pos = 0
    for m in TAG_RE.finditer(text):
        result.append(text[pos:m.start()])
        code, content = m.group(1), m.group(2)
        css = SHORTCODE_MAP.get(code)
        if css:
            result.append(f'<tajweed class="{css}">{content}</tajweed>')
        else:
            result.append(content)
        pos = m.end()
    result.append(text[pos:])
    return "".join(result)


def strip_footnotes(html: str) -> str:
    """Remove <sup foot_note=...>N</sup> annotations from quran.com translation."""
    return SUP_RE.sub("", html).strip()


def strip_leading_basmalah(text: str) -> str:
    stripped = text.lstrip()
    for prefix in BASMALAH_PREFIXES:
        if stripped.startswith(prefix):
            return stripped[len(prefix):].lstrip()
    return text


def clean_quran_arabic_text(surah_number: int, ayah_number: int, text: str) -> str:
    if ayah_number != 1 or surah_number in (1, 9):
        return text
    return strip_leading_basmalah(text)


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; QuranSeed/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def dollar_quote(s: str) -> str:
    """Wrap string in PostgreSQL $$ dollar-quoting, choosing a unique delimiter."""
    # If text contains $$, use a unique tag
    if "$$" not in s:
        return f"$${s}$$"
    tag = "$T$"
    while tag in s:
        tag = tag[:-1] + "X$"
    return f"{tag}{s}{tag}"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--run", action="store_true",
                        help="apply SQL directly via docker exec psql")
    parser.add_argument("--from-surah", type=int, default=1, metavar="N")
    parser.add_argument("--translation", type=int, default=20, metavar="ID",
                        help="quran.com translation ID (default: 20 = Saheeh International)")
    parser.add_argument("--skip-tajweed", action="store_true",
                        help="skip ar_html from alquran.cloud")
    parser.add_argument("--skip-quran", action="store_true",
                        help="skip ar/en from quran.com")
    parser.add_argument("--output", default="/tmp/tajweed_seed.sql")
    parser.add_argument("--container", default="tholabul-ilmi-tholabul-ilmi-postgres-1")
    parser.add_argument("--db", default="thullabul_ilmi")
    args = parser.parse_args()

    print(f"Seeding surahs {args.from_surah}–{TOTAL_SURAHS}")
    print(f"  ar_html : {'alquran.cloud tajweed' if not args.skip_tajweed else 'SKIP'}")
    print(f"  ar      : {'quran.com Uthmani' if not args.skip_quran else 'SKIP'}")
    print(f"  en      : {'quran.com translation #' + str(args.translation) if not args.skip_quran else 'SKIP'}")
    print()

    lines = ["BEGIN;"]
    total_stmts = 0

    for n in range(args.from_surah, TOTAL_SURAHS + 1):
        print(f"  [{n}/{TOTAL_SURAHS}] surah {n}…", end=" ", flush=True)

        # Map: ayah_number → {ar_html, ar, en}
        updates: dict[int, dict] = {}

        # ── alquran.cloud (ar_html) ────────────────────────────────────────
        if not args.skip_tajweed:
            try:
                data = fetch_json(CLOUD_URL.format(n))
                if data.get("code") == 200:
                    for a in data["data"]["ayahs"]:
                        updates.setdefault(a["numberInSurah"], {})
                        updates[a["numberInSurah"]]["ar_html"] = decode_brackets(a["text"])
            except Exception as e:
                print(f"\n    WARN alquran.cloud surah {n}: {e}")
            time.sleep(DELAY_CLOUD)

        # ── quran.com (ar Uthmani + en translation) ────────────────────────
        if not args.skip_quran:
            try:
                data = fetch_json(QURAN_URL.format(n, args.translation))
                for v in data.get("verses", []):
                    num = v["verse_number"]
                    updates.setdefault(num, {})
                    if v.get("text_uthmani"):
                        updates[num]["ar"] = clean_quran_arabic_text(n, num, v["text_uthmani"])
                    ts = v.get("translations") or []
                    if ts and ts[0].get("text"):
                        updates[num]["en"] = strip_footnotes(ts[0]["text"])
            except Exception as e:
                print(f"\n    WARN quran.com surah {n}: {e}")
            time.sleep(DELAY_QURAN)

        # ── Build SQL UPDATE for this surah ────────────────────────────────
        for ayah_num, fields in sorted(updates.items()):
            if not fields:
                continue
            set_parts = []
            for col, val in fields.items():
                set_parts.append(f"{col} = {dollar_quote(val)}")
            sql = (
                f"UPDATE translation SET {', '.join(set_parts)} "
                f"WHERE id = ("
                f"  SELECT a.translation_id FROM ayah a "
                f"  JOIN surah s ON s.id = a.surah_id "
                f"  WHERE s.number = {n} AND a.number = {ayah_num} "
                f"  AND a.deleted_at IS NULL LIMIT 1"
                f");"
            )
            lines.append(sql)
            total_stmts += 1

        print(f"{len(updates)} ayahs")

    lines.append("COMMIT;")
    sql_content = "\n".join(lines)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(sql_content)

    print(f"\nSQL written to {args.output} ({total_stmts} statements)")

    if args.run:
        print(f"Applying via docker exec → {args.container} db={args.db}…")
        result = subprocess.run(
            ["docker", "exec", "-i", args.container,
             "psql", "-U", "postgres", "-d", args.db],
            input=sql_content.encode("utf-8"),
            capture_output=True,
        )
        out = result.stdout.decode(errors="replace")
        err = result.stderr.decode(errors="replace")
        if result.returncode != 0:
            print("ERROR:", err)
            sys.exit(1)
        updated = out.count("UPDATE 1")
        skipped = out.count("UPDATE 0")
        print(f"Done! {updated} rows updated, {skipped} skipped (no matching ayah).")
    else:
        print(f"\nTo apply:")
        print(f"  docker exec -i {args.container} psql -U postgres -d {args.db} < {args.output}")


if __name__ == "__main__":
    main()
