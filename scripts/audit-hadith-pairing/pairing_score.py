"""Skor keselarasan satu pasang Arab <-> terjemahan Indonesia.

Berbeda dari rowcheck.check() yang hanya melihat perawi pertama (cukup untuk
sensus cepat), skor ini memeriksa SELURUH nama perawi yang disebut terjemahan
dan menghitung berapa yang benar-benar muncul di teks Arabnya.

Pasangan yang benar hampir selalu mendapat skor tinggi: nama-nama di sanad
memang ada di kedua sisi. Pasangan yang tertukar mendapat skor rendah karena
sanadnya orang yang sama sekali lain. Itu yang membuat skor ini layak dipakai
sebagai gerbang impor.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from translit import ARABIC_WORD, HARAKAT, ar_skeleton, latin_skeletons, similar

CONNECT = {
    "bin", "bint", "binti", "al", "ibnu", "ibn", "ath", "at", "an", "as",
    "ash", "az", "ad", "adz", "abu", "abi", "aba", "dan", "dari", "radliallahu",
    "radliyallahu", "shallallahu", "alaihi", "wasallam", "anhu", "anha",
}

# Kata dalam kurung siku yang bukan nama orang. Terjemahan menulis أبي/عمي/جدي
# sebagai "ayahku"/"pamanku"/"kakekku" -- tidak akan pernah cocok dengan teks
# Arab, jadi kalau ikut dihitung justru menghukum pasangan yang benar.
NOISE = {
    "nya", "beliau", "dia", "mereka", "kami", "aku", "saya", "kalian",
    "ayah", "ayahku", "ayahnya", "bapak", "bapakku", "bapaknya",
    "ibu", "ibuku", "ibunya", "paman", "pamanku", "pamannya",
    "kakek", "kakekku", "kakeknya", "nenek", "nenekku", "neneknya",
    "saudara", "saudaraku", "saudaranya", "anak", "anaknya", "anakku",
    "istri", "istrinya", "suami", "suaminya", "putra", "putranya",
    "putri", "putrinya", "cucu", "cucunya", "budak", "budaknya",
    "maula", "mantan", "seseorang", "seorang", "orang", "guru", "gurunya",
    "temannya", "sahabat", "sahabatnya", "bibi", "bibinya",
}

# Jendela sanad ikut panjang sanadnya: hadis dengan dua jalur (tahwil) punya
# lebih banyak nama dan sanadnya memanjang, sementara hadis berjalur pendek
# tidak boleh diberi jendela lebar supaya nama umum tidak cocok kebetulan.
AR_WINDOW_MIN = 20
AR_WINDOW_PER_NAME = 6


def _bracket_names(idn, limit=8):
    return re.findall(r"\[([^\]]{2,60})\]", idn or "")[:limit]


def _name_tokens(name):
    toks = [re.sub(r"[^A-Za-z'`]", "", t) for t in name.split()]
    return [
        t for t in toks
        if len(t) >= 3 and t.lower() not in CONNECT and t.lower() not in NOISE
    ]


def score(ar, idn, limit=8, ar_window=None):
    """Kembalikan (jumlah_nama_ketemu, jumlah_nama_diperiksa).

    (0, 0) berarti tidak bisa dinilai — terjemahan tanpa nama dalam kurung,
    atau teks Arab kosong.
    """
    if not ar or not idn:
        return 0, 0

    names = []
    for name in _bracket_names(idn, limit):
        tokens = _name_tokens(name)
        cands = [s for t in tokens for s in latin_skeletons(t) if len(s) >= 2]
        if cands:
            names.append(cands)
    if not names:
        return 0, 0

    if ar_window is None:
        ar_window = max(AR_WINDOW_MIN, AR_WINDOW_PER_NAME * len(names))

    # Hanya bagian awal yang dilihat: sanad ada di situ. Kalau seluruh matan
    # ikut dihitung, nama umum bisa cocok secara kebetulan.
    words = ARABIC_WORD.findall(HARAKAT.sub("", ar))[:ar_window]
    ar_words = {s for s in (ar_skeleton(w) for w in words) if len(s) >= 2}
    if not ar_words:
        return 0, 0

    found = sum(
        1 for cands in names
        if any(similar(a, c) for a in ar_words for c in cands)
    )
    return found, len(names)


def ratio(ar, idn):
    found, checked = score(ar, idn)
    return (found / checked) if checked else None
