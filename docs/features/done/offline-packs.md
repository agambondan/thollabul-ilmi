# Offline Packs

Status: `DONE`
Priority: `P1`
Tanggal: `2026-05-13`

## Objective

Paket offline berbasis SQLite untuk mobile: Quran, Hadith, Doa, Dzikir, dan jadwal sholat (30 hari) tanpa koneksi internet.

## Scope

- API: - (data di-sideload)
- Web: -
- Mobile: `offlineContent.native.js`

## Evidence

- Mobile: `apps/mobile/src/utils/offlineContent.native.js`

## Source of Truth

- `apps/mobile/assets/offline/`

## Details

### Data Packs (No API — Sideloaded SQLite)

| Pack             | Contents                                                            | File Size Estimate |
| ---------------- | ------------------------------------------------------------------- | ------------------ |
| **Quran**        | Full mushaf text (Arabic), per-ayah translation IDN/EN, juz mapping | ~15 MB             |
| **Hadith**       | Bukhari + Muslim matan terjemah, limited to ~5000 hadith            | ~20 MB             |
| **Doa**          | All doa categories: arabic, transliteration, meaning, source        | ~2 MB              |
| **Dzikir**       | All dzikir categories with fadhilah and audio references            | ~1 MB              |
| **Prayer Times** | 30-day schedule pre-calculated for major Indonesian cities          | ~0.5 MB            |

### Key Frontend Components

- **Mobile** (`offlineContent.native.js`): SQLite bundle loader; checksum verification on load; cache-first data access pattern (SQLite → API fallback); storage space indicator before download; selective pack download UI
- **Web**: Not applicable (offline packs are mobile-only)
