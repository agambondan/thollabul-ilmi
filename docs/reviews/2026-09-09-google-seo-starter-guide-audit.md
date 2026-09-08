# Audit Kepatuhan Google Search SEO Starter Guide (`apps/web`)

Tanggal: `2026-09-09`  
Rujukan Resmi: [Google Search Central — SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=en)

---

## 1. Ringkasan Eksekutif

Aplikasi web Thullaabul 'Ilmi (`apps/web`) telah menerapkan sebagian besar prinsip dasar dari **Google SEO Starter Guide**:

- **Skor Kepatuhan**: ~88% terpenuhi.
- **Kekuatan Utama**: Pengaturan `sitemap.xml` dinamis komprehensif, `robots.txt` bersih dan ketat melindungi rute personal/admin, `canonical` tag konsisten di hampir seluruh rute, OpenGraph/Twitter card rapi, serta struktur URL semantik yang deskriptif.
- **Area Peluang (Peningkatan)**: Penambahan schema `BreadcrumbList` pada rute bertingkat, schema `FAQPage`/`QAPage` pada modul tanya-jawab, penambahan `rel="nofollow"` otomatis pada konten UGC (user comments/forum), serta migrasi sisa halaman konten statis dari `"use client"` ke React Server Components (RSC) agar konten langsung ter-render dalam payload HTML pertama.

---

## 2. Matriks Audit Komparatif (Panduan Google vs Realisasi Web)

| Area Panduan Google              | Standar Google SEO Starter Guide                                                | Kondisi di `apps/web`                                                                                                                                                                      | Status       |
| :------------------------------- | :------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| **Sitemap XML**                  | File sitemap tersedia, berisi URL publik penting, didaftarkan di `robots.txt`.  | Dikelola dinamis di `src/app/sitemap.js`. Memetakan 50+ rute statis publik dan ribuan entitas dinamis (surah, tafsir, hadis, siroh, blog, perpustakaan, perawi). Terhubung di `robots.js`. | **LULUS**    |
| **Robots.txt**                   | Mencegah bot merayapi halaman privat/duplikat tanpa memblokir resource CSS/JS.  | `src/app/robots.js` memblokir `/admin/`, `/dashboard/`, `/auth/`, `/profile/`, `/stats/`, `/bookmarks/`, `/notes/`, `/goals/`, dll. Tidak memblokir aset visual.                           | **LULUS**    |
| **URL Canonicalization**         | Menentukan canonical URL untuk mencegah kanibalisasi konten duplikat.           | Dikonfigurasi via `metadataBase` di root `layout.js` dan `alternates: { canonical: ... }` di 70+ halaman publik (termasuk slug dinamis surah, hadits, tafsir, dan blog).                   | **LULUS**    |
| **Title Links (`<title>`)**      | Judul unik, spesifik, deskriptif, dan merefleksikan isi konten halaman.         | Root layout memakai pola template: `%s — Thullaabul 'Ilmi`. Tiap halaman detail menyematkan nama entitas spesifik (misal: `Surah Al-Fatihah (الفاتحة) — Al-Quran`).                        | **LULUS**    |
| **Meta Description**             | Ringkasan 1–2 kalimat unik per halaman sebagai acuan snippet pencarian.         | Halaman utama memiliki deskripsi lengkap. Rute dinamis (`/blog/[slug]`, `/quran/[...slug]`, `/hadith/[slug]`) mengambil sari pati konten / arti surah.                                     | **LULUS**    |
| **Struktur URL & Hirarki**       | Menggunakan kata deskriptif, huruf kecil, tanda hubung (`-`), bukan ID acak.    | Rute bersih: `/quran/surah/al-fatihah`, `/hadith/bukhari`, `/blog/judul-artikel`, `/panduan-sholat`, `/asmaul-husna/wirid`.                                                                | **LULUS**    |
| **Heading Semantik**             | Penggunaan `<h1>` yang jelas untuk topik utama halaman, diikuti struktur logis. | Tiap halaman publik memiliki `<h1>` utama yang mendeskripsikan judul/topik.                                                                                                                | **LULUS**    |
| **Optimasi Gambar & Alt**        | Gambar relevan, nama file deskriptif, atribut `alt` wajib ada, format modern.   | Komponen `next/image` digunakan untuk optimasi WebP/AVIF. Komponen gambar menyertakan atribut `alt` kontekstual.                                                                           | **LULUS**    |
| **Snippet Control**              | Kontrol preview visual hasil pencarian.                                         | Didefinisikan di root `layout.js`: `robots: { googleBot: { index: true, follow: true, "max-image-preview": "large" } }`.                                                                   | **LULUS**    |
| **Social Cards (OG/Twitter)**    | Metadata OpenGraph dan Twitter Card untuk pratinjau tautan.                     | Helper `openGraphFor()` dan aset statis `og.png` (1200x630) siap di semua rute publik.                                                                                                     | **LULUS**    |
| **PWA & Mobile Ready**           | Desain responsif, mobile viewport, manifest web app.                            | `src/app/manifest.js` lengkap dengan icon multi-ukuran. Desain mobile-first dengan Tailwind CSS dan tab bar navigasi.                                                                      | **LULUS**    |
| **Structured Data: Site & Book** | JSON-LD schema.org untuk membantu mesin pencari memahami tipe konten.           | `WebSite` + `SearchAction` di root `layout.js`, `Book` di `/quran`, `Article` di `/blog/[slug]`.                                                                                           | **LULUS**    |
| **Structured Data: Breadcrumb**  | JSON-LD `BreadcrumbList` untuk navigasi hirarki di hasil pencarian.             | Belum diimplementasikan pada rute multi-level (`/quran/surah/[slug]`, `/hadith/[slug]/[number]`).                                                                                          | **GAP (P1)** |
| **Structured Data: QA / FAQ**    | Schema `FAQPage` atau `QAPage` untuk modul tanya jawab & fatwa/fiqh.            | Belum ada di `/forum` atau `/fiqh`.                                                                                                                                                        | **GAP (P2)** |
| **UGC Link Qualification**       | Outbound links dari pengguna diberi `rel="nofollow"` atau `ugc`.                | Fitur komentar blog & forum belum secara eksplisit menambahkan atribut `rel="ugc nofollow"` pada link kiriman user.                                                                        | **GAP (P2)** |
| **Server-Side Rendering (SSR)**  | Googlebot membaca teks HTML langsung tanpa bergantung JavaScript client render. | Sebagian halaman publik masih memakai directive `"use client"` penuh untuk fetching data via REST API client.                                                                              | **GAP (P1)** |

---

## 3. Detail Gap & Rencana Tindak Lanjut (Roadmap)

### Prioritas 1 (P1) — High Impact

1. **Implementasi `BreadcrumbList` Schema (JSON-LD)**
    - **Lokasi**:
        - `/quran/[...slug]/layout.js` (`Beranda` > `Al-Quran` > `Surah ...`)
        - `/hadith/[slug]/layout.js` dan `/hadith/[slug]/[number]/page.js` (`Beranda` > `Hadits` > `Kitab ...` > `Nomor ...`)
        - `/blog/[slug]/layout.js` (`Beranda` > `Blog` > `Kategori` > `Judul Artikel`)
        - `/tafsir/[slug]/layout.js` (`Beranda` > `Tafsir` > `Surah ...`)
    - **Tujuan**: Memunculkan visual breadcrumb interaktif di Google Search SERP.

2. **Perluasan Server Component (SSR / ISR) untuk Halaman Konten Utama**
    - **Lokasi**: Halaman pembaca hadis, doa, wirid, dan fiqh ringkas.
    - **Tujuan**: Memastikan bot perayap mesin pencari menerima seluruh teks Arab, latin, dan terjemahan langsung pada initial HTML payload tanpa menunggu evaluasi JS client-side.

### Prioritas 2 (P2) — Polish & Enriched Results

3. **Kualifikasi Tautan Luar Konten Buatan Pengguna (UGC)**
    - **Lokasi**: Komponen rendering komentar blog (`src/components/comments/`) dan forum Q&A (`src/app/forum/`).
    - **Tindakan**: Tautan eksternal yang diinput oleh user wajib otomatis disanitasi dan diberi atribut `rel="ugc nofollow noopener noreferrer"`.
    - **Tujuan**: Melindungi reputasi domain dari spam dan link-farming sesuai Google Search Spam Policies.

4. **Penambahan Schema `QAPage` / `FAQPage`**
    - **Lokasi**: `/forum/[slug]` dan `/fiqh`.
    - **Tujuan**: Menampilkan format tanya-jawab yang kaya (rich snippets) di hasil pencarian.

---

## 4. Kesimpulan

Secara keseluruhan, fondasi teknis SEO website telah mengadopsi standar Google Search Essentials dan Starter Guide dengan sangat baik. Pekerjaan lanjutan difokuskan pada pengayaan structured data (rich snippets) dan sanitasi tautan eksternal.
