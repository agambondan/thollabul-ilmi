# Mobile IA — Approach A (Claude Sonnet)

> Status: proposal pembanding, bukan dokumen utama.
> Source of truth terbaru: `docs/MOBILE_IA_FINAL_APPROACH.md`.

> Dokumen ini adalah proposal arsitektur informasi (IA) untuk mobile app
> Thollabul Ilmi. Ditulis sebagai bahan perbandingan sebelum keputusan
> implementasi diambil.

---

## Prinsip Dasar

**Primary content tidak boleh di-demote.**
Quran dan Hadith adalah alasan utama user membuka app Islamic setiap hari.
Keduanya harus first-class tabs, bukan menu di dalam katalog.

**Tab bar = top-level intent, bukan content taxonomy.**
User tidak berpikir "saya mau buka fitur Tasbih". Mereka berpikir "saya mau
ibadah sekarang" atau "saya mau belajar sesuatu". Tab harus mencerminkan intent
itu, bukan daftar fitur backend.

**Setiap tab adalah hub, bukan list.**
Tab tidak boleh langsung menampilkan flat list fitur. Tiap tab punya section
yang terorganisir sehingga user bisa scan cepat ke mana harus pergi.

---

## Struktur Tab (5 Tab)

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Beranda  │  Quran   │  Hadis   │  Ibadah  │ Belajar  │
│  🏠       │  📖       │  📜       │  🕌       │  🎓       │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Tab 1 — Beranda

**Tujuan**: Cockpit harian. Bukan menu besar — hanya yang paling relevan hari ini.

Konten:

- Waktu sholat berikutnya + countdown
- Ayat dan Hadith harian
- 6–8 shortcut kontekstual (berubah sesuai waktu/kebiasaan user)
- Card "Lanjutkan" (surah/hadis terakhir dibuka)
- Pengingat streak / goals ringkas
- Notifikasi inbox (jika ada)

**Aturan ketat**: Beranda bukan duplikasi Explore. Beranda hanya surface
konten yang paling relevan — bukan tempat semua fitur tampil.

---

### Tab 2 — Quran

**Tujuan**: Semua perjalanan yang berawal dari Al-Quran.

Konten (internal tabs/sections):

- **Surah** — daftar surah + search + diamond number
- **Hafalan** — tracker per surah (Belum / Sedang / Hafal)
- **Murojaah** — log sesi murojaah + skor

Embedded (dalam reader, bukan menu terpisah):

- Tafsir (per ayat)
- Asbabun Nuzul (per ayat)
- Audio qari
- Catatan ayat
- Bookmark ayat
- Progress per ayat
- Hafalan mode (sembunyikan Arab/terjemah)

**Prinsip**: Tafsir dan Asbab bukan fitur tersendiri — mereka adalah lapisan
yang membuka ketika user berada di dalam reader. Tidak perlu tab khusus.

---

### Tab 3 — Hadis

**Tujuan**: Semua perjalanan yang berawal dari Hadis. First-class tab, setara Quran.

Konten:

- Filter kitab (chip horizontal: Bukhari, Muslim, dll)
- Daftar hadis dengan preview
- Hadis tersimpan (jika login)

Embedded (dalam detail hadis):

- Sanad + chain perawi
- Takhrij (rujukan kitab lain)
- Jarh wa Ta'dil per perawi
- Biografi perawi (Guru / Murid)
- Catatan hadis
- Bookmark hadis

**Prinsip yang sama dengan Quran**: Perawi, Sanad, Takhrij adalah lapisan
kontekstual dalam detail — bukan menu di Ilmu/Explore.

---

### Tab 4 — Ibadah

**Tujuan**: Semua yang dilakukan user saat beribadah atau sebagai sarana ibadah.

Dibagi dalam 3 section visual:

**Harian** (ibadah yang dilakukan setiap hari):

- Jadwal Sholat + Log Sholat Harian
- Doa (doa sehari-hari, pilah per kategori)
- Dzikir (pagi, petang, setelah sholat)

**Alat** (tools yang dibutuhkan untuk ibadah):

- Kiblat / Kompas
- Tasbih digital
- Zakat (kalkulator)
- Faraidh (kalkulator waris)

**Rencana** (ibadah yang direncanakan):

- Khatam (tracker khatam Quran)
- Puasa Sunnah (jadwal + tracker)
- Manasik (panduan haji/umrah)

**Prinsip**: Ibadah adalah tab dengan sub-section, bukan flat grid. User
scrolls dan tap section, bukan memilih dari 20 ikon.

---

### Tab 5 — Belajar

**Tujuan**: Konten ilmu Islam yang bisa dieksplorasi, + semua fitur personal user.

Dibagi dalam 2 area:

**Ilmu Islam** (konten yang bisa dipelajari):

- Kajian (artikel/audio kajian)
- Fiqh (panduan hukum Islam)
- Siroh (biografi Nabi)
- Sejarah Islam
- Asmaul Husna
- Kamus Arab-Indonesia
- Quiz Islami
- Blog

**Personal** (fitur yang butuh akun):

- Bookmarks (Quran, Hadis, Explore)
- Catatan / Notes
- Goals & Target Belajar
- Leaderboard Streak
- Stats Ibadah
- Pengaturan Profil + Akun

**Prinsip**: Tab Belajar menggabungkan konten ilmu dan personal karena keduanya
jarang diakses sesering Quran/Hadis/Ibadah. Ini menghilangkan kebutuhan tab
Profil yang berdiri sendiri.

---

## Perbedaan dengan Proposal Agent Sebelah

| Aspek           | Agent Sebelah             | Approach A (ini)                                  |
| --------------- | ------------------------- | ------------------------------------------------- |
| Hadis           | Masuk tab "Ilmu"          | Dedicated tab (setara Quran)                      |
| Tab ke-5        | "Profil" sendiri          | "Belajar" (Ilmu + Profil digabung)                |
| Explore         | Tetap ada sebagai Katalog | Dihilangkan, kontennya dibagi ke Ibadah & Belajar |
| Profil/Personal | Tab tersendiri            | Section di dalam tab Belajar                      |

**Alasan utama perbedaan**:

Hadith adalah _primary reading content_, bukan _learning feature_. App Islamic
yang menaruh Hadis di dalam menu Ilmu sama seperti app berita yang menaruh
artikel utama di dalam submenu. User tidak akan menemukannya secara natural.

Tab Profil yang berdiri sendiri cenderung underutilized — isinya sedikit dan
jarang dibuka. Menggabungkannya ke Belajar mengisi tab tersebut dengan konten
yang lebih kaya sekaligus mempertahankan aksesibilitas fitur personal.

---

## Template Detail yang Konsisten

Setiap feature yang punya halaman detail mengikuti satu pola:

```
┌─────────────────────────────────┐
│ Header: judul + meta + [back]   │
│ (optional) search / filter bar  │
├─────────────────────────────────┤
│ Tab internal (jika konten banyak│
│ misal: Teks | Sanad | Takhrij)  │
├─────────────────────────────────┤
│ Content list (virtualized)      │
│ ...                             │
│ ...                             │
├─────────────────────────────────┤
│ Action pills: bookmark, note,   │
│ share, audio                    │
└─────────────────────────────────┘
```

Empty, loading, dan error state wajib ada di setiap screen.

---

## Prioritas Implementasi

Urutan yang disarankan, dari yang paling berdampak:

1. **Refactor ExploreScreen → IbadahScreen** (tab 4)
   Buat hub section Harian / Alat / Rencana.
   Feature yang sudah ada (Tasbih, Zakat, Faraidh, Doa, Dzikir) dipindah ke sini.

2. **Buat BelajarScreen** (tab 5, menggantikan Explore)
   Katalog ilmu + section personal.
   Search fitur/konten, kategori horizontal, badge Offline/Baru.

3. **Perkuat Beranda sebagai cockpit**
   Shortcut kontekstual, card Lanjutkan, streak ringkas.

4. **Quran & Hadis stay** — sudah solid, tinggal polish minor.

5. **Back navigation & deep link** — sudah selesai (setBack/clearBack pattern).

---

## Yang Tidak Berubah

- Pattern `Card` / `CardTitle` / `Screen` / `Paper` — tetap.
- Pattern `setBack`/`clearBack` untuk back navigation — tetap.
- API layer (`apps/mobile/src/api/`) — tidak perlu diubah.
- Storage, preferences, offline pack — tidak perlu diubah.
- Bottom tab bar styling — hanya rename label + ganti icon.
