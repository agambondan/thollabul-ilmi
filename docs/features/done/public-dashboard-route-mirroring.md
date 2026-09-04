# Public and Dashboard Route Mirroring Architecture

## Overview

Aplikasi web Thollabul 'Ilmi memiliki pola arsitektur **Route Mirroring**: banyak fitur Islam utama tersedia dalam dua konteks layout/navigasi yang berbeda:

1. **Public Route (`/*`)**: Ditujukan untuk akses publik tanpa autentikasi, SEO-friendly, layout landing page dengan header/footer publik.
2. **Dashboard / Private Route (`/dashboard/*`)**: Ditujukan untuk pengguna terautentikasi (atau mode dashboard terfokus), menggunakan shell navigasi sidebar, layout dashboard, dan integrasi preferensi personal akun.

---

## Daftar Route yang Memiliki Mirroring

Berikut daftar pasangan route public vs dashboard yang saling me-mirror fitur yang sama:

| Fitur                     | Public Route              | Dashboard Route (`/dashboard/*`)              | Keterangan & Sinkronisasi                                                                                              |
| ------------------------- | ------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Jadwal Sholat**         | `/jadwal-sholat`          | `/dashboard/jadwal-sholat`                    | Keduanya berbagi pengaturan notifikasi adzan, jeda per waktu sholat, dan preferensi metode/madhab lewat `useSettings`. |
| **Al-Quran Mushaf**       | `/quran/page-mushaf`      | `/dashboard/quran/page-mushaf`                | Pembaca mushaf berbasis halaman Madinah.                                                                               |
| **Al-Quran Surah**        | `/quran`                  | `/dashboard/quran`                            | Daftar surah dan pencarian ayat Al-Quran.                                                                              |
| **Hadits**                | `/hadith`                 | `/dashboard/hadith`                           | Pencarian & pembaca hadits 9 kitab (Kutubut Tis'ah).                                                                   |
| **Tafsir**                | `/tafsir`                 | `/dashboard/tafsir`                           | Baca tafsir per surah & kitab tafsir rujukan.                                                                          |
| **Dzikir & Doa**          | `/dzikir`, `/doa`         | `/dashboard/dzikir`, `/dashboard/doa`         | Kumpulan doa harian, dzikir pagi & petang.                                                                             |
| **Wirid & Wirid Custom**  | `/wirid`, `/wirid-custom` | `/dashboard/wirid`, `/dashboard/wirid-custom` | Bacaan wirid setelah sholat fardhu & kustomisasi.                                                                      |
| **Tasbih Digital**        | `/tasbih`                 | `/dashboard/tasbih`                           | Penghitung dzikir dengan feedback getar/haptic.                                                                        |
| **Sholat Tracker**        | `/sholat-tracker`         | `/dashboard/sholat-tracker`                   | Catatan tracking sholat wajib & sunnah harian.                                                                         |
| **Panduan Sholat**        | `/panduan-sholat`         | `/dashboard/panduan-sholat`                   | Rukun, bacaan, dan tata cara sholat.                                                                                   |
| **Kajian**                | `/kajian`                 | `/dashboard/kajian`                           | Jadwal dan rekaman kajian Islam.                                                                                       |
| **Tilawah & Hafalan**     | `/tilawah`, `/hafalan`    | `/dashboard/tilawah`, `/dashboard/hafalan`    | Pencatatan progres tilawah dan hafalan Al-Quran.                                                                       |
| **Muroja'ah**             | `/muroja-ah`              | `/dashboard/muroja-ah`                        | Uji dan evaluasi ingatan hafalan ayat.                                                                                 |
| **Amalan & Muhasabah**    | `/amalan`, `/muhasabah`   | `/dashboard/amalan`, `/dashboard/muhasabah`   | Checklist amalan yaumiyah dan evaluasi diri.                                                                           |
| **Arah Kiblat**           | `/kiblat`                 | `/dashboard/kiblat`                           | Kompas kiblat berbasis geolokasi & sensor perangkat.                                                                   |
| **Asmaul Husna**          | `/asmaul-husna`           | `/dashboard/asmaul-husna`                     | 99 Asmaul Husna beserta arti dan dalilnya.                                                                             |
| **Siroh & Sejarah**       | `/siroh`, `/sejarah`      | `/dashboard/siroh`, `/dashboard/sejarah`      | Sejarah Nabi Muhammad ﷺ dan peradaban Islam.                                                                           |
| **Khatam Quran**          | `/khatam`                 | `/dashboard/khatam`                           | Kalkulator dan tracker target khatam Al-Quran.                                                                         |
| **Manasik Haji/Umrah**    | `/manasik`                | `/dashboard/manasik`                          | Panduan rukun dan tata cara ibadah haji & umrah.                                                                       |
| **Perawi Hadits**         | `/perawi`                 | `/dashboard/perawi`                           | Biografi perawi hadits dan sanad.                                                                                      |
| **Zakat & Faraidh**       | `/zakat`, `/faraidh`      | `/dashboard/zakat`, `/dashboard/faraidh`      | Kalkulator perhitungan zakat maal/fitrah dan waris.                                                                    |
| **Kalender Hijriah**      | `/hijri`, `/imsakiyah`    | `/dashboard/hijri`, `/dashboard/imsakiyah`    | Penanggalan Islam dan jadwal imsakiyah Ramadhan.                                                                       |
| **Pencarian Global**      | `/search`                 | `/dashboard/search`                           | Mesin cari lintas domain (Quran, hadits, doa, artikel).                                                                |
| **Fiqih & Asbabun Nuzul** | `/fiqh`, `/asbabun-nuzul` | `/dashboard/fiqh`, `/dashboard/asbabun-nuzul` | Materi dasar fiqih ibadah & sebab turunnya ayat.                                                                       |

---

## Aturan Pengembangan untuk Rute Mirrored

Saat melakukan perbaikan atau penambahan fitur pada rute yang di-mirror:

1. **Prinsip Paritas Fungsional**:
    - Jika suatu kontrol logika atau interaksi diperbaiki di versi publik (misal: perbaikan responsivitas layout suara adzan di `/jadwal-sholat`), pastikan versinya di dashboard (`/dashboard/jadwal-sholat`) juga diperiksa dan memiliki fitur setara.
    - Sumber state inti harus menggunakan hook atau context yang sama (misal `useSettings`, `useQuranFont`, `useLocale`).
2. **Internal Navigation Consistency**:
    - Link CTA atau link navigasi internal di dalam `/dashboard/*` **harus tetap mengarah ke `/dashboard/*`**, tidak boleh membocorkan user kembali ke rute publik tanpa alasan eksplisit.
3. **Responsivitas Mobile**:
    - Karena pengguna sering membuka versi publik via browser mobile maupun dashboard di layar smartphone, seluruh form filter (seperti pemilihan kota, suara adzan, dropdown jeda waktu) wajib menggunakan pola responsif:
        - Container kontrol di layar kecil: `flex flex-col sm:flex-row`.
        - Select / button diberi `w-full sm:w-auto min-w-0` agar tidak memicu horizontal scrolling / overflow pada viewport mobile (<480px).
