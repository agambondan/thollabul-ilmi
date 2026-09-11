# Fix Stream URL Radio Islam (Semua Mati/Fabrikasi)

Tanggal: `2026-09-11`
Scope: `services/api/app/db/migrations/seeder_masjid_radio.go` (`getRadioIslamicData()`),
`apps/web/src/lib/masjidRadioData.js` (`ISLAMIC_RADIOS`)
Status: `SELESAI` — 9/10 stream URL baru diverifikasi curl langsung, 1 stasiun (#10) dikosongkan
karena tidak ketemu live stream yang bisa diverifikasi

Dipicu laporan user: fitur direktori "Radio Islam" bisa ditekan play tapi audio tidak pernah
keluar. Diagnosis awal menunjukkan seluruh 10 `StreamURL` yang di-seed adalah data lama/fabrikasi
— sebagian besar domainnya sendiri tidak resolve DNS, satu lagi (`stream.zeno.fm/...`) menjawab
`HTTP 401`. Ini bukan regresi dari perubahan baru, murni data yang dari awal tidak pernah benar.

---

## Kondisi Sebelum Perbaikan

Semua 10 `StreamURL` (Go) / `streamUrl` (JS) di-curl dengan
`curl -sD - -o /dev/null --max-time 8 -A "Mozilla/5.0" -L "<url>"`:

| # | Nama Stasiun | URL Lama | Hasil Curl |
| - | --- | --- | --- |
| 1 | Radio Rodja 756 AM | `https://live.radiorodja.com/;` | Tidak ada respons (DNS/koneksi gagal) |
| 2 | Radio Silaturahim (Rasil) 720 AM | `https://streaming.radiosilaturahim.com:8443/rasil` | Tidak ada respons |
| 3 | Radio Muadz Jakarta & Kendari | `https://stream.radiomuadz.com/live` | Tidak ada respons |
| 4 | Radio Tarbiyah Sunnah Bandung | `https://radio.tarbiyahsunnah.com/stream` | Tidak ada respons |
| 5 | Radio Muslim Jogja | `https://stream.radiomuslim.com/stream` | Tidak ada respons |
| 6 | Radio Suara Al-Iman Surabaya | `https://stream.suaraaliman.com/live` | Tidak ada respons |
| 7 | Radio Fajri FM | `https://stream.fajrifm.com/live` | Tidak ada respons |
| 8 | Radio Hang FM Batam | `https://stream.hangfm.id/live` | Tidak ada respons |
| 9 | Radio Kita FM Cirebon | `https://stream.radiokitafm.com/live` | Tidak ada respons |
| 10 | Quran Stream Radio 24 Jam | `https://stream.zeno.fm/f3wvbbqmdg8uv` | `HTTP/2 401` |

"Tidak ada respons" berarti curl tidak mendapat header sama sekali dalam 8 detik — kombinasi
domain yang tidak pernah dipakai stasiun tersebut untuk streaming (menebak subdomain generik
seperti `stream.<domain>`) dengan hostname yang memang tidak resolve.

## Metode Pencarian & Verifikasi URL Baru

Untuk tiap stasiun: cari halaman resmi/live-streaming di situsnya, cek source HTML untuk
`<audio>`/plugin shoutcast-player yang menyimpan URL asli di atribut `data`/list item (banyak situs
WordPress pakai plugin `lbg-audio4-html5-shoutcast` yang taruh URL di `<li class="xradiostream">`),
atau cross-check via agregator (`onlineradiobox.com`) yang sering menyimpan URL stream asli di HTML
mereka. Setiap kandidat lalu diverifikasi dengan:

```
curl -sD - -o /dev/null --max-time 8-10 -A "Mozilla/5.0" -L "<url>"
```

Diterima hanya jika `HTTP 2xx` + `Content-Type: audio/*` (atau header `icy-*` Icecast/Shoutcast).
Header `icy-name`/`icy-description` dicocokkan ke nama/tagline stasiun untuk memastikan bukan
stream station lain yang kebetulan online di URL tebakan.

## Sesudah Perbaikan

| # | Nama Stasiun | URL Baru | Verifikasi |
| - | --- | --- | --- |
| 1 | Radio Rodja 756 AM | `https://live2.radiorodja.com/rodja.mp3` | `200 OK`, `Content-Type: audio/mpeg`, `icy-name: Radio Rodja 756 AM dan 100.1 FM` |
| 2 | Radio Silaturahim (Rasil) 720 AM | `https://ssg.streamingmurah.com:9300/;` | `200 OK` (HTTP/2), `Content-Type: audio/aacp`, Shoutcast — diambil langsung dari `<audio src>` di homepage resmi `radiosilaturahim.com`; `icy-name` kosong tapi content-type audio valid dan sumbernya player resmi situs |
| 3 | Radio Muadz Jakarta & Kendari | `https://radioislamindonesia.com/radiomuadz.mp3` | `200 OK`, `audio/mpeg`, `icy-name: Radio Muadz 94.3 FM Kendari` |
| 4 | Radio Tarbiyah Sunnah Bandung | `https://radioislamindonesia.com/tarbiyah.mp3` | `200 OK`, `audio/mpeg`, `icy-name: Radio Tarbiyah Sunnah 1476 AM Bandung`, `icy-description: Lillah Nyunnah Merenah` |
| 5 | Radio Muslim Jogja | `https://streaming.radiomuslim.com/;stream/1` | `200 OK` (HTTP/2), `audio/mpeg`, `icy-name: Radiomuslim` |
| 6 | Radio Suara Al-Iman Surabaya | `https://radioislamindonesia.com/aliman.mp3` | `200 OK`, `audio/mpeg`, `icy-name: Radio Suara Al-Iman 846 AM Surabaya`, `icy-description: Sarana Penyubur Keimanan` |
| 7 | Radio Fajri FM | `https://radio.mitradio.com/listen/fajrifm/radio.mp3` | `200 OK` (HTTP/2), `audio/mpeg`, `icy-name: 1. FajriFM`, `icy-description: Suara Kebangkitan Islam`, `icy-url: https://www.fajrifm.com` |
| 8 | Radio Hang FM Batam | `https://icecast.surau.tv/hangfm` | `200 OK` (HTTP/2), `audio/mpeg`, `icy-name: HANG FM BATAM`, `icy-description: Radio Dakwah Islam` |
| 9 | Radio Kita FM Cirebon | `https://broadcast.yufid.com/listen/radio_sunnah_cirebon/kitafm` | `200 OK` (HTTP/2), `audio/mpeg`, `icy-name: Kita FM 94.3MHz`, `icy-description: Radio Dakwah Islam From Cirebon City West Java Indonesia`, `icy-url: https://live.radiokitafm.com` |
| 10 | Quran Stream Radio 24 Jam | `""` (dikosongkan) | Tidak ada — lihat di bawah |

Catatan: stasiun #3, #4, dan #6 ternyata di-host bersama di satu Icecast (`radioislamindonesia.com`)
— domain tersebut muncul sebagai `icy-url` di header stream stasiun-stasiun terkait, jadi bukan
tebakan, melainkan hasil ekstraksi dari player resmi tiap situs (`radiomuadz.com`,
`radiotarbiyahsunnah.com/streaming-radio-tarbiyah-sunnah/`, `aliman.id/live/`).

## Stasiun #10 (Quran Stream Radio 24 Jam) — Dikosongkan, Tidak Difabrikasi

URL lama `stream.zeno.fm/f3wvbbqmdg8uv` menjawab `401`. Dicoba beberapa kandidat pengganti:

- Beberapa station ID Zeno.FM lain untuk murottal 24 jam (`al-quran-stream`,
  `radio-murottal-langsung`, dan ID yang dipakai `onlineradiobox.com/eg/quranlive/`) — **semua**
  path `stream.zeno.fm/<id>` yang dicoba menjawab `401` tanpa body. Ini konsisten dengan kejadian
  di URL lama, mengindikasikan Zeno.FM sekarang memblokir hotlink langsung ke `stream.zeno.fm`
  secara umum (butuh player/token resmi mereka), jadi seluruh platform Zeno.FM tidak dipakai lagi
  untuk kategori ini.
- `qurankareemradio.com` (radio Al-Qur'an Kairo) — halaman player berbasis JS, tidak ada URL
  stream langsung yang bisa diekstrak dari HTML statis.
- `jadwalkajian.com/radio-sunnah/` (agregator streaming murottal Indonesia) — halaman full
  JS-rendered (kemungkinan Next.js), tidak ada referensi `.mp3`/`.m3u8` di HTML mentah.
- `radiojar.com/8s5u5tpdtwzuv` (ID yang beredar di berbagai skrip radio open-source sebagai
  "Quran Radio Cairo") — **dicoba dan sengaja ditolak**: responsnya `200 audio/mpeg` tapi
  `icy-name: Mini2's Broadcast`, jelas bukan siaran Qur'an, jadi tidak dipakai.

Karena tidak ada live stream yang bisa diverifikasi benar-benar menyiarkan murottal/Qur'an,
`StreamURL`/`streamUrl` untuk stasiun ini diset ke string kosong (`""`), sesuai instruksi task:
kosong lebih jujur daripada URL yang belum tentu benar. Frontend web sudah menangani string kosong
dengan pesan "Siaran online untuk X belum tersedia" alih-alih tombol play yang mati.

## Verifikasi Build

```
cd services/api
gofmt -l app/db/migrations/seeder_masjid_radio.go   # kosong (bersih)
go build ./...                                       # lulus, tanpa output
go vet ./...                                          # lulus, tanpa output
```

Untuk `apps/web/src/lib/masjidRadioData.js`: **tidak** dijalankan `prettier --write` penuh pada
file ini karena file tersebut belum pernah diformat prettier sebelumnya (banyak baris `address`/
`description` di `JAKARTA_MASJIDS` melebihi print width) — menjalankan prettier penuh akan
me-reformat baris data masjid yang di luar scope task ini (masjid sedang dikerjakan terpisah oleh
sesi lain, ada uncommitted changes lain di file yang sama). Sepuluh baris `streamUrl` diedit
manual mengikuti gaya baris di sekitarnya (double quotes, 4-space indent, trailing comma) — sudah
konsisten dengan konvensi yang ada di file tanpa mengubah baris lain.

## Yang Perlu Diketahui Agent Lain

- Diff `services/api/app/db/migrations/seeder_masjid_radio.go` sekarang berisi dua sumber
  perubahan yang independen: perubahan `getMasjidData()` (koordinat/alamat 8 masjid, lihat
  [`2026-09-11-masjid-seeder-nationwide-expansion.md`](./2026-09-11-masjid-seeder-nationwide-expansion.md))
  dari sesi lain, dan perubahan `getRadioIslamicData()` (10 `StreamURL`) dari task ini. Keduanya
  sengaja tidak disatukan/di-commit di sini — biarkan review terpisah.
- Kalau stream mati lagi di kemudian hari: metode yang paling berhasil di sini adalah curl
  halaman resmi tiap stasiun lalu grep untuk `<li class="xradiostream">` (plugin
  `lbg-audio4-html5-shoutcast`) atau cek `onlineradiobox.com/id/<slug>/` — ORB sering menyimpan
  URL stream asli (bukan proxy mereka sendiri) langsung di HTML halaman stasiun.
- Zeno.FM (`stream.zeno.fm/<id>`) tampaknya sudah memblokir direct hotlink (401 untuk semua ID
  yang dicoba) — jangan pakai domain ini lagi untuk stream baru tanpa verifikasi curl eksplisit.
