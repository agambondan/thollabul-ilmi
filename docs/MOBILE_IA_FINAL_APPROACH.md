# Mobile IA Final Approach

> Canonical source of truth for mobile information architecture.
> Semua keputusan IA mobile terbaru harus mengacu ke dokumen ini.

> Created: 2026-05-07
> Scope: `apps/mobile`
> Inputs:
>
> - `docs/MOBILE_IA_APPROACH_A.md`
> - `docs/MOBILE_INFORMATION_ARCHITECTURE_APPROACH_CODEX.md`
> - `docs/MOBILE_FEATURE_REFERENCE.md`
> - `docs/MOBILE_UX_REVIEW.md`
>   Implementation tasklist: `docs/MOBILE_IA_REVAMP_TASKLIST.md`

## Final Decision

Gunakan 5 tab utama:

| Tab     | Role                               | Keputusan                                                       |
| ------- | ---------------------------------- | --------------------------------------------------------------- |
| Beranda | Contextual dashboard               | Tetap menjadi cockpit harian dan delivery surface               |
| Quran   | Primary reading content            | Tetap first-class tab                                           |
| Hadis   | Primary reading/reference content  | Tetap first-class tab                                           |
| Ibadah  | Daily worship hub                  | Menggantikan tab Prayer yang terlalu sempit                     |
| Belajar | Knowledge + personal secondary hub | Menggantikan Explore/Profile sebagai hub discovery dan personal |

Profil tidak menjadi tab utama. Profil tetap penting, tetapi di mobile ia lebih tepat menjadi account/settings surface yang bisa diakses dari avatar/header dan section Personal di tab Belajar. Keputusan ini menjaga tab bar tetap 5 item sambil mempertahankan Quran dan Hadis sebagai dua konten utama aplikasi Islamic.

## Layout Mode Policy

IA final ini mengatur struktur navigasi utama, bukan memaksa satu visual layout
untuk semua user.

Mobile app boleh punya layout mode yang bisa dipilih user selama tetap patuh ke
5 tab final: Beranda, Quran, Hadis, Ibadah, Belajar. Kode dan UX mobile app
lama tetap dipertahankan sebagai mode `classic`, sedangkan layout baru yang
terinspirasi mobile web dashboard menjadi mode `web_app`.

Detail keputusan layout mode ada di
[`MOBILE_LAYOUT_MODES.md`](./MOBILE_LAYOUT_MODES.md).

## Why This Hybrid Wins

Approach A benar bahwa Quran dan Hadis adalah primary content. Kalau Hadis dimasukkan ke katalog Belajar, ia berisiko terasa seperti fitur sekunder, padahal hadis adalah salah satu alasan utama user membuka app.

Approach Codex benar bahwa mobile butuh intent-first IA, bukan backend-feature-list. Ia juga benar bahwa fitur long-tail harus diantarkan lewat hub, search, pinned shortcut, recently opened, dan contextual delivery.

Gabungan terbaiknya:

- Ambil dari Approach A: Hadis tetap first-class tab.
- Ambil dari Approach Codex: discovery layer wajib ada supaya fitur backend melimpah tetap terdeliver tanpa flat menu.
- Ambil dari keduanya: Ibadah dan Belajar menjadi hub, bukan list fitur.
- Koreksi dari Approach A: Belajar tidak boleh menjadi dumping ground semua personal; personal hanya section ringkas, sedangkan account/settings tetap surface khusus via avatar.
- Koreksi dari Codex: Profil sebagai tab utama kalah prioritas dibanding Hadis untuk product Islamic reading app.

## Comparison Summary

| Decision Area       | Approach A               | Approach Codex         | Final                              |
| ------------------- | ------------------------ | ---------------------- | ---------------------------------- |
| Max tab count       | 5                        | 5                      | 5                                  |
| Hadis               | Primary tab              | Dalam Belajar          | Primary tab                        |
| Profil              | Section di Belajar       | Primary tab            | Account surface + Personal section |
| Explore             | Dihilangkan              | Jadi Belajar           | Jadi Belajar                       |
| Prayer              | Jadi Ibadah              | Jadi Ibadah            | Jadi Ibadah                        |
| Long-tail features  | Dibagi ke Ibadah/Belajar | Hub + search/favorites | Hub + search/favorites/recent      |
| Contextual delivery | Ada di Beranda           | Kuat                   | Wajib                              |

## Navigation Model

### 1. Beranda

Beranda menjawab: "apa yang relevan untuk saya sekarang?"

Isi utama:

- Jadwal sholat berikutnya dan status lokasi.
- Bacaan harian: ayat dan hadis.
- Shortcut kontekstual 6-8 item.
- Lanjutkan terakhir: Quran, Hadis, kajian, dzikir, atau fitur terakhir dibuka.
- Journal/muhasabah ringkas.
- Notifikasi penting.
- Avatar/account button untuk membuka Profil/Settings.

Beranda tidak boleh menjadi katalog semua fitur.

### 2. Quran

Quran menjawab: "saya mau membaca, mendengar, menghafal, atau memahami Al-Quran."

Isi utama:

- Surah list.
- Reader virtualized.
- Navigasi juz/page/hizb.
- Tafsir dan asbab inline di reader.
- Audio/qari preference.
- Hafalan dan murojaah berbasis surah/ayah.
- Notes dan bookmark ayat.

Tafsir/asbab boleh punya entry di Belajar untuk discovery, tetapi pengalaman utamanya tetap contextual di Quran reader.

### 3. Hadis

Hadis menjawab: "saya mau membaca, mencari, menyimpan, atau meneliti hadis."

Isi utama:

- Filter kitab horizontal.
- List hadis dengan preview.
- Search hadis.
- Detail hadis dengan internal tabs: Teks, Sanad, Perawi, Takhrij, Catatan.
- Saved hadith, notes, dan bookmark.
- Perawi, sanad, jarh-ta'dil, dan takhrij sebagai lapisan contextual, bukan menu terpisah utama.

Belajar boleh punya entry "Ilmu Hadis" atau "Perawi" sebagai shortcut, tetapi detail authority tetap di tab Hadis.

### 4. Ibadah

Ibadah menjawab: "saya mau menjalankan ibadah atau memakai alat ibadah."

Section:

- Harian: Jadwal sholat, log sholat, doa, dzikir pagi/petang, dzikir setelah sholat.
- Alat: Qibla, tasbih, zakat, faraidh.
- Rencana: Khatam, puasa sunnah/Ramadan, imsakiyah, manasik.
- Bacaan: Wirid, tahlil, asmaul husna.

Prayer screen lama menjadi feature detail dalam Ibadah, bukan tab sendiri.

### 5. Belajar

Belajar menjawab: "saya mau eksplor ilmu dan referensi."

Section:

- Kajian dan artikel: Kajian, blog.
- Siroh dan sejarah: Siroh, sejarah Islam, manasik konseptual.
- Fiqh dan panduan: Fiqh, panduan sholat, amaliah.
- Referensi: Kamus Islami, asmaul husna, perawi shortcut.
- Evaluasi: Quiz.
- Personal ringkas: goals, stats, leaderboard, bookmarks, notes.

Belajar harus searchable dan grouped. Hindari feature grid flat panjang.

## Profile And Settings Placement

Profil tetap ada sebagai screen, tetapi bukan bottom tab.

Entry point:

- Avatar di Beranda header.
- Avatar/account action di Belajar header.
- Personal section di Belajar.
- Shortcut dari auth-required empty states: "Masuk dari Profil".

Isi Profil:

- Session/auth.
- Account settings.
- Notification settings.
- Offline/data sementara.
- App settings.
- Full personal overview.

Rationale:

- Bottom tab perlu dipakai untuk high-frequency top-level intent.
- Profil/settings penting, tetapi intensitas aksesnya lebih rendah dari Quran/Hadis/Ibadah/Belajar.
- Akses lewat avatar adalah pattern mobile yang umum dan tidak menyembunyikan akun.

## Feature Placement Rules

1. Jika fitur dipakai saat ibadah, masuk Ibadah.
   Contoh: jadwal sholat, qibla, doa, dzikir, tasbih, zakat, faraidh, khatam.

2. Jika fitur dipakai untuk membaca primary source, masuk Quran atau Hadis.
   Contoh: Quran reader, tafsir inline, hadith detail, sanad, perawi.

3. Jika fitur dipakai untuk eksplor ilmu, masuk Belajar.
   Contoh: kajian, siroh, sejarah, fiqh, blog, quiz, kamus.

4. Jika fitur adalah personal state, tampilkan summary di Belajar/Profil, tetapi action detail tetap di konteks asal bila ada.
   Contoh: hafalan detail di Quran; summary hafalan di Personal.

5. Jika fitur masuk dua intent, boleh punya dua entry point tetapi satu source screen.
   Contoh: Asmaul Husna bisa muncul di Ibadah sebagai bacaan/dzikir dan di Belajar sebagai referensi, tetapi detail screen tetap satu.

## Discovery Layer

Karena fitur backend banyak, final IA wajib punya discovery layer:

- Global search untuk fitur dan konten.
- Pinned shortcuts di Beranda.
- Recently opened di Beranda.
- Contextual recommendations berdasarkan waktu dan aktivitas.
- Badge kecil: Butuh akun, Offline, Baru, Terakhir dibuka.
- Deep link alias untuk route lama.

Tanpa discovery layer, hub akan berubah menjadi menu panjang dan masalah lama kembali.

## Implementation Plan

### Phase 1 - Contract And Compatibility

- Kunci tab final: Beranda, Quran, Hadis, Ibadah, Belajar.
- Buat route alias lama agar deep link `profile`, `prayer`, dan `explore` tetap aman.
- Tetapkan mapping feature key ke hub final.

### Phase 2 - Ibadah Hub

- Refactor Prayer tab menjadi Ibadah.
- Masukkan Qibla, Doa, Dzikir, Tasbih, Zakat, Faraidh, Khatam, Wirid/Tahlil.
- Jadwal sholat tetap menjadi primary card di hub Ibadah.

### Phase 3 - Belajar Hub

- Refactor Explore menjadi Belajar.
- Group fitur ilmu dan referensi.
- Tambahkan Personal section ringkas.
- Tambahkan search/filter feature katalog.

### Phase 4 - Profile Surface

- Pindahkan Profil dari bottom tab ke avatar/account screen.
- Pastikan auth-required states tetap punya CTA yang jelas.
- Profil tetap punya settings detail: account, notification, offline, cache, security.

### Phase 5 - Home Delivery

- Tambahkan recently opened.
- Tambahkan pinned shortcuts.
- Tambahkan contextual shortcuts berdasarkan waktu.

### Phase 6 - Verification

- Web screenshot smoke untuk semua tab baru.
- Native smoke untuk Android Expo Go.
- Deep link smoke untuk route lama dan route baru.
- `npx expo export --platform web`.
- `npx expo-doctor`.

## Acceptance Criteria

- Bottom tab tetap 5 item.
- Quran dan Hadis tetap first-class.
- Prayer tidak lagi menjadi tab sempit; diganti Ibadah.
- Explore tidak lagi flat; diganti Belajar.
- Profil tetap mudah diakses lewat avatar dan Personal section.
- Setiap fitur backend punya minimal satu entry point yang jelas.
- Tidak ada hub yang menjadi list 20+ item tanpa grouping.
- Fitur kompleks tetap memakai detail screen, internal tabs, pagination, atau virtualization.
- Deep link lama tetap bekerja via alias.

## Open Decisions

- Nama tab Quran: `Quran` atau `Al-Quran`.
- Nama tab Hadis: `Hadis` atau `Hadith`; pilih satu bahasa di seluruh mobile.
- Apakah Asmaul Husna primary placement di Ibadah atau Belajar; final sementara: tampil di dua entry point dengan satu detail screen.
- Apakah Personal section di Belajar cukup, atau perlu account icon persistent di semua tab; final sementara: account icon minimal di Beranda dan Belajar.
