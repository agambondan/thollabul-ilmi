# Monitoring & Perawatan VPS

VPS produksi `sumopod-1` (2 vCPU, 2 GB RAM, disk 40 GB) dipakai bersama
project lain (eduplay, wedding), jadi masalah disk atau memori di sini
berdampak ke semuanya. Dokumen ini mencatat apa yang dipasang untuk memantau
dan merawatnya, plus jebakan yang sudah pernah kena.

Akses SSH: alias `sumopod-direct` (port 2222). Jaringan kantor BBG memblokir
port 22, jadi jangan pakai alias yang lewat 22.

## Dashboard

| Alat   | URL                               | Fungsi                                                                                        |
| ------ | --------------------------------- | --------------------------------------------------------------------------------------------- |
| Beszel | https://beszel.thollabulilmi.site | CPU, memori, disk, jaringan, metrik per-container, dan alert                                  |
| pgHero | https://pghero.thollabulilmi.site | Postgres: query lambat (dari `pg_stat_statements`), index duplikat/tak terpakai, ukuran tabel |

- Lokasi di VPS: `/works/me/monitoring/docker-compose.yml` (service `beszel`,
  `beszel-agent`, `pghero`). Data Beszel di volume `beszel_data`,
  `beszel_agent_data`, `beszel_socket`.
- Kredensial **tidak ada di repo**. Basic auth pgHero ada di compose di atas;
  login Beszel dipegang pemilik.
- pgHero memakai role Postgres khusus dengan hak minimum (lewat fungsi
  `SECURITY DEFINER`), bukan `postgres`.
- Cadangan kalau DNS atau tunnel bermasalah: SSH tunnel ke `127.0.0.1:8090`
  (Beszel) dan `127.0.0.1:8080` (pgHero).

### Cloudflare Tunnel

Config: `/etc/cloudflared/config.yml` di VPS (service `cloudflared`). Route
`pghero` ke `http://127.0.0.1:8080` dan `beszel` ke `http://127.0.0.1:8090`.
Path `/_/` (admin UI PocketBase milik Beszel) sengaja dijawab 404 dari publik;
buka lewat SSH tunnel kalau perlu.

## Alert (Beszel)

Sistem `sumopod-1`, notifikasi lewat Telegram:

| Alert           | Kondisi                                               |
| --------------- | ----------------------------------------------------- |
| Status          | Agent tidak terhubung 2 menit atau lebih              |
| Disk            | Pemakaian > 85% selama 5 menit                        |
| Memory          | Pemakaian > 90% selama 10 menit                       |
| CPU             | Pemakaian > 90% selama 10 menit                       |
| ContainerHealth | Container dengan healthcheck jadi unhealthy (1 menit) |

- Kanal: bot `@HermesAgent28_2Bot` (bot kedua milik harness Hermes, profil
  `hermes28`) ke chat pribadi pemilik. URL Shoutrrr-nya
  `telegram://<token>@telegram?chats=<chat_id>`, tersimpan di Beszel
  (Settings, Notifications).
- Kalau token diganti lewat BotFather, perbarui juga di Beszel.
- **Jangan panggil `getUpdates` dengan token itu.** Gateway Hermes memakai
  long polling dengan token yang sama; dua poller saling menendang.
- Pesan `ContainerHealth` menyertakan cuplikan log container. Log API berisi
  path request, jadi kanalnya harus chat pribadi.
- Email alert dikosongkan karena SMTP tidak dikonfigurasi.
- Belum tercakup: alert berbasis metrik aplikasi (`api_slow_requests_total`)
  dan tunnel Cloudflare mati (Beszel ada di dalam VPS, jadi tidak melihatnya).
  Untuk yang kedua butuh pengecek dari luar.

## Perawatan disk

Insiden 2026-09-30: disk sempat **90%** (sisa 4,1 GB). Dua penyebab utama:

1. Setiap deploy memindahkan tag `:prod` ke image baru, image lama jadi
   tanpa tag dan menumpuk (±285 MB per deploy, 21 image = 5,96 GB).
2. Registry lokal membengkak jadi 12,6 GB. Tiap deploy menyisakan revisi
   manifest tanpa tag (390 revisi untuk 19 tag di repo API, 808 untuk 18 tag
   di repo web) dan `registry_cleanup.sh` lama hanya menghapus tag, tidak
   pernah blob-nya.

Hasil pembersihan: disk 90% jadi 52% (19 GB kosong), registry 12,6 jadi 3,4 GB.

Jadwal otomatis di crontab user `ubuntu` (waktu VPS UTC+8):

| Jadwal       | Perintah                                       | Efek                                                  |
| ------------ | ---------------------------------------------- | ----------------------------------------------------- |
| Harian 03:45 | `docker image prune -f --filter until=24h`     | Buang image tanpa tag yang lebih tua dari 24 jam      |
| Minggu 03:30 | `ops/scripts/registry-gc.py --apply` (`flock`) | Registry hanya menyimpan 10 rilis terbaru plus `prod` |

Log: `~/registry-gc.log` dan `~/docker-image-prune.log` di VPS. Image 24 jam
terakhir sengaja disisakan supaya rollback lokal cepat masih mungkin.

### `ops/scripts/registry-gc.py`

Dry run secara default:

```bash
ssh sumopod-direct 'python3 /works/me/thollabul-ilmi/ops/scripts/registry-gc.py'
ssh sumopod-direct 'python3 /works/me/thollabul-ilmi/ops/scripts/registry-gc.py --apply'
```

Opsi: `--keep N` (default 10), `--repos a,b` (default repo project ini),
`--force` (lewati penolakan saat registry baru menerima tulis).

Urutan `--apply`: hapus semua revisi di luar 10 rilis terbaru dan `prod` (beserta
manifest anaknya), verifikasi semua tag lewat API, baru garbage-collect, restart
registry, lalu verifikasi ulang. Verifikasi sebelum GC sengaja ada karena
penghapusan manifest masih bisa dipulihkan (blob belum hilang), GC tidak. Script
menolak jalan kalau ada blob dari manifest yang dipertahankan sudah hilang, atau
kalau registry menerima PUT/POST/PATCH/DELETE dalam 10 menit terakhir.

Salinan di VPS di-copy manual, karena `/works/me/thollabul-ilmi/` di sana bukan
checkout git:

```bash
ssh sumopod-direct 'cat > /works/me/thollabul-ilmi/ops/scripts/registry-gc.py' < ops/scripts/registry-gc.py
```

Kenapa bukan `registry garbage-collect --delete-untagged`: opsi itu menganggap
manifest anak dari OCI image index sebagai "tanpa tag" (memang tidak punya tag)
dan berisiko menghapusnya. Riwayat push di registry ini campuran manifest
tunggal dan OCI index, jadi script menghitung sendiri set yang aman.

### Jebakan registry

- `DELETE /v2/<repo>/manifests/<digest>` hanya menghapus file `link`. Folder
  revisinya tersisa kosong, jadi hitung revisi dari keberadaan `link`, bukan
  dari `ls`.
- Setelah GC, registry harus di-restart. Cache deskriptor in-memory
  (`blobdescriptor: inmemory`) bisa masih menganggap blob yang sudah dihapus
  ada. Sesaat setelah restart, koneksi ke port 5000 bisa di-reset; script
  menunggu sampai `/v2/` menjawab.
- `registry_cleanup.sh` lama (di `/works/me/` VPS, tanpa izin execute) tidak
  dijadwalkan dan hanya menghapus tag; untuk repo project ini sudah tergantikan.

## Ukuran image API

`data/static` sengaja tetap di-bake ke image (lihat komentar di
`services/api/Dockerfile`): stack lokal `make docker-up` tidak bind-mount data,
jadi seeder file butuh salinan di image. Di produksi salinan itu tertimpa bind
mount `./data:/app/data:ro`, dan `deploy.sh` mengirim `data/static` terpisah.

`services/api/.dockerignore` mengecualikan dua file yang hanya dibaca scraper di
laptop (`cmd/scrape-kajian`), tidak pernah oleh API: `kajian_listing_cache.json`
(30 MB) dan `kajian_scrape_state.json`. `data/static` di image turun dari ±145
MB ke 113,8 MB.

## Jebakan lain

- **DNS negatif ter-cache.** Jangan `dig`/`curl` hostname baru sebelum
  record-nya dibuat. Resolver di rumah atau kantor bisa menyimpan NXDOMAIN
  sampai SOA minimum (1800 detik untuk zona ini), lalu hostname yang sudah
  benar tetap tidak terbuka.
- **`cloudflared tunnel route dns` jalankan sebagai `ubuntu`, bukan `sudo`.**
  `cert.pem` ada di `~/.cloudflared` milik `ubuntu` dan hanya berlaku untuk zona
  `thollabulilmi.site`. Hostname zona lain (mis. `jangkauin.site`) tertempel
  jadi `<host>.jangkauin.site.thollabulilmi.site`.
- **Deploy latar bisa terpotong batas waktu.** Kalau terpotong di tengah
  migrate, image sudah ada di registry; jalankan ulang migrate saja lalu
  recreate container. Migrate aman dijalankan ulang (sudah dilakukan beberapa
  kali).
- **`AutoMigrate` tidak pernah menghapus kolom.** Membuang kolom dari model
  tidak membuangnya dari database; deploy kode dulu (kolom masih ada, tidak ada
  yang rusak), baru `ALTER TABLE ... DROP COLUMN` manual. Kebalikannya berisiko:
  API lama yang masih jalan bisa error kalau ada query yang menyebut kolom itu.
  `DROP COLUMN` juga belum mengecilkan file; ruangnya baru kembali setelah
  `VACUUM FULL`, yang mengunci tabel selama proses.
