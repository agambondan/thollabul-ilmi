# Audit Pasangan Arab ↔ Terjemahan Hadis

Alat untuk memeriksa apakah `translation.ar` dan `translation.idn` pada satu
nomor hadis benar-benar merujuk hadis yang sama.

## Cara kerja

Perawi pertama di sanad dipakai sebagai penanda. Nama versi Arab dan versi
Latin sama-sama diubah jadi **kerangka konsonan** — vokal dibuang (tidak
ditulis di Arab), dan huruf yang di transliterasi Indonesia sering tertukar
disatukan jadi satu kelas:

| Kelas | Huruf Arab | Ditulis Latin |
| ----- | ---------- | ------------- |
| `t`   | ت ط ث      | t, th, ts     |
| `s`   | س ص ش      | s, sh, sy     |
| `z`   | ز ذ ظ      | z, dz, dh     |
| `d`   | د ض        | d             |
| `h`   | ه ح        | h             |
| `x`   | خ          | kh            |
| `'`   | ع ء ؤ ئ    | ' atau hilang |

`مسدد` dan `Musaddad` sama-sama jadi `msd`, jadi cocok. `بشار` jadi `bsr`
sedangkan `Bakar` jadi `bkr`, jadi tidak cocok.

Hamza/'ain dan alif/waw/ya panjang boleh hilang di sisi Latin (`علي` → `'ly`
tetap cocok dengan `'Ali` → `'l`). Selain itu tidak ada toleransi — versi awal
memakai toleransi "beda satu huruf" dan itu membuat `بشار` dianggap `Bakar`.

Nama dibandingkan hanya pada 3 kata Arab pertama lawan 2 token Latin pertama.
Jendela sempit ini penting: dengan jendela lebar, nama umum seperti `عمر` yang
muncul di tengah sanad bisa cocok secara kebetulan.

## Menjalankan

```bash
cd scripts/audit-hadith-pairing
python3 fetch_all.py bukhari muslim      # tarik + cache (cache/ di-gitignore)
python3 validate.py                      # WAJIB: uji ke baris berlabel manual
python3 census.py                        # persentase per kitab
python3 offset.py bukhari muslim         # uji hipotesis geseran nomor
```

`validate.py` adalah pengamannya. Labelnya hasil baca manusia, bukan keluaran
matcher. Jalankan setiap kali `translit.py`, `rowcheck.py`, atau
`pairing_score.py` diubah — kalau akurasinya turun, perubahan itu merusak.

Teks ujinya dibekukan di `labeled_rows.json`, tidak ditarik dari API. Sebagian
baris di sana menyimpan teks Arab **sebelum** perbaikan 2026-09-03, karena itu
contoh pasangan salah yang harus tetap bisa dikenali. Kalau fixture-nya ikut
data hidup, contoh-contoh itu lenyap begitu datanya diperbaiki dan gerbang mutu
ini berubah jadi lampu hijau palsu — persis yang sempat terjadi saat perbaikan
diterapkan.

## Batas alat ini

- Hanya memeriksa **perawi pertama**. Pasangan yang perawi pertamanya kebetulan
  sama tapi matan-nya beda tidak akan tertangkap.
- Huruf tertukar posisi belum ditangani. Contoh nyata: bukhari 4253, Arabnya
  `عثمان` tapi dataset menulis `Ustman` (harusnya `Utsman`) — ditandai beda
  padahal cocok.
- Ketelitian terukur: dari 12 baris bertanda "beda" yang dibaca manual, 11
  memang beda (~92%). Kalikan angka sensus dengan itu untuk perkiraan wajar.
