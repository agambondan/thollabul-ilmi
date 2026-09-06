# Standar Lebar Kontainer (Layout Width Guidelines)

Dokumen ini mendefinisikan panduan pemilihan lebar kontainer di Thullaabul 'Ilmi web & dashboard, baik untuk mode standar (compact) maupun saat fitur **Wide Mode** (floating button setting) diaktifkan.

---

## 1. Prinsip Utama: Compact vs Wide

Aplikasi mendukung dua mode tampilan global via `useLayoutMode`:

| Mode | Lebar Kontainer | Perilaku |
| --- | --- | --- |
| **Wide Mode** | `w-full` | Melebar penuh 100% viewport layar monitor tanpa batasan `max-w`. Berguna untuk layar ultrawide atau saat multitasking. |
| **Compact Mode (Default)** | Terbatas (`max-w-* mx-auto`) | Konten dibatasi di tengah layar dengan margin otomatis untuk menjaga kenyamanan visual dan keterbacaan teks. |

---

## 2. Kategori Lebar Kontainer (Compact Mode)

Dalam mode default (compact), batasan lebar dibagi menjadi **dua tier standar** berdasarkan tujuan penggunaan konten:

### Tier A: `max-w-3xl` / `max-w-4xl` (Readability & Long-Form Text)
- **Ukuran:** 768px (`max-w-3xl`) hingga 896px (`max-w-4xl`).
- **Tujuan:** Menjaga *optimal line-length* (panjang baris membaca) berkisar antara 65–85 karakter per baris.
- **Kenapa tidak boleh terlalu lebar di mode compact?**
  - Teks Arab, terjemahan tafsir, doa, dan artikel panjang yang membentang terlalu lebar di layar desktop 24"+ membuat mata cepat lelah saat berpindah baris bacaan (*eye-tracking fatigue*).
  - Khusus tipografi Arab dengan harakat tebal, batas kolom yang sempit hingga menengah membantu fokus tilawah/muroja'ah.

#### Halaman yang menggunakan Tier A:
1. **Al-Quran Reader & Ayat Detail:** `/quran`, `/quran/[...slug]`
2. **Tafsir:** `/tafsir`, `/tafsir/[slug]`
3. **Hadits Detail (Matan & Terjemahan):** `/hadith/[slug]`, `/hadith/[slug]/[number]`
4. **Siroh Nabawiyah & Sejarah Islam:** `/siroh/[slug]`, `/sejarah`
5. **Asbabun Nuzul:** `/asbabun-nuzul`
6. **Kumpulan Doa & Dzikir:** `/doa`, `/dzikir`, `/wirid`
7. **Blog & Artikel:** `/blog/[slug]`
8. **Panduan Sholat & Manasik Detail:** `/panduan-sholat`, `/manasik`

---

### Tier B: `max-w-6xl` (Visual Browse, Multi-Column & Grids)
- **Ukuran:** 1152px (`max-w-6xl`).
- **Tujuan:** Memberikan ruang yang cukup untuk tata letak multi-kolom (grid 2, 3, atau 4 kartu) tanpa terlihat sesak atau terlalu terpotong.
- **Kenapa butuh lebih lebar di mode compact?**
  - Halaman ini berfokus pada eksplorasi visual: gambar thumbnail video 16:9, kartu statistik, badge kategori, dan daftar buku.
  - Jika dibatasi hanya `max-w-3xl`, layout kartu grid 2-3 kolom akan menjadi terlalu sempit dan thumbnail video mengecil secara tidak wajar.

#### Halaman yang menggunakan Tier B:
1. **Koleksi Kajian Islam (Video Cards & Transkrip):** `/kajian`, `/dashboard/kajian`
2. **Katalog Kitab Hadits (Books Grid):** `/hadith` (Tab Kitab)
3. **Kamus Istilah Islam:** `/kamus`, `/dashboard/kamus`
4. **Asmaul Husna (99 Kartu Nama):** `/asmaul-husna`
5. **Belajar Hub & Modul:** `/dashboard/belajar`
6. **Perawi Hadits (Database List):** `/dashboard/perawi`
7. **Komunitas / Forum Feed:** `/dashboard/komunitas`, `/feed`

---

## 3. Aturan Teknis Penerapan di Kode

Gunakan komponen `<ContentWidth>` atau hook `useLayoutMode`:

```jsx
// Opsi 1: Menggunakan ContentWidth
import ContentWidth from "@/components/layout/ContentWidth";

// Untuk teks bacaan (Tier A):
<ContentWidth compact="max-w-3xl" className="px-4 py-6">
    <ArticleContent />
</ContentWidth>

// Untuk kartu / grid (Tier B):
<ContentWidth compact="max-w-6xl" className="px-4 py-6">
    <CardGrid />
</ContentWidth>
```

```jsx
// Opsi 2: Menggunakan hook useLayoutMode langsung
import { useLayoutMode } from "@/lib/useLayoutMode";

export default function MyClientPage() {
    const { isWide } = useLayoutMode();

    return (
        <div className={isWide ? "w-full px-4" : "w-full max-w-6xl mx-auto px-4"}>
            <Content />
        </div>
    );
}
```

---

## 4. Pengecualian Khusus (Bukan Halaman Konten Utama)
- **Modal Dialog & Popup:** Tetap berukuran `max-w-md` atau `max-w-lg` agar fokus formulir tetap terjaga dan tidak melebar mengikuti viewport.
- **Halaman Auth (Login / Register):** Tetap `max-w-md` di tengah layar untuk kejelasan input akun.
- **Halaman 404 / Error Boundary:** Tetap `max-w-md` terpusat.
