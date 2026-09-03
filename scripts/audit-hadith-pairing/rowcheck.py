import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from translit import ar_skeleton, latin_skeletons, similar, HARAKAT, ARABIC_WORD

CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")

FUNC = set("""حدثنا حدثني وحدثنا وحدثني أخبرنا أخبرني وأخبرنا وأخبرني اخبرنا اخبرني
قال قالا قالت وقال قالوا أنبأنا انبانا ثنا نا عن وعن بن ابن وابن قرأت على
يعني رضى الله عنه عنها عنهما أنه سمعت سمع رسول صلى عليه وسلم هو إلى لي ح
جميعا كلهم وهو أن أنا حدثناه وحدثناه أخبرناه بهذا الإسناد""".split())
CONNECT = set("""bin bint binti al ibnu ibn ath at an as ash az ad adz dan
radliallahu radliyallahu dia berkata telah""".split())

def head_words(ar, n=4):
    ws = [w for w in ARABIC_WORD.findall(HARAKAT.sub("", ar or "")) if w not in FUNC]
    return ws[:n]

def latin_tokens(idn):
    m = re.search(r"\[([^\]]+)\]", idn or "")
    if not m:
        return []
    toks = [re.sub(r"[^A-Za-z'`]", "", x) for x in m.group(1).split()]
    return [t for t in toks if t and t.lower() not in CONNECT]

def check(ar, idn, n_ar=4, n_lat=3):
    """None = tidak bisa dinilai, True = cocok, False = tidak cocok."""
    lt = latin_tokens(idn)[:n_lat]
    hw = head_words(ar, n_ar)
    if not lt or not hw:
        return None
    ls = [x for t in lt for x in latin_skeletons(t) if len(x) >= 2]
    as_ = [x for x in (ar_skeleton(w) for w in hw) if len(x) >= 2]
    if not ls or not as_:
        return None
    return any(similar(a, b) for a in as_ for b in ls)

def load(book):
    """Ambil dari cache; kalau belum ada, tarik dari API dan simpan."""
    path = os.path.join(CACHE, f"{book}.json")
    if os.path.exists(path):
        return json.load(open(path, encoding="utf-8"))
    from fetch_all import load as fetch_book
    return fetch_book(book)
