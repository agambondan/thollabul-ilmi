# Migrasi Scraper Kajian: Per-Channel File + Tanpa Batas Video

Tanggal: `2026-09-09`
Scope: `services/api/cmd/scrape-kajian`, `services/api/app/db/migrations/seeder_static_file.go`,
`services/api/scripts/scrape_kajian_cron.sh`, `services/api/data/static/kajian*`
Status: `SELESAI` — sudah diverifikasi lewat seed lokal sungguhan, belum di-deploy

Dipicu keluhan user: file `data/static/kajian.json` sudah 48 MB (3.333 video,
83k+ chunk transkrip), berat dibuka di editor. User juga menemukan scraper
tidak pernah menambah video baru untuk channel yang sudah lama di-scrape.

---

## Ringkasan Perubahan

| Sebelum                                                                                 | Sesudah                                                                                                                  |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Satu file `data/static/kajian.json`, gabungan semua channel                             | Satu folder `data/static/kajian/`, satu file `<slug>.json` per channel (mis. `khalidbasalamah.json`)                     |
| Tiap 1 video baru ditulis ulang **seluruh** file gabungan (48 MB)                       | Tiap video baru cuma menulis ulang file channel-nya sendiri (KB–belasan MB)                                              |
| `-max` default 50 (CLI) / 500 (script cron)                                             | `-max` default `0` = tanpa batas, scan seluruh riwayat channel                                                           |
| `-out <file.json>`                                                                      | `-out-dir <folder>` (flag lama dihapus total, bukan diam-diam diberi arti baru)                                          |
| Seeder baca 1 file (`readStaticJSON("kajian.json", ...)`)                               | Seeder baca semua `*.json` di folder (`readStaticJSONDir[T]("kajian")`), fallback ke file lama kalau foldernya belum ada |
| Cron script restart container setelah sync — **tidak pernah benar-benar migrate ke DB** | Cron script jalankan `-migrate` dulu sebelum restart                                                                     |

## Kenapa Video Baru Tidak Nambah-Nambah

`getChannelVideos` memanggil `yt-dlp --flat-playlist --playlist-end <max>` ke
tab `/videos` channel, yang urutannya terbaru dulu. Dengan `-max 500`, scraper
**selalu** cuma melihat 500 video paling baru di channel itu. Begitu ke-500
video itu sudah pernah di-scrape (baik berhasil dapat transkrip maupun gagal
dan masuk skip-cache), setiap run berikutnya cuma menemukan video yang sama
lagi — video ke-501 dan seterusnya (yang lebih lama) tidak pernah tersentuh
sama sekali. Untuk channel produktif (Khalid Basalamah, Firanda Andirja,
dst. — masing-masing >2000 video sepanjang hidup channel-nya), ini berarti
scraper cuma pernah melihat sepotong kecil arsipnya.

Fix: default `-max` jadi `0` (unlimited), yang sebenarnya sudah didukung
kode sejak awal (`if maxVideos > 0 { --playlist-end ... }`) tapi tidak
pernah dipakai karena default CLI 50 dan default script cron 500.

## Bug Tambahan yang Ketemu Sambil Jalan: Cron Tidak Pernah Migrate

`scrape_kajian_cron.sh` lama cuma melakukan `rsync` file lalu
`docker compose restart`. Tapi `main.go` cuma memanggil
`Migrations()`/`Seeder()` kalau dijalankan dengan flag `-migrate`; boot
normal container (`CMD ["/app/main", "-environment", "container"]`, tanpa
`-migrate`) **tidak pernah** menyentuh database. Artinya selama ini
pipeline cron kemungkinan besar cuma mengupdate file JSON di VPS tapi
database production tidak pernah benar-benar ikut ter-update otomatis oleh
cron — perlu migrate manual terpisah. Sudah ditambahkan langkah
`docker compose run --rm --no-deps --entrypoint /app/main <service>
-environment container -migrate` sebelum restart, meniru pola yang sama di
`deploy.sh`.

## Migrasi Data Lama

3.333 video di `kajian.json` dikelompokkan per `speaker` (field ini sama
persis dengan `channel.Name` dari `list_ustad_sunnah.json` saat scraping,
jadi pemetaannya 1:1), lalu ditulis ke `data/static/kajian/<slug>.json`
sesuai slug yang dihasilkan `channelSlug()` (fungsi yang sama dipakai
scraper, diverifikasi dulu lewat `-list-channels` supaya tidak ada
channel yang salah nama file atau tabrakan). Hasil: 14 file (44 channel
lain belum pernah punya konten sukses, jadi belum ada filenya. Sebagian
besar karena `list_ustad_sunnah.json` memang masih punya banyak URL
YouTube yang salah/404 — lebih dari 20 sudah diperbaiki di sesi yang sama,
belum dicatat sebagai dokumen terpisah).

Sekalian dibersihkan 3 video sampah ("famous boy" x2, "new status") yang
nyasar ke `hsiabdullahroy.json` akibat link YouTube Abdullah Roy yang
salah sebelum diperbaiki (channel vlog orang lain, bukan channel HSI-nya).

File lama `services/api/data/static/kajian.json` sudah dihapus dari repo
(`git rm`).

## Verifikasi

- `go build ./...`, `go vet ./...`, `go test ./...` (12 paket) hijau.
- `make db-setup-docker` sungguhan ke Postgres lokal: seeder membaca 14
  file baru, log `[seeder] seedKajianFromFile: 3330 entri` dan
  `83498 transcript chunk tersimpan`, nol error insert. Angka 3330 (bukan 3333) karena 3 video sampah di atas sudah dibuang sebelum migrasi.
- `SELECT count(*) FROM kajian_transcript` di DB lokal: 83.234 baris;
  `SELECT count(*) FROM kajian`: 3.322. Selisih dari angka yang di-log
  seeder (3330/83498) berasal dari baris `title+speaker` duplikat yang
  memang saling menimpa di logika upsert seeder (`Where("speaker = ? AND
title = ?").First(...)`) — perilaku ini sudah ada sejak sebelum migrasi
  ini, bukan regresi dari perubahan folder.

## Yang Perlu Diketahui Agent Lain

- **Jangan cari `data/static/kajian.json` lagi** — itu sekarang folder
  `data/static/kajian/`, satu file per channel. `_index.json` di folder
  itu cuma ringkasan (nama, url, jumlah video/chunk) buat operator baca
  manual, bukan dibaca seeder (nama file diawali `_` sengaja di-skip).
- Cara jalankan scraper manual sekarang pakai `-out-dir`, bukan `-out`.
  Contoh lengkap ada di
  [`scrape_kajian_cron.md`](../../services/api/scripts/scrape_kajian_cron.md).
- Kalau mau scan cepat satu channel buat testing, tetap kasih `-max` kecil
  manual (mis. `-max 20`) — defaultnya sekarang tanpa batas dan bisa lama
  untuk channel besar.
- `services/api/scripts/dump_static_data.go` (`dumpKajian()`, dipanggil
  dari `make db-dump-static`) **belum ikut diubah** — masih nulis satu file
  `data/static/kajian.json` dengan skema yang sudah lama tidak lengkap
  (tanpa `video_id`/`transcripts`). File itu tidak lagi dibaca seeder
  (folder selalu diprioritaskan), jadi kalau tool itu dijalankan hasilnya
  cuma file basi yang tidak kepakai — bukan bug baru, tapi belum
  dirapikan. Lihat juga
  [`2026-09-08-kajian-transcript-search-tuning.md`](./2026-09-08-kajian-transcript-search-tuning.md)
  dan [`2026-09-08-audit-transkrip-kajian.md`](./2026-09-08-audit-transkrip-kajian.md)
  untuk riwayat masalah lain di data kajian yang sama.
