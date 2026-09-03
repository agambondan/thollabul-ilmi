# Review Docs

Folder ini menyimpan hasil review lintas mobile, web, API, data, dan UX.
Gunakan folder ini untuk mencatat potensi bug dan gap sinkronisasi sebelum
dipecah menjadi task implementasi.

## Review Terbaru

| Dokumen                                                                                                          | Fokus                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [2026-09-01-mobile-accessibility-review.md](./2026-09-01-mobile-accessibility-review.md)                         | Sweep aksesibilitas mobile: role, state, label ikon, semantik modal — plus koreksi angka awal yang salah hitung    |
| [2026-09-01-web-frontend-deep-review.md](./2026-09-01-web-frontend-deep-review.md)                               | Deep review frontend web: UI, UX, aksesibilitas, performa, kebenaran data konten, dan SEO — 40 temuan berukur      |
| [2026-05-23-web-mobile-feature-parity-deep-review.md](./2026-05-23-web-mobile-feature-parity-deep-review.md)     | Deep review parity fitur web ke mobile dan mobile ke web, termasuk stub, intentional exclusions, dan gap kedalaman |
| [2026-05-17-web-mobile-performance-sync-deep-review.md](./2026-05-17-web-mobile-performance-sync-deep-review.md) | Deep review sync web/mobile/backend, CTA parity, dan performance risk lintas platform                              |
| [2026-05-15-public-dashboard-parity-review.md](./2026-05-15-public-dashboard-parity-review.md)                   | Deep review parity fitur public vs dashboard customer, CTA leakage dashboard ke public route, dan pola `basePath`  |
| [2026-05-15-web-journey-cta-review.md](./2026-05-15-web-journey-cta-review.md)                                   | Deep review user journey landing, dashboard customer, dashboard admin, dan CTA mismatch                            |
| [2026-05-13-deep-review-summary.md](./2026-05-13-deep-review-summary.md)                                         | Ringkasan prioritas dan urutan perbaikan                                                                           |
| [2026-05-13-contract-sync-review.md](./2026-05-13-contract-sync-review.md)                                       | Drift kontrak API antara web, mobile, dan backend                                                                  |
| [2026-05-13-mobile-ui-ux-review.md](./2026-05-13-mobile-ui-ux-review.md)                                         | Risiko bug dan polish UI/UX mobile                                                                                 |
| [2026-05-13-web-dashboard-review.md](./2026-05-13-web-dashboard-review.md)                                       | Risiko web dashboard/admin dan sync data personal                                                                  |
| [2026-05-13-verification-log.md](./2026-05-13-verification-log.md)                                               | Evidence command yang dijalankan saat review                                                                       |

## Cara Pakai

- Temuan `P0` sebaiknya dibuatkan feature doc atau task implementasi sebelum
  polish visual lain.
- Temuan yang sudah diperbaiki tetap dipertahankan sebagai catatan dan diberi
  update status di dokumen terkait.
- Jangan menandai review sebagai selesai hanya karena lint/build hijau. Untuk
  mobile UI, device smoke tetap wajib.
