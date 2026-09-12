# Audit Manhaj & Koordinat — 31 Masjid Landmark Provinsi

Tanggal: `2026-09-12`
Scope: cross-check editorial (bukan kode) atas seluruh 31 entri masjid
landmark hasil ekspansi nasional di
`services/api/app/db/migrations/seeder_masjid_radio.go` (`getMasjidData()`),
lihat juga [`docs/reviews/2026-09-11-masjid-seeder-nationwide-expansion.md`](2026-09-11-masjid-seeder-nationwide-expansion.md)
untuk riwayat perbaikan koordinat sebelumnya. 8 entri lama (area Jabodetabek —
Al-Barkah/Rodja, Nur-Salma, dll) tidak termasuk scope ini karena sudah
dikurasi manual berdasarkan afiliasi salafi sejak awal.
Status: `SELESAI` — riset + perbaikan kode selesai keduanya.

Konteks: 31 masjid ini dipilih murni karena jadi ikon kota/masjid agung pemda
per provinsi, TANPA kurasi afiliasi manhaj. User (pemilik aplikasi, manhaj
salafi/Ahlussunnah sesuai pemahaman salaf) minta verifikasi ketat apakah ada
masjid yang identik dengan praktik tarekat sufi tertentu, maulid akbar rutin,
tahlilan rutin, atau kontroversi sektarian (Syiah/Ahmadiyah), plus verifikasi
kasar alamat vs koordinat. Prinsip riset: tidak mengarang klasifikasi — kalau
sumber tidak menyebut eksplisit, dilaporkan "tidak ditemukan info spesifik".

## Ringkasan Angka

- **Kontroversi Syiah/Ahmadiyah/aliran sesat sebagai pengelola masjid: 0 dari 31.** Satu-satunya singgungan sektarian yang ditemukan adalah riwayat
  historis di Istiqlal (mantan Imam Besar KH Ali Mustafa Yaqub pernah menolak
  penceramah Syiah tampil di sana pada 2014) — ini justru menunjukkan
  penjagaan akidah oleh imam besar terdahulu, bukan indikasi masjid
  berafiliasi Syiah.
- **Terasosiasi tradisi/tarekat/maulid akbar yang secara ketat dipandang
  bid'ah oleh manhaj salafi: ~10 dari 31** (daftar di bawah).
- **Netral / tidak ditemukan info manhaj spesifik: ~20 dari 31** — bukan
  berarti terbukti sesuai manhaj salaf, hanya tidak ada bukti sebaliknya di
  sumber yang terindeks.
- **Koordinat perlu diperbaiki (salah signifikan, ada rekomendasi angka
  baru): 3** — Pekanbaru, Manado, **Mamuju (meleset ~38 km, parah)**.
- **Koordinat tidak bisa diverifikasi presisi** (sentroid kelurahan/kecamatan
  atau tanpa sumber lat/lng eksplisit): Kupang & Tarakan (sudah tercatat
  sejak audit 2026-09-11), plus baru ditemukan Kendari & Jayapura.
- Sisanya (~24) koordinatnya cocok dengan sumber independen (Wikipedia/situs
  resmi) dalam radius wajar (puluhan–ratusan meter).

## Masjid dengan Indikasi Tradisi/Tarekat yang Ketat Dianggap Bid'ah

| Masjid                                      | Kota          | Indikasi                                                                                                  |
| ------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------- |
| Masjid Raya Baiturrahman                    | Banda Aceh    | Terasosiasi Abu Mudi (Mustasyar PBNU, pimpinan dayah tarekat-tasawuf Samalanga) + Maulid Festival tahunan |
| Masjid Raya Sultan Riau (Penyengat)         | Tanjungpinang | Barzanji keliling kampung + ritual adat "injak tanah Makkah" bayi 40 hari                                 |
| Masjid Jami' Sultan Syarif Abdurrahman      | Pontianak     | Maulid kirab ala Keraton/habib berlangsung ~2 bulan + sunatan massal                                      |
| Masjid Gedhe Kauman                         | Yogyakarta    | Pusat Sekaten & Garebeg Mulud, ritual Keraton turun-temurun sejak 1773                                    |
| Masjid Nasional Al-Akbar                    | Surabaya      | Maulid Akbar tahunan, tamu kehormatan rutin keturunan pendiri Tarekat Qadiriyah                           |
| Masjid Agung Jawa Tengah                    | Semarang      | Maulid Akbar 12 hari berskala besar, program resmi takmir                                                 |
| Masjid Agung Baiturrahim                    | Gorontalo     | Tradisi "Dikili" — zikir Maulid semalam suntuk, warisan tarekat lokal                                     |
| Masjid Sultan Ternate                       | Ternate       | Ritual adat kesultanan "Kolano Uci Sabea" (prosesi Sultan + gamelan)                                      |
| Masjid Istiqlal                             | Jakarta       | Maulid Nabi tingkat kenegaraan bersama LD PBNU: Barzanji, Mahallul Qiyam, hadroh                          |
| Masjid Raya Baitul Khairaat (ex-Darussalam) | Palu          | Nama diambil dari ormas Alkhairaat (tradisi maulid/haul, bukan salafi ketat — kasus lebih ringan)         |

## Masjid Netral / Tidak Ditemukan Info Manhaj Spesifik

Masjid Raya Al-Mashun (Medan), Masjid Raya Sumatera Barat (Padang), Masjid
Raya An-Nur (Pekanbaru), Masjid Agung Al-Falah (Jambi), Masjid Agung Sultan
Mahmud Badaruddin I (Palembang), Masjid Jamik Pangkalpinang, Masjid Agung
Al-Furqon (Bandar Lampung), Masjid Jamik Bengkulu, Masjid Agung Sudirman
(Denpasar), Masjid Raya Hubbul Wathan (Mataram), Masjid Agung Al-Baitul
Qadim (Kupang), Masjid Raya Darussalam (Palangka Raya), Masjid Raya Sabilal
Muhtadin (Banjarmasin, catatan: pengajian ulama tradisional Banjar seperti
Guru Bakeri/Guru Juhdi — bukan salafi eksplisit tapi juga bukan tarekat
formal), Masjid Islamic Center Samarinda, Masjid Baitul Izzah (Tarakan),
Masjid Agung Awwal Fathul Mubien (Manado), Masjid Agung Mamuju, Masjid
Al-Markaz Al-Islami (Makassar — klaim afiliasi Tarekat Naqsyabandiyah yang
beredar di hasil pencarian TIDAK terkonfirmasi sumber primer, sengaja tidak
dianggap valid), Masjid Al-Alam (Kendari), Masjid Raya Al-Fatah (Ambon),
Masjid Raya Baiturrahim (Jayapura).

## Perbaikan Koordinat yang Direkomendasikan

| Masjid                                   | Koordinat saat ini                                | Rekomendasi                                                                                                 | Catatan                                                                                                                                                                                                                                                                                                    |
| ---------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Masjid Raya An-Nur, Pekanbaru            | -0.5378, 101.43704 (lat harusnya positif: 0.5378) | **0.5267, 101.4508**                                                                                        | Meleset ~1,9 km dari Wikipedia/Wikidata (Jl. Hang Tuah, Sumahilang)                                                                                                                                                                                                                                        |
| Masjid Agung Awwal Fathul Mubien, Manado | 1.521, 124.848                                    | **1.50655, 124.84564**                                                                                      | Meleset ~1,6 km dari Wikipedia (Jl. Sultan Hasanuddin, Kel. Islam, Kec. Tuminting)                                                                                                                                                                                                                         |
| Masjid Agung Mamuju, Mamuju              | -2.453759, 119.135361                             | **-2.6747476, 118.8862879** (centroid Kota Mamuju, sama seperti pola Kupang/Tarakan — belum level bangunan) | **Meleset parah ~38 km.** Nominatim mencocokkan koordinat lama persis dengan node OSM "MASJID SYUHADA 45" — kemungkinan besar masjid desa lain yang kebetulan mirip nama, di dalam Kabupaten Mamuju yang sangat luas (bentang -2.96 s.d. -2.12 lat), bukan Masjid Agung di Jl. KH Abdul Ahadi, Kota Mamuju |

Butuh verifikasi manual (tidak ada sumber lat/lng eksplisit untuk cross-check,
tapi area/kecamatan konsisten): **Masjid Al-Alam Kendari**, **Masjid Raya
Baiturrahim Jayapura**. Berstatus sentroid kota/kelurahan (bukan titik
bangunan persis, karena data building-level tidak tersedia di sumber
terbuka): **Masjid Agung Al-Baitul Qadim Kupang**, **Masjid Baitul Izzah
Tarakan** (sudah tercatat sejak audit 2026-09-11), dan sekarang **Masjid
Agung Mamuju** juga masuk kategori ini setelah dikoreksi dari titik yang
salah lokasi total.

## Keputusan & Eksekusi (2026-09-12)

Pemilik produk memutuskan: **ganti semua 10 masjid bermasalah dengan masjid
kajian sunnah/salaf yang nyata dan terverifikasi di kota yang sama**, kecuali
2 kota di mana tidak ditemukan kandidat yang cukup terverifikasi (tetap
dipertahankan apa adanya). Prinsip riset kandidat pengganti: jangan mengarang
nama masjid — kalau tidak ketemu sumber yang bisa diverifikasi ulang
(situs resmi, darussalaf.or.id, berita, atau Nominatim untuk koordinat),
laporkan jujur "tidak ditemukan" daripada memasukkan data tidak terverifikasi.

**8 diganti** (semua sudah diupdate di `seeder_masjid_radio.go`):

| Kota       | Lama                                   | Baru                                                 | Sumber verifikasi                                                                                   |
| ---------- | -------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Jakarta    | Masjid Istiqlal                        | Masjid Nurul Iman, Blok M Square                     | Situs resmi Blok M Square, kumparan                                                                 |
| Banda Aceh | Masjid Raya Baiturrahman               | Masjid Baitul Muqarrabin                             | Kajian rutin harian terverifikasi, Ustadz Farhan Abu Furaihan                                       |
| Pontianak  | Masjid Jami' Sultan Syarif Abdurrahman | Masjid Abu Bakar Ash-Shiddiq (Ma'had Taqribussunnah) | Terdaftar darussalaf.or.id, kanal Telegram aktif hingga Sept 2026                                   |
| Yogyakarta | Masjid Gedhe Kauman                    | Masjid Pogung Dalangan (MPD)                         | Situs resmi mpd.or.id — Ustadz Ammi Nur Baits & Abduh Tuasikal (rumaysho.com/konsultasisyariah.com) |
| Semarang   | Masjid Agung Jawa Tengah               | Masjid Nurussunnah                                   | Yayasan Islam Nurus Sunnah, artikel "7 Masjid Referensi Kajian Sunnah Semarang"                     |
| Surabaya   | Masjid Nasional Al-Akbar               | Masjid Darul Hijrah                                  | Satu kompleks STAI Ali bin Abi Thalib (izin resmi Ditjen Pendis)                                    |
| Gorontalo  | Masjid Agung Baiturrahim               | Masjid Umar Al-Faruq                                 | Pusat dakwah DPW Wahdah Islamiyah Gorontalo                                                         |
| Palu       | Masjid Raya Baitul Khairaat            | Masjid Al-Quds Islamic Center                        | Pusat dakwah DPW Wahdah Islamiyah Sulawesi Tengah                                                   |

**Catatan Wahdah Islamiyah (Gorontalo & Palu):** untuk 2 kota ini, satu-satunya
kandidat masjid sunnah yang terverifikasi berasal dari jaringan Wahdah
Islamiyah — ormas Ahlussunnah/salafi yang diakui akademis sebagai bagian
gerakan salafi Indonesia, tapi bercorak "salafi haraki" (terorganisasi) yang
berbeda gaya dari pola "salafi tenang" 8 masjid Jabodetabek existing
(Al-Barkah/Rodja, dll). Pemilik produk sudah dikonfirmasi dan menyetujui —
tetap dianggap Ahlussunnah, bukan masalah.

**2 dipertahankan apa adanya** (tidak ditemukan kandidat pengganti yang cukup
terverifikasi, atas persetujuan pemilik produk — Muhammadiyah juga dianggap
akidahnya sejalan kalau ke depan ditemukan kandidat begitu):

- **Masjid Raya Sultan Riau (Penyengat), Tanjungpinang** — riset akademis
  mengonfirmasi ada gerakan salafi lokal sejak 2004 (Yayasan Nashrussunnah,
  Radio Al-Bayan FM 96.5), tapi tidak ada satu masjid flagship yang bisa
  diverifikasi silang.
- **Masjid Sultan Ternate** — hanya ditemukan fasilitas pesantren internal
  (Ponpes Tahfidzul Qur'an Wahdah Islamiyah), tanpa nama masjid/alamat
  presisi yang cukup terverifikasi untuk kualitas data setara entri lain.

**Koordinat** — 3 yang salah signifikan sudah diperbaiki di kode:
Pekanbaru (~1,9 km), Manado (~1,6 km), dan Mamuju (**~38 km, parah** — koordinat
lama ternyata cocok persis dengan node OSM masjid desa lain yang kebetulan
mirip nama, di kabupaten yang sangat luas). Kupang, Tarakan, dan sekarang
Mamuju berstatus sentroid kota/kelurahan (bukan titik bangunan persis, karena
data building-level tidak tersedia di sumber terbuka) — sudah dicatat apa
adanya, bukan dipaksakan presisi palsu. Kendari dan Jayapura tidak bisa
diverifikasi lebih lanjut tanpa survei manual.
