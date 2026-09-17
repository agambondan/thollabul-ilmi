# Review Rencana Sinkronisasi Musnad Ahmad

Tanggal: `2026-09-17`
Scope: rencana sinkronisasi Arab Musnad Ahmad (JSON lokal → SQL backfill → upsert PostgreSQL)
Status: `RENCANA, BELUM DIEKSEKUSI`

Rencana yang direview:

1. JSON lokal (`services/api/data/hadits_ahmad.json`) jadi source of truth: 26.363
   hadis, nomor unik 1–26.363, terjemahan dianggap lebih benar.
2. SQL punya nomor yang sama + Arab lengkap, tapi terjemahannya bercampur sanad
   sehingga tidak dipakai.
3. Backfill Arab dari SQL hanya berdasarkan nomor hadis; Arab JSON yang sudah
   terisi tidak ditimpa.
4. Setelah JSON final, upsert ke PostgreSQL; overwrite `ar`/`idn`/`en` hanya
   kalau field JSON tidak kosong.

---

## Ringkasan

Rencana ini menyentuh field yang sama dengan yang sudah pernah diperbaiki di
produksi. Sebelum eksekusi, dua hal wajib dicek dulu karena berpotensi
**menimpa balik perbaikan yang sudah ada**, bukan cuma isu kualitas data baru:

- JSON lokal saat ini kemungkinan **lebih basi** dari database produksi untuk
  field yang sama.
- Backfill "hanya berdasarkan nomor" adalah pola persis yang sudah pernah
  menyebabkan ~3.800 baris salah pasang di kitab lain — Musnad Ahmad selama ini
  selamat dari masalah itu justru **karena** Arab dan terjemahannya berasal
  dari satu record yang sama, bukan dijodohkan lewat nomor.

## Temuan

### 1. (Kritis) JSON lokal kemungkinan basi vs. produksi — arah overwrite bisa kebalik

`docs/reviews/2026-09-03-audit-pasangan-hadis.md` (status **SUDAH DITERAPKAN DI
PRODUKSI 2026-09-03**) mencatat Musnad Ahmad saat itu: 21.588 dari 25.863 baris
(83%) tanpa teks Arab, dan perbaikannya (`out/apply_gapfill_ahmad.sql`, 21.598
baris UPDATE + `apply_gapfill_ahmad_sisa.sql` 476 baris + `apply_rescue_ahmad.sql`
50 baris) sudah dibuat dan ditandai diterapkan.

Dicek hari ini, `hadits_ahmad.json` punya 26.363 baris dengan **22.058 (83,7%)**
`ar` kosong — rasio kosongnya nyaris identik dengan kondisi _sebelum_ perbaikan
9 Sep, bukan sesudahnya. Artinya JSON lokal ini kemungkinan besar **tidak**
mencerminkan gapfill yang sudah jalan di database.

Kalau ini benar, rencana "upsert overwrite `ar` hanya jika JSON tidak kosong"
justru berbahaya begitu langkah 3 (backfill Arab dari SQL baru) mengisi
sel-sel yang di JSON masih kosong itu: sel yang tadinya kosong (jadi tidak akan
menimpa apa pun) berubah jadi terisi, dan upsert akan **menimpa Arab yang sudah
benar dan sudah diverifikasi di database** dengan Arab dari sumber SQL baru
yang provenance-nya belum diverifikasi sama sekali.

**Sebelum langkah 3 dijalankan:** diff dulu `hadits_ahmad.json` terhadap
`translation.ar` produksi untuk seluruh baris Ahmad. Untuk baris yang di
database sudah terisi (hasil gapfill 9 Sep, sumbernya Open-Hadith-Data yang
sudah lolos uji silang 4.275/4.275 di zona overlap — lihat
`services/api/scripts/repair_hadith_pairing/README.md`), pakai itu sebagai
sumber backfill JSON, bukan SQL baru yang belum diketahui asal-usulnya. SQL
baru hanya relevan untuk baris yang di database pun masih kosong.

### 1b. (Update) Sumber SQL sudah dikonfirmasi: `irsyadulibad/hadits-database` (carihadis.com)

Dicek ke GitHub: repo ini SQL dump "Database Hadits Terjemahan Indonesia",
sumber [carihadis.com](https://carihadis.com), dan mencantumkan **Musnad Ahmad:
26.363 hadits** — sama persis dengan total baris di `hadits_ahmad.json` saat
ini. Kecocokan angka non-bulat sebesar ini kecil kemungkinan kebetulan, jadi
kemungkinan besar `hadits_ahmad.json` memang sudah pernah di-generate dari
sumber carihadis.com yang sama (atau turunannya), dan yang hilang saat itu
cuma kolom Arabnya — bukan dua dataset independen yang perlu dijodohkan buta.
Ini **menurunkan** risiko di Temuan 2 di bawah (kemungkinan salah edisi/skema
lebih kecil dari yang tadinya saya kira), tapi belum menghilangkannya —
"total sama" bukan bukti "per-baris sama", terutama karena database produksi
sendiri memakai sumber Arab **berbeda** (gadingnst, bukan carihadis.com) untuk
gapfill 9 Sep. Tetap perlu spot-check isi (bukan cuma hitung baris) sebelum
dipercaya penuh, dan sebaiknya dibandingkan juga dengan hasil gapfill 9 Sep
untuk baris yang tumpang tindih (Temuan 1) — kalau carihadis.com dan gadingnst
sepakat pada baris yang sama, itu bukti kuat; kalau beda, butuh keputusan mana
yang dipakai, bukan salah satu menang begitu saja karena "datang belakangan".

README repo GitHub-nya sendiri tidak menjelaskan skema tabel maupun apakah
Arab dan terjemahan berasal dari record yang sama atau file terpisah — jadi
klaim "SQL Arabnya lengkap, terjemahannya bercampur sanad" di rencana awal
perlu dicek langsung ke isi SQL-nya, bukan diasumsikan dari nama repo.

### 2. (Kritis, direvisi turun jadi Sedang-Tinggi) Backfill "hanya berdasarkan nomor" tetap butuh gerbang isi, walau risiko edisi kini lebih kecil

[[project_hadith_data_misalignment]] — audit 3 Sep menyimpulkan tegas bahwa
menjodohkan Arab↔terjemahan lewat nomor hadis **bukan** cara yang aman:
menggeser seluruh terjemahan `k` nomor menjatuhkan kecocokan dari 75–89% ke
11–21% (setara kebetulan), artinya penomoran dua sumber independen tidak bisa
diasumsikan sejajar tanpa bukti, walau angka awal dan akhirnya sama-sama masuk
akal.

Musnad Ahmad memang lolos dari masalah pasang-ulang di kitab lain, tapi
alasannya spesifik: sumber gadingnst menyimpan Arab dan terjemahan **dalam satu
record**, jadi tidak pernah dijodongkan lewat nomor sama sekali (lihat
`repair_hadith_pairing/README.md`, "dua kitab yang tidak lewat jalur itu ...
justru paling bersih"). Begitu Arab-nya diganti sumber baru yang dijodohkan
murni lewat angka 1–26.363, Ahmad kehilangan proteksi itu dan mewarisi risiko
persis yang sudah terbukti nyata di Bukhari/Muslim/dll — termasuk risiko lebih
besar karena Musnad Ahmad punya riwayat penomoran yang berbeda-beda antar
edisi cetak (mis. edisi Ahmad Syakir vs edisi yang dipakai software semacam
Syamela/dorar.net). Kalau SQL baru memakai edisi/skema penomoran yang berbeda
dari yang dipakai JSON, hasilnya akan terlihat identik dengan pasangan yang
benar (nomor 1..26.363 sama-sama lengkap di kedua sisi) padahal isinya salah
sanad — bug ini tidak akan kelihatan dari sekadar hitung baris.

**Mitigasi minimum sebelum backfill dijalankan:**

- Konfirmasi SQL baru pakai skema penomoran yang sama dengan JSON/database
  (bukan cuma total barisnya kebetulan 26.363) — cek beberapa titik acak di
  awal/tengah/akhir rentang, bandingkan nama perawi pertama di Arab SQL dengan
  nama perawi di terjemahan JSON pada nomor yang sama.
- Pakai gerbang mutu yang sudah ada di repo ini, jangan skip: adaptasi
  `scripts/audit-hadith-pairing/pairing_score.py` (ambang 0,70, dari perawi
  pertama) atau pola `idn_token_coverage` + verdict `match` di
  `services/api/scripts/backfill_hadisku_arabic.go`. Backfill nomor-ke-nomor
  tanpa gerbang isi persis pola yang sudah pernah gagal.
- Sebutkan sumber SQL secara eksplisit (nama, edisi, tanggal ambil) — sesuai
  aturan project [[feedback_islamic_data_sahih_only]]: data agama wajib sumber
  yang bisa diverifikasi, bukan dump tak bernama.

### 3. (Sedang) "Tidak overwrite Arab JSON yang sudah terisi" hanya menambal lubang, tidak memperbaiki yang sudah salah

Aturan ini konsisten dengan pola yang sudah ada (`backfill_hadisku_arabic.go`
juga "never overwrite existing text"), jadi arahnya sudah benar. Tapi perlu
eksplisit di rencana: langkah ini murni **gap-fill**, bukan **koreksi**. Audit 3
Sep hanya bisa menilai 4.268 dari 25.863 baris Ahmad (sisanya kosong sehingga
tak bisa dinilai), dan dari yang bisa dinilai itu ~3,7% (159 baris) sudah
ditandai beda. Baris-baris itu punya Arab yang **terisi tapi berpotensi salah**
— backfill nomor-ke-nomor ini by design tidak akan menyentuhnya sama sekali.
Setelah JSON final, jalankan `pairing_score`/`census.py` khusus Ahmad untuk
tahu kualitas riilnya, jangan cuma ukur tingkat keterisian.

### 4. (Sedang) Belum ada tooling upsert-dengan-overwrite untuk hadis di repo ini

`services/api/scripts/import_hadits.go` (`createHadith`, baris 291–329) yang
selama ini jadi importer `hadits_*.json` → Postgres sifatnya **insert-only**:
kalau `(number, book_id)` sudah ada, baris di-skip total, field yang ada di DB
tidak pernah disentuh (baris 292–298). Jadi "upsert overwrite `ar`/`idn`/`en`
kalau JSON tidak kosong" adalah **perilaku baru yang belum ada presedennya** di
importer ini — perlu ditulis dari nol atau importer-nya diubah, bukan asumsi
bahwa mekanisme ini sudah teruji.

Karena ini menyentuh 26.363 baris data agama produksi, ikuti disiplin yang
sudah dipakai di `repair_hadith_pairing/` (satu-satunya alur upsert hadis yang
pernah dijalankan di repo ini): hasilkan SQL yang bisa dibaca manusia dulu
(`out/apply_*.sql` + `out/rollback_*.sql` berpasangan, satu transaksi, `less`
sebelum `psql -f`), bukan upsert langsung dari kode aplikasi tanpa preview.
**Ambil dump database dulu** sebelum apply — ini konten agama, dan rollback
berbasis berkas cuma menolong kalau berkasnya masih ada.

### 5. (Rendah) Pastikan kunci upsert tidak menggeser nomor atau menduplikasi baris

`repair_hadith_pairing/README.md` sudah menetapkan aturan keras: nomor hadis
tidak boleh berubah karena jadi kunci bookmark, progress baca, hafalan, dan URL
yang sudah dibagikan pengguna. Sebelum upsert jalan:

- Konfirmasi jumlah baris Ahmad di database saat ini benar-benar 26.363 dan
  sejajar 1:1 dengan `number` di JSON. Kalau beda (mis. database masih di
  25.863 lama), upsert-by-number bisa membuat baris baru alih-alih meng-update
  yang ada, atau sebaliknya melewatkan baris yang seharusnya baru.
- Kunci upsert eksplisit ke `(book_id, number)`, bukan asumsi urutan array.

## Rekomendasi Urutan Eksekusi

1. Diff `hadits_ahmad.json` vs `translation.ar` produksi (per nomor) — hasilkan
   laporan jumlah baris yang (a) sama, (b) DB terisi tapi JSON kosong, (c) JSON
   kosong dan DB juga kosong, (d) keduanya terisi tapi beda teks.
2. Untuk kelompok (b): tarik dari DB ke JSON dulu (bukan SQL baru) — ini
   memulihkan gapfill 9 Sep yang sudah tervalidasi.
3. Untuk kelompok (c): baru pakai SQL baru, dengan gerbang validasi isi
   (pairing_score/narrator match), bukan nomor polos. Sebutkan sumber SQL.
4. Untuk kelompok (d): jangan diam-diam pilih salah satu — ini kandidat kuat
   mismatch, masukkan ke tinjauan manual seperti pola karantina di
   `repair_hadith_pairing`.
5. Baru setelah JSON final dan lolos gerbang mutu, buat SQL upsert yang bisa
   direview (pola `apply_*.sql`/`rollback_*.sql`), ambil dump DB, baca dulu,
   baru jalankan.

## Referensi

- `docs/reviews/2026-09-03-audit-pasangan-hadis.md` — audit asal + status
  "SUDAH DITERAPKAN DI PRODUKSI"
- `services/api/scripts/repair_hadith_pairing/README.md` — pola perbaikan Arab
  yang sudah dipakai, termasuk aturan dump-dulu dan larangan ganti nomor
- `scripts/audit-hadith-pairing/README.md` — alat ukur kecocokan Arab↔terjemahan
- `services/api/scripts/backfill_hadisku_arabic.go` — presedan backfill Arab
  yang aman (guarded by compare verdict, tidak pernah menimpa yang terisi)
- `services/api/scripts/import_hadits.go:291-329` — importer saat ini bersifat
  insert-only, bukan upsert
