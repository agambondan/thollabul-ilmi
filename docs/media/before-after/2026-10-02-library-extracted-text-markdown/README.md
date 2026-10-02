# Bukti Visual UI/UX — Library Reader Formatted Docs & Markdown Mode

## Ringkasan Perubahan

Menambahkan formatting cerdas (Dokumen Rapi / Docs View), tampilan kode Markdown (.md), teks asli (Raw), dan fitur ekspor/unduh `.md` pada pembaca teks hasil ekstraksi buku perpustakaan (`/library/[slug]`).

- **Sebelum:** Teks hasil ekstraksi PDF dirender polos (*raw plain text*) dengan `whitespace-pre-wrap` tanpa penataan heading, kutipan ayat/hadis, teks Arab, maupun list.
- **Sesudah:**
  1. **Mode Dokumen Rapi:** Otomatis memformat judul/bab (`## / ###`), blok kutipan dalil/firman/hadits dengan aksen emerald dan label surat/hadits, blok teks Arab dengan RTL dan font arab, list poin, serta tipografi nyaman dibaca.
  2. **Mode Markdown:** Menampilkan source code Markdown lengkap dengan tombol *Salin .md* dan *Unduh .md*.
  3. **Mode Teks Asli:** Opsi melihat teks mentah 1:1 sesuai hasil ekstraksi.
  4. **Kontrol Tipografi:** Pilihan font Serif (Klasik Buku) vs Sans-Serif (Modern) serta kontrol pembesaran teks (`A-` / `A+`).

## Tabel Bukti

| No | Layar / Fitur | Sebelum | Sesudah | Keterangan |
|---|---|---|---|---|
| 01 | Pembaca Teks Buku (`/library/[slug]`) | `01-library-reader-before.png` | `01-library-reader-after.png` | Teks polos vs format Dokumen Rapi, selector mode (Dokumen/Markdown/Teks Asli), tombol Unduh .md & Salin .md |

## Lingkungan Pengujian

- URL: `http://localhost:3000/library/al-kaba-ir-dosa-dosa-besar`
- Viewport: Desktop (1440x900) & Mobile
- Tema: Terang & Gelap (Tailwind Dark Mode)
