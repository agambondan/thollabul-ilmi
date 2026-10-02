# Bukti Visual: Mode Lebar Penuh (Full Width) & Fokus Belajar Pembaca Teks Perpustakaan

## Ringkasan Perubahan
Menambahkan opsi mode **Lebar Penuh (Full Width / Fokus Belajar)** dan penyempurnaan user interface untuk kenyamanan belajar saat membaca teks buku/kitab:
1. **Mode Lebar Penuh (Full Width / Fokus Belajar):**
   - Mengembangkan pembaca teks ke lebar penuh layar tanpa tertekan oleh kolom informasi buku di sebelah kiri.
   - Kolom teks dibatasi secara ergonomis (`max-w-3xl` / `max-w-4xl mx-auto`) dengan margin dan padding yang lega agar mata tidak cepat lelah saat membaca di monitor lebar (1920px).
   - Banner notifikasi mode fokus dengan tombol cepat "Kembali ke Split View".
   - Pintasan keyboard: tekan `F` untuk toggle Lebar Penuh / Split View, tekan `Esc` untuk kembali ke Split View.
2. **Tema Kertas Baca (Paper Themes):**
   - ☀️ **Terang (Light):** Tampilan putih/slate bersih standar.
   - 📜 **Sepia (Kertas Kitab):** Latar kertas hangat (`#faf6ee`) dengan teks cokelat gelap yang lembut di mata untuk muthala'ah lama.
   - 🌙 **Gelap (Dark):** Latar slate gelap kontras rendah untuk membaca di kondisi temaram.
3. **Penyempurnaan Teks Asli (Raw View) & Tipografi Belajar:**
   - Pemisahan paragraf terstruktur dengan `line-height: 1.95`.
   - Statistik membaca halaman: jumlah kata dan estimasi waktu baca (`~X mnt baca`).

## Screenshot

| No | Tampilan | Gambar | Keterangan |
|---|---|---|---|
| 01 | Split View (Sebelumnya) | `01-split-view-before.png` | Pembaca teks terhimpit di kolom kanan 50% |
| 02 | Mode Lebar Penuh (Teks Asli) | `02-fullwidth-raw-after.png` | Layar penuh fokus belajar dengan kolom baca terpusat dan ergonomis |
| 03 | Mode Sepia (Kertas Kitab) | `03-fullwidth-sepia-after.png` | Tema kertas sepia hangat untuk kenyamanan belajar muthala'ah |

## Lingkungan Pengujian
- Chromium 1440x900 (deviceScaleFactor: 2)
- Next.js Web App (`apps/web`)
- URL: `/library/al-kaba-ir-dosa-dosa-besar`
