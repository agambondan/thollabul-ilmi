# Contract Sync Review

Tanggal: `2026-05-13`
Scope: API route, web API client, mobile API client, feature catalog
Status: `RUNTIME_WEB_VERIFIED_DEVICE_PENDING`

## Update Implementasi 2026-05-13

Sudah ditangani pada slice lanjutan:

- `GET /api/v1/ayah/daily` ditambahkan untuk mobile Home.
- `adminSejarahApi` web diarahkan ke kontrak backend `/api/v1/history`.
- Admin quiz mendapat adapter backend `/api/v1/quiz/questions/*` untuk
  list/create/update/delete sesuai payload web saat ini.
- `GET /api/v1/asbabun-nuzul` dan alias `/api/v1/asbabun-nuzul/list`
  ditambahkan untuk table admin.
- `hijriApi.convert` web diarahkan ke `/api/v1/hijri/convert` dengan query
  `year`, `month`, `day`.
- `GET /api/v1/wirid` ditambahkan sebagai alias list dzikir supaya feature
  mobile/web tidak 404.
- Admin static CRUD untuk `wirid`, item `tahlil`, step `manasik`, dan item
  `fiqh` sudah diberi route adapter yang sesuai dengan form admin web.
- Admin Asbabun Nuzul sudah memakai kontrak many-to-many ayah: UI bisa mengirim
  `ayah_refs`/range ayat, backend resolve ke `ayah.id`, dan create/update
  mengganti join table `asbabun_nuzul_ayahs`.
- Admin `fiqh` sudah memakai field `dalil` terpisah dari `source`.
- `GET /api/v1/imsakiyah` kini punya default koordinat Jakarta jika dipanggil
  tanpa `lat/lng`, sehingga feature mobile tidak langsung 400.
- Payload checklist sholat web/mobile dipetakan ke status valid backend:
  `munfarid` untuk selesai dan `missed` untuk belum selesai.

Runtime follow-up:

- Authenticated browser smoke admin Asbabun Nuzul create/update/delete sudah
  `PASS` terhadap source API.
- Docker API sempat stale dan mengembalikan `405 Method Not Allowed` untuk
  `GET /api/v1/asbabun-nuzul`; setelah rebuild API/web, endpoint kembali
  `200 OK`.
- Authenticated Docker API smoke Asbabun Nuzul create/update/delete sudah
  `PASS`.
- Device smoke mobile masih pending karena `adb devices -l` belum menampilkan
  device.

## P0 Findings

### 1. Mobile Home Memanggil Daily Ayah Endpoint Yang Belum Ada

Evidence:

- mobile client memanggil `GET /api/v1/ayah/daily` di
  `apps/mobile/src/api/client.js:248`.
- API route ayah hanya mendaftarkan `/ayah`, `/ayah/:id`, `/ayah/number/:number`,
  `/ayah/surah/number/:number`, `/ayah/page/:page`, dan `/ayah/hizb/:hizb` di
  `services/api/app/http/routes.go:135-144`.
- API sudah punya daily hadith di `services/api/app/http/routes.go:188-192`,
  tetapi tidak ada padanan daily ayah.

Impact:

- Home mobile bisa gagal memuat ayat harian.
- Fallback di UI mungkin menyembunyikan error, sehingga user hanya melihat
  widget kosong atau data tidak konsisten.

Rekomendasi:

- Tambah `GET /api/v1/ayah/daily`, atau ubah mobile agar memakai deterministic
  daily ayah seperti web `DailyAyahWidget`.
- Tambahkan contract test untuk daily ayah dan daily hadith.

Status: `FIXED` pada slice lanjutan.

### 2. Web Admin Memakai Endpoint Sejarah Yang Berbeda Dari API

Evidence:

- web admin memakai `/api/v1/sejarah` di `apps/web/src/lib/api.js:450-454`.
- API mendaftarkan history sebagai `/api/v1/history` di
  `services/api/app/http/routes.go:429-434`.
- mobile feature catalog sudah memakai `/api/v1/history` di
  `apps/mobile/src/data/mobileFeatures.js:89-95`.

Impact:

- halaman admin sejarah bisa kosong atau gagal CRUD.
- web publik/mobile dan admin tidak mengelola dataset yang sama secara kontrak.

Rekomendasi:

- Ubah `adminSejarahApi` ke `/api/v1/history`.
- Pertimbangkan alias backend `/sejarah` hanya jika sudah ada URL publik lama
  yang perlu dipertahankan.

Status: `FIXED` pada slice lanjutan.

### 3. Web Admin Quiz Memakai Path Yang Tidak Ada

Evidence:

- web admin memakai `/api/v1/quiz/questions/all`,
  `/api/v1/quiz/questions`, dan `/api/v1/quiz/questions/:id` di
  `apps/web/src/lib/api.js:443-447`.
- API route quiz yang tersedia adalah `/quiz/session`, `/quiz/submit`,
  `/quiz/stats`, `POST /quiz`, dan `DELETE /quiz/:id` di
  `services/api/app/http/routes.go:441-446`.

Impact:

- list/create/update/delete quiz di admin berisiko tidak jalan.
- API belum punya update route untuk quiz item, sedangkan UI admin menyediakan
  edit.

Rekomendasi:

- Putuskan kontrak admin quiz:
    - opsi API: tambah `/quiz/questions/*`.
    - opsi frontend: ganti ke `/quiz` untuk create/delete dan hilangkan edit
      sampai backend tersedia.
- Tambahkan route test admin quiz.

Status: `FIXED` untuk kontrak route dan adapter payload admin web.

### 4. Admin CRUD Static Content Lebih Luas Dari API

Evidence:

- web admin client menyediakan CRUD untuk wirid, tahlil, manasik, dan fiqh di
  `apps/web/src/lib/api.js:464-489`.
- API hanya menyediakan `GET /tahlil` dan `GET /tahlil/:id` di
  `services/api/app/http/routes.go:386-388`.
- API hanya menyediakan `GET /manasik`, `GET /manasik/:type`, dan
  `GET /manasik/:type/:step` di `services/api/app/http/routes.go:436-439`.
- API tidak punya `GET /wirid`; yang ada hanya
  `GET /wirid/occasion/:occasion` di `services/api/app/http/routes.go:397-398`.
- API fiqh membedakan category route dan item route di
  `services/api/app/http/routes.go:371-384`, tetapi web admin memakai generic
  `/fiqh/:id` untuk update/delete di `apps/web/src/lib/api.js:485-489`.

Impact:

- Admin UI memberi kesan CMS lengkap, tetapi sebagian tombol dapat gagal.
- Mobile feature `Wirid` juga memakai `/api/v1/wirid` di
  `apps/mobile/src/data/mobileFeatures.js:21-25`, sehingga user bisa membuka
  fitur yang endpoint-nya tidak ada.

Rekomendasi:

- Untuk konten static seeded, pilih salah satu:
    - jadikan admin benar-benar read-only, atau
    - tambahkan CRUD backend yang sesuai.
- Tambah endpoint `GET /wirid` atau ubah mobile/web ke endpoint occasion yang
  jelas.
- Pisahkan API client `fiqhCategoryAdminApi` dan `fiqhItemAdminApi`.

Status: `FIXED_FOR_ADMIN_CONTRACT` untuk route dan payload web admin saat ini.
Catatan: `fiqh.dalil` sudah memakai field model/API terpisah dari `source`.

### 5. Asbabun Nuzul Admin List Path Tidak Ada

Evidence:

- web admin client memakai `/api/v1/asbabun-nuzul/list` di
  `apps/web/src/lib/api.js:457-458`.
- API route asbabun nuzul hanya menyediakan lookup by ayah/surah plus
  create/update/delete di `services/api/app/http/routes.go:507-512`.

Impact:

- admin asbabun nuzul tidak punya list source untuk table awal.

Rekomendasi:

- Tambahkan `GET /api/v1/asbabun-nuzul` atau ubah admin list agar memakai query
  by surah/ayah dengan filter eksplisit.

Status: `FIXED` untuk list source admin dan form create/update many-to-many
`Ayahs`.

### 6. Hijri Convert Client Tidak Sesuai Dengan Controller

Evidence:

- web client `hijriApi.convert` memakai `/api/v1/hijri?date=...`.
- API controller meminta route `/hijri/convert` dengan query `year`, `month`,
  dan `day` di `services/api/app/http/routes.go:501-505`.

Impact:

- fitur convert hijri rawan gagal jika memakai helper ini.

Rekomendasi:

- Ubah web client ke `/api/v1/hijri/convert?year=YYYY&month=M&day=D`.
- Tambahkan helper yang menerima `Date` dan menghasilkan query controller.

Status: `FIXED` untuk helper string `YYYY-MM-DD` yang dipakai UI saat ini.

## P1 Findings

### 7. Imsakiyah Mobile Feature Tidak Mengirim Lat/Lng

Evidence:

- mobile feature catalog memakai endpoint statis `/api/v1/imsakiyah`.
- API `GetImsakiyah` memanggil parser lat/lng dan akan bad request jika query
  `lat` dan `lng` kosong.

Impact:

- fitur Imsakiyah di Belajar/Ibadah bisa terlihat tersedia tetapi gagal saat
  dibuka.

Rekomendasi:

- Jadikan Imsakiyah tool lokal yang meminta lokasi dulu, seperti Prayer screen.
- Atau beri default city/coordinate yang jelas di endpoint frontend.

Status: `FIXED_WITH_DEFAULT` memakai koordinat Jakarta di backend jika query
`lat/lng` kosong.

### 8. Payload Sholat Tidak Seragam

Evidence:

- API model menerima `{ date, prayer, status }` dengan status
  `berjamaah|munfarid|qadha|missed`.
- mobile Prayer screen memakai status valid.
- mobile Explore sholat tracker memakai status `done` saat selesai.
- web dashboard sholat tracker mengirim object seluruh checklist ke
  `sholatTrackerApi.update`.

Impact:

- data sholat dari feature yang berbeda bisa masuk dengan bentuk berbeda.
- statistik backend dapat salah karena status di luar enum tidak dihitung.

Rekomendasi:

- Buat satu shared contract sholat di web/mobile.
- Untuk checklist sederhana, map checked ke `munfarid` atau minta user memilih
  status.
- Backend sebaiknya validasi enum sebelum save.

Status: `FIXED_FOR_CHECKLIST` pada web dashboard dan mobile Explore. Mobile
Prayer tetap memakai status detail yang sudah valid.

## Contract Gate Yang Disarankan

1. Buat daftar endpoint yang dipakai `apps/web/src/lib/api.js`,
   `apps/mobile/src/api/*.js`, dan `apps/mobile/src/data/mobileFeatures.js`.
2. Buat test yang membandingkan daftar tersebut dengan route Fiber.
3. Tambahkan smoke API minimal untuk endpoint P0:
    - daily ayah
    - history/sejarah admin
    - quiz admin
    - wirid/tahlil/manasik/fiqh admin
    - asbabun nuzul admin list
    - hijri convert
    - imsakiyah with coordinates
