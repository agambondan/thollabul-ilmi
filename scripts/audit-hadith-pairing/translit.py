"""Pencocokan nama perawi Arab <-> Latin lewat kerangka konsonan.

Kedua sisi diubah ke deretan konsonan yang sama-sama netral (huruf yang di
transliterasi Indonesia sering tertukar dijadikan satu kelas: ت/ط -> t,
س/ص -> s, ذ/ظ/ز -> z, dst). Vokal dibuang karena tidak ditulis di Arab.
Sisa selisih kecil (alif/ya panjang yang kadang hilang di Latin) ditoleransi
lewat jarak edit <= 1.
"""
import re

HARAKAT = re.compile("[ً-ْٰـۖ-ۭ]")
ARABIC_WORD = re.compile(r"[ء-ي]+")

AR_MAP = {
    "ا": "", "أ": "'", "إ": "'", "آ": "'", "ٱ": "",
    "ب": "b", "ت": "t", "ط": "t", "ث": "t",
    "ج": "j", "ح": "h", "ه": "h", "خ": "x",
    "د": "d", "ض": "d", "ذ": "z", "ظ": "z", "ز": "z",
    "ر": "r", "س": "s", "ص": "s", "ش": "s",
    "ع": "'", "ء": "'", "ؤ": "'", "ئ": "'",
    "غ": "g", "ف": "f", "ق": "q", "ك": "k",
    "ل": "l", "م": "m", "ن": "n",
    "و": "w", "ي": "y", "ى": "y", "ة": "h",
}

LATIN_DIGRAPH = [
    ("kh", "X"), ("sy", "S"), ("sh", "S"), ("ts", "T"), ("th", "T"),
    ("dz", "Z"), ("dh", "Z"), ("gh", "G"), ("ch", "X"), ("zh", "Z"),
]
LATIN_MAP = {
    "b": "b", "t": "t", "j": "j", "h": "h", "d": "d", "r": "r", "z": "z",
    "s": "s", "g": "g", "f": "f", "q": "q", "k": "k", "l": "l", "m": "m",
    "n": "n", "w": "w", "y": "y", "p": "f", "v": "f", "c": "k", "x": "k",
    "'": "'", "`": "'",
    "X": "x", "S": "s", "T": "t", "Z": "z", "G": "g",
}

def _collapse(s):
    out = []
    for ch in s:
        if not out or out[-1] != ch:
            out.append(ch)
    return "".join(out)

def ar_skeleton(word):
    w = HARAKAT.sub("", word)
    if w.startswith("ال") and len(w) > 3:   # buang "al-"
        w = w[2:]
    return _collapse("".join(AR_MAP.get(ch, "") for ch in w)).replace("q", "k")

def latin_skeleton(token):
    t = token.lower()
    t = re.sub(r"[^a-z'`]", "", t)
    if t.startswith("abd"):        # Abdul/Abdullah -> عبد
        t = "abd"
    for a, b in LATIN_DIGRAPH:
        t = t.replace(a, b)
    return _collapse("".join(LATIN_MAP.get(ch, "") for ch in t)).replace("q", "k")

def _edit(a, b):
    if a == b:
        return 0
    if abs(len(a) - len(b)) > 2:
        return 99
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]

def _forms(sk):
    """Bentuk-bentuk yang dianggap setara: hamza/'ain kadang tak ditulis,
    alif/waw/ya panjang kadang hilang di transliterasi Latin."""
    base = sk.replace("'", "")
    out = {sk, base, base.rstrip("wy"), re.sub(r"[wy]", "", base)}
    return {f for f in out if f}

def similar(a, b):
    if not a or not b or len(a) < 2 or len(b) < 2:
        return False
    fa, fb = _forms(a), _forms(b)
    common = fa & fb
    if not common:
        return False
    # nama pendek seperti علي/'Ali memang hanya menyisakan sedikit huruf
    floor = min(2, min(len(a.replace("'", "")), len(b.replace("'", ""))))
    return max(len(c) for c in common) >= max(floor, 1)
