# Semantic Search & Islamic RAG

Status: `DONE`
Priority: `P2`
Tanggal: `2026-09-08`
Selesai: `2026-10-02`

## Objective

Pengguna bisa mencari dan bertanya lintas Quran, Hadith, Tafsir, Asbabun Nuzul, Doa, Fiqh, Siroh, Blog, Kajian, dan Library dengan hasil semantik, sitasi sumber, dan jawaban yang aman dibatasi ke data aplikasi.

## Scope

- Mobile:
  - Search v2 di Explore/Quran/Hadith dengan mode `keyword` / `makna`.
  - Ask UI: input pertanyaan, hasil jawaban + daftar sumber.
  - Riwayat pencarian lokal.
- Web:
  - Global search page dengan hasil semantik + filter konten.
  - Ask modal/section dengan jawaban grounded + sumber rujukan.
- API:
  - Endpoint `GET /search/semantic?q=&types=&limit=`.
  - Endpoint `POST /ask` dengan retrieval + grounded response.
  - CLI indexer `cmd/backfill-content-embeddings/main.go`.
  - Rate limit & safety guardrail agar jawaban selalu menyertakan sumber dan tidak fatwa bebas.
- Data/Seeder:
  - Embedding table: `content_embeddings(content_type, content_id, chunk_text, embedding, metadata)`.
  - Backfill untuk Quran, Hadith, Tafsir, Asbabun Nuzul, Doa, Fiqh, Siroh, Blog, Kajian, Library.

## Current Baseline

- PostgreSQL `pgvector` (`vector(256)`) aktif di database.
- `LocalHashProvider` (hash token + trigram 256D, pure-Go) digunakan untuk efisiensi resource VPS (1.9 GB RAM).
- Endpoint `GET /search/semantic` dan `POST /ask` terdaftar di routes (`/api/v1/search/semantic` dan `/api/v1/ask`).

## Task List

1. ✅ Backend vector: PostgreSQL `pgvector` (`vector(256)`).
2. ✅ Migrasi tabel `content_embeddings` — didaftarkan lewat `ModelMigrations`.
3. ✅ Chunker per content type (Quran, Hadith, Tafsir, Asbabun Nuzul, Doa, Fiqh, Sirah, Blog, Kajian, Library) — `cmd/backfill-content-embeddings/main.go`.
4. ✅ CLI backfill embeddings (`go run ./cmd/backfill-content-embeddings -types ... -batch ... -clean`).
5. ✅ Endpoint `GET /search/semantic?q=&types=&limit=`.
6. ✅ Endpoint `POST /ask` dengan retrieval + confidence threshold + fallback jawaban.
7. ✅ UI web (`apps/web/src/app/search/SearchClient.js`, toggle Kata Kunci/Makna) dan mobile (`apps/mobile/src/screens/GlobalSearchScreen.js`, kedua layout classic & web_app).
8. ✅ Guardrail dasar (fallback text saat similarity < 0.3 / tidak ada hasil) dan test skenario adversarial (`TestContentEmbeddingService_AdversarialQueries` - 6 skenario lolos).
9. ✅ Perbaikan critical bug GORM: `Similarity` di `model.ContentEmbedding` awalnya `gorm:"-"` sehingga GORM menolak men-scan hasil `1 - (embedding <=> ?) AS similarity` (skor selalu 0). Diperbaiki menjadi `gorm:"->;type:float"`.
10. ✅ Backfill production VPS: 236.228 chunks berhasil di-index ke `content_embeddings`.
11. ✅ Deploy `tholabul-ilmi-api:prod` ke VPS dan verifikasi live.

## Acceptance Criteria

- Query makna menemukan ayat/hadith/kajian relevan.
- Jawaban Ask mencantumkan minimal 2 sumber saat tersedia.
- Jika sumber lemah, API mengembalikan jawaban fallback tanpa mengarang.
- Latensi pencarian semantic < 2 detik.

## Evidence

- Unit tests:
  - `go test -v ./app/services -run "TestContentEmbedding"` (PASS)
  - `go test -v ./app/repository -run "TestContentEmbeddingRepository_SearchSimilar_Postgres"` (PASS, similarity score terisi > 0)
- Production live verification (VPS `sumopod-1`):
  - `SELECT content_type, count(*) FROM content_embeddings` total 236.228 chunks:
    - asbabun_nuzul: 800
    - blog: 30
    - doa: 174
    - fiqh: 64
    - hadith: 800
    - kajian: 220.431
    - library: 6.648
    - quran: 7.036
    - sirah: 64
    - tafsir: 6.836
  - `GET /api/v1/search/semantic?q=tauhid&limit=3` merespons 200 dengan chunk kajian Kitab Tauhid yang presisi.
  - `POST /api/v1/ask` pertanyaan "apa makna tauhid dan macam macamnya?" menghasilkan jawaban sintesis terstruktur, confidence 0.535, dan 5 sitasi sumber valid dengan metadata URL & timestamps.

## Source of Truth

- `docs/api/FEATURE_ROADMAP.md` (#2 Search)
- `services/api/app/model/content_embedding.go`
- `services/api/app/services/content_embedding_service.go`
- `services/api/app/repository/content_embedding_repository.go`
- `services/api/cmd/backfill-content-embeddings/main.go`
