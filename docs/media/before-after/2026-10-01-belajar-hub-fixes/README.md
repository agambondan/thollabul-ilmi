# Perbaikan UI/UX Belajar Hub Mobile — Bukti Before/After

- **Topik:** Audit Belajar hub & chrome navigasi (B1–B7: Amalan guest error, Lessons markdown, Blog excerpt markdown, Hamburger highlight, Global Search tab highlight, Quiz header translation).
- **Sebelum:** `d4badaa5` (sebelum harmonisasi dan perbaikan audit).
- **Sesudah:** Perbaikan B1–B7 termuat.
- **Lingkungan:** Expo web export (`apps/mobile`) via Playwright, iPhone 15 Pro Max (430x750 @2x), tema terang.
- **Aturan yang mengikat:** [`docs/VISUAL_EVIDENCE.md`](../../../VISUAL_EVIDENCE.md)

| #   | Layar | Yang diperbaiki |
| --- | ----- | --------------- |
| 01  | Belajar > Amalan Harian | Menghilangkan progress card saat guest error & pesan login personal yang konsisten |
| 02  | Belajar > Modul & Kelas | Render MarkdownView pada langkah modul (bukan raw markdown) |
| 03  | Belajar > Artikel | Cuplikan artikel bersih dari heading `#` / markdown |
| 04  | Hamburger Menu (Sheet) | Highlight menu hanya untuk fitur yang aktif, bukan semua sub-fitur Belajar |
| 05  | Pencarian Global | Bottom nav tetap highlight tab Beranda |
| 06  | Belajar > Quiz Islami | Translation key `explore.quiz.questionProgress` terjemah benar di header |

## 01 — Amalan Harian (Guest Gating)

| Before | After |
| ------ | ----- |
| <img src="01-amalan-guest-error-before.png" width="320" /> | <img src="01-amalan-guest-error-after.png" width="320" /> |

## 02 — Modul & Kelas (Markdown Formatting)

| Before | After |
| ------ | ----- |
| <img src="02-lessons-markdown-before.png" width="320" /> | <img src="02-lessons-markdown-after.png" width="320" /> |

## 03 — Artikel (Blog Excerpt Cleanup)

| Before | After |
| ------ | ----- |
| <img src="03-blog-excerpt-markdown-before.png" width="320" /> | <img src="03-blog-excerpt-markdown-after.png" width="320" /> |

## 04 — Hamburger Menu Item Highlight

| Before | After |
| ------ | ----- |
| <img src="04-hamburger-double-highlight-before.png" width="320" /> | <img src="04-hamburger-double-highlight-after.png" width="320" /> |

## 05 — Navigasi Pencarian Global

| Before | After |
| ------ | ----- |
| <img src="05-global-search-no-highlight-before.png" width="320" /> | <img src="05-global-search-no-highlight-after.png" width="320" /> |

## 06 — Quiz Islami Header Progress

| Before | After |
| ------ | ----- |
| <img src="06-quiz-question-progress-before.png" width="320" /> | <img src="06-quiz-question-progress-after.png" width="320" /> |
