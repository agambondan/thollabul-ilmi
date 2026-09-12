# Audit URL/Media Eksternal Lainnya (Selain Masjid, Radio, Surah-Audio Slug)

Tanggal: `2026-09-12`
Scope: seluruh field model yang menyimpan URL eksternal — `AudioURL` (Asmaul Husna, Dzikir, Doa),
`ImageURL` (blog, siroh/sejarah, tokoh tarikh), `seeder_library_books.go` (link sunnah.com),
`Website` (di luar masjid), dan hardcoded `https://` di `apps/web/src/app` +
`apps/web/src/components`.
Status: `SELESAI` — 1 bug nyata ditemukan & diperbaiki (10 foto qari di `SurahAudioPlayer.js`,
9/10 URL mati/salah), sisanya N/A (field kosong, memang belum di-seed) atau PASS (sudah benar).

Lanjutan pola sistemik yang ditemukan sesi ini: koordinat masjid, `StreamURL` radio Islam, dan
slug `QuranicAudio` surah-audio semuanya fabrikasi/tidak pernah di-curl-verify sebelum di-commit.
Task ini menyisir _field lain_ yang belum kena giliran diperiksa. Masjid (`seeder_masjid_radio.go`)
sengaja dilewati — sedang direwrite paralel oleh sesi lain untuk audit manhaj — dan radio Islam
sudah selesai diperbaiki di [`2026-09-11-radio-islamic-stream-url-fix.md`](./2026-09-11-radio-islamic-stream-url-fix.md).

---

## Hasil per Dataset

| #   | Dataset / Field                                                              | Sample                                                | Hasil                                                         | Catatan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `AsmaUlHusna.AudioURL` (`model/asmaul_husna.go` + `seedAsmaUlHusnaFromFile`) | 99/99 baris di `data/static/asma_ul_husna.json`       | **N/A** — field tidak pernah diisi                            | `docs/api/feature-gap-analysis.md` baris 23/189 mengklaim "✅ BE data (Mei 2026) — Model `AsmaUlHusna` punya `AudioURL` field... tinggal seed data" tapi kenyataannya `seedAsmaUlHusnaFromFile` (baris 182-215) tidak pernah membaca/menulis `audio_url` — JSON sumbernya juga tidak punya key itu sama sekali. Klaim dokumen itu **tidak akurat**; belum ada satu pun URL untuk diverifikasi. Tidak menebak URL baru (melanggar aturan "jangan fabrikasi") — dibiarkan kosong, dokumen gap-analysis perlu dikoreksi terpisah. |
| 2   | `Dzikir.AudioURL` (`model/dzikir.go`)                                        | 27/27 baris `data/static/dzikir.json`                 | **N/A** — semua kosong                                        | Konsisten dengan `feature-gap-analysis.md` baris 155 yang memang menandai ini sebagai gap belum dikerjakan (`❌ BE+FE`).                                                                                                                                                                                                                                                                                                                                                                                                       |
| 3   | `Doa.AudioURL` (`model/doa.go`)                                              | 27/27 baris `data/static/doa.json`                    | **N/A** — semua kosong                                        | Sama seperti Dzikir.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 4   | `TokohTarikh.ImageURL` (`model/tokoh_tarikh.go`)                             | 15/15 baris `data/static/tokoh_tarikh.json`           | **N/A** — semua kosong                                        | Field ada & di-parse seeder, tapi tidak ada satu pun baris sumber yang mengisi `image_url`.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 5   | `Location.ImageURL` (siroh/peta Islam, `model/location.go`)                  | 50/50 baris `data/locations.json`                     | **N/A** — field bahkan tidak di-parse `SeedLocationsFromFile` | `image_url` di JSON sumber pun kosong semua; dead field, tidak ada yang perlu diperbaiki.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 6   | `Blog.CoverImage` (`model/blog.go`, `seeder_tier4_blog_articles.go`)         | seluruh seeder                                        | **N/A** — field tidak pernah di-set di seeder manapun         | Tidak ditemukan referensi `CoverImage` di kode seeder manapun.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 7   | `LibraryBook.SourceURL` (`seeder_library_books.go`)                          | 4/4 (semua entri)                                     | **PASS** (terverifikasi tidak langsung)                       | Raw `curl` **dan** `WebFetch` sama-sama kena `403` Cloudflare bot-block di ke-4 URL sunnah.com. `WebSearch site:sunnah.com <slug>` untuk tiap URL mengonfirmasi keempatnya ter-index dengan judul yang cocok persis (Forty Hadith an-Nawawi, Riyad as-Salihin, Bulugh al-Maram, Sahih Muslim) — artinya halaman itu benar ada dan berisi konten yang benar, Cloudflare cuma memblokir traffic non-browser. Verdict: **PASS**, tidak perlu diubah.                                                                              |
| 8   | `Website` (model lain di luar masjid)                                        | —                                                     | **N/A**                                                       | Field `Website` cuma ada di `masjid.go` (`Masjid` & `RadioIslamic`) — keduanya dikecualikan dari task ini. Tidak ada field `Website` di model lain.                                                                                                                                                                                                                                                                                                                                                                            |
| 9   | Grep `https://` di `apps/web/src/app` + `src/components`                     | ~15 hit unik (di luar domain sendiri & infra dikenal) | **1 bug ditemukan**                                           | Lihat detail di bawah.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 10  | `AyahAudio.EveryAyahDir` (everyayah.com)                                     | spot-check 1 file                                     | **PASS**                                                      | Sudah dikonfirmasi bekerja di audit sebelumnya (`2026-09-12-surah-audio-slug-fix.md`), di luar scope task itu — spot-check ulang (`Alafasy_128kbps/001001.mp3`) tetap `200 audio/mpeg`.                                                                                                                                                                                                                                                                                                                                        |
| 11  | `data/tafsirweb_urls.json` (input scraper, bukan field model live)           | spot-check 1 dari ribuan entri                        | **PASS**                                                      | Bukan field yang disajikan ke user (input one-off untuk `scripts/scrape_tafsirweb.go`), tapi domainnya masih hidup (`200 text/html`) saat di-spot-check.                                                                                                                                                                                                                                                                                                                                                                       |

---

## Bug ditemukan & diperbaiki — 10 foto qari di `SurahAudioPlayer.js`

**File:** `apps/web/src/components/SurahAudioPlayer.js` (`QARI_CATALOG`, baris 27-78)

Semua 10 foto qari memakai URL Wikimedia Commons pola
`https://upload.wikimedia.org/wikipedia/commons/thumb/<hash>/<file>/220px-<file>` — pola yang sama
persis dengan bug slug `QuranicAudio` yang sudah diperbaiki di
[`2026-09-12-surah-audio-slug-fix.md`](./2026-09-12-surah-audio-slug-fix.md), tapi field yang
berbeda (foto FE, bukan slug audio BE) dan **belum pernah diperiksa**.

`curl -s -o /dev/null -w "%{http_code} %{content_type}" --max-time 8 -A "Mozilla/5.0" -L "<url>"`
untuk ke-10 URL asli:

| #   | Qari                        | Hasil Curl (220px) | Root cause                                                                                  |
| --- | --------------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| 1   | Mishary Rashid Al-Afasy     | `400`              | Lebar `220px` **bukan** ukuran thumbnail valid Wikimedia (lihat di bawah) + file salah nama |
| 2   | Abdurrahman As-Sudais       | `400`              | sama                                                                                        |
| 3   | Abdul Basit Abdul Samad     | `400`              | sama, file juga tidak eksis dengan nama itu                                                 |
| 4   | Sa'ad Al-Ghamidi            | `400`              | sama                                                                                        |
| 5   | Yasser Al-Dosari            | `400`              | lebar invalid; file **eksis** tapi di hash `6/69`, bukan `5/55`                             |
| 6   | Maher Al-Muaiqly            | `400`              | lebar invalid + file tidak eksis dengan nama itu                                            |
| 7   | Hani Ar-Rifai               | `400`              | lebar invalid + **tidak ada foto Commons untuk orang ini sama sekali**                      |
| 8   | Salah Bukhatir              | `400`              | lebar invalid + **tidak ada foto Commons untuk orang ini sama sekali**                      |
| 9   | Abdullah Al-Juhany          | `400`              | lebar invalid + file tidak eksis dengan nama itu                                            |
| 10  | Ali Abdurrahman Al-Hudhaify | `400`              | lebar invalid + file tidak eksis dengan nama itu                                            |

Body respons Wikimedia untuk `400` konsisten: `"Use thumbnail sizes listed on
https://w.wiki/GHai"` → halaman itu (`mediawiki.org/wiki/Common_thumbnail_sizes`) menyebutkan
Wikimedia cuma menerima hotlink ke lebar standar: `20, 40, 60, 120, 250, 330, 500, 960, 1280,
1920, 3840` px. `220px` **tidak** ada di daftar itu — jadi seluruh 10 URL pasti gagal terlepas
dari apakah filenya benar, karena lebar thumbnail-nya sendiri ditolak Wikimedia.

Selain itu, dicek lewat Wikimedia Commons API (`action=query&prop=imageinfo`) — 9 dari 10 nama
file yang dipakai di kode (mis. `Abdul_Basit_Abdul_Samad.jpg`, `Hani_Ar-Rifai.jpg`) **tidak eksis**
sama sekali di Commons (`"missing":""`); Yasser Al-Dosari eksis tapi hash direktorinya salah
(`5/55` vs yang benar `6/69`).

### Perbaikan

Dicari file Commons yang benar via `action=query&list=search` (per nama qari) lalu diverifikasi
`imageinfo` + `curl` langsung (lebar diganti ke `250px`, ukuran standar terdekat):

| Qari                        | Foto Baru                                                                                                                                         | Verifikasi Curl                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Mishary Rashid Al-Afasy     | `commons/thumb/2/24/Мишари_Рашид.jpg` (judul file Cyrillic, deskripsi mengonfirmasi "Sheikh Mishary Alafasy")                                     | `200 image/jpeg`                                             |
| Abdurrahman As-Sudais       | `commons/thumb/1/18/Abdul-Rahman_Al-Sudais_(Cropped,_2011).jpg`                                                                                   | `200 image/jpeg`                                             |
| Abdul Basit Abdul Samad     | `commons/thumb/e/ee/Abdul_Basit_'Abd_us-Samad_with_King_Faisal.jpg`                                                                               | `200 image/jpeg`                                             |
| Sa'ad Al-Ghamidi            | `commons/thumb/4/43/Saad_al_Ghamdi.jpg`                                                                                                           | `200 image/jpeg`                                             |
| Yasser Al-Dosari            | `commons/thumb/6/69/Yasser_Al-Dosari.jpg` (hash diperbaiki, nama file sama)                                                                       | `200 image/jpeg`                                             |
| Maher Al-Muaiqly            | `commons/thumb/b/b8/Maher_Al_Mueaqly.jpg`                                                                                                         | `200 image/jpeg`                                             |
| Hani Ar-Rifai               | _(dikosongkan → `QARI_FALLBACK_AVATAR`)_                                                                                                          | tidak ditemukan foto Commons untuk orang ini — tidak menebak |
| Salah Bukhatir              | _(dikosongkan → `QARI_FALLBACK_AVATAR`)_                                                                                                          | tidak ditemukan foto Commons untuk orang ini — tidak menebak |
| Abdullah Al-Juhany          | `commons/thumb/2/25/Abdullah_Al_Juhany_(Cropped).png` — deskripsi file mengonfirmasi "Sheikh Abdullah Al Juhany... di atas mimbar Masjidil Haram" | `200 image/png`                                              |
| Ali Abdurrahman Al-Hudhaify | `commons/thumb/9/9c/Ali_al-Hudhayfi.jpg`                                                                                                          | `200 image/jpeg`                                             |

2 dari 10 (Hani Ar-Rifai, Salah Bukhatir) tidak punya foto apapun di Wikimedia Commons setelah
pencarian nama + variasi ejaan — sesuai aturan "jangan fabrikasi", foto keduanya diganti ke
`QARI_FALLBACK_AVATAR` (SVG data-URI inisial, sudah ada di file yang sama untuk qari custom) alih-alih
menebak URL.

`npx prettier --check src/components/SurahAudioPlayer.js` → clean, tidak perlu format ulang.

---

## Ditemukan tapi TIDAK diperbaiki — perlu keputusan produk

**`apps/web/src/app/contact/ContactPageClient.js`** — link kontak/sosial media project sendiri
(bukan konten pihak ketiga yang di-seed, tapi tetap hardcoded `https://`):

| Field     | URL                                   | Hasil Curl                                                                                                |
| --------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| GitHub    | `https://github.com/tholabul-ilmi`    | `404`                                                                                                     |
| X/Twitter | `https://twitter.com/tholabululmi`    | `404`                                                                                                     |
| Instagram | `https://instagram.com/tholabul.ilmi` | `200` (tidak konklusif — Instagram sering balas `200` untuk profil manapun karena SPA client-side render) |

`WebSearch` untuk "Thollabul Ilmi" tidak menemukan akun GitHub/Instagram/Twitter/X publik yang
cocok — kemungkinan ini adalah handle aspirasional/placeholder yang belum benar-benar dibuat.
**Tidak diubah** karena ini bukan koreksi fakta seperti temuan lain (foto qari, slug audio) — ini
keputusan produk (apakah project benar-benar sudah punya GitHub org/social media, atau
placeholder-nya harus dihapus sampai akun asli dibuat). Dilaporkan saja untuk keputusan pemilik
produk.

---

## Dilewati (sesuai instruksi task / sudah di luar scope)

- `services/api/app/db/migrations/seeder_masjid_radio.go` dan seluruh field `Masjid.*` — dikunci
  total, sedang direwrite paralel oleh sesi lain untuk audit manhaj masjid.
- `RadioIslamic.StreamURL` / `LogoURL` / `Website` (juga di `masjid.go`) — sudah selesai diperbaiki
  di [`2026-09-11-radio-islamic-stream-url-fix.md`](./2026-09-11-radio-islamic-stream-url-fix.md).
- `SurahAudio.QuranicAudio` — sudah selesai diperbaiki di
  [`2026-09-12-surah-audio-slug-fix.md`](./2026-09-12-surah-audio-slug-fix.md).
- `kajian.go` (`URL`, `ThumbnailURL`, `TimestampURL`) dan seluruh `data/static/kajian/*.json` —
  semua file kajian sedang berstatus modified/untracked (`git status`) oleh sesi lain saat task ini
  berjalan; juga sudah punya audit dedicated sendiri (`2026-09-08-audit-transkrip-kajian.md`,
  migrasi per-channel). Tidak disentuh sama sekali.
- `AdzanSound.URL` — bukan data seeded/kurasi, ini objek yang di-upload user sendiri (ada
  `UserID`/`ObjectKey`), di luar semangat audit "URL yang di-fabrikasi seeder".
- File lain yang sudah dirty di `git status` sebelum task dimulai (`apps/web/src/app/admin/audit-logs/page.js`,
  `apps/web/src/app/search/SearchClient.js`, `services/api/app/model/hadith_ayah.go`,
  `notification_repository*.go`, `notification_service.go`, dll) — tidak dibuka/diedit sama sekali,
  sesuai aturan "skip file yang sudah dirty oleh sesi lain".

---

## Verifikasi

- `npx prettier --check src/components/SurahAudioPlayer.js` (di `apps/web/`) → clean.
- `go build ./...` di `services/api/` → clean (tidak ada file Go yang diubah task ini, dijalankan
  cuma untuk pastikan baseline tidak rusak sebelum mulai).
- Tidak ada file Go yang diedit sehingga `gofmt`/`go vet` tidak relevan untuk task ini.
