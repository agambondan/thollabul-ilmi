# Use Case + UI Flow — Daftar Lengkap

> Sumber: diagram Use Case + UI Flow di `assets/design/mobile.pen` (area kanvas `x≈4910`
> ke kanan). Detail build recipe, id node, dan gotcha pen.dev ada di
> [`MOBILE_PENDEV_REDESIGN.md`](./MOBILE_PENDEV_REDESIGN.md) — dokumen ini cuma katalog
> ringkas 1 usecase = 1 baris, buat referensi cepat.

Status: **25 usecase selesai** (1 usecase primary per feature, bukan exhaustive). Semua
entry point mulai dari Beranda - Modern, terhubung lewat connector berlabel aksi tap.

## Daftar Usecase

| No  | Usecase                          | Alur Tap                                                                          | Layar Baru yang Dibangun                           | Grounding (screenshot)                                                                   |
| --- | -------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | Login / Masuk ke Akun            | Beranda → avatar → menu → Profil → "Masuk/Daftar"                                 | Akun - Modern                                      | modern-login.png, modern-avatar-menu.png                                                 |
| 2   | Baca Surah Al-Qur'an             | Beranda → tab Al-Quran → Quran Hub → tap surah                                    | Quran Reader - Modern                              | modern-quran-surah-reader.png                                                            |
| 3   | Baca Hadis                       | Beranda → tab Hadis → Hadis Hub → tap hadis                                       | _(pakai Hadis Detail yang sudah ada)_              | modern-hadis.png, modern-hadis-detail.png                                                |
| 4   | Cari Arah Kiblat                 | Beranda → tab Ibadah → Ibadah Hub → kartu Qibla                                   | Kiblat - Modern                                    | modern-ibadah-qibla.png                                                                  |
| 5   | Cek Jadwal Sholat & Set Reminder | Beranda → tab Ibadah → Ibadah Hub → Jadwal Sholat → ikon gear                     | Jadwal Sholat - Modern, Pengaturan Sholat - Modern | modern-ibadah-prayer-with-location.png, modern-ibadah-prayer-reminder-enabled.png        |
| 6   | Ikuti Kuis Islami                | Beranda → tab Belajar → Belajar Hub → Quiz Islami → pilih jawaban                 | Kuis Soal - Modern, Kuis Jawaban - Modern          | modern-belajar-quiz.png, modern-belajar-quiz-answer.png                                  |
| 7   | Ikuti Kajian Islam               | Beranda → tab Belajar → Belajar Hub → Kajian                                      | Kajian - Modern                                    | modern-belajar-kajian.png                                                                |
| 8   | Baca Doa Harian                  | Beranda → tab Ibadah → Ibadah Hub (Harian) → Doa                                  | Doa - Modern                                       | modern-ibadah-doa.png                                                                    |
| 9   | Baca Asmaul Husna                | Beranda → tab Ibadah → Ibadah Hub (Dzikir & Bacaan) → Asmaul Husna                | Asmaul Husna - Modern                              | modern-ibadah-asmaul-husna.png                                                           |
| 10  | Gunakan Tasbih Digital           | Beranda → tab Ibadah → Ibadah Hub (Alat) → Tasbih                                 | Tasbih - Modern                                    | modern-ibadah-tasbih.png                                                                 |
| 11  | Hitung Zakat                     | Beranda → tab Ibadah → Ibadah Hub (Alat) → Zakat                                  | Zakat - Modern                                     | modern-belajar-zakat.png _(nama file "belajar", tap path aslinya Ibadah)_                |
| 12  | Hitung Waris (Faraidh)           | Beranda → tab Ibadah → Ibadah Hub (Alat) → Faraidh                                | Faraidh - Modern                                   | modern-belajar-faraidh.png _(nama file "belajar", tap path aslinya Ibadah)_              |
| 13  | Baca Tafsir Al-Qur'an            | Beranda → tab Belajar → Belajar Hub (Referensi) → Tafsir → pilih surah            | Tafsir - Modern, Tafsir Detail - Modern            | modern-belajar-tafsir.png, modern-belajar-tafsir-surah-selected.png                      |
| 14  | Baca Siroh Nabawiyah             | Beranda → tab Belajar → Belajar Hub (Siroh & Sejarah) → Siroh → pilih peristiwa   | Siroh - Modern, Siroh Detail - Modern              | modern-belajar-siroh.png, modern-belajar-siroh-detail.png                                |
| 15  | Baca Fiqh Ringkas                | Beranda → tab Belajar → Belajar Hub (Fiqh & Panduan) → Fiqh Ringkas → pilih topik | Fiqh Ringkas - Modern, Fiqh Detail - Modern        | modern-belajar-fiqh.png, modern-belajar-fiqh-detail.png                                  |
| 16  | Ikut Komunitas Belajar           | Beranda → tab Belajar → Belajar Hub (Kajian & Artikel) → Komunitas                | Komunitas - Modern                                 | modern-belajar-komunitas.png                                                             |
| 17  | Dengarkan Radio Islam            | Beranda → tab Belajar → Belajar Hub (Kajian & Artikel) → Radio Islam              | Radio Islam - Modern                               | classic-belajar-radio-islam.png _(cuma ada di tema Classic, konten di-reskin ke Modern)_ |
| 18  | Baca Artikel/Blog Islami         | Beranda → tab Belajar → Belajar Hub (Kajian & Artikel) → Artikel                  | Artikel - Modern                                   | modern-belajar-blog.png                                                                  |
| 19  | Lihat Leaderboard                | Beranda → tab Belajar → Belajar Hub (Personal Ringkas) → Leaderboard              | Leaderboard - Modern                               | modern-belajar-leaderboard.png, modern-belajar-leaderboard-hafalan.png                   |
| 20  | Isi Jurnal Muhasabah             | Beranda → kartu "Jurnal Muhasabah" _(langsung di Beranda, bukan via hub)_         | Jurnal Muhasabah - Modern                          | classic-belajar-muhasabah.png                                                            |
| 21  | Cari Istilah di Kamus Arab       | Beranda → tab Belajar → Belajar Hub (Referensi) → Kamus Arab → cari               | Kamus - Modern, Kamus Search - Modern              | modern-belajar-kamus.png, modern-belajar-kamus-search.png                                |
| 22  | Lihat Jadwal Imsakiyah Ramadan   | Beranda → tab Ibadah → Ibadah Hub (Arah & Waktu) → Imsakiyah                      | Imsakiyah - Modern                                 | modern-belajar-imsakiyah.png _(nama file "belajar", tap path aslinya Ibadah)_            |
| 23  | Kelola Wirid Saya                | Beranda → tab Ibadah → Ibadah Hub (Dzikir & Bacaan) → Wirid Saya                  | Wirid Saya - Modern                                | modern-belajar-wirid-saya.png                                                            |
| 24  | Rencanakan Khatam Al-Qur'an      | Beranda → tab Ibadah → Ibadah Hub (Rencana) → Khatam                              | Khatam - Modern                                    | modern-ibadah-khatam.png                                                                 |
| 25  | Ikuti Modul & Kelas Belajar      | Beranda → tab Belajar → Belajar Hub (Modul & Kelas) → pilih modul                 | Modul & Kelas - Modern, Lessons Detail - Modern    | modern-belajar-lessons-detail.png                                                        |

## Belum Digarap (Kandidat Round 4+)

Feature/tile berikut belum punya usecase karena belum ada screenshot asli yang dedicated
(butuh screenshot baru dari emulator dulu, satu-satu — cuma 1 device, gak bisa paralel):

| Feature                                    | Kemungkinan Lokasi Tile                  |
| ------------------------------------------ | ---------------------------------------- |
| Hafalan                                    | Beranda (Akses Cepat) / Belajar          |
| Jurnal (quick-action, beda dari Muhasabah) | Beranda (Akses Cepat)                    |
| Statistik                                  | Belajar Hub (Personal Ringkas) / Profile |
| Bookmark                                   | Belajar Hub (Personal Ringkas)           |
| Catatan                                    | Belajar Hub (Personal Ringkas)           |
| Target Belajar                             | Belajar Hub (Personal Ringkas)           |
| Log Sholat                                 | Ibadah Hub (Rencana)                     |
| Manasik                                    | Ibadah Hub (Rencana) / Belajar (Siroh)   |
| Kalender Hijriah                           | Ibadah Hub (Arah & Waktu)                |
| Masjid                                     | Ibadah Hub (Arah & Waktu)                |
| Dzikir                                     | Ibadah Hub (Dzikir & Bacaan)             |
| Lainnya                                    | Ibadah Hub (grid "Lainnya")              |

## Catatan

- Semua usecase pakai `Flow/HandoffCard` (komponen reusable id `r7P5jg` per 2026-09-25 —
  cek ulang lewat `Get`/nama kalau id ini sudah basi lagi, lihat riwayat insiden penghapusan
  di [`MOBILE_PENDEV_REDESIGN.md`](./MOBILE_PENDEV_REDESIGN.md#status-2026-09-24)).
- Beberapa nama file screenshot mengandung "belajar" padahal tap path asli ada di Ibadah hub
  (Zakat, Faraidh, Imsakiyah) — sudah diverifikasi via struktur hub asli, bukan cuma dari nama
  file. Lihat gotcha #13 di `MOBILE_PENDEV_REDESIGN.md`.
- Dokumen ini adalah katalog usecase (fokus: struktur flow & urutan tap). Detail desain
  visual/UI tiap layar adalah tanggung jawab pekerjaan lanjutan (bukan cakupan dokumen ini).
