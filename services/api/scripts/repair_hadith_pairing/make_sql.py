#!/usr/bin/env python3
"""Ubah hasil build_fix.py menjadi berkas SQL yang bisa ditinjau sebelum jalan.

Sengaja tidak menyentuh database sendiri. Teks hadis itu isi agama; perubahannya
harus bisa dibaca manusia dulu, dijalankan sadar, dan dibatalkan kalau perlu.

Menghasilkan, per kitab:
    out/apply_<kitab>.sql      UPDATE dalam satu transaksi
    out/rollback_<kitab>.sql   kembalikan ke teks Arab yang lama
"""
import argparse
import glob
import json
import os


def q(text):
    """Kutip literal SQL dengan menggandakan tanda kutip tunggal."""
    return "'" + (text or "").replace("'", "''") + "'"


def statements(fixes, field):
    for row in fixes:
        hid = row.get("hadith_id")
        if hid is None:
            continue
        text = row.get(field) or ""
        # kolom aslinya NULL, bukan string kosong -- rollback harus mengembalikan NULL
        value = q(text) if text else "NULL"
        yield (
            "UPDATE translation SET ar = {} "
            "WHERE id = (SELECT translation_id FROM hadith WHERE id = {});"
        ).format(value, int(hid))


def write(path, header, body):
    with open(path, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("BEGIN;\n\n")
        for line in body:
            f.write(line + "\n")
        f.write("\nCOMMIT;\n")


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(here, "out"))
    args = ap.parse_args()

    total = 0
    pola = ["fix_*.json", "gapfill_*.json", "rescue_*.json"]
    berkas = [p for pat in pola for p in sorted(glob.glob(os.path.join(args.out, pat)))]
    for path in berkas:
        book = os.path.basename(path)[:-5]
        fixes = json.load(open(path, encoding="utf-8"))
        if not fixes:
            continue

        head = (
            f"-- Perbaikan teks Arab hadis: {book}\n"
            f"-- {len(fixes)} baris. Hanya kolom translation.ar yang disentuh;\n"
            f"-- nomor hadis, terjemahan, dan id record tidak berubah, jadi bookmark,\n"
            f"-- progres baca, dan URL yang sudah dibagikan tetap valid.\n"
            f"-- Jalankan rollback_{book}.sql untuk membatalkan.\n\n"
        )
        write(os.path.join(args.out, f"apply_{book}.sql"), head,
              statements(fixes, "ar_baru"))
        write(os.path.join(args.out, f"rollback_{book}.sql"),
              f"-- Kembalikan teks Arab {book} ke kondisi sebelum perbaikan.\n\n",
              statements(fixes, "ar_lama"))
        print(f"{book:<12}{len(fixes):>6} pernyataan")
        total += len(fixes)

    print(f"\nTotal {total} UPDATE. Belum ada yang dijalankan.")


if __name__ == "__main__":
    main()
