# Perbaikan Pasangan Arab ↔ Terjemahan Hadis

Memperbaiki baris hadis yang teks Arabnya milik hadis lain.

## Penyebabnya

`scripts/scrape_all.go` mengunduh edisi Arab, Indonesia, dan Inggris dari
fawazahmed0 sebagai **tiga berkas terpisah**, lalu menjahitnya berdasarkan
nomor hadis. Penomoran ketiga edisi itu tidak identik, jadi sebagian baris
memasangkan sanad Arab satu hadis dengan terjemahan hadis yang lain.

Dua kitab yang tidak lewat jalur itu — Musnad Ahmad dan Sunan Darimi, keduanya
dari gadingnst yang menyimpan `arab` dan `id` dalam satu record — justru paling
bersih. Itu petunjuk yang mengarahkan perbaikan ini.

## Cara memperbaikinya

Sumber gadingnst tidak bisa salah pasang karena Arab dan terjemahannya satu
record. Tapi penomorannya berbeda dengan database (database memakai penomoran
hadits.in) — hanya ~9% nomor bukhari yang sejajar. **Mengganti nomor akan
memutus bookmark, progres baca, hafalan, dan URL yang sudah dibagikan
pengguna**, jadi itu bukan pilihan.

Karena terjemahan di database dan di gadingnst berasal dari terjemahan yang
sama, keduanya dijodohkan lewat **isi teks terjemahan**, bukan nomor:

```
baris database (nomor 6896, terjemahan T)
   -> cari record gadingnst yang terjemahannya sama persis dengan T
   -> ambil teks Arab dari record itu
   -> uji ulang pasangannya; kalau lolos baru dipakai
```

Nomor hadis, terjemahan, dan id record tidak berubah. Yang diganti hanya
`translation.ar`, dan hanya pada baris yang gagal uji.

Penjodohan ini berhasil untuk **seluruh** baris yang punya terjemahan
(31.391 dari 31.391 di tujuh kitab), tanpa satu pun kandidat ambigu.

## Gerbang mutu

Setiap hasil diuji dengan `pairing_score`: berapa persen nama perawi di
terjemahan yang benar-benar muncul di sanad Arabnya. Ambang lolos 0,70 dipilih
dari data berlabel manual — pasangan yang salah tidak pernah melewati 0,60,
jadi ambang ini menyisakan jarak aman.

Yang tidak lolos **tidak ditulis ke berkas perbaikan**. Baris seperti itu masuk
karantina untuk ditinjau manusia. Prinsipnya: lebih baik membiarkan apa adanya
dan menandainya daripada menayangkan yang belum bisa dipastikan.

## Menjalankan

```bash
cd services/api/scripts/repair_hadith_pairing

python3 build_fix.py          # perbaiki pasangan yang tertukar
python3 fill_gaps.py          # isi teks Arab yang kosong + selamatkan karantina
python3 make_sql.py           # ubah jadi SQL yang bisa ditinjau

less out/apply_bukhari.sql    # BACA DULU
psql "$DSN" -f out/apply_bukhari.sql
```

Setiap `apply_*.sql` punya pasangan `rollback_*.sql` yang mengembalikan teks
Arab ke kondisi sebelumnya. Semuanya dalam satu transaksi.

**Ambil dump database dulu sebelum menjalankan apply.** Ini isi agama, dan
rollback berbasis berkas hanya menolong kalau berkasnya masih utuh.

## Keluaran

| Berkas                        | Isi                                           |
| ----------------------------- | --------------------------------------------- |
| `out/fix_<kitab>.json`        | baris yang diperbaiki, lengkap skor lama/baru |
| `out/quarantine_<kitab>.json` | baris yang perlu ditinjau manusia             |
| `out/apply_<kitab>.sql`       | UPDATE dalam satu transaksi                   |
| `out/rollback_<kitab>.sql`    | pembatalannya                                 |
| `out/report.json`             | ringkasan angka                               |

## Mengisi lubang: `fill_gaps.py`

Skrip kedua, untuk baris yang teks Arabnya kosong dan baris karantina.

Sumbernya [Open-Hadith-Data](https://github.com/mhashim6/Open-Hadith-Data) —
sisi Arab dari Ensiklopedi Hadits Kitab 9 Imam, edisi yang sama dengan asal
terjemahan di database ini. Jumlah hadis per kitab **persis sama** dengan skema
hadits.in untuk kesembilan kitab, jadi penomorannya satu skema.

Bukti keselarasan yang dikumpulkan sebelum dipakai:

| Uji                                             | Hasil                 |
| ----------------------------------------------- | --------------------- |
| Jumlah hadis 9 kitab vs skema hadits.in         | sama persis, 9 dari 9 |
| Sepakat dgn Arab Ahmad yang sudah terverifikasi | 4.275 / 4.275 (100%)  |
| Nama di matan cocok, per blok 4.000 nomor       | 26–36%                |
| — pembanding: pasangan yang sudah pasti benar   | 25,8%                 |
| — pembanding: pasangan acak                     | 0,5–4,3%              |

Uji ketiga penting karena verifikasi langsung hanya tersedia di rentang nomor
14.000 ke atas. Metrik matan lemah (pasangan yang pasti benar pun cuma 25,8%),
tapi ia tetap memisahkan dengan tajam dari pasangan acak, dan hasilnya rata di
**semua** blok nomor — termasuk blok yang tidak punya verifikasi langsung sama
sekali.

Yang **tidak** dilakukan skrip ini: menimpa baris yang teks Arabnya sudah lolos
uji. Saat diadu pada 218 baris yang kedua sumbernya berbeda, teks hasil
penjodohan-lewat-terjemahan menang **218 lawan 0**, karena penomoran database
ini campuran dua skema. Jadi sumber ini hanya untuk mengisi yang kosong dan
menyelamatkan yang dikarantina.

Skrip berhenti dengan galat kalau jumlah hadis di berkas sumber tidak sama
dengan yang diharapkan — penjaga supaya perubahan di hulu tidak lewat diam-diam.

## Batasnya

- 65 baris Muslim dan 1 baris Malik nomornya di luar jangkauan sumber mana pun
  (penomoran fawazahmed0 lebih panjang daripada edisi Ensiklopedi).
- Baris yang terjemahannya kosong tidak bisa diuji sama sekali; tidak disentuh.
- Baris karantina yang teks Arab penggantinya pun tidak lolos uji tetap
  dibiarkan apa adanya.
- Gerbang ini memeriksa **sanad**, bukan matan. Pasangan yang sanadnya benar
  tapi matannya tertukar tidak akan tertangkap. Untuk kepastian penuh tetap
  perlu pembacaan oleh orang yang paham hadis.
