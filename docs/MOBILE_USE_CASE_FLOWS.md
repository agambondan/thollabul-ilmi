# Use Case + UI Flow — Daftar Lengkap

> Sumber: diagram Use Case + UI Flow di `assets/design/mobile.pen` (area kanvas `x≈4910`
> ke kanan). Detail build recipe, id node, dan gotcha pen.dev ada di
> [`MOBILE_PENDEV_REDESIGN.md`](./MOBILE_PENDEV_REDESIGN.md) — dokumen ini cuma katalog
> ringkas, buat referensi cepat.

Status (2026-09-25): **61 usecase selesai** di **47 feature**. Semua feature dari audit
`docs/api/FEATURE_ROADMAP.md` + audit kode `apps/mobile/src/` sudah tercakup, kecuali yang
memang tidak punya UI mobile sama sekali (lihat bagian "Dikecualikan" di bawah).

## Layout kanvas: 1 feature = 1 baris (row)

Setiap feature dapat satu baris horizontal (satu nilai Y tetap). Kalau feature itu punya lebih
dari 1 usecase, semua usecase-nya ditaruh **berdampingan ke kanan** di baris yang sama (gap
150px antar-usecase, gap 80px antar-screen dalam 1 usecase) — bukan baris baru ke bawah. Baris
baru (Y baru) hanya untuk FEATURE baru.

6 feature yang sudah punya >1 usecase:

| Feature                  | Usecase (urutan kiri→kanan)                                                         |
| ------------------------ | ----------------------------------------------------------------------------------- |
| Login / Akun             | Masuk → Daftar Akun Baru → Reset Password                                           |
| Baca Hadis               | Hadis Detail langsung → Hadis Reader per kitab                                      |
| Jadwal Sholat & Reminder | Alur utama → izin notifikasi → atur waktu → nonaktifkan → konfirmasi → ganti metode |
| Baca Surah Al-Qur'an     | Baca Surah → Audio Murotal → Muroja'ah → Mufrodat (arti kata per kata)              |
| Baca Asmaul Husna        | List → Flashcard → Wirid (counter per nama)                                         |
| Ikut Komunitas Belajar   | Obrolan Komunitas → Diskusi & Komentar pada konten feed                             |

## Daftar Usecase Lengkap

| No  | Feature                        | Usecase                    | Alur Tap Singkat                                                   | Grounding                                                       |
| --- | ------------------------------ | -------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| 1   | First Launch                   | Buka Aplikasi Pertama Kali | Splash → izin lokasi OS → Beranda tamu                             | modern-launch-splash.png, -location-permission.png              |
| 2a  | Login / Akun                   | Masuk                      | Beranda → avatar → Profil → Masuk/Daftar (tab Masuk)               | modern-login.png                                                |
| 2b  | Login / Akun                   | Daftar Akun Baru           | ...→ tab Daftar (channel WhatsApp)                                 | modern-register-whatsapp.png                                    |
| 2c  | Login / Akun                   | Reset Password             | ...→ tab Lupa Sandi                                                | modern-forgot-password.png                                      |
| 3a  | Baca Surah Al-Qur'an           | Baca Surah                 | Beranda → Quran Hub → pilih surah                                  | modern-quran-surah-reader.png                                   |
| 3b  | Baca Surah Al-Qur'an           | Audio Murotal              | ...reader → player murotal (qari/scrubber/kontrol)                 | `QuranAudioRangePanel.js`                                       |
| 3c  | Baca Surah Al-Qur'an           | Muroja'ah                  | ...→ tab Murojaah → nilai sendiri hafalan                          | `QuranScreen.helpers.js` QURAN_TABS                             |
| 3d  | Baca Surah Al-Qur'an           | Mufrodat (arti kata)       | ...reader → tap 1 kata Arab → arti+akar kata                       | `getMufrodatByPage/BySurah`                                     |
| 4a  | Baca Hadis                     | Baca Hadis                 | Beranda → Hadis Hub → pilih hadis                                  | modern-hadis-detail.png                                         |
| 4b  | Baca Hadis                     | Hadis Reader per Kitab     | ...→ "Buka Reader" pada kitab → daftar hadis → pilih               | modern-hadis-reader.png                                         |
| 5   | Cari Arah Kiblat               | —                          | Beranda → Ibadah Hub → kartu Qibla                                 | modern-ibadah-qibla.png                                         |
| 6a  | Jadwal Sholat & Reminder       | Cek Jadwal & Set Reminder  | Beranda → Ibadah → Jadwal Sholat → ikon gear                       | modern-ibadah-prayer-with-location.png                          |
| 6b  | Jadwal Sholat & Reminder       | Izin Notifikasi            | ...→ toggle Notifikasi Lokal pertama kali                          | -notification-permission.png                                    |
| 6c  | Jadwal Sholat & Reminder       | Atur Waktu & Sholat        | ...→ ubah Jeda Pengingat & Waktu Sholat                            | -lead-and-prayers.png, -lead-changed.png                        |
| 6d  | Jadwal Sholat & Reminder       | Nonaktifkan Reminder       | ...→ matikan toggle                                                | -reminder-off.png                                               |
| 6e  | Jadwal Sholat & Reminder       | Konfirmasi Terjadwal       | ...→ "Atur ulang pengingat"                                        | -scheduled-confirmation.png                                     |
| 6f  | Jadwal Sholat & Reminder       | Ganti Metode Jadwal        | ...→ Metode Jadwal (Kemenag/MWL/dll)                               | -settings-top.png                                               |
| 7   | Ikuti Kuis Islami              | —                          | Beranda → Belajar Hub → Quiz Islami → jawab                        | modern-belajar-quiz.png, -answer.png                            |
| 8   | Ikuti Kajian Islam             | —                          | Beranda → Belajar Hub → Kajian                                     | modern-belajar-kajian.png                                       |
| 9   | Baca Doa Harian                | —                          | Beranda → Ibadah Hub (Harian) → Doa                                | modern-ibadah-doa.png                                           |
| 10a | Baca Asmaul Husna              | List                       | Beranda → Ibadah Hub (Dzikir & Bacaan) → Asmaul Husna              | modern-ibadah-asmaul-husna.png                                  |
| 10b | Baca Asmaul Husna              | Flashcard                  | ...→ mode Flashcard → hafal via kartu balik                        | `WebAppAsmaulFlashcardRoute`                                    |
| 10c | Baca Asmaul Husna              | Wirid (counter per nama)   | ...→ pilih nama → wirid dengan penghitung                          | `WebAppAsmaulWiridRoute`                                        |
| 11  | Gunakan Tasbih Digital         | —                          | Beranda → Ibadah Hub (Alat) → Tasbih                               | modern-ibadah-tasbih.png                                        |
| 12  | Hitung Zakat                   | —                          | Beranda → Ibadah Hub (Alat) → Zakat                                | modern-belajar-zakat.png                                        |
| 13  | Hitung Waris (Faraidh)         | —                          | Beranda → Ibadah Hub (Alat) → Faraidh                              | modern-belajar-faraidh.png                                      |
| 14  | Baca Tafsir Al-Qur'an          | —                          | Beranda → Belajar Hub (Referensi) → Tafsir → pilih surah           | modern-belajar-tafsir.png                                       |
| 15  | Baca Siroh Nabawiyah           | —                          | Beranda → Belajar Hub (Siroh & Sejarah) → Siroh → peristiwa        | modern-belajar-siroh.png                                        |
| 16  | Baca Fiqh Ringkas              | —                          | Beranda → Belajar Hub (Fiqh & Panduan) → Fiqh Ringkas → topik      | modern-belajar-fiqh.png                                         |
| 17a | Ikut Komunitas Belajar         | Obrolan Komunitas          | Beranda → Belajar Hub (Kajian & Artikel) → Komunitas               | modern-belajar-komunitas.png                                    |
| 17b | Ikut Komunitas Belajar         | Diskusi & Komentar         | ...→ post ayat/hadis di feed → beri komentar                       | `getCommentsByRef`/`createComment`                              |
| 18  | Dengarkan Radio Islam          | —                          | Beranda → Belajar Hub (Kajian & Artikel) → Radio Islam             | classic-belajar-radio-islam.png                                 |
| 19  | Baca Artikel/Blog Islami       | —                          | Beranda → Belajar Hub (Kajian & Artikel) → Artikel                 | modern-belajar-blog.png                                         |
| 20  | Lihat Leaderboard              | —                          | Beranda → Belajar Hub (Personal Ringkas) → Leaderboard             | modern-belajar-leaderboard.png                                  |
| 21  | Isi Jurnal Muhasabah           | —                          | Beranda → kartu "Jurnal Muhasabah" (bukan via hub)                 | classic-belajar-muhasabah.png                                   |
| 22  | Cari Istilah di Kamus Arab     | —                          | Beranda → Belajar Hub (Referensi) → Kamus Arab → cari              | modern-belajar-kamus.png                                        |
| 23  | Lihat Jadwal Imsakiyah Ramadan | —                          | Beranda → Ibadah Hub (Arah & Waktu) → Imsakiyah                    | modern-belajar-imsakiyah.png                                    |
| 24  | Kelola Wirid Saya              | —                          | Beranda → Ibadah Hub (Dzikir & Bacaan) → Wirid Saya                | modern-belajar-wirid-saya.png                                   |
| 25  | Rencanakan Khatam Al-Qur'an    | —                          | Beranda → Ibadah Hub (Rencana) → Khatam                            | modern-ibadah-khatam.png                                        |
| 26  | Ikuti Modul & Kelas Belajar    | —                          | Beranda → Belajar Hub (Modul & Kelas) → pilih modul                | modern-belajar-lessons-detail.png                               |
| 27  | Kelola Hafalan Al-Qur'an       | —                          | Beranda (Akses Cepat) → tile Hafalan                               | tile `POVC6` (icon book-check)                                  |
| 28  | Buka Jurnal (Akses Cepat)      | —                          | Beranda (Akses Cepat) → tile Jurnal                                | tile `wumCV` (kemungkinan alias Muhasabah)                      |
| 29  | Lihat Statistik Belajar        | —                          | Beranda → Belajar Hub (Personal Ringkas) → Statistik               | tile (icon activity)                                            |
| 30  | Kelola Bookmark                | —                          | Beranda → Belajar Hub (Personal Ringkas) → Bookmark                | tile (icon bookmark)                                            |
| 31  | Kelola Catatan Pribadi         | —                          | Beranda → Belajar Hub (Personal Ringkas) → Catatan                 | tile (icon file-text)                                           |
| 32  | Atur Target Belajar            | —                          | Beranda → Belajar Hub (Personal Ringkas) → Target Belajar          | tile (icon target)                                              |
| 33  | Catat Log Sholat Harian        | —                          | Beranda → Ibadah Hub (Rencana) → Log Sholat                        | modern-ibadah-sholat-tracker-CRASH.png (state crash, dibenerin) |
| 34  | Pelajari Manasik Haji & Umrah  | —                          | Beranda → Ibadah Hub (Rencana) → Manasik                           | tile (icon map)                                                 |
| 35  | Lihat Kalender Hijriah         | —                          | Beranda → Ibadah Hub (Arah & Waktu) → Kalender Hijriah             | modern-belajar-hijri.png                                        |
| 36  | Cari Masjid Terdekat           | —                          | Beranda → Ibadah Hub (Arah & Waktu) → Masjid                       | tile (icon map-pin)                                             |
| 37  | Baca Dzikir Pagi/Petang        | —                          | Beranda → Ibadah Hub (Dzikir & Bacaan) → Dzikir                    | tile (icon sparkles)                                            |
| 38  | Buka Menu Lainnya              | —                          | Beranda (Akses Cepat) → tile Lainnya                               | tile `Wj3vJ` (icon layout-grid)                                 |
| 39  | Cari Konten Lintas Fitur       | —                          | Beranda → ikon search di header                                    | `GlobalSearchScreen.js`                                         |
| 40  | Jelajahi Sejarah Islam         | —                          | Beranda → Belajar Hub (Siroh & Sejarah) → Sejarah Islam            | `/api/v1/history`, distinct dari Siroh                          |
| 41  | Baca Biografi Tokoh Sejarah    | —                          | Beranda → ikon menu → Menu Lainnya → Tokoh Tarikh → detail         | `TokohTarikhContent.js`                                         |
| 42  | Jelajahi Peta Islam Interaktif | —                          | Beranda → ikon menu → Peta Islam                                   | `HistoricalMapScreen.js`                                        |
| 43  | Catat Tilawah Harian           | —                          | Beranda → ikon menu → Menu Lainnya → Tilawah                       | feature key `tilawah`                                           |
| 44  | Isi Checklist Amalan Harian    | —                          | Beranda → ikon menu → Amalan                                       | `WebAppAmalanRoute.js`                                          |
| 45  | Baca Asbabun Nuzul             | —                          | Beranda → Belajar Hub (Referensi) → Asbabun Nuzul → surah → detail | feature key `asbabun-nuzul`                                     |
| 46  | Baca Panduan Sholat Lengkap    | —                          | Beranda → Belajar Hub (Fiqh & Panduan) → Panduan Sholat            | feature key `panduan-sholat`                                    |
| 47  | Baca Bacaan Sunnah & Wirid     | —                          | Beranda → Ibadah Hub (Dzikir & Bacaan) → Wirid                     | feature key `wirid` ("Wirid Sunnah")                            |

## Dikecualikan (Tidak Perlu Usecase)

Feature dari roadmap yang dikonfirmasi **tidak punya UI mobile sama sekali** (audit kode
2026-09-25, `apps/mobile/src/`), murni backend/konsep, atau belum diimplementasi:

| Feature                        | Alasan                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Streak & Daily Habit           | Cuma angka yang numpang di Profile/Leaderboard/Log Sholat, tidak ada layar sendiri                                             |
| Rekap & Laporan Bulanan        | Belum diimplementasi di mobile sama sekali                                                                                     |
| Sharing Card Metadata          | Murni backend, nol UI mobile                                                                                                   |
| User Roles Granular            | Murni backend/admin, nol UI mobile                                                                                             |
| Open API & Partner Integration | Murni backend untuk pihak ketiga, nol UI mobile                                                                                |
| Share to Feed                  | Dead stub — tombol "+ Buat Postingan" ada tapi tanpa `onPress` handler                                                         |
| Reading Progress               | Sama dengan feature "Khatam" yang sudah dibangun (usecase #25) — 1 screen yang sama (`KhatamScreen.js`), cuma beda entry point |

## Catatan

- Semua usecase pakai `Flow/HandoffCard` (komponen reusable id `r7P5jg` per 2026-09-25 — cek
  ulang lewat `Get`/nama kalau id ini sudah basi lagi akibat insiden penghapusan kanvas, lihat
  riwayat di [`MOBILE_PENDEV_REDESIGN.md`](./MOBILE_PENDEV_REDESIGN.md)).
- Sebagian usecase digrounding dari screenshot asli (`apps/mobile/output/native/2026-09-24/`),
  sebagian dari tile hub asli (icon/label/subtitle dibaca langsung dari `Get` pada dokumen live,
  bukan ditebak), dan sebagian dari audit kode langsung (`apps/mobile/src/`) untuk feature yang
  belum punya screenshot maupun tile UI kalau ternyata reachable lewat menu (`MobileMenuSheet.js`).
- Beberapa feature (Search, Tokoh Tarikh, Peta Islam Interaktif, Tilawah, Amalan) di-reach lewat
  ikon menu/hamburger di header Beranda, bukan lewat tab hub — direpresentasikan dengan layar
  "Menu Lainnya" (bottom-sheet) sebagai perantara, mengikuti pola bottom-sheet modal yang sudah
  jadi standar desain project ini.
- Dokumen ini adalah katalog usecase (fokus: struktur flow & urutan tap, pengelompokan per
  feature). Detail desain visual/UI tiap layar adalah tanggung jawab pekerjaan lanjutan (bukan
  cakupan dokumen ini).
