#!/usr/bin/env python3
"""Susun perbaikan translation.idn yang kosong, dari hasil scraping hadits.in.

Latar belakang: hadits.in untuk nomor di luar jangkauannya tidak memberi 404,
melainkan diam-diam menyajikan terjemahan Bukhari nomor 1 (lihat
docs/reviews/2026-09-03-audit-pasangan-hadis.md, bagian "hadits.in menyajikan
hadis nomor 1..."). Scraper menembak penjaga di level halaman: setiap hasil
dicek `window.imam` dan `window.noHadits` yang tertanam di JS halaman itu
sendiri harus persis sama dengan yang diminta -- kalau tidak, halaman itu
adalah jebakan dan dibuang di scraper, tidak pernah sampai ke berkas ini.

Gerbang kedua di sini: karena teks Arab baris-baris ini sudah lengkap (dari
perbaikan sebelumnya), setiap terjemahan yang lolos penjaga halaman diuji
ULANG lawan Arab yang sudah ada di database, independen dari penjaga tadi.
Yang gagal kedua uji ini tidak ditulis ke berkas perbaikan.
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..",
                                     "scripts", "audit-hadith-pairing"))
sys.path.insert(0, AUDIT)
from pairing_score import score  # noqa: E402

PASS_RATIO = 0.70


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scraped", required=True)
    ap.add_argument("--out", default=os.path.join(HERE, "out"))
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    rows = json.load(open(args.scraped, encoding="utf-8"))
    by_book = {}
    stats = {
        "total": len(rows), "guard_gagal": 0, "gagal_ambil": 0,
        "gerbang_gagal": 0, "diisi": 0,
    }

    for r in rows:
        book = r["imam"]
        by_book.setdefault(book, [])

        if not r.get("guard_ok"):
            stats["guard_gagal"] += 1
            continue
        idn = (r.get("idn") or "").strip()
        if not idn:
            stats["gagal_ambil"] += 1
            continue

        found, checked = score(r.get("ar", ""), idn)
        if not checked or found / checked < PASS_RATIO:
            stats["gerbang_gagal"] += 1
            continue

        stats["diisi"] += 1
        by_book[book].append({
            "number": r["number"], "hadith_id": r["hadith_id"], "idn": idn,
            "skor": f"{found}/{checked}",
        })

    for book, fills in by_book.items():
        json.dump(fills, open(os.path.join(args.out, f"translationfill_{book}.json"), "w",
                              encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"{book:<12} {len(fills)} terjemahan siap diisi")

    print(f"\nTotal   : {stats['total']}")
    print(f"Diisi   : {stats['diisi']}")
    print(f"Kena jebakan (guard menolak): {stats['guard_gagal']}")
    print(f"Gagal diambil               : {stats['gagal_ambil']}")
    print(f"Lolos guard tapi gagal gerbang mutu: {stats['gerbang_gagal']}")


if __name__ == "__main__":
    main()
