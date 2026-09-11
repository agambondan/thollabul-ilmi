# Fix Slug QuranicAudio Surah Audio (8/10 Qori Link Mati)

Tanggal: `2026-09-12`
Scope: `services/api/app/db/migrations/seeder_audio.go` (field `QuranicAudio` di `qariCatalog`)
Status: `SELESAI` — 8/8 slug yang diperbaiki diverifikasi curl langsung `HTTP 200` +
`Content-Type: audio/mpeg` untuk surah 001 (tidak ada yang perlu dikosongkan)

Dipicu temuan di [`2026-09-12-project-deep-review.md`](./2026-09-12-project-deep-review.md):
"audio surah 8/10 qori link mati (pola sama dengan bug radio)". Diagnosis awal mengonfirmasi
8 dari 10 slug `QuranicAudio` yang di-seed menghasilkan `404` saat dipakai membangun URL
`https://download.quranicaudio.com/quran/<slug>/<3-digit-surah>.mp3` — hanya
`abdurrahmaan_as-sudays` (As-Sudais) yang sudah benar sejak awal. Ini bukan regresi, murni data
transliterasi lama yang salah format sejak awal di-seed.

## Akar Masalah

Slug lama pakai backtick (<code>`</code>) untuk mewakili bunyi `ain`/hamzah ala transliterasi ilmiah (mis. <code>sa`d_al-ghaamidi</code>, <code>haani_ar-rifaa`i</code>). Pada kenyataannya, server download.quranicaudio.com tidak pernah pakai backtick di path URL-nya — mereka pakai gaya "chat Arabic" dengan angka 3 sebagai gantinya, dan beberapa reciter malah punya slug yang sama sekali berbeda dari transliterasi namanya (subfolder tahun rekaman, nama pendek, dll).

## Kondisi Sebelum Perbaikan

Semua 10 `QuranicAudio` di-curl dengan
`curl -s -o /dev/null -w "%{http_code}" --max-time 8-10 -A "Mozilla/5.0" "https://download.quranicaudio.com/quran/<slug>/001.mp3"`:

| #   | Qari (Name)                 | Slug Lama                                                                    | Hasil Curl          |
| --- | --------------------------- | ---------------------------------------------------------------------------- | ------------------- |
| 1   | Mishary Rashid Al-Afasy     | <code>mishaari_raashid_al-`afaasee</code>                                    | `404`               |
| 2   | Abdurrahman As-Sudais       | `abdurrahmaan_as-sudays`                                                     | `200` (sudah benar) |
| 3   | Abdul Basit Abdul Samad     | `abdul_basit`                                                                | `404`               |
| 4   | Saad Al-Ghamidi             | <code>sa`d_al-ghaamidi</code>                                                | `404`               |
| 5   | Yasser Al-Dosari            | `yaasir_ad-dusaari`                                                          | `404`               |
| 6   | Maher Al-Muaiqly            | <code>maahir_ibnaa\_`ali\_haashim\_ibn\_`abdul\_`aziiz\_al-mu`ayqiliy</code> | `404`               |
| 7   | Hani Ar-Rifai               | <code>haani_ar-rifaa`i</code>                                                | `404`               |
| 8   | Salah Bukhatir              | <code>salaah\_`abdul\_`aziiz_bukhaatir</code>                                | `404`               |
| 9   | Abdullah Al-Juhany          | <code>abdullaah\_`abdul\_`aziiz\_`abdullaah_aal-juhany</code>                | `404`               |
| 10  | Ali Abdurrahman Al-Hudhaify | <code>`ali_ibn_`abd_ar-rahman_al-hudhaify</code>                             | `404`               |

## Metode Pencarian & Verifikasi Slug Baru

Untuk As-Sudais slug lama sudah benar, jadi tidak diubah. Untuk 9 lainnya:

1. Coba substitusi backtick → `3` langsung di slug lama (berhasil untuk Al-Afasy dan Abdul Basit,
   dengan catatan Abdul Basit butuh suffix `_murattal` karena slug bare `abdul_basit` tidak eksis
   sebagai path sendiri — ada dua gaya bacaan, murattal dan mujawwad).
2. Untuk 6 qari yang benar-benar masih rusak (Al-Ghamidi, Ad-Dosari, Al-Muaiqly, Ar-Rifai,
   Bukhatir, Al-Juhany) ditambah Al-Hudhaify yang diriset ulang untuk berjaga-jaga, substitusi `3`
   saja tidak cukup karena slug asli quranicaudio.com jauh berbeda dari transliterasi nama lengkap
   yang dipakai di seeder. Solusinya: `WebFetch` ke halaman reciter resmi di
   `quranicaudio.com/quran/<id-numerik>` (id ditemukan dulu lewat `WebFetch` ke homepage
   `quranicaudio.com` yang me-list seluruh direktori reciter), lalu ekstrak link download
   `001.mp3` langsung dari HTML halaman tersebut — itulah slug asli yang dipakai server, bukan
   tebakan.
3. Semua kandidat hasil langkah di atas diverifikasi ulang dengan curl langsung ke
   `download.quranicaudio.com` (surah 001, ditambah spot-check 002 dan 114 untuk mengonfirmasi
   pola berlaku di seluruh Al-Qur'an, bukan cuma 1 file yang kebetulan ada).

## Sesudah Perbaikan

| #   | Qari (Name)                 | Slug Lama                                                                    | Slug Baru                       | Verifikasi Curl                                                                                                                              |
| --- | --------------------------- | ---------------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Mishary Rashid Al-Afasy     | <code>mishaari_raashid_al-`afaasee</code>                                    | `mishaari_raashid_al_3afaasee`  | `200`, `audio/mpeg` (001)                                                                                                                    |
| 2   | Abdurrahman As-Sudais       | `abdurrahmaan_as-sudays`                                                     | _(tidak diubah, sudah benar)_   | `200` (sudah terverifikasi sebelumnya)                                                                                                       |
| 3   | Abdul Basit Abdul Samad     | `abdul_basit`                                                                | `abdul_basit_murattal`          | `200`, `audio/mpeg` (001)                                                                                                                    |
| 4   | Saad Al-Ghamidi             | <code>sa`d_al-ghaamidi</code>                                                | `sa3d_al-ghaamidi/complete`     | `200`, `audio/mpeg` (001, 002, 114) — slug diambil dari HTML resmi `quranicaudio.com/quran/13`                                               |
| 5   | Yasser Al-Dosari            | `yaasir_ad-dusaari`                                                          | `yasser_ad-dussary`             | `200`, `audio/mpeg` (001, 002, 114) — dari `quranicaudio.com/quran/97`                                                                       |
| 6   | Maher Al-Muaiqly            | <code>maahir_ibnaa\_`ali\_haashim\_ibn\_`abdul\_`aziiz\_al-mu`ayqiliy</code> | `maher_almu3aiqly/year1440`     | `200`, `audio/mpeg` (001, 002, 114) — dari `quranicaudio.com/quran/159`, rekaman tahun 1440H                                                 |
| 7   | Hani Ar-Rifai               | <code>haani_ar-rifaa`i</code>                                                | `rifai`                         | `200`, `audio/mpeg` (001, 002, 114) — dari `quranicaudio.com/quran/27` (bukan reciter Rifai lain, `quran/10`, yang merupakan Nabil Ar-Rifai) |
| 8   | Salah Bukhatir              | <code>salaah\_`abdul\_`aziiz_bukhaatir</code>                                | `salaah_bukhaatir`              | `200`, `audio/mpeg` (001, 002, 114) — dari `quranicaudio.com/quran/18`                                                                       |
| 9   | Abdullah Al-Juhany          | <code>abdullaah\_`abdul\_`aziiz\_`abdullaah_aal-juhany</code>                | `abdullaah_3awwaad_al-juhaynee` | `200`, `audio/mpeg` (001, 002, 114) — dari `quranicaudio.com/quran/1`                                                                        |
| 10  | Ali Abdurrahman Al-Hudhaify | <code>`ali_ibn_`abd_ar-rahman_al-hudhaify</code>                             | `huthayfi`                      | `200`, `audio/mpeg` (001, 002, 114) — dari `quranicaudio.com/quran/8` (bukan `quran/113`, Ahmad Al-Huthaify, reciter berbeda)                |

Tidak ada slug yang dikosongkan — seluruh 8 slug yang diperbaiki berhasil ditemukan dan
diverifikasi bekerja.

Catatan implementasi: dua slug baru (`sa3d_al-ghaamidi/complete` dan `maher_almu3aiqly/year1440`)
mengandung `/` karena reciternya punya subfolder di server (mis. gaya bacaan/tahun rekaman
berbeda). Ini aman dipakai apa adanya sebagai isi field `QuranicAudio` karena `surahAudioURL()`
cuma melakukan
`fmt.Sprintf("https://download.quranicaudio.com/quran/%s/%03d.mp3", q.QuranicAudio, surahNum)` —
substitusi string biasa, jadi `/` di tengah slug menghasilkan path bersarang yang benar.

## Verifikasi Build

```
cd services/api
gofmt -l app/db/migrations/seeder_audio.go   # kosong (bersih)
go build ./...                                # lulus, tanpa output
go vet ./app/db/migrations/...                # lulus, tanpa output
```

`go vet ./...` di level repo gagal, tapi kegagalannya ada di
`app/services/notification_push_test.go` (fake `NotificationRepository` yang belum implement
`DeletePushToken`) — file itu tidak disentuh sama sekali di task ini, jadi ini masalah pre-existing
di `master` dari sesi lain, bukan regresi dari perubahan `seeder_audio.go`. Konsisten dengan catatan
lama: "Master bisa broken akibat commit sapuan sesi lain — jangan asumsikan HEAD hijau."

## Frontend: Penanganan Slug/URL Kosong

Dicek `apps/web/src/components/SurahAudioPlayer.js` karena instruksi task meminta konfirmasi
sebelum mengosongkan `QuranicAudio` mana pun — meskipun akhirnya tidak ada yang perlu dikosongkan,
hasil pengecekan tetap dicatat untuk referensi ke depan:

- Semua tempat yang mengonsumsi `audio_url` (`loadQariOptions`, `getAyahSources`) sudah
  `.filter((item) => item.audio_url)` — item dengan `audio_url` falsy otomatis tidak masuk daftar
  qari yang ditampilkan.
- `buildAudioCandidates()` dan `playCandidate()` juga sudah defensif: kalau `source.audio_url`
  falsy, player langsung lompat ke kandidat/antrean berikutnya (`playQueueItem(nextIndex + 1, ...)`)
  alih-alih crash.
- **Catatan untuk perbaikan berikutnya**: `surahAudioURL()` di Go selalu membangun URL penuh lewat
  `fmt.Sprintf(...)` walaupun `QuranicAudio == ""` — hasilnya bukan string kosong, melainkan URL
  malformed (`https://download.quranicaudio.com/quran//001.mp3`), yang lolos dari filter
  `item.audio_url` di frontend (karena string tidak kosong) dan akan tetap dicoba diputar lalu gagal
  di `audio.onerror`. Kalau di masa depan ada qari yang benar-benar harus dikosongkan (tidak
  ditemukan slug valid), `seedSurahAudioForQari` perlu di-guard agar tidak memanggil
  `surahAudioURL()` sama sekali saat `q.QuranicAudio == ""` (skip insert row atau simpan
  `AudioURL: ""` langsung) — bukan sekadar mengosongkan field `QuranicAudio` di catalog.

## Yang Perlu Diketahui Agent Lain

- Slug asli `download.quranicaudio.com` **tidak selalu** bisa ditebak dari transliterasi nama
  qari — cara paling andal adalah `WebFetch` halaman reciter di `quranicaudio.com/quran/<id>`
  (id numerik, ditemukan dari listing di homepage) dan ekstrak link `001.mp3` langsung dari HTML,
  baru diverifikasi ulang dengan curl.
- Hati-hati reciter dengan nama mirip: ada dua "Rifai" (`quran/10` Nabil, `quran/27` Hani) dan dua
  "Huthaify/Huthayfi" (`quran/8` Ali Abdurrahman, `quran/113` Ahmad) di `quranicaudio.com` — pastikan
  ambil ID yang cocok dengan nama lengkap di seeder, jangan asal ambil hasil pencarian pertama.
- `AyahAudio`/`everyayah.com` (field `EveryAyahDir`) tidak disentuh di task ini — sudah dikonfirmasi
  bekerja sebelumnya dan di luar scope.
