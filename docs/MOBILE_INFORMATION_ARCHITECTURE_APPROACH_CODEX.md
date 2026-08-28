# Mobile Information Architecture Approach - Codex

> Status: proposal pembanding, bukan dokumen utama.
> Source of truth terbaru: `docs/MOBILE_IA_FINAL_APPROACH.md`.

> Created: 2026-05-07
> Scope: `apps/mobile`
> Purpose: Usulan arsitektur navigasi mobile untuk mengantarkan fitur backend yang sangat banyak tanpa membuat journey terasa seperti daftar menu web.

## Ringkasan

Mobile app tidak perlu menampilkan semua fitur sebagai menu utama. Web bisa memakai sidebar/header karena ruang layar besar; mobile harus mengutamakan intent, konteks, dan progressive disclosure.

Rekomendasi utama: pertahankan maksimal 5 tab utama dan turunkan fitur besar ke hub yang sesuai. Fitur backend tetap tersampaikan lewat hub, shortcut kontekstual, search, favorit, dan detail screen yang konsisten.

## Prinsip Desain

1. Intent-first, bukan backend-module-first.
   User berpikir "mau ibadah", "mau baca Quran", "mau belajar", atau "mau lihat progress", bukan "mau membuka endpoint X".

2. Home adalah delivery surface, bukan katalog.
   Beranda menampilkan yang relevan sekarang: jadwal sholat, bacaan harian, shortcut favorit, lanjutkan aktivitas, dan notifikasi ringkas.

3. Katalog hanya untuk discovery.
   Fitur banyak tetap perlu bisa ditemukan, tetapi katalog harus grouped, searchable, dan punya shortcut/favorite. Jangan tampil sebagai grid flat panjang.

4. Fitur kompleks harus hidup di konteksnya.
   Tafsir dan asbab muncul di Quran reader. Sanad, perawi, dan takhrij muncul di detail Hadith. Log sholat muncul di Prayer. Summary progress boleh muncul di Profil.

5. Satu fitur boleh punya beberapa entry point.
   Entry point boleh muncul di Home, hub, dan Profil, tetapi screen/source of truth tetap satu supaya state dan UX tidak pecah.

## Usulan 5 Tab

| Tab      | Role                  | Isi utama                                                                                                     |
| -------- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| Beranda  | Dashboard kontekstual | Next prayer, daily ayah/hadith, shortcut favorit, lanjutkan terakhir, journal ringan                          |
| Al-Quran | Quran hub             | Surah list, reader, tafsir, asbab, audio, hafalan, murojaah, preferensi baca                                  |
| Ibadah   | Daily worship hub     | Jadwal sholat, qibla, doa, dzikir, wirid, tasbih, zakat, faraidh, khatam, imsakiyah                         |
| Belajar  | Knowledge hub         | Hadith, kajian, siroh, sejarah, fiqh, manasik, asmaul husna, kamus, quiz, blog/artikel                        |
| Profil   | Personal hub          | Akun, goals, stats, notes, bookmarks, achievements, leaderboard, offline, notification settings, app settings |

Catatan penting: Hadith tidak menjadi tab utama sendiri dalam approach ini. Hadith tetap fitur kelas utama, tetapi secara intent lebih cocok berada di Belajar. Kalau Hadith tetap menjadi primary tab, salah satu payung besar seperti Ibadah atau Belajar harus dikorbankan, dan itu membuat fitur backend lain lebih sulit ditemukan.

## Placement Fitur

### Beranda

Beranda harus menjawab: "apa yang perlu saya lakukan sekarang?"

- Jadwal sholat berikutnya dan status lokasi.
- Ayat/hadith harian.
- Shortcut favorit/pinned maksimal 6-8 item.
- Lanjutkan terakhir: surah terakhir, kajian terakhir, dzikir terakhir, atau fitur terakhir dibuka.
- Journal/muhasabah ringkas.
- Notifikasi penting.

Yang tidak masuk Beranda:

- Semua daftar fitur.
- Card panjang untuk semua tracker.
- Settings panjang.

### Al-Quran

Al-Quran harus menjadi tempat semua journey Quran-native.

- List surah, juz/page/hizb navigation.
- Reader ayah virtualized.
- Tafsir dan asbab inline/contextual.
- Audio dan qari preference.
- Hafalan dan murojaah yang berbasis surah/ayah.
- Notes/bookmark Quran.

Profil boleh menampilkan summary hafalan/murojaah, tetapi aksi detailnya tetap masuk ke Al-Quran.

### Ibadah

Ibadah harus menjawab: "saya mau menjalankan atau menyiapkan amalan."

Group yang disarankan:

- Sholat: Jadwal sholat, log sholat, panduan sholat, imsakiyah.
- Arah dan waktu: Qibla, kalender Hijriah.
- Dzikir dan bacaan: Doa, dzikir, wirid, asmaul husna.
- Alat: Tasbih, zakat, faraidh.
- Rencana: Khatam, puasa/Ramadan jika ada.

Prayer screen lama sebaiknya menjadi salah satu feature detail di hub Ibadah, bukan satu tab sempit.

### Belajar

Belajar menggantikan Explore sebagai katalog ilmu yang intentional.

Group yang disarankan:

- Hadith dan ilmu hadith: Hadith, perawi, sanad, jarh-ta'dil, takhrij.
- Tafsir dan ilmu Quran: Tafsir catalog, asbabun nuzul, kamus Quran jika ada.
- Sejarah dan siroh: Siroh, sejarah Islam, manasik.
- Fiqh dan amaliah: Fiqh, panduan ibadah konseptual.
- Media dan evaluasi: Kajian, blog/artikel, quiz, kamus Islami.

Belajar harus punya search dan grouping yang jelas. Hindari flat feature grid panjang.

### Profil

Profil harus menjadi personal hub, bukan katalog semua fitur.

- Session/auth.
- Ringkasan progress: streak, tilawah, hafalan, sholat log, goals.
- Bookmark dan notes lintas fitur.
- Achievement dan leaderboard.
- Offline/data sementara.
- Notification settings.
- App settings.

Personal feature detail boleh tetap berada di konteks asalnya. Contoh: notes Quran dibuka dari Quran reader, tetapi semua notes bisa dilihat dari Profil.

## Delivery Mechanism

Supaya fitur backend tetap terasa lengkap tanpa menu berlebihan, mobile perlu beberapa mekanisme discovery:

1. Global search.
   Search harus bisa menemukan fitur, konten Quran, hadith, kajian, doa, dan kamus.

2. Pinned shortcuts.
   User bisa pin Qibla, Dzikir Pagi, Tafsir, atau fitur lain ke Beranda.

3. Recently opened.
   Beranda menampilkan aktivitas terakhir agar fitur dalam tidak terasa hilang.

4. Contextual recommendations.
   Contoh: pagi tampilkan dzikir pagi, menjelang maghrib tampilkan jadwal/imsakiyah, setelah baca Quran tampilkan tafsir/asbab.

5. Badges.
   Gunakan badge kecil seperti "Butuh akun", "Offline", "Baru", atau "Terakhir dibuka" untuk memperjelas behavior tanpa copy panjang.

## Pattern Detail Screen

Setiap feature detail sebaiknya mengikuti pola yang sama:

- Header compact dengan back action icon.
- Summary singkat atau primary action di atas.
- Search/filter jika list panjang.
- Segmented tabs untuk subkonten yang setara.
- Virtualized list atau pagination.
- Notes/bookmark/action contextual.
- Loading, empty, error, offline, dan auth state eksplisit.

Dengan ini, banyak fitur bisa tetap terasa satu sistem, bukan kumpulan halaman acak.

## Tradeoff

Kelebihan:

- Mobile tetap 5 tab dan mudah dipahami.
- Fitur backend besar tetap punya tempat yang jelas.
- Home tidak berubah menjadi dump menu.
- Journey Quran/Ibadah/Belajar/Profil lebih intentional.
- Bisa diimplementasikan bertahap tanpa rewrite total.

Risiko:

- Hadith turun dari primary tab, sehingga perlu Belajar yang kuat agar tidak terasa disembunyikan.
- Fitur yang bisa masuk dua kategori butuh aturan source of truth.
- Global search dan pinned shortcuts menjadi lebih penting.
- Deep link lama perlu compatibility alias agar tidak rusak.

## Urutan Implementasi

1. Kunci kontrak IA di dokumen.
   Tetapkan 5 tab final, naming, dan placement fitur.

2. Refactor Explore menjadi Belajar.
   Ubah label, grouping, empty state, dan search. Jangan pindahkan semua logic dulu kalau belum perlu.

3. Refactor Prayer menjadi Ibadah.
   Jadikan Prayer/Qibla/Doa/Dzikir/Tasbih/Zakat/Faraidh sebagai feature detail dalam hub Ibadah.

4. Pindahkan Hadith ke Belajar.
   Pertahankan Hadith detail, sanad, perawi, takhrij, notes, dan bookmark. Tambahkan deep link alias dari route lama.

5. Rapikan Profil sebagai personal hub.
   Tarik summary personal dari fitur lain, tetapi jangan duplikasi detail screen.

6. Tambahkan discovery layer.
   Global search, pinned shortcuts, recently opened, dan badges.

## Acceptance Criteria

- Maksimal 5 tab utama.
- Tidak ada tab yang hanya mewakili satu fitur sempit kecuali Al-Quran.
- Setiap fitur backend punya minimal satu entry point yang jelas.
- Fitur personal punya entry di Profil atau konteks asal.
- Fitur panjang memakai detail screen, tabs, pagination, atau virtualization.
- Deep link lama tetap diarahkan ke screen baru.
- Beranda tetap ringkas dan kontekstual, bukan katalog.

## Pertanyaan Untuk Dibandingkan Dengan Approach Agent Lain

- Apakah Hadith lebih baik tetap primary tab, atau turun ke Belajar?
- Apakah Asmaul Husna ditempatkan utama di Ibadah atau Belajar?
- Apakah Profil menjadi personal hub saja, atau juga menjadi katalog semua fitur yang butuh akun?
- Apakah Ibadah cukup sebagai hub baru, atau perlu screen khusus Prayer tetap first-class?
- Seberapa cepat global search dan pinned shortcuts harus dibuat agar fitur dalam tetap discoverable?
