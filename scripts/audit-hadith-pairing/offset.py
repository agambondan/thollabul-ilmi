"""Untuk tiap baris yang ditandai beda, cari apakah terjemahan yang cocok
ada di baris lain di sekitarnya (geseran nomor). Kalau ya, perbaikannya
cukup memasangkan ulang data yang sudah ada."""
import json, os, sys
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rowcheck import load, check

WINDOW = 25
for book in sys.argv[1:]:
    rows = load(book)
    by_idx = {r["number"]: i for i, r in enumerate(rows)}
    flagged = [r for r in rows if check(r["ar"], r["idn"], 3, 2) is False]
    offsets = Counter()
    found = 0
    for r in flagged:
        i = by_idx[r["number"]]
        best = None
        for k in range(-WINDOW, WINDOW + 1):
            if k == 0 or not (0 <= i + k < len(rows)):
                continue
            if check(r["ar"], rows[i + k]["idn"], 3, 2) is True:
                if best is None or abs(k) < abs(best):
                    best = k
        if best is not None:
            found += 1
            offsets[best] += 1
    n = len(flagged)
    print(f"\n=== {book} ===")
    print(f"ditandai beda            : {n}")
    print(f"terjemahan cocok ketemu  : {found} ({found/max(n,1)*100:.1f}%) dalam jarak ±{WINDOW} nomor")
    print(f"tidak ketemu di sekitar  : {n-found} ({(n-found)/max(n,1)*100:.1f}%)")
    print("geseran paling sering    :", ", ".join(f"{k:+d} ({c}x)" for k, c in offsets.most_common(8)))
