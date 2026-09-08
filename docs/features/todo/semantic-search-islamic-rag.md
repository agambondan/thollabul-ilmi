# Semantic Search & Islamic RAG

Status: `TODO`
Priority: `P2`
Tanggal: `2026-09-08`

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

1. Pilih backend vector: PostgreSQL `pgvector` dulu (paling minim infra), upgrade ke Qdrant/Weaviate hanya jika perlu scale.
2. Tambah migrasi `pgvector` + tabel `content_embeddings`.
3. Buat chunker konten per type (Quran, Hadith, Tafsir, Asbabun Nuzul, Fiqh, dst).
4. Buat CLI/job backfill embeddings.
5. Endpoint semantic search dengan filter konten + source metadata.
6. Endpoint `POST /ask` dengan retrieval top-k + response grounded + sitasi.
7. UI mobile/web untuk hasil semantic search & ask.
8. Guardrail: fallback ke “tidak cukup data” jika retrieval lemah.

## Acceptance Criteria

- Query makna seperti “ayat tentang sabar saat musibah” menemukan ayat/hadith relevan meski kata literal berbeda.
- Jawaban Ask selalu mencantumkan minimal 2 sumber saat tersedia.
- Jika sumber lemah, API mengembalikan jawaban fallback tanpa mengarang.
- Latensi pencarian semantic < 2 detik untuk dataset awal.

## Evidence

- Commands: `go test ./...`, benchmark API semantic search.
- Device/API/Web smoke: 10 query uji semantik + verifikasi sitasi.
- Notes:

## Source of Truth

- `docs/api/FEATURE_ROADMAP.md` (#2 Search)
- `services/api/app/services/search_service.go`
