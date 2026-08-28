# Mobile Design Pattern Contract

Status: `DONE`
Priority: `P0`
Tanggal: `2026-05-07`

## Scope

- detail UI mobile tidak memakai inline expand/collapse
- detail memakai bottom-sheet modal atau page detail terpisah
- sub-navigation Android wajib memakai `setBack` dan `clearBack`
- komponen detail, modal, dan card diarahkan ke shared component agar UI
  konsisten

## Verified Baseline

- `docs/MOBILE_DESIGN_PATTERNS.md` menjadi aturan desain mengikat.
- `docs/INDEX.md` menandai dokumen pattern sebagai keputusan aktif.
- `AGENTS.md` di repo root mengulang aturan mobile design sebagai instruksi
  project.

## Exit Criteria

- setiap feature baru punya rujukan jelas untuk memilih modal atau page detail
- agent tidak perlu menebak pattern detail screen dari nol
- UI mobile punya guardrail untuk menghindari expand/collapse inline

## Source of Truth

- `docs/MOBILE_DESIGN_PATTERNS.md`
- `docs/MOBILE_DESIGN_REWORK_TASKLIST.md`
- `AGENTS.md`
