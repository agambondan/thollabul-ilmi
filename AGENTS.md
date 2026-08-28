# Agent Instructions

Gunakan Chronicle sebagai layer retrieval dan memory default untuk project ini.

## Chronicle-First Protocol

- Pada message pertama yang non-trivial dalam satu sesi, mulai dengan `chronicle.init` atau `chronicle.session_init` memakai intent user saat ini.
- Pada message non-trivial berikutnya, panggil `chronicle.context` atau `chronicle.context_build` lagi sebelum implementasi, debugging, planning, atau repo exploration yang lebar.
- Jika koneksi MCP diragukan, jalankan `chronicle.doctor` sebelum workflow lain.
- Jika binding project diragukan, cek `chronicle.list_projects` dan pastikan project aktif benar.

## Search-First Protocol

- Gunakan `chronicle.search` sebelum scan manual yang lebar dengan `rg`, `find`, atau membuka banyak file untuk discovery.
- Jika `chronicle.search` kosong atau terlihat stale, jalankan `chronicle.sync` untuk repo lokal lalu retry search.
- Fallback ke scan manual hanya boleh setelah Chronicle tidak memberi hasil yang cukup atau saat butuh pembacaan file yang sudah terlokalisasi.

## Monorepo Layout

- Website applications live in `apps/`; the current website is `apps/web`.
- Runtime services live in `services/`; the current API service is `services/api`.
- Shared documentation and setup notes live in `docs`.
- Chronicle binding lives at the repository root in `.chronicle`.

## Mobile Design Rules (Mengikat)

- IA mobile mengikuti `docs/MOBILE_IA_FINAL_APPROACH.md` (5 tab: Beranda · Quran · Hadis · Ibadah · Belajar).
- **Detail UI:** JANGAN pakai inline expand/collapse. Pakai bottom-sheet modal atau page detail terpisah — acuan lengkap di `docs/MOBILE_DESIGN_PATTERNS.md`.
- Back navigation Android wajib pakai `setBack`/`clearBack` di setiap sub-navigation.

## Deploy tooling in `ops/deploy-workspace/`

That directory is a **mirrored backup**, not configuration for this repo. Deploys
run from `~/works/me` on the laptop (`make help`), and `~/works/me` is not a git
repo, so every repo carries an identical copy of its `deploy.sh` + `Makefile` as
the only versioned record. The `Makefile` there lists targets for *every*
project — that is expected, it mirrors the workspace file. Read
`ops/deploy-workspace/README.md` before touching it.
