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

## Git Workflow (Mengikat)

- Commit **langsung ke `master`** — jangan bikin feature branch untuk
  kerjaan di repo ini. Repo personal satu orang, seluruh history-nya
  memang commit langsung ke master; feature branch cuma menambah langkah
  checkout/merge/delete tanpa manfaat review.
- **`master` bisa dalam keadaan broken sementara** akibat commit sapuan
  dari sesi agent lain yang berjalan konkuren. Jangan asumsikan HEAD
  selalu hijau — sebelum kerja non-trivial, jalankan `go build ./...`
  (dan test suite web) dulu. Detail & contoh insiden:
  [`docs/AGENT_KNOWLEDGE.md`](docs/AGENT_KNOWLEDGE.md).

## Code Comments

Jangan tulis komentar di atas logic block atau function definition — di
bahasa apa pun (Go, TS/JS/JSX, dll). Ini lebih ketat dari default
"WHY-only": kalau ada sesuatu yang perlu dijelaskan (constraint
tersembunyi, workaround, invariant), taruh di commit message, bukan di
kode.

## Islamic Content Data (Mengikat)

Semua data Islam yang di-seed/diimpor (asbabun nuzul, hadis, tafsir,
siroh, istilah, dll) **wajib dari sumber shahih dan ulama mu'tabar** —
jangan dari situs umum atau ulama yang tidak dikenal manhaj-nya:

- Asbabun Nuzul: Lubabun Nuqul (As-Suyuthi), Shahih Asbabun Nuzul (Muqbil
  Al-Wadi'i), Tafsir Ibnu Katsir, atau langsung dari Shahih
  Bukhari/Muslim/Sunan dengan takhrij jelas. Hindari Asbab An-Nuzul
  Al-Wahidi tanpa cross-check.
- Hadis: Kutubut Tis'ah, atau kitab dengan takhrij ulama kontemporer
  terpercaya (Al-Albani, Syu'aib Al-Arnauth, Muqbil Al-Wadi'i).
- Tafsir: Ibnu Katsir, Ath-Thabari, As-Sa'di, Al-Baghawi, Al-Qurthubi.
- Setiap entri wajib punya field `Source` spesifik (nama kitab + nomor
  hadis/halaman), bukan atribusi kabur ("berbagai riwayat").
- Scraping harus hati-hati (rate limit, robots.txt) dan direview manual
  per entri sebelum commit ke seeder.
- Kalau ragu, konfirmasi ke user dulu atau skip entri itu.

Insiden data yang sudah ketemu (transkrip kajian fabrikasi, hadis
Arab↔terjemahan tidak sepasang, kutipan Ahmad yang salah jilid/halaman):
lihat [`docs/AGENT_KNOWLEDGE.md`](docs/AGENT_KNOWLEDGE.md).

## Mobile Design Rules (Mengikat)

- IA mobile mengikuti `docs/MOBILE_IA_FINAL_APPROACH.md` (5 tab: Beranda · Quran · Hadis · Ibadah · Belajar).
- **Detail UI:** JANGAN pakai inline expand/collapse. Pakai bottom-sheet modal atau page detail terpisah — acuan lengkap di `docs/MOBILE_DESIGN_PATTERNS.md`.
- Back navigation Android wajib pakai `setBack`/`clearBack` di setiap sub-navigation.

## Deploy tooling in `ops/deploy-workspace/`

That directory is a **mirrored backup**, not configuration for this repo. Deploys
run from `~/works/me` on the laptop (`make help`), and `~/works/me` is not a git
repo, so every repo carries an identical copy of its `deploy.sh` + `Makefile` as
the only versioned record. The `Makefile` there lists targets for _every_
project — that is expected, it mirrors the workspace file. Read
`ops/deploy-workspace/README.md` before touching it.

## Multi-agent shared session — DO NOT TOUCH STASH

This repo is shared across multiple concurrent Claude/agent sessions. Some
sessions park WIP work in `git stash` (e.g. `stash@{1}` may contain
unrelated-in-progress changes from a different agent doing kajian+quiz+player
work). **NEVER run `git stash drop`, `git stash pop`, `git stash clear`, or
`git stash apply stash@{N}`** — you can destroy another agent's work-in-progress.

If you think a stash belongs to you, verify with the user first. Otherwise
treat every existing `stash@{N}` as read-only and out of scope. Same rule
applies to `git reflog` cleanups and `git filter-branch`/`filter-repo` — they
can rewrite commits other agents are about to base on.

## Multi-agent Shared Workspace — Commit Scoping Rule (Wajib)

Setiap agent **HANYA BOLEH** men-stage, me-commit, dan me-push file yang dikerjakan oleh sesinya sendiri.

- **DILARANG** menjalankan `git add .`, `git add -A`, atau `git commit -a` secara global.
- Selalu periksa `git status` dan pilih file yang relevan secara eksplisit (`git add <file1> <file2>`).
- File modifikasi/untracked milik sesi agent lain yang sedang berjalan bersamaan tidak boleh disentuh, di-stage, di-stash, ataupun di-revert.
