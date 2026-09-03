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

python3 build_fix.py          # susun perbaikan + karantina (tidak menyentuh DB)
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

## Batasnya

- Ahmad dan Darimi tidak ikut: keduanya sudah dari gadingnst dan penomorannya
  sudah sejajar. Masalah Ahmad berbeda — 21.588 barisnya tidak punya teks Arab
  sama sekali, dan gadingnst hanya punya 4.305 baris, jadi tidak bisa ditambal
  dari sini.
- 1.422 baris dikarantina karena terjemahannya kosong; tidak ada yang bisa
  dijadikan pegangan untuk menguji.
- 1.381 baris dikarantina karena teks Arab penggantinya pun tidak lolos uji.
- Gerbang ini memeriksa **sanad**, bukan matan. Pasangan yang sanadnya benar
  tapi matannya tertukar tidak akan tertangkap. Untuk kepastian penuh tetap
  perlu pembacaan oleh orang yang paham hadis.
