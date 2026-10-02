# Agent Knowledge — Hal Non-Obvious yang Perlu Diketahui

Kumpulan fakta dan insiden yang tidak kelihatan dari membaca kode saja —
ditemukan lewat debugging/audit sesi-sesi sebelumnya. Baca ini kalau
menyentuh area yang disebutkan, supaya tidak mengulang investigasi atau
kesalahan yang sama. Dokumen ini dirawat manual; kalau nemu insiden baru
sekelas ini, tambahkan section baru di sini.

Lihat juga [`AGENTS.md`](../AGENTS.md) untuk aturan wajib (Chronicle,
commit, multi-agent) dan [`INDEX.md`](./INDEX.md) untuk navigasi dokumen
lain.

---

## Master bisa dalam keadaan broken sementara

Beberapa sesi agent (Claude Code, OpenCode, dll) berjalan **konkuren** di
repo yang sama. Kalau satu sesi commit sebagian fitur (mis. `routes.go`
sudah mendaftarkan controller baru) sementara file yang mendefinisikan
simbolnya masih untracked di working tree sesi lain, `master` bisa
ke-push dalam keadaan tidak bisa `go build`.

**Jangan asumsikan HEAD `master` selalu hijau.** Sebelum kerja non-trivial:
jalankan `go build ./...` (dan test suite web) dulu untuk tahu baseline
benar-benar bersih. Kalau ternyata rusak, prioritaskan **melengkapi file
yang hilang** (bukan revert) — biasanya artinya ada fitur uncommitted lain
di working tree yang justru perlu diselesaikan & di-commit.

Insiden nyata (2026-09-08): commit `683adc6` menyapu sebagian
`routes.go`/`migration.go` yang mereferensikan `model.Masjid{}` dan
`NewRadioIslamicController`, padahal `model/masjid.go`/
`masjid_controller.go` yang mendefinisikannya belum ikut ter-commit.

---

## Data hadis: Arab dan terjemahan sering tidak sepasang

Per audit 2026-09-03 (sensus penuh, bukan dugaan): `translation.ar` dan
`translation.idn` pada satu nomor hadis sering merujuk hadis **berbeda**.
~3.800 dari 35.968 baris yang bisa dinilai kena — Muslim ~23%, Malik ~16%,
Abu Dawud ~13%, Bukhari ~10%, Tirmidzi ~10%, sisanya lebih kecil.

**Ini bukan geseran nomor** — menggeser terjemahan ke nomor lain
menjatuhkan kecocokan ke level kebetulan (11–21%), jadi tidak bisa
diperbaiki dengan memasangkan ulang data yang sudah ada di DB. Perbaikan
wajib lewat **impor ulang dari sumber yang Arab dan terjemahannya satu
edisi**.

- Laporan lengkap: [`reviews/2026-09-03-audit-pasangan-hadis.md`](./reviews/2026-09-03-audit-pasangan-hadis.md)
- Alat ukur + gerbang mutu: `scripts/audit-hadith-pairing/` — jalankan
  `validate.py` tiap kali data hadis di-seed ulang atau matcher-nya diubah.

---

## Kajian: seeder dari data static

### Kajian transcript fabrication {#kajian-transcript-fabrication}

5 video kajian panjang (58–91 menit) sempat 2× ketahuan cuma punya
transkrip 2 chunk (~120 detik) berisi kalimat generik gaya "nasihat buku"
— bukan hasil scrape asli (`cmd/scrape-kajian`), video_id:
`7xRlElvBqjc`, `f5jy4djuElM`, `TlYXJ6quAoE`, `DoqO9vxIHYE`, `qxaJIAppS7U`.

- **2026-09-08**: disimpulkan kelima video **tidak punya caption YouTube
  sama sekali** → `transcripts` dikosongkan di `kajian.json` (file
  tunggal lama). Lihat [`reviews/2026-09-08-audit-transkrip-kajian.md`](./reviews/2026-09-08-audit-transkrip-kajian.md)
  — **kesimpulannya keliru, lihat koreksi di dokumen itu.**
- **2026-09-09**: migrasi ke folder per-channel tidak ikut membawa fix
  2026-09-08 (entah generate ulang dari snapshot lama, atau fix aslinya
  cuma menyentuh DB). Karena seeder selalu baca ulang JSON sebagai source
  of truth, konten fabrikasi otomatis muncul lagi.
- **2026-09-11**: dicek ulang langsung via `yt-dlp --write-subs
--write-auto-subs` — **kelima video ternyata PUNYA caption Indonesia
  asli**. Diperbaiki pakai flag baru `-fix-video` di `cmd/scrape-kajian`
  (re-fetch video_id spesifik, upsert ke file channel-nya) — 389 chunk
  transkrip asli menggantikan 10 chunk fabrikasi. Commit `41b297cd`,
  ditulis langsung ke `services/api/data/static/kajian/<slug>.json` (bukan
  cuma DB), jadi tahan re-seed.

**Kalau user lapor lagi soal transkrip pendek/mencurigakan** (ciri: persis
2 chunk, batas waktu 0–60 & 61–120, kalimat generik terlalu rapi) untuk
video lain: **jangan percaya begitu saja kesimpulan lama** bahwa video itu
"tidak punya caption" — cek ulang langsung ke YouTube setiap kali (caption
bisa ditambahkan belakangan, atau kesimpulan sebelumnya bisa salah). Cara
cepat verifikasi:

```bash
yt-dlp --skip-download --write-subs --write-auto-subs \
  --sub-langs "id.*,en.*,id,en" --no-warnings --dump-json --no-simulate <url>
```

Kalau memang ada caption asli, pakai `-fix-video <video_id>` (butuh
`-channel`+`-speaker`) — jangan tulis manual ke JSON. **Perbaikan data
harus menyentuh file JSON sumber**, bukan cuma DB, karena `seedKajianFromFile`
akan menimpa DB lagi di re-seed berikutnya dari JSON manapun.

### Pencarian transkrip kajian

Rework 2026-09-08, dokumen: [`reviews/2026-09-08-kajian-transcript-search-tuning.md`](./reviews/2026-09-08-kajian-transcript-search-tuning.md).

- **Caption otomatis YouTube pakai ejaan KBBI**, bukan ejaan pesantren yang
  diketik user: `salat` 836× vs `sholat` 0×, `hadis` 981× vs `hadits` 4×,
  `ustaz` 1609× vs `ustadz` 12×. Tanpa peta varian ejaan
  (`app/lib/textsearch/variants.go`), query user bisa dapat 0 hasil.
- **Embedding `kajian-local-hash-v1` (FNV token+trigram, 256 dim) itu
  noise murni** untuk query pendek — dicabut dari ranking 2026-09-08, lalu
  kolom `kajian_transcript.embedding`, HNSW index, `-backfill-embeddings`
  dan cron-nya dibuang total 2026-09-30. Jangan pakai lagi sebagai sinyal
  "semantik" tanpa model embedding sungguhan. Mode "Makna" berjalan di atas
  FTS stemmer Indonesia + varian ejaan + trigram fuzzy (typo).
- Konfigurasi FTS Postgres `'indonesian'` tidak membuang stopword dan
  stemmer Snowball-nya kadang salah (`menikah`→`meni`).
- `KajianTranscript` soft-delete — seeder wajib `Unscoped()` pas hapus,
  dan semua query search wajib filter `deleted_at IS NULL`.
- **Zero-value `pgvector.Vector` diserialisasi GORM jadi `'[]'` dan
  ditolak Postgres** ("vector must have at least 1 dimension"). Dulu ini
  bikin SEMUA insert transkrip gagal diam-diam (kolomnya sudah dibuang,
  jebakannya tetap berlaku). Kalau nambah kolom `vector` di model, wajib
  `default:null` atau pointer, dan `Omit` field itu di insert.
- **Query dengan `Table().Scan()` melewati soft-delete.**
  `GetTranscriptsByKajianID` pernah menyajikan tombstone: kajian 58 chunk
  tampil 116. Tulis `deleted_at IS NULL` eksplisit, dengan `OR` dalam kurung.
- **Seeder kajian dilewati bila sidik direktori tidak berubah** (mtime
  terbaru, ukuran total, jumlah file). Deploy dari worktree baru mengubah
  mtime sehingga memicu re-seed penuh; deploy dari checkout yang sama tidak.
- **Video yang sama boleh ada di dua file channel** (20 video di
  `cintasunnahtv.json` dan `rodjatv.json`, batas chunk sedikit berbeda).
  Hanya entri terakhir per `video_id` yang di-seed; tanpa itu dua entri saling
  menghapus chunk lawannya dan id chunk berganti di tiap re-seed, yang
  menjadikan `kajian_user_bookmark.chunk_id` yatim.

Uji lewat harness lokal (seed ke Postgres compose, port 54320):
`KAJIAN_SEARCH_PG_DSN=... go test ./app/repository/ -run TestKajianSearchPostgres`.

---

## Kutipan "HR. Ahmad jilid/halaman" — ~39% bermasalah

Audit 2026-09-17 atas 28 kutipan "HR. Ahmad `<jilid>/<halaman>`" di
`asbabun_nuzul.json`, `siroh_content.json`, `islamic_term.json` (verifikasi
via dorar.net/islamweb.net/Wikisource/alukah.net/islamqa.info): 18 MATCH,
10 dikoreksi/dihapus. Pola yang ketahuan: hadis di jilid/halaman yang
dikutip ternyata bicara topik lain sama sekali, perawi+ayat dipasangkan
salah, atau hadis itu sebenarnya bukan di Musnad Ahmad sama sekali.

Laporan lengkap per-entry: [`reviews/2026-09-17-audit-ahmad-jilid-halaman-citations.md`](./reviews/2026-09-17-audit-ahmad-jilid-halaman-citations.md).

**Peringatan penting:** `seedAsbabunNuzulFromFile` di
`services/api/app/db/migrations/seeder_static_file.go` bersifat
**insert-only** (skip kalau `title` sudah ada) — fix di JSON source
**tidak otomatis** sampai ke database yang sudah ter-seed. Kalau baris ini
sudah pernah di-seed ke DB lokal/production, butuh `UPDATE` manual by
`title` untuk membawa perbaikan masuk.

**Sampel tunggal yang kebetulan cocok tidak representatif** — jangan
pernah anggap 1 sampel cukup untuk validasi konten agama jenis ini.
Heuristik cepat deteksi citation-padding: rentang halaman >1 untuk satu
hadis, nomor Tirmidzi/Ahmad yang topik/perawinya beda dari klaim naratif,
atau perawi minor diatribusikan ke juz 1 Musnad Ahmad (khusus Khulafa
Rasyidin + 'Asyarah Mubasysyarin).

---

## VPS: deploy meninggalkan sampah yang diam-diam menghabiskan disk

Tiap `make <service>.deploy` memindahkan tag `:prod` ke image baru. Image
lama jadi tanpa tag (±285 MB per deploy untuk API) dan **tidak pernah hilang
sendiri**. Di registry lokal, tiap push menyisakan revisi manifest tanpa tag,
dan `registry_cleanup.sh` lama hanya menghapus tag, bukan blob-nya. Per
2026-09-30 disk VPS (yang dipakai bareng eduplay dan wedding) sampai 90%
sebelum ketahuan; sesudah dibersihkan 52%.

Sekarang sudah otomatis (crontab `ubuntu` di VPS): `docker image prune`
harian dan `ops/scripts/registry-gc.py` mingguan, plus alert disk > 85% di
Beszel. Kalau alert itu bunyi, jalankan dulu dry run script di atas, jangan
`registry garbage-collect --delete-untagged` mentah: opsi itu berisiko
menghapus manifest anak dari OCI index yang masih dipakai.

Detail lengkap dan jebakannya:
[`setup/vps-monitoring-and-maintenance.md`](./setup/vps-monitoring-and-maintenance.md).

---

## API di belakang Cloudflare Tunnel: IP klien, rate limit, dan metrik

Insiden 2026-09-30: semua klien tampak sebagai satu IP, jadi tiap rate limiter
punya satu bucket untuk seluruh pengguna (limiter auth: 10 percobaan per menit
untuk semua orang; agent stress test kena 429 dari IP mana pun).
Detail: [`reviews/2026-09-29-backend-performance-production-review.md`](./reviews/2026-09-29-backend-performance-production-review.md#d5-rate-limiter-menghitung-semua-pengguna-sebagai-satu-ip).

- **IP klien = `CF-Connecting-IP`, dipercaya hanya dari peer privat atau
  loopback** (`app/http/client_ip.go`, override dengan `TRUSTED_PROXIES`). Lewat
  cloudflared dan `docker-proxy`, alamat peer selalu gateway Docker
  (`172.21.0.1`); panggilan dari container web datang dari `172.21.0.5`.
- **Jangan hapus `EnableIPValidation`.** Tanpa itu `c.IP()` mengembalikan isi
  header apa adanya, kosong untuk pemanggil tanpa header (curl di VPS, panggilan
  internal), dan semuanya berbagi satu kunci kosong.
- **IP klien yang kini nyata harus disimpan berkunci.** `hashIP` di
  `page_view_service.go` memakai HMAC-SHA256 (`IP_HASH_SECRET`, cadangan
  diturunkan dari `ACCESS_SECRET`). Jangan mengganti dengan hash polos: SHA-256
  tanpa kunci atas alamat IPv4 bisa dibalik dengan brute force.
- Port API hanya terikat ke `127.0.0.1:29900`, jadi header tidak bisa
  dipalsukan dari luar. Kalau port pernah dibuka ke publik, persempit
  `TRUSTED_PROXIES` ke alamat proxy saja.
- **Load test.** Satu IP dibatasi 180 per menit global dan 10 per menit di
  endpoint auth. Dari VPS, kirim `CF-Connecting-IP` berbeda per klien simulasi
  ke `http://127.0.0.1:29900`. Dari luar, header itu ditimpa Cloudflare. Tanpa
  header dari VPS, panggilan dianggap internal dan memakai bucket longgar
  (`RATE_LIMIT_INTERNAL`, default 3000 per menit) yang bukan cerminan batas
  pengguna nyata.
- Proxy Next.js `/api/v1/*` menyalin semua header masuk, jadi IP pengunjung
  ikut terbawa. Render server components tidak membawa IP pengunjung; panggilan
  itu jatuh ke bucket internal (peer tepercaya tanpa header), bukan bucket
  publik, dan peer yang tidak tepercaya tidak pernah mendapat tingkat itu.
- **`MetricsMiddleware` harus di depan semua limiter.** Kalau tidak, 429 tidak
  tercatat dan masalah seperti ini tidak terlihat.
- **String dari `c.Method()`, `c.Path()`, `c.Query()`, `c.Params()`, `c.Get()`
  menunjuk ke buffer request yang dipakai ulang** dan hanya valid selama
  handler. Jangan disimpan (label Prometheus, map, goroutine, cache in-memory)
  tanpa disalin dengan `strings.Clone` atau dipetakan ke konstanta. Insiden:
  label `method` menjadi "GETT" dan `/metrics` mengembalikan error.

---

## Tes repository: penamaan tabel dan soft delete

- **Fixture SQLite harus memakai `SingularTable: true`**, persis seperti
  `app/db/postgresql.go` dan `db_sqlite.go`. Dengan penamaan plural bawaan GORM,
  SQL mentah yang salah (`hadiths`, `content_reports`, `doas`) tampak benar di tes
  dan baru meledak di produksi. Gunakan `softdelete/testdb.Open`.
- **Tes soft delete ada di `app/repository/softdelete/<domain>`.** Repository
  baru yang memakai SQL mentah, `Joins("JOIN ...")`, `.Table()` atau `Scan` ke
  struct non-model wajib punya tes di sana: GORM tidak menambahkan
  `deleted_at IS NULL` di jalur itu. Filter tabel yang di-join ditaruh di `ON`,
  bukan `WHERE`, supaya `LEFT JOIN` tidak berubah jadi `INNER JOIN`.
- **`paginate.With(...)` menjalankan query `Unscoped()`**, dan `Preload` di
  dalamnya mewarisinya. Beri setiap `Preload` kondisi `deleted_at IS NULL`
  (`blogLive`, `hadithLiveMedia`).
- **`CreatedAt *int64` dengan `autoCreateTime` tidak bisa diisi GORM saat
  insert.** Isi manual (`unixNow()` di `repository/unix_time.go`) atau pakai
  `int64` biasa.
- **Indeks unik non-parsial + soft delete + `DO NOTHING` = tidak bisa membuat
  ulang baris yang pernah dihapus.** Pakai `DO UPDATE ... WHERE deleted_at IS NOT
NULL` untuk menghidupkan kembali (lihat `KajianBookmarkRepository.Add`).
- Paginator menelan galat SQL: endpoint ber-paginate yang salah nama tabel
  menjawab 200 dengan daftar kosong, bukan 500. Cek `RawError` di tes.

---

## Deploy gagal "cannot reach sumopod over SSH"

Pesan itu tidak selalu berarti jaringan BBG. Kalau `ssh sumopod true` berhasil
sebagian dan sebagian gagal dengan `kex_exchange_identification: Connection
closed by remote host`, sshd di VPS sedang throttling (`MaxStartups`) karena
banjir percobaan login dari internet (lihat D11 di review performa). Coba ulang
tidak cukup karena satu deploy butuh belasan koneksi. Buka satu koneksi master
dengan retry dan jalankan deploy dengan `ssh` yang memakai `ControlMaster` (satu
koneksi dipakai semua langkah), lalu tutup dengan `ssh -O exit`.

---

## `ExploreScreen`'s `activeFeature` hidup di luar pohon state `appNavigation.js`

Per audit B12 (`docs/reviews/2026-10-01-belajar-hub-deep-audit.md`,
`2026-10-01`): fitur Belajar yang dibuka dari hub LAIN (mis. "Doa" dari hub
Ibadah) dirender di bawah tab `"belajar"` yang sesungguhnya, dengan
`returnRoutes.belajar = {tab: "ibadah"}` supaya chrome (`getShellActiveTab`)
menampilkan "Ibadah". Menekan tab "Belajar" dari state ini tampak seperti
tombol mati — highlight berubah tapi konten tetap nyangkut di fitur lama.

**Kenapa:** `activeFeature` (fitur yang sedang ditampilkan `ExploreScreen`)
adalah `useState` murni di komponen itu sendiri — **bukan** bagian dari
pohon reducer `appNavigation.js`. `ExploreScreen` tidak pernah membaca
`internalRoutes`/`navigation.current` sama sekali (dicek lewat grep). Jadi
perbaikan level reducer saja (mis. "reset `internalRoutes[tab]` saat tab
diminta ulang") **tidak akan pernah menyentuh bug sejenis ini** — reducer
dan konten yang terlihat adalah dua sumber kebenaran terpisah yang
kebetulan biasanya sinkron.

**Pola fix yang benar** (dipakai di B12): reducer melaporkan sinyal eksplisit
(`openTabState` mengembalikan `resetContent: true`) saat terdeteksi kasus
"tab diminta ulang tapi chrome sedang menyamarkannya sebagai tab lain";
`App.js` menaikkan counter dan menyisipkannya ke `key` pane React supaya
`ExploreScreen` di-remount bersih — bukan mengandalkan state reducer untuk
memberi tahu komponen secara langsung.

**Terkait:** pipa `currentFeatureKey` (dari fix B5, `commit 8d7611a0`) adalah
mekanisme GENERIK "`featureKey` apa yang dideklarasikan layar yang sedang
tampil lewat `navigation.setHeader({featureKey: ...})`", diteruskan
`App.js` → shell → `MobileMenuSheet`. Bukan khusus `ExploreScreen`/fitur
Belajar — `ProfileScreen.js` ikut memakainya (fix B16) untuk membedakan
Pengaturan/Bantuan/Tentang di hamburger. Kalau butuh "layar mana yang lagi
aktif" untuk highlight semacam ini, pakai pipa yang sudah ada ini dulu
sebelum bikin mekanisme paralel baru.

**Efek samping kedua, ditemukan lewat B20** (sesi 5): karena
`ExploreScreen` menutup `activeFeature` lewat state lokal (bukan lewat
`appNavigation.js`), transisi itu juga tidak terlihat oleh bagian LAIN
`App.js` yang cuma mengamati `activeTab`/`internalRoutes` — termasuk
listener `Keyboard.addListener("keyboardDidHide", ...)` yang menentukan
`keyboardVisible` (dipakai `ClassicAppShell`/`WebAppShell` buat
menyembunyikan tab bar saat keyboard terbuka). Menutup fitur Belajar yang
sedang fokus di kolom pencarian bisa membongkar native view input SEBELUM
event `keyboardDidHide` sempat terkirim, jadi `keyboardVisible` tersangkut
`true` selamanya (tab bar hilang permanen, cuma pulih lewat restart
proses penuh). Fix-nya: `headerConfig` (state yang DIUBAH tiap
`navigation.setHeader(...)` dipanggil layar manapun, lintas layout) ikut
jadi dependency di `useEffect` penangkal yang me-reset `keyboardVisible`
ke `false` — satu-satunya sinyal `App.js`-level yang benar-benar
menangkap transisi `ExploreScreen` ini. Pelajaran umum: kalau sebuah
mekanisme di `App.js` cuma mengamati `activeTab`/`internalRoutes` buat
tahu "layar barusan berubah", dia TIDAK akan melihat transisi internal
`ExploreScreen` — pakai `headerConfig` (via `setHeader`) sebagai sinyal
tambahan kalau itu yang sebenarnya ingin diketahui.

---

## Prettier markdown bisa berosilasi (tidak idempotent) di list bersarang dalam

Ditemukan di `docs/reviews/2026-10-01-belajar-hub-deep-audit.md` (entri
detail B20, paragraf lanjutan bernomor di dalam satu item bullet,
dipisah baris kosong). `npx prettier --write` berulang-ulang pada file
ini **tidak konvergen** — dua hasil berbeda bergantian muncul tiap kali
dijalankan (dibuktikan dengan membandingkan md5sum dua `--write`
berturut-turut). Ini bug non-idempotency Prettier pada printer markdown
untuk pola nesting tertentu, bukan kesalahan isi/konten.

**Cara menyikapi:** jangan buang waktu menjalankan `--write` berulang
kali berharap konvergen. Satu kali `--write` lalu commit apa adanya;
`--check` yang tetap merah pada file ini (khususnya bagian ini) adalah
false-positive yang sudah diketahui, bukan tanda isi salah — verifikasi
isi dengan `diff` yang mengabaikan whitespace, bukan `prettier --check`.

---

## `console.log` tidak sampai ke `adb logcat` di build release RN 0.81 Bridgeless

Ditemukan saat investigasi B20 (`docs/reviews/2026-10-01-belajar-hub-deep-audit.md`,
`2026-10-02`): `console.log` yang dipasang di `apps/mobile` untuk debugging
runtime **tidak pernah muncul** di `adb logcat -s ReactNativeJS:V` sama
sekali pada APK release — dikonfirmasi string log ada di bundle JS
(`grep` ke `index.android.bundle`) tapi `logcat -b all` tetap kosong
total. Kemungkinan besar perilaku RN 0.81 New Architecture/Bridgeless
yang me-reroute `console.*` lewat jalur berbeda di build release
(belum ditelusuri sampai ke kode native RN — kalau ada yang menemukan
penyebab pastinya, update catatan ini).

**Cara menyikapi:** jangan andalkan `console.log` + `logcat` untuk
debugging timing/race di build release repo ini. Pindah ke logging
on-device sinkron: tulis ke file lewat `expo-file-system`
(`FileHandle`, append sinkron) di titik-titik yang mau diamati, lalu
`adb pull` file itu setelah tiap trial buat dibaca. Build debug
(`./gradlew assembleDebug` + Metro bundler jalan) kemungkinan masih
bisa pakai `console.log` normal lewat Metro — belum dicoba sesi ini,
tapi itu alternatif lebih cepat untuk dicoba duluan sebelum pindah ke
file-based logging kalau sesi berikutnya butuh debugging serupa.
