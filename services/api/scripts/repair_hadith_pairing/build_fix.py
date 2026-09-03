#!/usr/bin/env python3
"""Susun perbaikan teks Arab hadis, dicocokkan lewat isi terjemahan.

Latar belakang
--------------
`scrape_all.go` mengunduh edisi Arab, Indonesia, dan Inggris sebagai tiga file
terpisah dari fawazahmed0, lalu menjahitnya berdasarkan nomor hadis. Penomoran
ketiga edisi itu tidak identik, jadi sebagian baris berakhir memasangkan teks
Arab satu hadis dengan terjemahan hadis lain.

Cara memperbaiki
----------------
Sumber gadingnst menyimpan `arab` dan `id` dalam SATU record, jadi pasangannya
tidak mungkin tertukar. Tapi penomorannya berbeda dengan yang sudah dipakai
database (database memakai penomoran hadits.in), dan mengganti nomor akan
memutus bookmark, progres baca, serta URL yang sudah dibagikan pengguna.

Karena terjemahan di database dan di gadingnst berasal dari terjemahan yang
sama, keduanya dijodohkan lewat **isi teks terjemahan**, bukan nomor. Nomor
hadis dibiarkan apa adanya; yang diganti hanya teks Arabnya.

Setiap hasil diuji ulang dengan pairing_score. Yang tidak lolos ambang tidak
ikut ditulis ke berkas perbaikan, melainkan masuk berkas karantina untuk
ditinjau manusia. Prinsipnya: lebih baik tidak menayangkan daripada
menayangkan yang belum bisa dipastikan.

Keluaran (tidak menyentuh database):
    out/fix_<kitab>.json         siap dipakai apply_fix.py
    out/quarantine_<kitab>.json  perlu ditinjau manual
    out/report.json              ringkasan angka
"""
import argparse
import json
import os
import re
import sys
import urllib.request
from collections import defaultdict

# services/api/scripts/repair_hadith_pairing -> akar repo -> scripts/audit-...
AUDIT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "..",
    "scripts", "audit-hadith-pairing",
)
sys.path.insert(0, os.path.abspath(AUDIT))
from pairing_score import score  # noqa: E402

API = "https://api-thollabul.jangkauin.site"
GADING = "https://raw.githubusercontent.com/gadingnst/hadith-api/master/books"

# slug di database -> nama berkas di gadingnst
BOOKS = {
    "bukhari": "bukhari",
    "muslim": "muslim",
    "abudaud": "abu-daud",
    "tirmidzi": "tirmidzi",
    "nasai": "nasai",
    "ibnumajah": "ibnu-majah",
    "malik": "malik",
}

PASS_RATIO = 0.70


def _norm(text, limit=None):
    """Kunci penjodohan: huruf kecil, tanpa kurung siku dan tanda baca."""
    text = re.sub(r"[\[\]]", " ", text or "")
    text = re.sub(r"[^a-z ]", " ", text.lower())
    words = text.split()
    return " ".join(words[:limit] if limit else words)


def fetch_json(url, timeout=120):
    with urllib.request.urlopen(url, timeout=timeout) as resp:
        return json.load(resp)


def load_db(book, cache_dir):
    path = os.path.join(cache_dir, f"db_{book}.json")
    if os.path.exists(path):
        return json.load(open(path, encoding="utf-8"))
    rows, page = [], 1
    while True:
        data = fetch_json(f"{API}/api/v1/hadiths/book/{book}?page={page}&size=500")
        items = data.get("items") or []
        if not items:
            break
        for h in items:
            tr = h.get("translation") or {}
            rows.append({
                "number": h.get("number"),
                "hadith_id": h.get("id"),
                "ar": tr.get("ar") if isinstance(tr.get("ar"), str) else "",
                "idn": tr.get("idn") if isinstance(tr.get("idn"), str) else "",
            })
        if page >= (data.get("total_pages") or 1):
            break
        page += 1
    rows.sort(key=lambda r: r["number"] or 0)
    json.dump(rows, open(path, "w", encoding="utf-8"), ensure_ascii=False)
    return rows


def load_gading(book, cache_dir):
    path = os.path.join(cache_dir, f"gading_{book}.json")
    if os.path.exists(path):
        return json.load(open(path, encoding="utf-8"))
    rows = fetch_json(f"{GADING}/{BOOKS[book]}.json")
    json.dump(rows, open(path, "w", encoding="utf-8"), ensure_ascii=False)
    return rows


def build_index(gading_rows):
    """Indeks terjemahan gadingnst -> record. Kunci ganda: teks penuh dan 30
    kata pertama, supaya beda ejaan di ekor kalimat tidak membuat gagal jodoh."""
    full, short = defaultdict(list), defaultdict(list)
    for row in gading_rows:
        idn = row.get("id") or ""
        if not idn.strip():
            continue
        k_full = _norm(idn)
        k_short = _norm(idn, 30)
        if k_full:
            full[k_full].append(row)
        if k_short:
            short[k_short].append(row)
    return full, short


def repair_book(book, cache_dir):
    db_rows = load_db(book, cache_dir)
    full, short = build_index(load_gading(book, cache_dir))

    fixes, quarantine = [], []
    stats = {
        "total": len(db_rows), "sudah_benar": 0, "diperbaiki": 0,
        "karantina_tak_berjodoh": 0, "karantina_skor_rendah": 0,
        "karantina_tanpa_terjemahan": 0, "karantina_tak_tertolong": 0,
    }

    for row in db_rows:
        idn = row["idn"]
        if not idn.strip():
            stats["karantina_tanpa_terjemahan"] += 1
            quarantine.append({**row, "alasan": "terjemahan kosong"})
            continue

        # Bedah minimal: baris yang pasangannya sudah lolos uji tidak disentuh.
        # Mengganti teks Arab yang sudah benar hanya menambah risiko tanpa guna.
        lama_found, lama_checked = score(row["ar"], idn)
        if lama_checked and lama_found / lama_checked >= PASS_RATIO:
            stats["sudah_benar"] += 1
            continue

        cands = full.get(_norm(idn)) or short.get(_norm(idn, 30)) or []
        if len(cands) != 1:
            stats["karantina_tak_berjodoh"] += 1
            quarantine.append({
                **row,
                "alasan": "tidak berjodoh" if not cands else f"ambigu ({len(cands)} kandidat)",
            })
            continue

        arab_baru = (cands[0].get("arab") or "").strip()
        found, checked = score(arab_baru, idn)
        ratio = (found / checked) if checked else 0.0

        if not checked or ratio < PASS_RATIO:
            # Teks Arab pengganti pun tidak lolos uji -> jangan ditayangkan.
            stats["karantina_tak_tertolong"] += 1
            quarantine.append({
                **row, "ar_usulan": arab_baru,
                "alasan": f"usulan pun hanya {found}/{checked}" if checked else "tak bisa dinilai",
            })
            continue

        stats["diperbaiki"] += 1
        fixes.append({
            "number": row["number"],
            "hadith_id": row["hadith_id"],
            "ar_lama": row["ar"],
            "ar_baru": arab_baru,
            "skor_lama": f"{lama_found}/{lama_checked}",
            "skor_baru": f"{found}/{checked}",
        })

    return fixes, quarantine, stats


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(here, "out"))
    ap.add_argument("--cache", default=os.path.join(here, "cache"))
    ap.add_argument("--book", action="append", choices=sorted(BOOKS))
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    os.makedirs(args.cache, exist_ok=True)

    report = {}
    for book in (args.book or sorted(BOOKS)):
        fixes, quarantine, stats = repair_book(book, args.cache)
        json.dump(fixes, open(os.path.join(args.out, f"fix_{book}.json"), "w",
                              encoding="utf-8"), ensure_ascii=False, indent=1)
        json.dump(quarantine, open(os.path.join(args.out, f"quarantine_{book}.json"),
                                   "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        report[book] = stats
        q = (stats["karantina_tak_berjodoh"] + stats["karantina_skor_rendah"]
             + stats["karantina_tanpa_terjemahan"])
        print(f"{book:<12} total {stats['total']:>5} | diperbaiki {stats['diperbaiki']:>5} "
              f"| sudah benar {stats['sudah_benar']:>5} | karantina {q:>5}")

    json.dump(report, open(os.path.join(args.out, "report.json"), "w",
                           encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\nBerkas ditulis ke {args.out} — belum ada yang menyentuh database.")


if __name__ == "__main__":
    main()
