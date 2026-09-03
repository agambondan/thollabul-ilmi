#!/usr/bin/env python3
"""Isi teks Arab yang kosong, dan selamatkan baris karantina yang bisa diuji.

Sumber: Open-Hadith-Data (github.com/mhashim6/Open-Hadith-Data), sisi Arab dari
Ensiklopedi Hadits Kitab 9 Imam — edisi yang sama dengan asal terjemahan di
database ini. Jumlah hadis per kitab persis sama dengan hadits.in untuk
kesembilan kitab, jadi penomorannya satu skema.

Bukti keselarasan sebelum dipakai (lihat docs/reviews/2026-09-03-...):

  1. Jumlah hadis kesembilan kitab persis sama dengan skema hadits.in.
  2. Pada 4.275 baris Musnad Ahmad yang teks Arabnya sudah ada dan sudah
     terverifikasi, sumber ini sepakat 4.275/4.275 (100%).
  3. Nama orang di dalam matan terjemahan dicocokkan ke teks Arab, diuji per
     blok 4.000 nomor: 26-36%, sementara pasangan acak hanya 0,5-4,3%.
     Pembanding pasangan yang sudah pasti benar ada di 25,8%, jadi angka ini
     setara dengan pasangan yang benar, bukan kebetulan.

Yang TIDAK dilakukan: menimpa baris yang teks Arabnya sudah lolos uji. Saat
diadu, teks hasil penjodohan-lewat-terjemahan menang 218 lawan 0 melawan sumber
ini, karena penomoran database ini campuran dua skema. Sumber ini hanya untuk
mengisi yang kosong dan menyelamatkan yang dikarantina.
"""
import argparse
import csv
import json
import os
import re
import sys
import urllib.request

csv.field_size_limit(10 ** 7)

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIT = os.path.abspath(os.path.join(HERE, "..", "..", "..", "..",
                                     "scripts", "audit-hadith-pairing"))
sys.path.insert(0, AUDIT)
from pairing_score import score  # noqa: E402

BASE = "https://raw.githubusercontent.com/mhashim6/Open-Hadith-Data/master"
CSV_PATH = {
    "bukhari": "Sahih_Al-Bukhari/sahih_al-bukhari_ahadith_mushakkala_mufassala.utf8.csv",
    "muslim": "Sahih_Muslim/sahih_muslim_ahadith_mushakkala_mufassala.utf8.csv",
    "abudaud": "Sunan_Abu-Dawud/sunan_abu-dawud_ahadith_mushakkala_mufassala.utf8.csv",
    "tirmidzi": "Sunan_Al-Tirmidhi/sunan_al-tirmidhi_ahadith_mushakkala_mufassala.utf8.csv",
    "nasai": "Sunan_Al-Nasai/sunan_al-nasai_ahadith_mushakkala_mufassala.utf8.csv",
    "ibnumajah": "Sunan_Ibn-Maja/sunan_ibn-maja_ahadith_mushakkala_mufassala.utf8.csv",
    "malik": "Maliks_Muwataa/maliks_muwataa_ahadith_mushakkala_mufassala.utf8.csv",
    "darimi": "Sunan_Al-Darimi/sunan_al-darimi_ahadith_mushakkala_mufassala.utf8.csv",
    "ahmad": "Musnad_Ahmad_Ibn-Hanbal/musnad_ahmad_ibn-hanbal_ahadith_mushakkala.utf8.csv",
}
# jumlah hadis yang diharapkan; kalau meleset, berkasnya bukan yang kita kira
EXPECTED = {
    "bukhari": 7008, "muslim": 5362, "abudaud": 4590, "tirmidzi": 3891,
    "nasai": 5662, "ibnumajah": 4332, "malik": 1594, "darimi": 3367,
    "ahmad": 26363,
}

PASS_RATIO = 0.70
RLM = re.compile("[‎‏]")


def load_source(book, cache_dir):
    path = os.path.join(cache_dir, f"oh_{book}.csv")
    if not os.path.exists(path):
        url = f"{BASE}/{CSV_PATH[book]}"
        with urllib.request.urlopen(url, timeout=300) as r, open(path, "wb") as f:
            f.write(r.read())

    rows = {}
    with open(path, encoding="utf-8", errors="replace") as f:
        for row in csv.reader(f):
            if len(row) >= 2 and row[0].isdigit():
                text = RLM.sub("", row[1]).strip()
                if text:
                    rows[int(row[0])] = text

    if len(rows) != EXPECTED[book]:
        raise SystemExit(
            f"{book}: sumber berisi {len(rows)} hadis, diharapkan {EXPECTED[book]}. "
            "Berkasnya berubah — periksa dulu sebelum melanjutkan."
        )
    return rows


def load_db(book):
    """Baris database, dari cache audit (berisi id hadits, ar, idn)."""
    path = os.path.join(AUDIT, "cache", f"{book}.json")
    if not os.path.exists(path):
        raise SystemExit(f"cache audit {book} tidak ada — jalankan fetch_all.py dulu")
    return json.load(open(path, encoding="utf-8"))


def plan(book, cache_dir):
    src = load_source(book, cache_dir)
    isi, selamat, lewat = [], [], {
        "sudah_benar": 0, "tidak_ada_di_sumber": 0, "tetap_karantina": 0,
        "tak_bisa_dinilai": 0,
    }

    for row in load_db(book):
        num, hid = row.get("number"), row.get("id")
        ar_lama = (row.get("ar") or "").strip()
        idn = (row.get("idn") or "").strip()
        if hid is None or num is None:
            continue

        baru = src.get(num)

        if not ar_lama:
            # lubang kosong: isi kalau sumber punya nomornya
            if not baru:
                lewat["tidak_ada_di_sumber"] += 1
                continue
            isi.append({"number": num, "hadith_id": hid, "ar_lama": "", "ar_baru": baru})
            continue

        found, checked = score(ar_lama, idn)
        if not checked:
            # terjemahan tanpa nama perawi -- tidak bisa dinilai, jangan disentuh
            lewat["tak_bisa_dinilai"] += 1
            continue
        if found / checked >= PASS_RATIO:
            lewat["sudah_benar"] += 1          # jangan ditimpa
            continue

        # baris karantina: pakai sumber ini hanya bila lolos uji
        if not baru:
            lewat["tetap_karantina"] += 1
            continue
        f2, c2 = score(baru, idn)
        if c2 and f2 / c2 >= PASS_RATIO:
            selamat.append({
                "number": num, "hadith_id": hid, "ar_lama": ar_lama, "ar_baru": baru,
                "skor_lama": f"{found}/{checked}", "skor_baru": f"{f2}/{c2}",
            })
        else:
            lewat["tetap_karantina"] += 1

    return isi, selamat, lewat


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "out"))
    ap.add_argument("--cache", default=os.path.join(HERE, "cache"))
    ap.add_argument("--book", action="append", choices=sorted(CSV_PATH))
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    os.makedirs(args.cache, exist_ok=True)

    total_isi = total_selamat = 0
    for book in (args.book or sorted(CSV_PATH)):
        isi, selamat, lewat = plan(book, args.cache)
        json.dump(isi, open(os.path.join(args.out, f"gapfill_{book}.json"), "w",
                            encoding="utf-8"), ensure_ascii=False, indent=1)
        json.dump(selamat, open(os.path.join(args.out, f"rescue_{book}.json"), "w",
                                encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"{book:<12} isi {len(isi):>6} | selamat {len(selamat):>4} | "
              f"sudah benar {lewat['sudah_benar']:>6} | gagal uji {lewat['tetap_karantina']:>4} | "
              f"tak dinilai {lewat['tak_bisa_dinilai']:>5} | di luar sumber {lewat['tidak_ada_di_sumber']:>4}")
        total_isi += len(isi)
        total_selamat += len(selamat)

    print(f"\nTOTAL: {total_isi} lubang diisi, {total_selamat} diselamatkan. "
          f"Belum ada yang menyentuh database.")


if __name__ == "__main__":
    main()
