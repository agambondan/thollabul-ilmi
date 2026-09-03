import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rowcheck import load, check

BOOKS = ["bukhari","muslim","abudaud","tirmidzi","nasai","ibnumajah","malik","darimi","ahmad"]
N_AR, N_LAT = 3, 2
out = {}
print(f"{'kitab':<12}{'baris':>7}{'dinilai':>9}{'cocok':>8}{'beda':>7}{'% beda':>9}{'tak dinilai':>13}")
for b in BOOKS:
    rows = load(b)
    ok = bad = skip = 0
    flagged = []
    for r in rows:
        v = check(r["ar"], r["idn"], N_AR, N_LAT)
        if v is None: skip += 1
        elif v: ok += 1
        else:
            bad += 1
            flagged.append(r["number"])
    judged = ok + bad
    pct = bad / judged * 100 if judged else 0
    print(f"{b:<12}{len(rows):>7}{judged:>9}{ok:>8}{bad:>7}{pct:>8.1f}%{skip:>13}")
    out[b] = {"total": len(rows), "judged": judged, "ok": ok, "bad": bad,
              "skipped": skip, "pct": round(pct, 2), "flagged": flagged}
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "census.json"), "w"), ensure_ascii=False)
