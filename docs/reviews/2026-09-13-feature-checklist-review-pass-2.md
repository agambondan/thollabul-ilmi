# Feature Checklist Review — Pass 2 — 2026-09-13

Sesi lanjutan dari `docs/reviews/2026-09-12-feature-checklist-review-pass.md`
(31 baris) dan sesi ini sendiri yang sempat crash sebelum sempat menulis
laporan/summary — pekerjaannya bertahan di working tree dan dilanjutkan di
sini. Referensi utama: `docs/reviews/2026-09-08-feature-route-inventory.md`
§4 (59 baris total).

## Cakupan sesi ini

**20 baris disentuh**: #1, #4, #7, #8, #11, #12, #13, #15, #16, #17, #18, #19,
#20, #21, #22, #27, #28, #29, #30, #38. Sebagian besar kolom **Web** yang
belum pernah dicek di pass 1 (backend-nya sudah [x] duluan), plus 3 baris
backend baru (#1 Auth, #22 Quiz, #38 Muroja'ah). Kolom **Mobile** tidak
disentuh sama sekali sesuai arahan eksplisit — di luar scope ronde ini.

Metodologi sama seperti pass 1: backend API live di
`http://localhost:29900/api/v1` dicek lewat `curl` untuk endpoint public;
endpoint JWT-gated dikonfirmasi 401 lalu kodenya dibaca. Web dicek dengan
membaca komponen `*Content.js`/`*Client.js` — fokus pada shape response API
vs cara komponen mengonsumsinya. **Tidak membuat akun test / login nyata**:
`services/api/.env` nunjuk `DB_HOST` ke IP eksternal (bukan container lokal
disposable), dan ada kredensial admin bocor yang menurut audit lama
(`docs/web/UI_MATURITY_AUDIT_2026-08-28.md`) sempat aktif di produksi — jadi
endpoint JWT tetap diverifikasi lewat baca kode + cek 401, bukan token asli,
sama seperti pendekatan pass 1.

## Bug ditemukan & diperbaiki sebelum sesi ini crash (1)

- **Muroja'ah stats — backend querying kolom yang tidak ada** (baris #38).
  `services/api/app/repository/murojaah_repository.go` fungsi `Stats()`
  memakai raw SQL `SUM(duration_seconds)`, padahal kolom GORM yang
  sebenarnya adalah `duration` (`duration_seconds` cuma nama JSON tag-nya,
  lihat `model/murojaah.go`). Query itu pasti gagal setiap kali dipanggil.
  **Fix**: ganti jadi `SUM(duration)`. Diverifikasi ulang sesi ini: `go
build ./...`, `go vet ./...`, `go test ./app/repository/...` semua lulus
  dengan fix ini terpasang (dikonfirmasi independen oleh sesi orchestrator).
  Controller (`murojaah_controller.go`) dan service
  (`services/murojaah_service.go`) dibaca ulang sesi ini juga — tidak ada
  masalah lain.

## Temuan non-bug yang layak dicatat

- **Muroja'ah web tidak pernah memanggil backend `/murojaah/*`** (baris
  #38). `apps/web/src/app/dashboard/muroja-ah/page.js` membangun antrian
  review dari `hafalanApi.list()` + tanggal review yang disimpan di
  `localStorage` saja — tidak ada `murojaahApi` di `lib/api.js` sama
  sekali. Backend session/result/history/stats endpoints kelihatannya
  cuma dipakai mobile. Bukan bug, tapi catatan kesenjangan desain/paritas
  platform buat yang megang keputusan produk fitur ini.
- **Feed like-button tidak melacak status like per-user** (baris #30).
  `FeedContent.js` merender hati terisi kalau `likes > 0`, bukan
  berdasarkan apakah user yang sedang login yang nge-like — soalnya
  `model/feed.go` di backend memang tidak punya field `is_liked`/semacamnya
  sama sekali. Bukan defect kode kontenporer (perbaikannya butuh perubahan
  skema, jadi "missing feature" bukan "bug kontan" sesuai batasan sesi ini),
  cuma dicatat.
- **Quiz `/quiz` 405 dari pass 1 dikonfirmasi bukan bug** (baris #22).
  Route publik yang benar adalah `GET /quiz/session`; `POST /quiz` memang
  admin-only (create). `QuizContent.js` (dirty di working tree dari sesi
  lain, tidak disentuh, cuma dibaca) sudah benar meresolusi index jawaban
  dari teks `correct_answer` terhadap array `options` yang sudah diacak.
- Auth & Users (baris #1) — seluruh alur register/login/refresh/logout/
  forgot-password/reset-password/verify-email/verify-whatsapp/resend-
  verification dibaca lengkap di `user_service.go` — anti-enumeration,
  revoke-session-on-reset, refresh-token rotation, WhatsApp OTP dengan
  lockout 5x percobaan semuanya benar. Web (`context/Auth.js` + halaman
  auth) match persis kontrak backend termasuk string `"account not
verified"` yang di-pattern-match di frontend.

## Baris web-only yang diverifikasi OK tanpa temuan

Asbabun Nuzul, Hadith (dispatcher saja, bukan ke-4 sub-view), Perawi,
Dzikir, Wirid, Asmaul Husna, Sejarah, Tokoh Tarikh, Peta Islam/Locations,
Fiqh Ringkas, Kamus, Manasik, Belajar/Lessons, Library, Forum Q&A,
Komunitas (wrapper saja), Feed (minus catatan like-button di atas). Semua
komponen ini membaca response backend dengan benar — pola unwrap
`items`/`data.items`/bare-array yang konsisten dicek satu-satu terhadap
shape asli (dikonfirmasi via curl live) dan tidak ada mismatch key seperti
yang ditemukan di baris #55 pass 1.

## Sengaja dilewati / belum tersentuh sesi ini

- **Semua fitur/kolom mobile** — di luar scope eksplisit ronde ini.
- **File yang sudah dirty dari sesi lain** — tidak disentuh sesuai aturan:
  `apps/web/src/app/page.js`, `apps/web/src/components/QuizContent.js`,
  `services/api/app/controllers/page_view_controller.go`,
  `services/api/app/model/{goal,kalkulasi_zakat,masjid,muhasabah}.go`,
  `services/api/app/repository/note_repository.go`,
  `services/api/app/services/{goal_service,note_service}.go`, semua file
  mobile di `apps/mobile/`. Beberapa di antaranya relevan ke baris checklist
  yang masih terbuka (Goals #40, Notes #53 — sudah [x] duluan, Zakat #48 —
  sengaja dilewati kedua pass).

## Belum tersentuh sama sekali — mulai dari sini di pass berikutnya

Comments/Diskusi generik (#31), Reading Progress (#33), Hafalan (#34),
Streak & Activity (#35), Tilawah Tracker (#36), Muhasabah (#39), Goals
(#40), Stats (#42), Content Correction Reports (#51), Admin Audit Logs
(#52), Analytics write path (#57, masih cuma GET-nya yang dicek 405),
Open API/Developer Partner (#58), Admin: User Management (#59). Juga
kolom Web yang masih kosong untuk: Audio Murotal + Adzan Sounds (#6),
Kajian (#23 — banyak sub-view: `TranscriptSearchView`, `SavedBookmarksView`,
`KajianClient`, `VideoPlayerModal`, `SpeakerMultiSelectDropdown`,
`SavedNotesView`, belum sempat dibaca satupun sesi ini), Prayer Tracker +
Panduan Sholat (#45), Notifications (#50), User Settings/sync (#54).
Sebagian besar sisa ini JWT/admin-gated — akan butuh token asli untuk
exercise end-to-end kalau mau lebih dari sekadar baca kode + cek 401.

## File yang diubah sesi ini

- `services/api/app/repository/murojaah_repository.go` — sudah diubah
  sebelum sesi ini crash (`SUM(duration_seconds)` → `SUM(duration)`);
  diverifikasi lagi di pass ini, tidak disentuh ulang.
- `docs/reviews/2026-09-08-feature-route-inventory.md` — checklist §4
  di-update in-place untuk 20 baris di atas.
- `docs/reviews/2026-09-13-feature-checklist-review-pass-2.md` — dokumen ini.
- `docs/reviews/README.md` — didaftarkan (lihat catatan concurrency).

## Catatan concurrency

`docs/reviews/README.md` sudah dirty dari sesi lain sejak sebelum sesi ini
mulai, dan ada beberapa entri `2026-09-13` lain yang ditambahkan sesi-sesi
paralel hari ini. Baris untuk dokumen ini ditambahkan di akhir tabel tanpa
menyentuh baris lain.
