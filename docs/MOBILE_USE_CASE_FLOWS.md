# Use Case + UI Flow — Daftar Lengkap

> Sumber: diagram Use Case + UI Flow di `assets/design/mobile.pen` (area kanvas `x≈4910`
> ke kanan). Detail build recipe, id node, dan gotcha pen.dev ada di
> [`MOBILE_PENDEV_REDESIGN.md`](./MOBILE_PENDEV_REDESIGN.md) — dokumen ini cuma katalog
> ringkas, buat referensi cepat.

Status: **34 usecase selesai** di **26 feature** (per 2026-09-25).

## Layout kanvas: 1 feature = 1 baris (row)

**Aturan wajib mulai sekarang**: kanvas disusun **per FEATURE, bukan per usecase**. Setiap
feature dapat satu baris horizontal (satu nilai Y tetap). Kalau feature itu punya lebih dari
1 usecase (mis. Login punya 3: Masuk/Daftar/Lupa Sandi), semua usecase-nya ditaruh
**berdampingan ke kanan** di baris yang sama (HandoffCard usecase kedua mulai ~150px setelah
layar terakhir usecase pertama) — **bukan** dibuatkan baris/lane baru ke bawah. Baris baru
(Y baru) hanya untuk FEATURE baru, bukan untuk usecase tambahan dari feature yang sudah ada.

Ini perbaikan dari pendekatan awal (setiap usecase dapat lane vertikal sendiri) yang bikin
kanvas jadi sangat panjang ke bawah dan sulit di-scan — lihat riwayat perubahan di
`MOBILE_PENDEV_REDESIGN.md`.

3 feature yang sudah punya >1 usecase, disusun sebagai 1 baris dengan label kecil di atasnya
("FITUR: ..."):

- **Login / Akun** (3 usecase, berdampingan): Masuk → Daftar Akun Baru → Reset Password
- **Baca Hadis** (2 usecase, berdampingan): Hadis Detail langsung → Hadis Reader per kitab
- **Jadwal Sholat & Reminder** (6 usecase, berdampingan): alur utama → izin notifikasi →
  atur waktu → nonaktifkan → konfirmasi terjadwal → ganti metode

## Daftar Usecase (dikelompokkan per Feature)

| No  | Feature                        | Usecase                            | Alur Tap                                                                          | Layar Baru yang Dibangun                           | Grounding (screenshot)                                                                   |
| --- | ------------------------------ | ---------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | First Launch                   | Buka Aplikasi Pertama Kali         | Splash → OS izin lokasi → Beranda (tamu)                                          | Splash - Modern, Izin Lokasi - Modern              | modern-launch-splash.png, modern-launch-location-permission.png                          |
| 2a  | Login / Akun                   | Login / Masuk ke Akun              | Beranda → avatar → menu → Profil → "Masuk/Daftar" → tab Masuk                     | Akun - Modern                                      | modern-login.png, modern-avatar-menu.png                                                 |
| 2b  | Login / Akun                   | Daftar Akun Baru                   | ...→ "Masuk/Daftar" → tab Daftar (channel WhatsApp)                               | Daftar Akun - Modern                               | modern-register.png, modern-register-whatsapp.png                                        |
| 2c  | Login / Akun                   | Reset Password (Lupa Sandi)        | ...→ "Masuk/Daftar" → tab Lupa Sandi                                              | Lupa Sandi - Modern                                | modern-forgot-password.png                                                               |
| 3   | Baca Surah Al-Qur'an           | Baca Surah Al-Qur'an               | Beranda → tab Al-Quran → Quran Hub → tap surah                                    | Quran Reader - Modern                              | modern-quran-surah-reader.png                                                            |
| 4a  | Baca Hadis                     | Baca Hadis                         | Beranda → tab Hadis → Hadis Hub → tap hadis                                       | _(pakai Hadis Detail yang sudah ada)_              | modern-hadis.png, modern-hadis-detail.png                                                |
| 4b  | Baca Hadis                     | Baca Hadis dalam 1 Kitab           | ...→ tap "Buka Reader" pada kitab → daftar hadis → pilih hadis                    | Hadis Reader - Modern                              | modern-hadis-reader.png                                                                  |
| 5   | Cari Arah Kiblat               | Cari Arah Kiblat                   | Beranda → tab Ibadah → Ibadah Hub → kartu Qibla                                   | Kiblat - Modern                                    | modern-ibadah-qibla.png                                                                  |
| 6a  | Jadwal Sholat & Reminder       | Cek Jadwal Sholat & Set Reminder   | Beranda → tab Ibadah → Ibadah Hub → Jadwal Sholat → ikon gear                     | Jadwal Sholat - Modern, Pengaturan Sholat - Modern | modern-ibadah-prayer-with-location.png, modern-ibadah-prayer-reminder-enabled.png        |
| 6b  | Jadwal Sholat & Reminder       | Izinkan Notifikasi Reminder Adzan  | ...→ toggle "Notifikasi Lokal" pertama kali → dialog izin OS                      | Izin Notifikasi - Modern                           | modern-ibadah-prayer-reminder-notification-permission.png                                |
| 6c  | Jadwal Sholat & Reminder       | Atur Waktu & Sholat untuk Reminder | ...→ ubah "Jeda Pengingat" & "Waktu Sholat"                                       | _(state Pengaturan Sholat berubah)_                | modern-ibadah-prayer-reminder-lead-and-prayers.png, lead-changed.png                     |
| 6d  | Jadwal Sholat & Reminder       | Nonaktifkan Reminder Adzan         | ...→ matikan toggle "Notifikasi Lokal"                                            | _(state Pengaturan Sholat off)_                    | modern-ibadah-prayer-reminder-off.png                                                    |
| 6e  | Jadwal Sholat & Reminder       | Konfirmasi Reminder Terjadwal      | ...→ tap "Atur ulang pengingat"                                                   | Konfirmasi Reminder - Modern                       | modern-ibadah-prayer-reminder-scheduled-confirmation.png                                 |
| 6f  | Jadwal Sholat & Reminder       | Ganti Metode Perhitungan Jadwal    | ...→ scroll ke atas → "Metode Jadwal"                                             | Metode Jadwal - Modern                             | modern-ibadah-prayer-settings-top.png                                                    |
| 7   | Ikuti Kuis Islami              | Ikuti Kuis Islami                  | Beranda → tab Belajar → Belajar Hub → Quiz Islami → pilih jawaban                 | Kuis Soal - Modern, Kuis Jawaban - Modern          | modern-belajar-quiz.png, modern-belajar-quiz-answer.png                                  |
| 8   | Ikuti Kajian Islam             | Ikuti Kajian Islam                 | Beranda → tab Belajar → Belajar Hub → Kajian                                      | Kajian - Modern                                    | modern-belajar-kajian.png                                                                |
| 9   | Baca Doa Harian                | Baca Doa Harian                    | Beranda → tab Ibadah → Ibadah Hub (Harian) → Doa                                  | Doa - Modern                                       | modern-ibadah-doa.png                                                                    |
| 10  | Baca Asmaul Husna              | Baca Asmaul Husna                  | Beranda → tab Ibadah → Ibadah Hub (Dzikir & Bacaan) → Asmaul Husna                | Asmaul Husna - Modern                              | modern-ibadah-asmaul-husna.png                                                           |
| 11  | Gunakan Tasbih Digital         | Gunakan Tasbih Digital             | Beranda → tab Ibadah → Ibadah Hub (Alat) → Tasbih                                 | Tasbih - Modern                                    | modern-ibadah-tasbih.png                                                                 |
| 12  | Hitung Zakat                   | Hitung Zakat                       | Beranda → tab Ibadah → Ibadah Hub (Alat) → Zakat                                  | Zakat - Modern                                     | modern-belajar-zakat.png _(nama file "belajar", tap path aslinya Ibadah)_                |
| 13  | Hitung Waris (Faraidh)         | Hitung Waris (Faraidh)             | Beranda → tab Ibadah → Ibadah Hub (Alat) → Faraidh                                | Faraidh - Modern                                   | modern-belajar-faraidh.png _(nama file "belajar", tap path aslinya Ibadah)_              |
| 14  | Baca Tafsir Al-Qur'an          | Baca Tafsir Al-Qur'an              | Beranda → tab Belajar → Belajar Hub (Referensi) → Tafsir → pilih surah            | Tafsir - Modern, Tafsir Detail - Modern            | modern-belajar-tafsir.png, modern-belajar-tafsir-surah-selected.png                      |
| 15  | Baca Siroh Nabawiyah           | Baca Siroh Nabawiyah               | Beranda → tab Belajar → Belajar Hub (Siroh & Sejarah) → Siroh → pilih peristiwa   | Siroh - Modern, Siroh Detail - Modern              | modern-belajar-siroh.png, modern-belajar-siroh-detail.png                                |
| 16  | Baca Fiqh Ringkas              | Baca Fiqh Ringkas                  | Beranda → tab Belajar → Belajar Hub (Fiqh & Panduan) → Fiqh Ringkas → pilih topik | Fiqh Ringkas - Modern, Fiqh Detail - Modern        | modern-belajar-fiqh.png, modern-belajar-fiqh-detail.png                                  |
| 17  | Ikut Komunitas Belajar         | Ikut Komunitas Belajar             | Beranda → tab Belajar → Belajar Hub (Kajian & Artikel) → Komunitas                | Komunitas - Modern                                 | modern-belajar-komunitas.png                                                             |
| 18  | Dengarkan Radio Islam          | Dengarkan Radio Islam              | Beranda → tab Belajar → Belajar Hub (Kajian & Artikel) → Radio Islam              | Radio Islam - Modern                               | classic-belajar-radio-islam.png _(cuma ada di tema Classic, konten di-reskin ke Modern)_ |
| 19  | Baca Artikel/Blog Islami       | Baca Artikel/Blog Islami           | Beranda → tab Belajar → Belajar Hub (Kajian & Artikel) → Artikel                  | Artikel - Modern                                   | modern-belajar-blog.png                                                                  |
| 20  | Lihat Leaderboard              | Lihat Leaderboard                  | Beranda → tab Belajar → Belajar Hub (Personal Ringkas) → Leaderboard              | Leaderboard - Modern                               | modern-belajar-leaderboard.png, modern-belajar-leaderboard-hafalan.png                   |
| 21  | Isi Jurnal Muhasabah           | Isi Jurnal Muhasabah               | Beranda → kartu "Jurnal Muhasabah" _(langsung di Beranda, bukan via hub)_         | Jurnal Muhasabah - Modern                          | classic-belajar-muhasabah.png                                                            |
| 22  | Cari Istilah di Kamus Arab     | Cari Istilah di Kamus Arab         | Beranda → tab Belajar → Belajar Hub (Referensi) → Kamus Arab → cari               | Kamus - Modern, Kamus Search - Modern              | modern-belajar-kamus.png, modern-belajar-kamus-search.png                                |
| 23  | Lihat Jadwal Imsakiyah Ramadan | Lihat Jadwal Imsakiyah Ramadan     | Beranda → tab Ibadah → Ibadah Hub (Arah & Waktu) → Imsakiyah                      | Imsakiyah - Modern                                 | modern-belajar-imsakiyah.png _(nama file "belajar", tap path aslinya Ibadah)_            |
| 24  | Kelola Wirid Saya              | Kelola Wirid Saya                  | Beranda → tab Ibadah → Ibadah Hub (Dzikir & Bacaan) → Wirid Saya                  | Wirid Saya - Modern                                | modern-belajar-wirid-saya.png                                                            |
| 25  | Rencanakan Khatam Al-Qur'an    | Rencanakan Khatam Al-Qur'an        | Beranda → tab Ibadah → Ibadah Hub (Rencana) → Khatam                              | Khatam - Modern                                    | modern-ibadah-khatam.png                                                                 |
| 26  | Ikuti Modul & Kelas Belajar    | Ikuti Modul & Kelas Belajar        | Beranda → tab Belajar → Belajar Hub (Modul & Kelas) → pilih modul                 | Modul & Kelas - Modern, Lessons Detail - Modern    | modern-belajar-lessons-detail.png                                                        |

## Belum Digarap (Kandidat Round Berikutnya)

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
  di [`MOBILE_PENDEV_REDESIGN.md`](./MOBILE_PENDEV_REDESIGN.md)).
- Beberapa nama file screenshot mengandung "belajar" padahal tap path asli ada di Ibadah hub
  (Zakat, Faraidh, Imsakiyah) — sudah diverifikasi via struktur hub asli, bukan cuma dari nama
  file. Lihat gotcha #13 di `MOBILE_PENDEV_REDESIGN.md`.
- Layar "Pengaturan Sholat" untuk usecase 6b (Izinkan Notifikasi) dibangun ulang dari nol
  oleh agent-nya karena id acuan yang diberikan sudah basi saat itu — belum direkonsiliasi
  ke screen kanonis yang dipakai 6a/6c/6d/6e/6f (`hutG2`). Perlu dicek/disamakan nanti.
- Dokumen ini adalah katalog usecase (fokus: struktur flow & urutan tap, dan pengelompokan
  per feature). Detail desain visual/UI tiap layar adalah tanggung jawab pekerjaan lanjutan
  (bukan cakupan dokumen ini).
