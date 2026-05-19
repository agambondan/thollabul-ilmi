#!/usr/bin/env python3
"""
Scrape HadisKu pages and compare them with local hadits_*.json data.

This script is intentionally staging-only: it does not update JSON files or DB.
Use the JSONL output as a candidate source for Arabic backfill after review.

Examples:
  python3 scripts/scrape_hadisku_compare.py --sample 10
  python3 scripts/scrape_hadisku_compare.py --books ahmad --full --scrape-cache --scrape-only --delay 0.7
  python3 scripts/scrape_hadisku_compare.py --books ahmad --full --from-cache
  python3 scripts/scrape_hadisku_compare.py --books ahmad,darimi --sample 50
  python3 scripts/scrape_hadisku_compare.py --books ahmad --full --workers 8
  python3 scripts/scrape_hadisku_compare.py --books ahmad --numbers 1,2,100,26363
"""

from __future__ import annotations

import argparse
import concurrent.futures
import html
import json
import re
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

try:
    from bs4 import BeautifulSoup
except ImportError as exc:  # pragma: no cover - command-line guard
    raise SystemExit("Missing dependency: beautifulsoup4. Install with `pip install beautifulsoup4`.") from exc


BASE_URL = "https://hadisku.flagodna.com/hadith"
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_DATA_DIR = SCRIPT_DIR.parent / "data"
DEFAULT_OUT_DIR = SCRIPT_DIR.parent / "data" / "hadisku_compare"
DEFAULT_RAW_DIR = SCRIPT_DIR.parent / "data" / "hadisku_raw"

BOOK_SLUGS = {
    "abudaud": "abudawud",
    "ahmad": "ahmad",
    "bukhari": "bukhari",
    "darimi": "addarimi",
    "ibnumajah": "ibnumajah",
    "malik": "malik",
    "muslim": "muslim",
    "nasai": "annasai",
    "tirmidzi": "tirmidzi",
}

HADISKU_COUNTS = {
    "abudawud": 4590,
    "addarimi": 3367,
    "ahmad": 26363,
    "annasai": 5662,
    "bukhari": 7008,
    "ibnumajah": 4332,
    "malik": 1595,
    "muslim": 5362,
    "tirmidzi": 3891,
}


def clean_text(value: str | None) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"^(?:Musnad|Sunan|Shahih|Muwatha'?|Hadis)\s+[A-Za-z ]+\s*[0-9٠-٩]+\s*:\s*", "", value, flags=re.I)
    value = value.strip(" \"“”")
    return re.sub(r"\s+", " ", value).strip()


def normalize_for_tokens(value: str | None) -> list[str]:
    value = clean_text(value).lower()
    replacements = {
        "radlia allahu": "radliyallahu",
        "radliya allahu": "radliyallahu",
        "radhiyallahu": "radliyallahu",
        "shallallahu 'alaihi wasallam": "shallallahu alaihi wa sallam",
        "shallallahu 'alaihi wa sallam": "shallallahu alaihi wa sallam",
        "shallallahu alaihi wasallam": "shallallahu alaihi wa sallam",
        "shallallahu alaihi wa sallam": "shallallahu alaihi wa sallam",
    }
    for src, dst in replacements.items():
        value = value.replace(src, dst)
    value = re.sub(r"\[[^\]]+\]", " ", value)
    value = re.sub(r"[^0-9a-zA-Z\u0600-\u06FF]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return [token for token in value.split(" ") if len(token) > 2]


def token_coverage(local_text: str, remote_text: str) -> float:
    local_tokens = normalize_for_tokens(local_text)
    remote_tokens = set(normalize_for_tokens(remote_text))
    if not local_tokens or not remote_tokens:
        return 0.0
    matched = sum(1 for token in local_tokens if token in remote_tokens)
    return matched / len(local_tokens)


def load_local_rows(data_dir: Path, slug: str) -> list[dict[str, Any]]:
    path = data_dir / f"hadits_{slug}.json"
    if not path.exists():
        raise FileNotFoundError(path)
    with path.open(encoding="utf-8") as handle:
        rows = json.load(handle)
    rows = [row for row in rows if isinstance(row.get("number"), int)]
    rows.sort(key=lambda row: row["number"])
    return rows


def row_idn(row: dict[str, Any]) -> str:
    return clean_text(row.get("idn") or row.get("terjemah") or "")


def sample_numbers(rows: list[dict[str, Any]], sample: int) -> list[int]:
    numbers = sorted({row["number"] for row in rows})
    if sample <= 0 or sample >= len(numbers):
        return numbers

    anchors = [1, 2, 100, 500, 1000, numbers[-1]]
    selected = [n for n in anchors if n in numbers]
    if len(selected) < sample:
        step = max(1, len(numbers) // sample)
        for idx in range(0, len(numbers), step):
            selected.append(numbers[idx])
            if len(set(selected)) >= sample:
                break
    return sorted(set(selected))[:sample]


def choose_local_numbers(
    rows: list[dict[str, Any]],
    sample: int,
    full: bool,
    explicit_numbers: set[int] | None,
) -> list[int]:
    by_number = {row["number"]: row for row in rows}
    if explicit_numbers is not None:
        return sorted(n for n in explicit_numbers if n in by_number)
    if full:
        return sorted(by_number)
    return sample_numbers(rows, sample)


def choose_remote_numbers(
    rows: list[dict[str, Any]],
    remote_slug: str,
    sample: int,
    full: bool,
    explicit_numbers: set[int] | None,
) -> list[int]:
    if explicit_numbers is not None:
        return sorted(explicit_numbers)
    if full:
        declared_count = HADISKU_COUNTS.get(remote_slug)
        if not declared_count:
            raise SystemExit(f"Missing HadisKu declared count for remote slug: {remote_slug}")
        return list(range(1, declared_count + 1))
    return sample_numbers(rows, sample)


def extract_hadisku(html_text: str) -> dict[str, str]:
    soup = BeautifulSoup(html_text, "html.parser")
    article = soup.find("article") or soup

    arabic_el = article.select_one(".arabic-text")
    arabic = clean_text(arabic_el.get_text(" ", strip=True) if arabic_el else "")

    idn_parts: list[str] = []
    idn_header = None
    for tag in article.find_all(["h2", "h3"]):
        if clean_text(tag.get_text(" ", strip=True)).lower() == "bahasa indonesia":
            idn_header = tag
            break
    if idn_header is not None:
        node = idn_header.find_next_sibling()
        while node is not None and getattr(node, "name", None) != "h2":
            if getattr(node, "name", None) == "p":
                idn_parts.append(node.get_text(" ", strip=True))
            node = node.find_next_sibling()

    statuses: dict[str, str] = {}
    for row in article.select("table tr"):
        cells = [clean_text(cell.get_text(" ", strip=True)) for cell in row.find_all(["td", "th"])]
        if len(cells) == 2 and cells[0].lower() not in {"peneliti", "status"}:
            statuses[cells[0]] = cells[1]

    return {
        "arabic": arabic,
        "idn": clean_text(" ".join(idn_parts)),
        "status_ahmad_syakir": statuses.get("Ahmad Syakir", ""),
        "status_al_arnaut": statuses.get("Al Arnaut", ""),
    }


REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; tholabul-ilmi-hadisku-compare/1.0)"}


def fetch_hadisku(remote_slug: str, number: int, retries: int = 3) -> dict[str, Any]:
    url = f"{BASE_URL}/{remote_slug}/{number}"
    last_error = ""
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, headers=REQUEST_HEADERS, timeout=25)
            if response.status_code == 404:
                return {"ok": False, "status": 404, "url": url, "error": "not_found"}
            response.raise_for_status()
            text = response.content.decode("utf-8", errors="replace")
            parsed = extract_hadisku(text)
            return {"ok": True, "status": response.status_code, "url": url, **parsed}
        except Exception as exc:  # pragma: no cover - network behavior
            last_error = str(exc)
            time.sleep(min(2 * attempt, 5))
    return {"ok": False, "status": 0, "url": url, "error": last_error}


def normalize_cached_remote(remote: dict[str, Any] | None, remote_slug: str, number: int) -> dict[str, Any]:
    if remote is None:
        return {
            "ok": False,
            "status": 0,
            "url": f"{BASE_URL}/{remote_slug}/{number}",
            "error": "missing_cache",
        }
    return {
        "ok": bool(remote.get("ok")),
        "status": remote.get("status", 0),
        "url": remote.get("url") or f"{BASE_URL}/{remote_slug}/{number}",
        "arabic": remote.get("arabic", ""),
        "idn": remote.get("idn", ""),
        "status_ahmad_syakir": remote.get("status_ahmad_syakir", ""),
        "status_al_arnaut": remote.get("status_al_arnaut", ""),
        "error": remote.get("error", ""),
    }


def compare_payload(
    slug: str,
    remote_slug: str,
    row: dict[str, Any],
    remote_payload: dict[str, Any] | None,
    threshold: float,
) -> dict[str, Any]:
    number = row["number"]
    local_idn = row_idn(row)
    local_ar = clean_text(row.get("ar") or "")
    remote = normalize_cached_remote(remote_payload, remote_slug, number)
    result = {
        "book_slug": slug,
        "remote_slug": remote_slug,
        "number": number,
        "local_has_arabic": bool(local_ar),
        "local_has_idn": bool(local_idn),
        "remote_ok": remote["ok"],
        "remote_status": remote["status"],
        "source_url": remote["url"],
        "remote_has_arabic": bool(clean_text(remote.get("arabic", ""))),
        "remote_has_idn": bool(clean_text(remote.get("idn", ""))),
        "idn_token_coverage": 0.0,
        "verdict": "remote_error",
        "local_idn_excerpt": local_idn[:240],
        "remote_idn_excerpt": clean_text(remote.get("idn", ""))[:240],
        "candidate_arabic_excerpt": clean_text(remote.get("arabic", ""))[:240],
        "status_ahmad_syakir": remote.get("status_ahmad_syakir", ""),
        "status_al_arnaut": remote.get("status_al_arnaut", ""),
        "error": remote.get("error", ""),
    }
    if not remote["ok"]:
        return result
    if not local_idn:
        result["verdict"] = "review_no_local_idn"
        return result
    if not result["remote_has_idn"]:
        result["verdict"] = "review_no_remote_idn"
        return result
    coverage = token_coverage(local_idn, remote.get("idn", ""))
    result["idn_token_coverage"] = round(coverage, 4)
    if coverage >= threshold:
        result["verdict"] = "match"
    else:
        result["verdict"] = "review_low_similarity"
    return result


def compare_one(slug: str, remote_slug: str, row: dict[str, Any], threshold: float) -> dict[str, Any]:
    return compare_payload(slug, remote_slug, row, fetch_hadisku(remote_slug, row["number"]), threshold)


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def append_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def raw_cache_path(raw_dir: Path, slug: str) -> Path:
    return raw_dir / f"{slug}.jsonl"


def load_raw_cache(raw_dir: Path, slug: str) -> dict[int, dict[str, Any]]:
    path = raw_cache_path(raw_dir, slug)
    if not path.exists():
        return {}
    records: dict[int, dict[str, Any]] = {}
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            number = row.get("number")
            if isinstance(number, int):
                records[number] = row
    return records


def scrape_raw_cache(
    raw_dir: Path,
    slug: str,
    remote_slug: str,
    numbers: list[int],
    refresh_cache: bool,
    delay: float,
) -> dict[str, Any]:
    path = raw_cache_path(raw_dir, slug)
    existing = load_raw_cache(raw_dir, slug)
    target_numbers = numbers if refresh_cache else [number for number in numbers if number not in existing]
    print(f"[{slug}] raw cache target={len(numbers)} existing={len(existing)} scrape={len(target_numbers)} path={path}")
    started = time.time()
    ok_count = 0
    error_count = 0
    for idx, number in enumerate(target_numbers, 1):
        remote = fetch_hadisku(remote_slug, number)
        record = {
            "book_slug": slug,
            "remote_slug": remote_slug,
            "number": number,
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            **remote,
        }
        append_jsonl(path, [record])
        if record["ok"]:
            ok_count += 1
        else:
            error_count += 1
        if idx % 50 == 0 or idx == len(target_numbers):
            print(f"[{slug}] raw cache {idx}/{len(target_numbers)} scraped")
        if delay > 0 and idx < len(target_numbers):
            time.sleep(delay)
    return {
        "book_slug": slug,
        "remote_slug": remote_slug,
        "target": len(numbers),
        "skipped_existing": 0 if refresh_cache else len(numbers) - len(target_numbers),
        "scraped": len(target_numbers),
        "ok": ok_count,
        "errors": error_count,
        "elapsed_seconds": round(time.time() - started, 2),
        "output": str(path),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape and compare HadisKu hadith pages.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--raw-dir", type=Path, default=DEFAULT_RAW_DIR)
    parser.add_argument("--books", default=",".join(BOOK_SLUGS.keys()), help="Comma-separated local book slugs")
    parser.add_argument("--numbers", help="Comma-separated hadith numbers. Only valid for one or more selected books.")
    parser.add_argument("--sample", type=int, default=10, help="Deterministic sample size per book. Use 0 with --full.")
    parser.add_argument("--full", action="store_true", help="Compare every local row for selected books.")
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--threshold", type=float, default=0.85)
    parser.add_argument("--scrape-cache", action="store_true", help="Scrape HadisKu pages into raw JSONL cache before compare.")
    parser.add_argument("--scrape-only", action="store_true", help="Only populate raw cache, do not compare.")
    parser.add_argument("--from-cache", action="store_true", help="Compare using raw JSONL cache only; never hit HadisKu.")
    parser.add_argument("--refresh-cache", action="store_true", help="Re-scrape selected raw cache rows even when already cached.")
    parser.add_argument("--delay", type=float, default=0.7, help="Delay in seconds between raw cache scrape requests.")
    args = parser.parse_args()

    selected_books = [book.strip() for book in args.books.split(",") if book.strip()]
    unknown = [book for book in selected_books if book not in BOOK_SLUGS]
    if unknown:
        raise SystemExit(f"Unknown local book slug(s): {', '.join(unknown)}")

    explicit_numbers = None
    if args.numbers:
        explicit_numbers = {int(part.strip()) for part in args.numbers.split(",") if part.strip()}

    if args.scrape_only and not args.scrape_cache:
        raise SystemExit("--scrape-only requires --scrape-cache")

    scrape_summaries: list[dict[str, Any]] = []
    if args.scrape_cache:
        for slug in selected_books:
            remote_slug = BOOK_SLUGS[slug]
            rows = load_local_rows(args.data_dir, slug)
            numbers = choose_remote_numbers(rows, remote_slug, args.sample, args.full, explicit_numbers)
            summary = scrape_raw_cache(args.raw_dir, slug, remote_slug, numbers, args.refresh_cache, args.delay)
            scrape_summaries.append(summary)
            print(json.dumps(summary, ensure_ascii=False, sort_keys=True))

        summary_path = args.raw_dir / "summary.json"
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        summary_path.write_text(json.dumps(scrape_summaries, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
        print(f"Raw cache summary written to {summary_path}")

    if args.scrape_only:
        return

    all_summaries: list[dict[str, Any]] = []
    for slug in selected_books:
        remote_slug = BOOK_SLUGS[slug]
        rows = load_local_rows(args.data_dir, slug)
        by_number = {row["number"]: row for row in rows}
        duplicates = len(rows) - len(by_number)
        numbers = choose_local_numbers(rows, args.sample, args.full, explicit_numbers)

        compare_from_cache = args.from_cache or args.scrape_cache
        raw_cache = load_raw_cache(args.raw_dir, slug) if compare_from_cache else {}
        source_label = f"cache={raw_cache_path(args.raw_dir, slug)}" if compare_from_cache else f"HadisKu slug={remote_slug}"
        print(f"[{slug}] comparing {len(numbers)} rows against {source_label}")
        started = time.time()
        results: list[dict[str, Any]] = []
        if compare_from_cache:
            for number in numbers:
                results.append(compare_payload(slug, remote_slug, by_number[number], raw_cache.get(number), args.threshold))
        else:
            with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
                futures = [
                    executor.submit(compare_one, slug, remote_slug, by_number[number], args.threshold)
                    for number in numbers
                ]
                for idx, future in enumerate(concurrent.futures.as_completed(futures), 1):
                    result = future.result()
                    results.append(result)
                    if idx % 100 == 0:
                        print(f"[{slug}] {idx}/{len(numbers)} done")

        results.sort(key=lambda item: item["number"])
        out_path = args.out_dir / f"{slug}.jsonl"
        write_jsonl(out_path, results)

        verdict_counts = Counter(result["verdict"] for result in results)
        summary = {
            "book_slug": slug,
            "remote_slug": remote_slug,
            "local_rows": len(rows),
            "local_unique_numbers": len(by_number),
            "local_duplicate_numbers": duplicates,
            "local_max_number": max(by_number) if by_number else 0,
            "hadisku_declared_count": HADISKU_COUNTS.get(remote_slug),
            "compared": len(results),
            "verdict_counts": dict(verdict_counts),
            "remote_with_arabic": sum(1 for result in results if result["remote_has_arabic"]),
            "local_missing_arabic_matched": sum(
                1
                for result in results
                if result["verdict"] == "match" and not result["local_has_arabic"] and result["remote_has_arabic"]
            ),
            "elapsed_seconds": round(time.time() - started, 2),
            "output": str(out_path),
            "source": "cache" if compare_from_cache else "network",
        }
        all_summaries.append(summary)
        print(json.dumps(summary, ensure_ascii=False, sort_keys=True))

    summary_path = args.out_dir / "summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(all_summaries, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")
    print(f"Summary written to {summary_path}")


if __name__ == "__main__":
    main()
