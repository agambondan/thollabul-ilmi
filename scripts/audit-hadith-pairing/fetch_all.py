import json, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
API = "https://api-thollabul.jangkauin.site"
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")

def fetch(book, page, size=500):
    url = f"{API}/api/v1/hadiths/book/{book}?page={page}&size={size}"
    for _ in range(4):
        try:
            with urllib.request.urlopen(url, timeout=90) as r:
                return json.load(r)
        except Exception:
            continue
    return {"items": []}

def load(book):
    path = os.path.join(CACHE, f"{book}.json")
    if os.path.exists(path):
        return json.load(open(path, encoding="utf-8"))
    first = fetch(book, 1)
    rows = list(first.get("items") or [])
    pages = first.get("total_pages") or 1
    with ThreadPoolExecutor(max_workers=4) as ex:
        for d in ex.map(lambda p: fetch(book, p), range(2, pages + 1)):
            rows.extend(d.get("items") or [])
    out = []
    for h in rows:
        tr = h.get("translation") or {}
        ar, idn, en = tr.get("ar"), tr.get("idn"), tr.get("en")
        out.append({
            "number": h.get("number"),
            "id": h.get("id"),
            "ar": ar if isinstance(ar, str) else "",
            "idn": idn if isinstance(idn, str) else "",
            "en": en if isinstance(en, str) else "",
        })
    out.sort(key=lambda r: r["number"] or 0)
    json.dump(out, open(path, "w", encoding="utf-8"), ensure_ascii=False)
    return out

if __name__ == "__main__":
    for b in sys.argv[1:]:
        rows = load(b)
        empty_ar = sum(1 for r in rows if not r["ar"])
        empty_idn = sum(1 for r in rows if not r["idn"])
        print(f"{b:<12} {len(rows):>6} baris   ar kosong: {empty_ar:<5} idn kosong: {empty_idn}")
