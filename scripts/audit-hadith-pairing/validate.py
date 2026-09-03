"""Uji matcher terhadap baris yang sudah dilabeli manual.

Label diambil dari baris yang dibaca dan dinilai orang, bukan oleh matcher,
jadi ini yang menahan matcher supaya tidak melenceng saat diubah-ubah.
Jalankan setiap kali translit.py atau rowcheck.py disentuh.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rowcheck import check, load

# True  = Arab dan terjemahan memang hadis yang sama
# False = pasangan salah, sudah diverifikasi manual
LABEL = {
    "bukhari": {
        True: [682, 825, 870, 872, 521, 522, 535, 548, 576, 579, 600, 617, 808,
               896, 976, 1094, 1272, 1736, 2259, 3156, 3527, 3786, 4724, 4957,
               5342, 5900, 7320, 6895, 6897, 585, 3414, 4773],
        False: [6896, 4155],
    },
    "muslim": {
        True: [810, 902, 982, 1101, 1220, 1761, 3228, 3828, 4776, 5017, 5497,
               6354, 1897, 1899, 2373, 2558, 2812, 5098, 5603, 6217, 6657,
               7475, 7532, 7552, 2999],
        False: [1294, 2303, 3572, 1435, 1669, 1898, 502, 509, 512, 521, 533,
                536, 556, 557, 647, 567, 569, 528, 2450, 4818, 4921, 983],
    },
    "abudaud": {
        True: [4254, 5116],
        False: [2279, 1268, 1703],
    },
    "nasai": {
        True: [1132, 1690, 839, 2177, 3162],
        False: [3945, 5180],
    },
    "tirmidzi": {True: [2132], False: []},
    "malik": {True: [], False: [635]},
}

# bukhari 4253 sengaja tidak dilabeli: ejaan dataset "Ustman" (harusnya
# "Utsman") membuat huruf tertukar posisi, kasus yang belum ditangani matcher.


def main():
    tp = tn = fp = fn = skip = 0
    for book, groups in LABEL.items():
        rows = {r["number"]: r for r in load(book)}
        for truth, numbers in groups.items():
            for number in numbers:
                row = rows.get(number)
                if not row:
                    print(f"  hilang: {book} no.{number}")
                    continue
                got = check(row["ar"], row["idn"])
                if got is None:
                    skip += 1
                elif got and truth:
                    tp += 1
                elif not got and not truth:
                    tn += 1
                elif not got and truth:
                    fn += 1
                    print(f"  FALSE ALARM: {book} no.{number}")
                else:
                    fp += 1
                    print(f"  KECOLONGAN : {book} no.{number}")

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
