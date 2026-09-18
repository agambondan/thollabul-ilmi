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
  noise murni** untuk query pendek — sudah dicabut dari ranking. Kolom
  `embedding`/HNSW index/`-backfill-embeddings` masih ada tapi tidak
  dipakai search. Jangan pakai lagi sebagai sinyal "semantik" tanpa model
  embedding sungguhan.
- Konfigurasi FTS Postgres `'indonesian'` tidak membuang stopword dan
  stemmer Snowball-nya kadang salah (`menikah`→`meni`).
- `KajianTranscript` soft-delete — seeder wajib `Unscoped()` pas hapus,
  dan semua query search wajib filter `deleted_at IS NULL`.
- **Zero-value `pgvector.Vector` diserialisasi GORM jadi `'[]'` dan
  ditolak Postgres** ("vector must have at least 1 dimension") — bikin
  SEMUA insert transkrip gagal diam-diam. Fix: tag `default:null` di
  model + `db.Omit("Embedding")` di seeder. Kalau nambah kolom `vector`
  lain, wajib `default:null` atau pointer.

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
