# Docs Index — Thollabul Ilmi

Panduan navigasi dokumen project. Baca ini sebelum mulai task supaya tidak salah acuan.

---

## Keputusan Aktif (Source of Truth)

| Dokumen | Topik | Status |
|---|---|---|
| [MOBILE_IA_FINAL_APPROACH.md](./MOBILE_IA_FINAL_APPROACH.md) | **Arsitektur navigasi mobile** — 5 tab final, feature placement, urutan implementasi | ✅ Aktif |
| [MOBILE_DESIGN_PATTERNS.md](./MOBILE_DESIGN_PATTERNS.md) | **Pola desain mobile mengikat** — detail UI harus modal/page (bukan inline expand), modal style, back navigation | ✅ Aktif |
| [MOBILE_LAYOUT_MODES.md](./MOBILE_LAYOUT_MODES.md) | **Strategi layout mobile app** — mobile app lama tetap dipertahankan, layout baru bisa dipilih user | 🟡 Planned |
| [api/FEATURE_ROADMAP.md](./api/FEATURE_ROADMAP.md) | Roadmap fitur backend, tier, dan status pengerjaan | ✅ Aktif |
| [api/roadmap-status.md](./api/roadmap-status.md) | Status terkini tiap fitur backend | ✅ Aktif |
| [web/web-status.md](./web/web-status.md) | Status halaman dan komponen web (Next.js) | ✅ Aktif |
| [features/README.md](./features/README.md) | Status feature per slice: todo, progress, done, onhold | ✅ Aktif |
| [reviews/README.md](./reviews/README.md) | Review lintas mobile, web, API, sync, dan UX | ✅ Aktif |

---

## Mobile

| Dokumen | Isi |
|---|---|
| **[MOBILE_IA_FINAL_APPROACH.md](./MOBILE_IA_FINAL_APPROACH.md)** | **← Acuan utama IA mobile. Baca ini dulu.** |
| **[MOBILE_DESIGN_PATTERNS.md](./MOBILE_DESIGN_PATTERNS.md)** | **← Pola desain mengikat: modal vs page detail, anti-expand-inline, modal style.** |
| **[MOBILE_LAYOUT_MODES.md](./MOBILE_LAYOUT_MODES.md)** | **← Keputusan layout mode: Classic tetap ada, Web App layout jadi opsi baru.** |
| [MOBILE_FEATURE_REFERENCE.md](./MOBILE_FEATURE_REFERENCE.md) | Daftar lengkap fitur mobile dan mapping ke backend |
| [MOBILE_UX_REVIEW.md](./MOBILE_UX_REVIEW.md) | Review UX dan daftar issue yang ditemukan |
| [MOBILE_DESIGN_REWORK_TASKLIST.md](./MOBILE_DESIGN_REWORK_TASKLIST.md) | Checklist design contract mobile (sudah selesai) |
| [MOBILE_IA_APPROACH_A.md](./MOBILE_IA_APPROACH_A.md) | Proposal pembanding (bukan acuan, sudah dilebur ke Final) |
| [MOBILE_INFORMATION_ARCHITECTURE_APPROACH_CODEX.md](./MOBILE_INFORMATION_ARCHITECTURE_APPROACH_CODEX.md) | Proposal pembanding Codex (bukan acuan, sudah dilebur ke Final) |
| [MOBILE_IA_FINAL.md](./MOBILE_IA_FINAL.md) | Alias → lihat MOBILE_IA_FINAL_APPROACH.md |

---

## Feature Docs

| Dokumen | Isi |
|---|---|
| **[features/README.md](./features/README.md)** | **← Hub status feature per slice/milestone.** |
| [features/TEMPLATE.md](./features/TEMPLATE.md) | Template feature doc baru |
| [features/todo/](./features/todo/) | Feature yang siap ditarik, tetapi belum mulai |
| [features/progress/](./features/progress/) | Feature yang sedang aktif dikerjakan |
| [features/done/](./features/done/) | Feature yang sudah selesai dan ditutup |
| [features/onhold/](./features/onhold/) | Feature yang ditunda karena blocker/dependency |

---

## Review Docs

| Dokumen | Isi |
|---|---|
| **[reviews/README.md](./reviews/README.md)** | **← Hub hasil review lintas platform.** |
| [reviews/2026-05-13-deep-review-summary.md](./reviews/2026-05-13-deep-review-summary.md) | Ringkasan prioritas hasil deep review |
| [reviews/2026-05-13-contract-sync-review.md](./reviews/2026-05-13-contract-sync-review.md) | Drift kontrak API antara web, mobile, dan backend |
| [reviews/2026-05-13-mobile-ui-ux-review.md](./reviews/2026-05-13-mobile-ui-ux-review.md) | Risiko bug dan polish UI/UX mobile |
| [reviews/2026-05-13-web-dashboard-review.md](./reviews/2026-05-13-web-dashboard-review.md) | Risiko web dashboard/admin dan sync data personal |
| [reviews/2026-05-13-verification-log.md](./reviews/2026-05-13-verification-log.md) | Evidence command review |

---

## API / Backend

| Dokumen | Isi |
|---|---|
| [api/FEATURE_ROADMAP.md](./api/FEATURE_ROADMAP.md) | Roadmap lengkap fitur backend per tier |
| [api/roadmap-status.md](./api/roadmap-status.md) | Status pengerjaan tiap fitur |
| [api/feature-gap-analysis.md](./api/feature-gap-analysis.md) | Gap antara spesifikasi dan implementasi |
| [api/spesifikasi-islamic-app.md](./api/spesifikasi-islamic-app.md) | Spesifikasi produk Islamic app |
| [api/spesifikasi-apps-hadis.md](./api/spesifikasi-apps-hadis.md) | Spesifikasi khusus fitur hadis |
| [api/integrasi-eksternal-opensource.md](./api/integrasi-eksternal-opensource.md) | Integrasi eksternal dan sumber data open source |
| [api/ASBABUN_NUZUL_DATASET_TODO.md](./api/ASBABUN_NUZUL_DATASET_TODO.md) | Tracker dataset asbabun nuzul (target ~250 entri shahih) |

---

## Web (Next.js)

| Dokumen | Isi |
|---|---|
| [web/web-status.md](./web/web-status.md) | Status halaman web per fitur |
| [web/api-endpoint-gaps.md](./web/api-endpoint-gaps.md) | Halaman web yang belum terhubung ke API |
| [web/api-gaps.md](./web/api-gaps.md) | Endpoint API yang belum dikonsumsi web |

---

## Setup & Infrastruktur

| Dokumen | Isi |
|---|---|
| [setup/local-development.md](./setup/local-development.md) | Cara menjalankan stack lokal (Docker, API, Web) |
| [setup/chronicle.md](./setup/chronicle.md) | Setup Chronicle (memory & context system) |
| [setup/ai-providers.md](./setup/ai-providers.md) | Konfigurasi AI provider |

---

## Quick Decision Reference

**Navigasi mobile → [`MOBILE_IA_FINAL_APPROACH.md`](./MOBILE_IA_FINAL_APPROACH.md)**
- 5 tab: Beranda · Quran · Hadis · Ibadah · Belajar
- Profil bukan tab — diakses via avatar di header
- Hadis dedicated tab setara Quran
- Prayer → Ibadah hub (Harian / Alat / Rencana / Bacaan)
- Explore → Belajar hub (Ilmu + Personal ringkas)

**Feature backend → [`api/FEATURE_ROADMAP.md`](./api/FEATURE_ROADMAP.md)**

**Design pattern mobile → `apps/mobile/src/components/`**
- `Card`, `CardTitle` — container konten
- `Screen` — layout scrollable dengan header
- `Paper` — `SegmentedTabs`, `ActionPill`, `IconActionButton`, `EmptyState`
- `setBack`/`clearBack` — back navigation pattern (wajib di semua sub-navigation)
