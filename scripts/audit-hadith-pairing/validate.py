"""Uji matcher terhadap baris yang sudah dilabeli manual.

Label diambil dari baris yang dibaca dan dinilai orang, bukan oleh matcher,
jadi ini yang menahan matcher supaya tidak melenceng saat diubah-ubah.
Jalankan setiap kali translit.py, rowcheck.py, atau pairing_score.py disentuh.

Teksnya dibekukan di labeled_rows.json, bukan ditarik dari API. Sebagian baris
di sana sengaja menyimpan teks Arab SEBELUM perbaikan 2026-09-03: itu contoh
pasangan salah yang harus tetap bisa dikenali matcher. Kalau fixture ini ikut
data hidup, contoh-contoh itu hilang begitu datanya diperbaiki dan gerbang mutu
ini berubah jadi lampu hijau palsu.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from rowcheck import check  # noqa: E402

FIXTURE = os.path.join(HERE, "labeled_rows.json")

# bukhari 4253 sengaja tidak dilabeli: ejaan dataset "Ustman" (harusnya
# "Utsman") membuat huruf tertukar posisi, kasus yang belum ditangani matcher.


def main():
    rows = json.load(open(FIXTURE, encoding="utf-8"))
    tp = tn = fp = fn = skip = 0

    for key, row in sorted(rows.items()):
        truth = row["cocok"]
        got = check(row["ar"], row["idn"])
        if got is None:
            skip += 1
        elif got and truth:
            tp += 1
        elif not got and not truth:
            tn += 1
        elif not got and truth:
            fn += 1
            print(f"  FALSE ALARM: {key}")
        else:
            fp += 1
            print(f"  KECOLONGAN : {key}")

    total = tp + tn + fp + fn
    print(f"\ncocok benar   : {tp}")
    print(f"beda benar    : {tn}")
    print(f"false alarm   : {fn}")
    print(f"kecolongan    : {fp}")
    print(f"tak dinilai   : {skip}")
    print(f"akurasi       : {(tp + tn) / max(total, 1) * 100:.1f}% dari {total} baris berlabel")
    return 0 if fp + fn == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
