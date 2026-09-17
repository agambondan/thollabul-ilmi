# Ekstraksi Konten Ebook untuk Belajar & Quiz Otomatis

Status: `TODO`
Priority: `P2`
Tanggal: `2026-09-18`

## Objective

Sekarang modul Belajar (`LessonModule`/`LessonStep`) dan Quiz seluruhnya
ditulis manual oleh admin, dan hanya terhubung ke ebook di Perpustakaan lewat
referensi "Bacaan Lanjutan" (lihat Current Baseline). Tujuan fitur ini: modul
Belajar dan bank soal Quiz bisa **dibangkitkan dari isi asli ebook** yang
sudah di-upload ke Perpustakaan — bukan sekadar link ke buku, tapi materi
belajar/soal quiz yang benar-benar bersumber dari teks buku tersebut, dengan
tetap melalui review manusia sebelum tayang (lihat bagian risiko).

Bukan tujuan fase ini: mengganti proses penulisan modul manual sepenuhnya.
Ini alat bantu percepatan draft, bukan otomasi penuh tanpa pengawasan —
mengingat aturan project bahwa konten Islam wajib bersumber shahih dan
ulama mu'tabar (lihat memori `feedback_islamic_data_sahih_only`).

## Scope

- Mobile: tidak ada perubahan langsung; otomatis dapat manfaat begitu modul
  Belajar/Quiz hasil ekstraksi tayang, karena mobile konsumsi endpoint yang
  sama.
- Web: halaman admin baru untuk memicu ekstraksi per buku, melihat progres,
  dan me-review draft modul/soal hasil generate sebelum publish.
- API: layanan ekstraksi teks PDF, tabel penyimpanan teks hasil ekstraksi,
  endpoint generate draft (LLM-assisted) dari teks tersebut, alur status
  draft → review → published.
- Data/Seeder: tidak ada seeder data statis; ini pipeline on-demand per buku,
  dipicu manual oleh admin (bukan cron otomatis di awal).

## Current Baseline

- `LibraryBook` (`services/api/app/model/library_book.go`) menyimpan PDF
  sebagai objek biner di MinIO (`FileObjectKey`/`SourceURL`) — tidak ada
  representasi teks dari isi buku di database sama sekali.
- `LessonModule` (`services/api/app/model/lesson.go`) sekarang punya field
  `RelatedBookID`/`RelatedBook` (ditambahkan bersamaan dengan dokumen ini,
  lihat commit terkait) — admin bisa pilih satu buku Perpustakaan sebagai
  "Bacaan Lanjutan" per modul. Ini murni referensi/link, isi modul & langkah
  tetap ditulis manual, sama sekali belum membaca isi file PDF-nya.
- Quiz (`services/api/app/model/quiz.go`) punya field generik `RefID *int`
  tapi belum dipakai untuk menunjuk ke `LibraryBook`, dan soal quiz semuanya
  statis/di-seed manual — tidak ada logika generate otomatis di manapun.
- Sebagian PDF di Perpustakaan adalah hasil scan gambar tanpa layer teks
  (misal "Sepuluh Pembatal Keislaman" — dicek langsung, `pdftotext` tidak
  menghasilkan apa-apa), sebagian lagi PDF teks asli yang bisa diekstrak
  langsung. Perbedaan ini harus ditangani berbeda (lihat Task List poin 1).

## Task List

1. **Deteksi & ekstraksi teks per buku**
   - Untuk PDF berteks: ekstrak langsung (`pdftotext` atau library Go setara,
     mis. `pdfcpu`/`unipdf`) per halaman.
   - Untuk PDF hasil scan (tidak ada layer teks — cek dengan mencoba ekstraksi
     dulu, kalau hasil kosong berarti scan): perlu OCR. Bahasa campuran
     Indonesia + Arab (banyak dalil dikutip dalam Arab) — evaluasi apakah
     Tesseract OCR dengan language pack `ind`+`ara` cukup akurat untuk teks
     Arab berharakat, atau perlu layanan OCR lain. Ini kemungkinan titik
     paling berisiko dari sisi kualitas.
   - Simpan hasil di tabel baru, misalnya `library_book_extracted_text`
     (book_id, page_number, text, extraction_method, extracted_at) —
     per halaman, bukan satu blob per buku, supaya sitasi halaman ke sumber
     tetap bisa dilacak.
2. **Endpoint & job admin untuk memicu ekstraksi**
   - `POST /library/books/:id/extract` (admin) — proses async (bisa lama
     untuk buku besar/hasil scan), dengan status field di `LibraryBook`
     (`extraction_status`: none/processing/done/failed) supaya admin panel
     bisa polling progres.
3. **Generate draft modul Belajar / soal Quiz dari teks hasil ekstraksi**
   - Pilih & rujuk potongan teks (per bab/topik, bukan seluruh buku sekaligus
     — konteks LLM terbatas dan hasil lebih presisi per potongan kecil).
   - Cek `docs/setup/ai-providers.md` untuk provider LLM yang sudah
     dikonfigurasi di project ini sebelum menambah provider baru.
   - Prompt harus eksplisit: **hanya merangkum/mengutip yang benar-benar ada
     di teks sumber, dilarang menambah klaim/dalil yang tidak ada di sumber**
     — draft harus menyertakan kutipan halaman sumber untuk setiap poin,
     supaya reviewer bisa cross-check langsung ke buku asli.
   - Output generate harus berstatus `draft`/`pending_review`, TIDAK PERNAH
     langsung `published` — lihat Acceptance Criteria.
4. **UI review admin**
   - Halaman baru (atau tab di admin Belajar/Quiz yang sudah ada) yang
     menampilkan draft hasil generate berdampingan dengan kutipan halaman
     sumber PDF, dengan aksi: edit manual, setujui & publish, atau tolak.
5. **Rollout bertahap**
   - Uji coba di 1-2 buku pendek dan tidak kontroversial dulu (misal "Tiga
     Landasan Utama" atau "Sepuluh Pembatal Keislaman" — keduanya sudah di
     Perpustakaan, singkat, isinya sudah baku/tidak memerlukan penafsiran
     rumit) sebelum diperluas ke buku lain.

## Acceptance Criteria

- Tidak ada modul Belajar atau soal Quiz hasil generate yang tayang ke
  publik tanpa direview & disetujui manual oleh admin/ustadz — ini non-
  negotiable mengingat aturan shahih-only untuk konten Islam.
- Setiap poin materi/soal hasil generate menyertakan rujukan halaman ke buku
  sumbernya, supaya bisa diverifikasi kapan saja tanpa harus percaya buta ke
  output LLM.
- Ekstraksi teks tercatat statusnya per buku (`extraction_status`) dan bisa
  dicoba ulang kalau gagal (terutama kasus OCR buku hasil scan).
- Buku dengan `license_status` selain `verified` diberi peringatan tambahan
  di UI review — konten hasil ekstraksi mewarisi ketidakpastian lisensi buku
  sumbernya.

## Evidence

- Commands: (belum ada, masih tahap TODO)
- Device/API/Web smoke: (belum ada, masih tahap TODO)
- Notes: Opsi ringan (link modul Belajar ke buku Perpustakaan tanpa ekstraksi
  konten) sudah diimplementasikan lebih dulu sebagai langkah awal — lihat
  `RelatedBookID` di `services/api/app/model/lesson.go` dan blok "Bacaan
  Lanjutan" di `apps/web/src/app/dashboard/belajar/lessons/LessonsContent.js`.

## Source of Truth

- `services/api/app/model/library_book.go`, `services/api/app/model/lesson.go`,
  `services/api/app/model/quiz.go` — model yang perlu diperluas.
- `docs/setup/ai-providers.md` — provider LLM yang tersedia di project ini.
- Memori project `feedback_islamic_data_sahih_only` — syarat wajib sumber
  shahih untuk semua konten Islam, termasuk hasil generate otomatis.
