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

# Digraf Latin itu ambigu: "sh" bisa ص/ش (satu huruf) tapi bisa juga س+ح yang
# kebetulan berdampingan seperti pada "Ishaq" (إسحاق). Karena itu satu nama
# Latin dibaca jadi BEBERAPA kemungkinan kerangka, lalu dicocokkan semuanya.
AMBIGUOUS_DIGRAPH = {
    "kh": ["X"],            # خ
    "sy": ["S"],            # ش
    "sh": ["S", None],      # ص/ش, atau س+ح
    "ts": ["T", None],      # ث, atau ت+س
    "th": ["T", None],      # ث, atau ت+ه
    "dz": ["Z", None],      # ذ
    "dh": ["Z", "D", None], # ذ/ظ atau ض
    "dl": ["D", None],      # ض ditulis "dl"
    "gh": ["G"],            # غ
    "zh": ["Z", None],      # ظ
    "ch": ["X"],            # خ
}

LATIN_MAP = {
    "b": "b", "t": "t", "j": "j", "h": "h", "d": "d", "r": "r", "z": "z",
    "s": "s", "g": "g", "f": "f", "q": "q", "k": "k", "l": "l", "m": "m",
    "n": "n", "w": "w", "y": "y", "p": "f", "v": "f", "c": "k", "x": "k",
    "'": "'", "`": "'",
    "X": "x", "S": "s", "T": "t", "Z": "z", "D": "d", "G": "g",
}

MAX_VARIANTS = 12


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

def latin_skeletons(token):
    """Semua kerangka yang mungkin untuk satu nama Latin."""
    t = re.sub(r"[^a-z'`]", "", token.lower())
    if t.startswith("abd"):        # Abdul/Abdullah -> عبد
        t = "abd"

    variants = [""]
    i = 0
    while i < len(t):
        pair = t[i:i + 2]
        options = AMBIGUOUS_DIGRAPH.get(pair)
        if options:
            nxt = []
            for v in variants:
                for opt in options:
                    nxt.append(v + (opt if opt else pair))
            variants = nxt[:MAX_VARIANTS]
            i += 2
        else:
            variants = [v + t[i] for v in variants]
            i += 1

    return {
        _collapse("".join(LATIN_MAP.get(ch, "") for ch in v)).replace("q", "k")
        for v in variants
    }


def latin_skeleton(token):
    """Kerangka utama (tafsiran digraf paling lazim) — untuk penjelasan/log."""
    return sorted(latin_skeletons(token))[0]


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
