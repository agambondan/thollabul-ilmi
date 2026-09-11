# Deep Review — Fitur Belum Selesai & Kualitas Data Seeding

Tanggal: `2026-09-12`
Scope: seluruh monorepo (`services/api`, `apps/web`, `apps/mobile`) + dokumentasi status
Status: `SELESAI` — riset murni, belum ada perbaikan kode untuk temuan di dokumen ini (kecuali yang eksplisit disebut sudah di-commit sebelumnya)

Dipicu permintaan user: "kira kira apalagi yang kurang dari project ini, feature yang belum
selesai atau data seeding yang masih belum bener." Direview lewat 3 jalur riset paralel (feature
backlog, kualitas data seeding, gap teknis/integrasi) lalu diverifikasi ulang sebagian temuan
secara independen sebelum ditulis di sini.

---

## Ringkasan Eksekutif

Kabar baik dulu: fondasi produk ini **sudah sangat lengkap** — hampir semua item di
`docs/api/roadmap-status.md` dan `docs/api/feature-gap-analysis.md` (per Mei 2026) sudah beres,
dan banyak yang dicap "❌ missing" di Mei 2026 ternyata sudah digarap diam-diam sejak itu
(adhango, Web Push/VAPID, Leaflet map, recharts). `go test ./...` di `services/api` **hijau
semua**, tidak ada test yang currently broken.

Tapi ada 3 kategori masalah nyata:

1. **Data seed dengan URL eksternal yang tidak pernah diverifikasi** — pola yang sama persis
   dengan bug masjid/radio yang baru saja diperbaiki hari ini **juga ada di seeder audio surah**
   (8 dari 10 qori link-nya 404). Kemungkinan ini adalah kelas bug yang berulang di project ini.
2. **Dokumentasi status basi** — ~20 dari 24 file di `docs/features/progress/` sebenarnya sudah
   `VERIFIED`/`completed` dan seharusnya sudah pindah ke `done/`, membuat backlog terlihat jauh
   lebih besar dari kenyataan. Sebaliknya, checklist review 59-item di
   `2026-09-08-feature-route-inventory.md` **97% belum di-centang** — bukan berarti semuanya
   rusak, tapi belum ada yang benar-benar duduk mengecek satu-satu.
3. **Gap fitur yang genuinely masih kurang**: semantic search kajian masih hash-based (bukan
   embedding beneran), harga emas zakat pakai angka hardcode (bukan live), server push notifikasi
   tidak menghormati toggle off per-user, dan beberapa integrasi eksternal dari spec awal
   (Meilisearch, Nominatim, frankfurter.app) memang belum ada sama sekali.

---

## 1. Bug Data Seeding — Prioritas Tertinggi

### 1.1 Audio surah (`SurahAudio`) — 8 dari 10 qori link mati (CONFIRMED, diverifikasi ulang)

`services/api/app/db/migrations/seeder_audio.go` menyimpan slug qori untuk
`download.quranicaudio.com/quran/<slug>/<nomor-surah>.mp3`. Slug-nya memakai backtick (`` ` ``)
untuk transliterasi huruf ain/hamzah, contoh:

```go
QuranicAudio: "mishaari_raashid_al-`afaasee",   // 404
QuranicAudio: "sa`d_al-ghaamidi",                // 404
```

Diverifikasi ulang independen (curl langsung, bukan cuma percaya laporan agent):

| Qori (seeded slug)                                      | HTTP  |
| --------------------------------------------------------- | ----- |
| `mishaari_raashid_al-`afaasee`` (Alafasy)                | 404   |
| `abdurrahmaan_as-sudays`                                   | ✅ 200 |
| `abdul_basit`                                              | 404   |
| `` sa`d_al-ghaamidi `` (Al-Ghamidi)                        | 404   |
| `yaasir_ad-dusaari` (Ad-Dosari)                             | 404   |

Slug yang benar-benar jalan (dicoba manual): Alafasy → `mishaari_raashid_al_3afaasee` (200), Abdul
Basit murattal → `abdul_basit_murattal` (200) — pola quranicaudio.com pakai angka `3` (gaya Arabic
chat alphabet) untuk huruf ain, bukan backtick. 6 qori sisanya (Al-Ghamidi, Ad-Dosari,
Al-Muaiqly, Ar-Rifai, Bukhatir, Al-Juhany, Al-Hudhaify) belum ketemu slug penggantinya — perlu
riset satu-satu ke quranicaudio.com sebelum diperbaiki (JANGAN nebak pola yang sama untuk semua,
sudah terbukti tidak seragam).

**Dampak**: audio player full-surah (`SurahAudioPlayer.js`) rusak untuk ~80% pilihan qori di
dropdown — user pilih qori lain selain As-Sudais, audio tidak akan muncul/gagal play.

Catatan: audio **per-ayat** (`AyahAudio`, dari everyayah.com) sudah dicek dan semua 10 qori-nya
jalan normal (200, `audio/mpeg`) — bug ini spesifik ke tabel `SurahAudio`/quranicaudio.com saja.

### 1.2 Hadis Arab ↔ terjemahan — sudah diperbaiki 2026-09-03, sisa gap kecil masih terbuka

Bug lama (~3.800 baris salah pasang, didokumentasikan di
[`2026-09-03-audit-pasangan-hadis.md`](./2026-09-03-audit-pasangan-hadis.md)) **sudah diperbaiki**
hari yang sama lewat commit bertahap (perbaikan 3.631 baris berdasar pencocokan konten, lalu isi
21.742 teks Arab kosong dari sumber Open-Hadith-Data, divalidasi silang 218/218 cocok dengan hasil
sebelumnya). Tidak ada regresi sejak itu.

Sisa yang masih terbuka (bukan bug tersembunyi — sudah dilaporkan apa adanya di dokumen aslinya):

- 65 baris masih tanpa teks Arab (nomor di luar jangkauan semua sumber yang diketahui)
- 1.422 baris masih tanpa terjemahan Indonesia
- ~640 baris di-karantina menunggu review manusia manual

### 1.3 Seeder lain — sudah dicek sampel, tidak ada tanda fabrikasi

`seeder_asbabun_nuzul_data.go` (350 entri, sampel ~15 dicek), `seeder_hadith_grade.go`,
`seeder_lessons.go`, `seeder_related.go`, `seeder_tier3.go`, `seeder_tier4*.go`,
`seeder_translations.go`, `seeder_ilmu_rijal.go` — semua mengutip sumber spesifik (nomor hadis +
kitab + derajat) dan tidak menunjukkan tanda data invented. `seeder_library_books.go` link ke
sunnah.com yang di-block Cloudflare untuk curl (bukan bukti link mati, konsisten dengan temuan
audit hadis sebelumnya soal hadits.in).

Pipeline kajian (transkrip ceramah) — histori 2x fabrikasi (2026-09-08, 2026-09-11) **tidak
terulang ketiga kalinya**. Yang ditemukan malah bug berbeda: commit `576a830e` (2026-09-11)
menemukan `--dump-json` di scraper diam-diam masuk mode simulate sehingga subtitle tidak
ke-download selama ~1 jam (677 video salah ke-cache sebagai "tidak ada transkrip") — ketahuan
sendiri lewat monitoring (0/677 sukses), langsung di-purge sebelum sempat mencemari data.

### 1.4 Rekomendasi proses

Ini sudah 2 seeder (radio, sekarang audio) ketahuan pakai URL eksternal yang **tidak pernah
di-curl-verify** sebelum di-commit. Sebelum menambah seeder baru dengan URL CDN/streaming
eksternal, wajib curl-check tiap URL (2xx + content-type yang sesuai) sebelum masuk kode — pola
yang sudah dipakai untuk perbaikan masjid/radio hari ini.

---

## 2. Status Fitur — Backlog vs Kenyataan

### 2.1 Dokumen `docs/features/progress/` sebagian besar sudah sebenarnya selesai

Dari 24 file, ~20 berstatus `VERIFIED`/`completed` di dalam dokumennya sendiri dan sudah
diverifikasi ulang di sesi ini terhadap kode aktual — seharusnya dipindah ke `docs/features/done/`
tapi belum, sehingga folder `progress/` terlihat seperti backlog besar padahal isinya arsip:

- 2026-05-13-contract-sync-p0.md, 2026-05-14-tafsir-data-rendering.md,
  2026-05-17-followup-journey-cta-task-breakdown.md, 2026-05-17-sync-performance-task-breakdown.md,
  2026-05-18-admin-dashboard-journey.md, 2026-05-24-mobile-web-app-layout-impact-plan.md,
  2026-05-24-web-mobile-runtime-sync.md, seluruh 6 file `2026-05-30-mobile-web-app-*-theme/route.md`,
  mobile-feature-catalog-hardening.md, mobile-global-search-v2.md, mobile-smart-notifications.md,
  2026-09-08-masjid-radio-islamic-directory.md (tinggal smoke test device fisik, bukan gap kode).

File todo satu-satunya, `docs/features/todo/peta-sirah-faraidh-visual.md`, ternyata **statusnya
sendiri sudah DONE** — peta interaktif Leaflet/OSM sudah ada di `apps/web/src/app/peta/MapComponent.js`.
Salah folder, bukan gap fitur.

### 2.2 Yang genuinely masih ada kerjaan (bukan cuma dokumen basi)

| Item | Detail |
| --- | --- |
| **Semantic search kajian masih hash-based** | `docs/features/progress/2026-09-09-semantic-search-islamic-rag.md` — `LocalHashProvider` dipakai, bukan embedding semantik beneran. Pencarian makna lintas kosakata (mis. cari "zakat penerima" dapat hasil soal "mustahik") tidak reliable. Ini gap fungsional paling terlihat user dari semua yang direview. |
| **Push notifikasi tidak menghormati toggle off per-user** | `DispatchDueAdzanPush` (server push) mengirim ke semua token aktif tanpa mengecek preferensi `notifAdzan` user — matikan notifikasi di app tidak benar-benar menghentikan push dari server. |
| **Verifikasi device fisik menumpuk** | Custom adzan audio offline, push notification, gesture Quran reader mobile, shared component system, search & discovery mobile — semua **kodenya selesai** tapi belum pernah dicoba di device fisik asli (terhambat izin ADB/MIUI berulang kali, tidak pernah diselesaikan). |
| **Checklist review 59 fitur baru 2/59 tercentang** | `docs/reviews/2026-09-08-feature-route-inventory.md` §4 — cuma Masjid & Radio Islamic yang sudah direview manual (hari ini). 57 baris lain belum pernah ada yang duduk mengecek. Bukan berarti rusak, tapi belum ada bukti tervalidasi. |
| **Dark theme mobile app-wide** | `apps/mobile/src/theme.js` cuma object statis, tidak ada `ThemeProvider`/`useTheme` yang benar-benar drive rendering — preferensi tersimpan tapi tidak mempengaruhi tampilan. |
| **Offline PWA di web** | Tidak ada `next-pwa`, service worker, atau `manifest.json` untuk offline web — gap struktural dari follow-up parity Mei 2026, masih terbuka. |

---

## 3. Gap Teknis / Integrasi Eksternal (Update dari `feature-gap-analysis.md` §3.16)

Dokumen `docs/api/feature-gap-analysis.md` terakhir update Mei 2026 (4 bulan basi). Re-verifikasi
terhadap kode sekarang:

| Item | Status Mei 2026 | Status 2026-09-12 (diverifikasi) |
| --- | --- | --- |
| `adhango` (kalkulasi sholat) | ❌ belum dipakai | ✅ **sudah dipakai** — opsi `method=adhango` di `prayer_times_service.go` |
| Web Push (VAPID) | ❌ belum | ✅ **sudah aktif** — `webpush-go` wired, route push-token/push-test ada |
| Leaflet/`react-leaflet` (peta) | ❌ belum | ✅ **sudah ada** — `/peta` dan `MasjidMapComponent.js` |
| `recharts` (chart statistik) | ❌ belum | ✅ **sudah terpasang** di `package.json` |
| Meilisearch (fuzzy search) | ❌ belum | ❌ **masih belum ada** |
| Nominatim (geocoding) | ❌ belum | ❌ **masih belum ada** — kota→koordinat masih manual/GPS |
| `frankfurter.app` (kurs) | ❌ belum | ❌ **masih belum ada sama sekali** |
| Harga emas zakat auto-fetch | ⚠️ partial | ⚠️ **masih partial, dan lebih halus dari kelihatannya**: kurs USD→IDR memang live-fetch tiap 6 jam dari exchangerate-api.com, tapi **harga emas per ons di-hardcode `2400.0`** di kode — nisab zakat akan diam-diam basi seiring waktu tanpa ada yang sadar karena kelihatannya "otomatis". |
| Mobile FCM/native push | ❌ belum | ❌ **masih belum** — mobile baru local notification |

Library baru sejak Mei yang belum tercatat di dokumen: `sentry-go` (error tracking),
`pgvector-go` (vector search kajian), `whatsmeow` (WhatsApp), `email-verifier`, `minio-go` —
bukan bagian dari rekomendasi spec awal tapi sudah shipped, dokumen perlu diupdate.

`go test ./...` di `services/api`: **semua paket hijau**, tidak ada test currently broken.

Spot-check ~9 halaman admin CRUD (masjid, radio-islamic, tokoh-tarikh, sanad, takhrij,
hadith-ayah, locations, jarh-tadil, perawi) — semua pakai pola `GenericAdminCRUD` yang lengkap,
tidak ada yang stub/"coming soon".

---

## 4. Rekomendasi Urutan Kerja

1. **Perbaiki slug `SurahAudio` di `seeder_audio.go`** (8 dari 10 qori) — pola sama dengan fix
   radio hari ini, effort kecil-menengah, dampak langsung ke fitur audio yang sudah dipakai.
2. **Ganti harga emas zakat hardcode jadi live-fetch** (atau minimal beri tanggal
   "terakhir diupdate manual" di response) — supaya nisab tidak diam-diam basi.
3. **Audit ulang toggle notifikasi adzan di server** — pastikan `notifAdzan=false` benar-benar
   menghentikan push, bukan cuma menyembunyikan UI.
4. **Bereskan hygiene dokumentasi**: pindahkan ~20 file `progress/` yang sudah `VERIFIED` ke
   `done/`, dan pindahkan `peta-sirah-faraidh-visual.md` dari `todo/` ke `done/`. Ini murni
   dokumentasi, tapi membuat proyek terlihat jauh lebih rapi dan backlog yang benar-benar
   terlihat.
5. **Lanjutkan checklist 59-item di feature-route-inventory.md** satu-satu — atau setidaknya
   prioritaskan modul dengan seed data eksternal (audio, video, streaming) karena itu yang
   sejauh ini paling sering ketahuan salah.
6. Gap besar yang butuh keputusan produk dulu (bukan sekadar coding): semantic search embedding
   beneran (ganti `LocalHashProvider`), dark theme mobile app-wide, offline PWA web — semuanya
   perubahan arsitektur, bukan tambal cepat.

---

## Sumber

- `docs/api/roadmap-status.md`, `docs/api/feature-gap-analysis.md` (baseline Mei 2026)
- `docs/features/progress/*.md` (24 file), `docs/features/todo/peta-sirah-faraidh-visual.md`
- `docs/reviews/2026-09-08-feature-route-inventory.md` §4
- `docs/reviews/2026-09-03-audit-pasangan-hadis.md`
- `docs/api/ASBABUN_NUZUL_DATASET_TODO.md`
- Verifikasi langsung: `go test ./...`, `curl` ke quranicaudio.com/everyayah.com, `grep` ke
  `go.mod`/`package.json`/routes
