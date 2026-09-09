# Semantic Search & Islamic RAG

Status: `IN_PROGRESS` — API backend jalan end-to-end, UI mobile/web belum digarap
Priority: `P2`
Tanggal: `2026-09-08` (dipindah ke progress 2026-09-09)

## Objective

Pengguna bisa mencari dan bertanya lintas Quran, Hadith, Tafsir, Asbabun Nuzul, Doa, Fiqh, Siroh, dan artikel dengan hasil semantik, sitasi sumber, dan jawaban yang aman dibatasi ke data aplikasi.

## Scope

- Mobile:
    - Search v2 di Explore/Quran/Hadith dengan mode `keyword` / `makna`.
    - Ask UI: input pertanyaan, hasil jawaban + daftar sumber.
    - Riwayat pencarian lokal.
- Web:
    - Global search page dengan hasil semantik + filter konten.
    - Ask page atau modal di dashboard/public web.
- API:
    - Endpoint `GET /search/semantic?q=&type=`.
    - Endpoint `POST /ask` dengan retrieval + grounded response.
    - Indexer background untuk embeddings konten Islamic knowledge.
    - Rate limit & safety guardrail agar jawaban selalu menyertakan sumber dan tidak fatwa bebas.
- Data/Seeder:
    - Embedding table: `content_embeddings(content_type, content_id, chunk_text, embedding, metadata)`.
    - Backfill job untuk Quran, Hadith, Tafsir, Asbabun Nuzul, Doa, Fiqh, Siroh, Blog.

## Current Baseline

- Search keyword Quran/Hadith sudah ada di `app/services/search_service.go`.
- Konten utama sudah tersedia di API dan seeder.
- Belum ada vector DB / embedding pipeline.

## Task List

1. ✅ Backend vector: PostgreSQL `pgvector` (`vector(256)`, sama dimensi dengan `kajian_transcript.embedding`), extension sudah di-create otomatis di `Repositories.Migrations()`.
2. ✅ Migrasi tabel `content_embeddings` — didaftarkan lewat `ModelMigrations` (auto-migrate), bukan file migrasi terpisah.
3. ✅ Chunker per content type (Quran, Hadith, Tafsir, Asbabun Nuzul, Doa, Fiqh, Sirah, Blog, Kajian) — `cmd/backfill-content-embeddings/main.go`.
4. ✅ CLI backfill embeddings (`go run ./cmd/backfill-content-embeddings -types ... -limit ... -batch ...`).
5. ✅ Endpoint `GET /search/semantic?q=&types=&limit=`.
6. ✅ Endpoint `POST /ask` dengan retrieval + confidence threshold + fallback jawaban.
7. ❌ UI mobile/web untuk hasil semantic search & ask — belum dikerjakan.
8. ⚠️ Guardrail dasar ada (fallback text saat similarity < 0.3 / tidak ada hasil), tapi belum ditest dengan skenario adversarial atau red-team query.

## Acceptance Criteria

- Query makna seperti “ayat tentang sabar saat musibah” menemukan ayat/hadith relevan meski kata literal berbeda.
- Jawaban Ask selalu mencantumkan minimal 2 sumber saat tersedia.
- Jika sumber lemah, API mengembalikan jawaban fallback tanpa mengarang.
- Latensi pencarian semantic < 2 detik untuk dataset awal.

## Evidence

- `go build ./...` dan `go vet ./...` bersih (2026-09-09).
- Smoke test lokal (docker postgres+redis, DB `thullabul_ilmi`): `-migrate` berhasil bikin tabel `content_embeddings`, `cmd/backfill-content-embeddings -types quran,hadith,doa,fiqh -limit 30` berhasil index 116 chunk tanpa error.
- `GET /search/semantic` dan `POST /ask` merespons 200 dengan data nyata (bukan cuma fallback kosong) setelah backfill.
- **Catatan kualitas retrieval:** provider embedding yang dipakai adalah `LocalHashProvider` (hash token + trigram, pure-Go, sama seperti yang dipakai kajian transcript search) — bukan model embedding semantik sungguhan. Hasil test manual: query makna seperti "siapa saja yang berhak menerima zakat" tidak selalu menaikkan chunk fiqh zakat yang relevan ke urutan atas (malah kalah sama chunk topik lain yang share kata umum). Acceptance criteria "menemukan hasil relevan meski kata literal berbeda" **belum sepenuhnya tercapai** dengan provider ini — cocok untuk lexical/hybrid matching (mirip kajian search), tapi lemah untuk true semantic query lintas topik yang beda kosakata. Perlu keputusan: terima trade-off ini (gratis, tanpa dependency eksternal) atau ganti provider ke model embedding sungguhan (mis. OpenAI text-embedding-3-small / lokal sentence-transformer via sidecar) untuk kualitas lebih baik.
- Bug yang ditemukan & diperbaiki saat verifikasi: kolom `content_embeddings.embedding` sempat didefinisikan `vector(1536)` padahal `LocalHashProvider` menghasilkan 256 dimensi — insert akan gagal di production kalau tidak disamakan ke `vector(256)`.

## Source of Truth

- `docs/api/FEATURE_ROADMAP.md` (#2 Search)
- `services/api/app/services/search_service.go`
