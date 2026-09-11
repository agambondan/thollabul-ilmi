# Seeder Masjid: Perbaikan Koordinat + Ekspansi 1 Indonesia

Tanggal: `2026-09-11`
Scope: `services/api/app/db/migrations/seeder_masjid_radio.go` (`getMasjidData()`)
Status: `SELESAI` — `gofmt`/`go build`/`go vet` hijau, belum di-deploy/migrate ke DB manapun

Dipicu laporan user setelah membuka data masjid seeded di aplikasi map: pin
beberapa masjid meleset dari lokasi aslinya, dan seluruh data (8 masjid) cuma
mencakup kawasan Jakarta/Tangerang/Bogor — user minta cakupan 1 Indonesia.

---

## 1. Perbaikan 8 Entri Lama

Semua koordinat diverifikasi ulang lewat geocoding alamat asli via Nominatim
(OpenStreetMap) dan/atau silang-cek pencarian web. Dua entri ternyata bukan
cuma meleset koordinat — alamat yang tercatat memang bukan lokasi asli masjid
tersebut (lihat catatan di bawah tabel), jadi Address/District/City/Province
ikut dikoreksi mengikuti prinsip task: hanya ubah field lain kalau proses
verifikasi memang mengungkap field itu salah.

| Masjid                            | Lat/Lng lama                                   | Lat/Lng baru                                                  | Catatan                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Masjid Jami' Al-Barkah (Rodja)    | -6.2704, 106.8678 (Kramat Jati, Jakarta Timur) | -6.3952078, 106.9588901 (Cileungsi, Kab. Bogor)               | **Alamat salah kota.** Markas Radio Rodja & Masjid Al-Barkah aslinya di Jl. Pahlawan, Kp. Tengah, Cileungsi, Kab. Bogor, Jawa Barat — dikonfirmasi radiorodja.com, rodja.info, dan tag OSM `place_of_worship`. Address/District/City/Province diperbaiki, Phone diperbaiki ke 021-22887131 |
| Masjid Nur-Salma                  | -6.2180, 106.8310 (Jl. HR Rasuna Said)         | -6.2301492, 106.8208588 (Centennial Tower, Jl. Gatot Subroto) | **Alamat salah jalan.** Masjid Nur-Salma nyatanya di lantai 22 Centennial Tower, Jl. Jenderal Gatot Subroto Kav. 24-25 (dikonfirmasi masjidnursalma.or.id + geocoding gedung), bukan di Jl. HR Rasuna Said seperti tercatat sebelumnya. Address dikoreksi                                  |
| Masjid Nurim Blok M               | -6.2440, 106.7995                              | -6.2397, 106.8058                                             | Koordinat lama meleset ke arah barat daya; titik baru mengikuti segmen Jl. Wolter Monginsidi yang kode posnya (12180) cocok persis dengan Address yang sudah ada. Nama masjid tidak ditemukan sumber independen — Address dipertahankan apa adanya, hanya koordinat yang diperbaiki        |
| Masjid Sunda Kelapa               | -6.1996, 106.8329                              | -6.2012984, 106.8322571                                       | Koreksi kecil (~250 m), dikonfirmasi tag OSM `Masjid Sunda Kelapa` persis di Jl. Taman Sunda Kelapa                                                                                                                                                                                        |
| Masjid Al-Ikhlas Cipete           | -6.2789, 106.8042                              | -6.2789206, 106.7997904                                       | Koordinat lama sebenarnya nyasar ~500 m ke arah Cipete Utara/Kebayoran Baru (ada 3 masjid "Al-Ikhlas" berbeda di area ini); titik baru persis di Jl. Cipete III sesuai Address                                                                                                             |
| Masjid Baitussalam Billy Moon     | -6.2367, 106.9242                              | -6.2480321, 106.9291752                                       | Koreksi ke gerbang utama Komplek Billy Moon, Pondok Kelapa sesuai Address                                                                                                                                                                                                                  |
| Masjid Jami' Imam Asy-Syafi'i BSD | -6.3039, 106.6847                              | -6.3006, 106.6854                                             | Koreksi kecil (~400 m) mengikuti posisi Jl. Kalimantan, BSD City yang kode posnya (15310) cocok dengan Address                                                                                                                                                                             |
| Masjid Ar-Rohmah Cibubur          | -6.3688, 106.9486                              | -6.3851121, 106.9543061                                       | Koreksi ~2 km ke titik dalam kompleks Kota Wisata, Nagrak, Gunung Putri sesuai Address. Nama "Ar-Rohmah" tidak ditemukan di sumber independen (masjid ikon kawasan ini adalah "Masjid Darussalam Kota Wisata"), tapi Address/kompleks yang tercatat valid — hanya koordinat yang dikoreksi |

Metode verifikasi: geocoding alamat literal via
`nominatim.openstreetmap.org/search`, disilangkan dengan hasil pencarian web
(situs resmi masjid, berita, direktori masjid) untuk mengonfirmasi identitas
bangunan sebelum menerima titik koordinatnya.

## 2. Entri Baru — Cakupan Nasional (31 Masjid, 31 Provinsi)

Satu masjid landmark/masjid raya provinsi per provinsi, di luar
DKI Jakarta/Banten/Jawa Barat yang sudah punya entri di atas (kecuali Masjid
Istiqlal untuk DKI Jakarta, ditambahkan karena landmark nasional yang berbeda
dari 4 masjid Jakarta yang sudah ada). Semua koordinat diambil dari infobox
Wikipedia (format derajat desimal) dan/atau tag `amenity=place_of_worship` di
OpenStreetMap via Nominatim — bukan hasil tebakan dari memori. Kapasitas
hanya diisi kalau ada angka yang benar-benar disebut sumber; selain itu 0.

| Masjid                                             | Kota           | Provinsi                  | Lat        | Lng        |
| -------------------------------------------------- | -------------- | ------------------------- | ---------- | ---------- |
| Masjid Istiqlal                                    | Jakarta Pusat  | DKI Jakarta               | -6.1697    | 106.8308   |
| Masjid Raya Baiturrahman Banda Aceh                | Banda Aceh     | Aceh                      | 5.55361    | 95.317194  |
| Masjid Raya Al-Mashun Medan                        | Medan          | Sumatera Utara            | 3.575111   | 98.687321  |
| Masjid Raya Sumatera Barat                         | Padang         | Sumatera Barat            | -0.924306  | 100.362611 |
| Masjid Raya An-Nur Pekanbaru                       | Pekanbaru      | Riau                      | 0.5378     | 101.43704  |
| Masjid Raya Sultan Riau Penyengat                  | Tanjungpinang  | Kepulauan Riau            | 0.92944    | 104.42039  |
| Masjid Agung Al-Falah Jambi                        | Jambi          | Jambi                     | -1.594178  | 103.608285 |
| Masjid Agung Sultan Mahmud Badaruddin I Palembang  | Palembang      | Sumatera Selatan          | -2.98748   | 104.7599   |
| Masjid Jamik Pangkalpinang                         | Pangkal Pinang | Kepulauan Bangka Belitung | -2.130821  | 106.109828 |
| Masjid Jamik Bengkulu                              | Bengkulu       | Bengkulu                  | -3.79234   | 102.26224  |
| Masjid Agung Al-Furqon Bandar Lampung              | Bandar Lampung | Lampung                   | -5.435162  | 105.246967 |
| Masjid Agung Jawa Tengah                           | Semarang       | Jawa Tengah               | -6.9839    | 110.4458   |
| Masjid Gedhe Kauman Yogyakarta                     | Yogyakarta     | DI Yogyakarta             | -7.802415  | 110.362297 |
| Masjid Nasional Al-Akbar Surabaya                  | Surabaya       | Jawa Timur                | -7.336294  | 112.71533  |
| Masjid Agung Sudirman Denpasar                     | Denpasar       | Bali                      | -8.66703   | 115.21961  |
| Masjid Raya Hubbul Wathan Islamic Center NTB       | Mataram        | Nusa Tenggara Barat       | -8.579965  | 116.100609 |
| Masjid Agung Al-Baitul Qadim Kupang                | Kupang         | Nusa Tenggara Timur       | -10.165516 | 123.578035 |
| Masjid Jami' Sultan Syarif Abdurrahman Pontianak   | Pontianak      | Kalimantan Barat          | -0.026738  | 109.347678 |
| Masjid Raya Darussalam Palangka Raya               | Palangka Raya  | Kalimantan Tengah         | -2.230718  | 113.89022  |
| Masjid Raya Sabilal Muhtadin Banjarmasin           | Banjarmasin    | Kalimantan Selatan        | -3.319012  | 114.591256 |
| Masjid Islamic Center Samarinda (Baitul Muttaqien) | Samarinda      | Kalimantan Timur          | -0.50244   | 117.11981  |
| Masjid Baitul Izzah Islamic Center Tarakan         | Tarakan        | Kalimantan Utara          | 3.298636   | 117.6241   |
| Masjid Agung Awwal Fathul Mubien Manado            | Manado         | Sulawesi Utara            | 1.521      | 124.848    |
| Masjid Agung Baiturrahim Gorontalo                 | Gorontalo      | Gorontalo                 | 0.537908   | 123.060309 |
| Masjid Raya Baitul Khairaat Prov. Sulawesi Tengah  | Palu           | Sulawesi Tengah           | -0.899148  | 119.84871  |
| Masjid Agung Mamuju (Masjid Syuhada)               | Mamuju         | Sulawesi Barat            | -2.453759  | 119.135361 |
| Masjid Al-Markaz Al-Islami Makassar                | Makassar       | Sulawesi Selatan          | -5.129989  | 119.426323 |
| Masjid Al-Alam Kendari                             | Kendari        | Sulawesi Tenggara         | -4.015152  | 122.530309 |
| Masjid Raya Al-Fatah Ambon                         | Ambon          | Maluku                    | -3.693372  | 128.176613 |
| Masjid Sultan Ternate                              | Ternate        | Maluku Utara              | 0.80735    | 127.379671 |
| Masjid Raya Baiturrahim Jayapura                   | Jayapura       | Papua                     | -2.547561  | 140.692809 |

Catatan presisi: untuk masjid yang bertepatan persis dengan tag
`place_of_worship` di OSM atau koordinat infobox Wikipedia (mayoritas daftar
di atas), akurasinya di level bangunan. Untuk beberapa yang mesin pencari
alamatnya tidak bisa menemukan bangunan persis (Baitul Izzah Tarakan, Awwal
Fathul Mubien Manado, Al-Alam Kendari, Al-Fatah Ambon, Sultan Ternate,
Baiturrahim Jayapura, Al-Baitul Qadim Kupang), koordinat yang dipakai adalah
sentroid kelurahan/kecamatan tempat masjid itu berada — akurasinya di level
lingkungan (radius beberapa ratus meter), bukan titik bangunan persis, karena
titik bangunan tidak tersedia di OSM/Wikipedia untuk lokasi tersebut.

## 3. Provinsi yang Sengaja Dilewati

Tidak menambahkan entri untuk provinsi hasil pemekaran Papua yang baru
(2022): **Papua Barat, Papua Tengah, Papua Pegunungan, Papua Selatan, dan
Papua Barat Daya**. Untuk Papua Barat (Manokwari) tidak ditemukan satu masjid
"agung"/landmark provinsi yang bisa diverifikasi lewat Wikipedia atau sumber
berita yang jelas (hasil pencarian cuma menunjukkan masjid-masjid lingkungan
kecil tanpa alamat lengkap yang bisa dikonfirmasi); untuk 4 provinsi
pemekaran terbaru lainnya, belum ada masjid landmark yang cukup terdokumentasi
di sumber publik untuk diverifikasi dengan percaya diri. Sesuai instruksi
task — lebih baik dilewati daripada menebak koordinat/alamat.

Total provinsi yang tercakup: 34 dari 38 (7 via 8 entri lama — DKI
Jakarta/Banten/Jawa Barat — ditambah 31 via entri baru; Kalimantan Utara,
Gorontalo, dan Kepulauan Riau termasuk yang baru ditambahkan).

## 4. Verifikasi

- `gofmt -l app/db/migrations/seeder_masjid_radio.go` — bersih (tanpa output)
- `go build ./...` — sukses
- `go vet ./...` — sukses
- Total entri sekarang: **39 masjid** (8 diperbaiki + 31 baru), sesuai target
  35-45 pada task.

## 5. Yang Perlu Diketahui Agent Lain

- Seeder ini belum dijalankan ulang ke database manapun (lokal/staging/
  production) — perubahan baru ada di kode `getMasjidData()`. `SeedMasjids()`
  pakai `OnConflict` berdasar kolom `name` unik, jadi menjalankan ulang
  seeder akan meng-update baris lama yang cocok nama-nya dan meng-insert
  baris baru; nama masjid Al-Barkah/Nur-Salma tidak berubah jadi baris
  lamanya akan ter-update in place (termasuk Address-nya) saat seeder
  dijalankan ulang.
- Beberapa masjid provinsi baru memakai nama resmi terbaru per sumber yang
  ditemukan (mis. Masjid Agung Darussalam Palu sudah resmi berganti nama jadi
  "Masjid Raya Baitul Khairaat Provinsi Sulawesi Tengah" per Februari 2025) —
  kalau ada dokumen lama yang menyebut nama lama, itu bukan salah ketik, cuma
  belum ikut update penamaan.
- `Capacity` sengaja dibiarkan `0` untuk sebagian besar entri baru karena
  tidak ditemukan angka kapasitas yang benar-benar dikutip sumber (bukan
  berarti masjidnya kecil — cuma belum ada data yang bisa diverifikasi).
