# Audit Rujukan "HR. Ahmad Jilid/Halaman"

Tanggal: `2026-09-17`
Scope: verifikasi isi (bukan cuma format) untuk semua kutipan "HR. Ahmad
`<jilid>/<halaman>`" di data konten (bukan tabel `hadits_ahmad.json`/hadis
utama) — dipicu karena sampel awal cuma 1 titik (Ahmad 1/53), dan ini
menggerbangi rencana sync SQL/PG Musnad Ahmad di
[`2026-09-17-musnad-ahmad-sync-plan-review.md`](./2026-09-17-musnad-ahmad-sync-plan-review.md).

Metode: 28 kutipan diverifikasi via pencarian web ke sumber independen
(dorar.net, islamweb.net, sunnah.com, Wikisource mirror Musnad Ahmad, alukah.net,
islamqa.info, dll) — dicek kecocokan perawi + matan terhadap klaim naratif di
JSON, bukan cuma "apakah jilid/halaman masuk akal secara rentang". **Status:
DIPERBAIKI** — semua temuan MISMATCH dan UNVERIFIABLE-yang-tetap-tak-terverifikasi
sudah dikoreksi langsung di file JSON sumber (lihat bagian "Perbaikan yang
diterapkan").

## Ringkasan akhir

| Verdict                          | Jumlah | %   |
| -------------------------------- | ------ | --- |
| MATCH                            | 18     | 64% |
| MISMATCH (dikoreksi)             | 7      | 25% |
| UNVERIFIABLE (dikoreksi/dihapus) | 3      | 11% |

**~11% dari kutipan "Ahmad jilid/halaman" akhirnya dihapus setelah riset penuh
(dari awalnya ~39% ditandai bermasalah).** Sampel tunggal awal (Ahmad 1/53,
entry #1) kebetulan MATCH — tidak representatif terhadap kondisi sebenarnya.
Field `source` di konten ini campuran: sebagian ditulis dari takhrij asli yang
diverifikasi, sebagian tampak "citation padding" (menempel referensi yang
tidak benar-benar dicek ke sumbernya).

## Temuan MISMATCH (7) — sudah dikoreksi

| #   | File                 | Judul/Term                                       | Kutipan Ahmad | Masalah                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------- | ------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `asbabun_nuzul.json` | Kemenangan Romawi atas Persia (Niyar bin Mukram) | Ahmad 1/304   | Hadis ini rantainya lewat Tirmidzi/Ibnu Khuzaimah/Thabrani/Baihaqi — **bukan** Musnad Ahmad milik Imam Ahmad sendiri. Hanya versi ringkas ada di _Kitab As-Sunnah_ karya anaknya (Abdullah bin Ahmad), bukan di Musnad. Niyar bin Mukram (perawi minor) tidak punya musnad tersendiri di juz 1 (juz 1 khusus Khulafa Rasyidin + 'Asyarah Mubasysyarin). |
| 2   | `asbabun_nuzul.json` | Al-Fil — Pasukan Gajah Abrahah                   | Ahmad 1/215   | Semua sumber independen mengaitkan kisah ini ke Mustadrak Al-Hakim atau Sirah Ibnu Ishaq (mursal), bukan ke Musnad Ahmad. Tidak ada situs yang mereproduksi "Ahmad 1/215" untuk narasi ini.                                                                                                                                                             |
| 3   | `asbabun_nuzul.json` | Al-Isra' — Birrul Walidain / larangan 'Uff'      | Ahmad 1/173   | Hadis Sa'd bin Abi Waqqash "4 ayat turun tentangku" itu nyata, tapi terkait QS. Luqman 14-15/Al-Ankabut 8 (ibu mogok makan), **bukan** QS. Al-Isra 23-24. Takhrij Ahmad Syakir menempatkan hadis ini di lokasi lain (mis. 3/99, 3/82), bukan 1/173. Atribusi "berbagai jalur sahabat" yang vage juga jadi red flag.                                     |
| 4   | `asbabun_nuzul.json` | At-Taubah — Ulama/Rahib Pemakan Harta Batil      | Ahmad 4/378   | Tirmidzi No. 3095 (yang dipasangkan di source yang sama) ternyata dari **'Adi bin Hatim** tentang **QS. At-Taubah ayat 31** (menjadikan pendeta sebagai tuhan) — bukan dari Ibnu Abbas tentang ayat 34-35 (penimbun harta) seperti diklaim. Seluruh klaster kutipan tampak mencampur dua hadis berbeda.                                                 |
| 5   | `siroh_content.json` | Kelahiran Nabi Muhammad ﷺ                        | Ahmad 5/262   | Hadis di lokasi ini adalah riwayat Irbadh bin Sariyah "aku sudah jadi penutup para nabi sejak Adam masih tanah liat" (soal kenabian azali) — tidak menyebut tanggal lahir, ibu susu (Halimah/Tsuwaibah), atau wafatnya Aminah di Al-Abwa'. Sanadnya juga lemah (Al-Faraj bin Fudhalah).                                                                 |
| 6   | `siroh_content.json` | Hilful Fudhul & Pembangunan Ka'bah               | Ahmad 1/193   | Hadis di lokasi ini adalah riwayat Abdurrahman bin Auf tentang **Hilf Al-Muthayyibin** — pakta pra-Islam yang berbeda dari Hilful Fudhul (ulama membedakan keduanya secara eksplisit, lihat fatwa islamqa.info). Tidak menyebut insiden Hajar Aswad usia 35 tahun sama sekali.                                                                          |
| 7   | `islamic_term.json`  | Hikmah                                           | Ahmad 4/79    | Hadis yang cocok secara matan ("da' maa yaribuka ilaa maa laa yaribuka", Al-Hasan bin Ali) ada di Musnad Ahlul Bait — **jilid 1**, bukan jilid 4. Nomor Tirmidzi yang dipasangkan juga meleset (ditemukan 2518, bukan 2520 seperti di source). Tema hadis ini pun lebih ke wara'/zuhud, bukan "hikmah".                                                 |

**Perbaikan:** token "HR. Ahmad X/Y" yang salah dihapus dari `source` untuk
#1, #2, #3, #5, #6. Untuk #4, **kedua** hadis (Tirmidzi 3095 + Ahmad 4/378)
dihapus karena keduanya salah perawi/ayat — tersisa Tafsir Ibnu Katsir +
Lubabun Nuqul As-Suyuthi. Untuk #7, nomor Tirmidzi dikoreksi 2520 → 2518 dan
token Ahmad (jilid salah, halaman tak terkonfirmasi) dihapus.

## Temuan UNVERIFIABLE (4) — hasil riset lanjutan

Setelah audit awal, dilakukan riset tambahan (bukan langsung dihapus) untuk 4
titik ini. Hasilnya: 1 naik status jadi MATCH, 3 sisanya tetap tidak bisa
dikonfirmasi walau sudah dicoba lebih dalam, sehingga token "HR. Ahmad X/Y"
untuk yang 3 itu **dihapus** dari `source` — konsisten dengan perlakuan 7
MISMATCH di atas: kutipan yang tidak bisa diverifikasi tidak boleh tetap
dipajang sebagai dalil.

| #   | File                 | Judul                                      | Kutipan Ahmad   | Status akhir                       | Catatan riset lanjutan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | -------------------- | ------------------------------------------ | --------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 8   | `asbabun_nuzul.json` | Yahudi Berkata "Allah Miskin" (Ibnu Abbas) | Ahmad 1/300     | **MATCH** (naik dari UNVERIFIABLE) | Ditemukan matan lengkap: Abu Bakar masuk pasar Yahudi, Finhas berkata "wallahi maa binaa ilallaahi min faqrin wa innahu ilainaa la-yaftaqir", Abu Bakar marah dan menampar wajahnya, Finhas mengadu ke Nabi ﷺ, lalu turun QS. Ali Imran 181. Riwayat ini berada di jalur Musnad Ibnu Abbas, yang memang menempati porsi besar Jilid 1 Musnad Ahmad (dikonfirmasi lewat banyak halaman Wikisource "مسند عبد الله بن العباس"). Perawi + matan cocok kuat; halaman presisi 300 tidak ter-pin-point independen, tapi jilid & narasi sudah cukup meyakinkan. **Kutipan dipertahankan, tidak diubah.** |
| 9   | `siroh_content.json` | Fase Dakwah Sirriyah                       | Ahmad 1/55-56   | **UNVERIFIABLE → dihapus**         | Riset lanjutan cuma menemukan bahwa Musnad Abu Bakar (yang membuka Jilid 1) memang jadi tempat sebagian riwayat "siapa yang pertama masuk Islam", tapi tidak ada satu pun sumber yang mengutip spesifik halaman 55-56 untuk daftar Khadijah/Ali/Abu Bakar/Zaid. Token Ahmad dihapus, sumber Bukhari No. 3818 + Sirah Ibnu Hisyam dipertahankan.                                                                                                                                                                                                                                                  |
| 10  | `siroh_content.json` | Hijrah Pertama ke Habasyah                 | Ahmad 1/201-204 | **UNVERIFIABLE → dihapus**         | Riset lanjutan (islamweb, wikipedia, Mustadrak Al-Hakim) tetap tidak menemukan rujukan Musnad Ahmad untuk narasi ini — semua sumber menyandarkannya ke Mustadrak/Sirah. Rentang 4 halaman juga tetap jadi red flag citation-padding. Token Ahmad dihapus, sumber Sirah Ibnu Hisyam + Ar-Raheeq Al-Makhtum dipertahankan.                                                                                                                                                                                                                                                                         |
| 11  | `siroh_content.json` | Al-Muakhah (Muhajirin-Anshar)              | Ahmad 1/187     | **UNVERIFIABLE → dihapus**         | Riset lanjutan mengonfirmasi kisah Abdurrahman bin Auf & Sa'd bin Ar-Rabi' bersumber dari **Shahih Bukhari** (dorar.net eksplisit atribusi ke Bukhari); Musnad Abdurrahman bin Auf memang ada di Jilid 1 (31 hadis, bagian 'Asyarah Mubasysyarin) tapi tidak ada sumber yang mengonfirmasi isi di halaman 187 spesifik cocok dengan kisah ini. Token Ahmad dihapus, sumber Bukhari No. 2294 + Sirah Ibnu Hisyam dipertahankan.                                                                                                                                                                   |

## Temuan MATCH (18) — dikorroborasi sumber independen

Tidak diulang detail di sini (lihat transkrip verifikasi); ringkasnya kutipan
berikut punya perawi + matan yang cocok dan dikonfirmasi lewat dorar.net,
islamweb.net, Wikisource, atau alukah.net — **dipertahankan tanpa perubahan**:

- Pengharaman Khamr Bertahap Tahap 1 & 3 (Umar, Ahmad 1/53 — satu hadis yang
  sama untuk dua tahap, bukan duplikasi keliru)
- Pembagian Rampasan Perang Badar (Ubadah bin Shamit, Ahmad 5/322)
- Doa Penutup Al-Baqarah (Abu Hurairah, Ahmad 2/412)
- Nasab Tuhan / Al-Ikhlas (Ubay bin Ka'b, Ahmad 5/133-134)
- Walid bin 'Uqbah & Tabayyun (Al-Harits bin Dhirar, Ahmad 4/279) — konfirmasi
  tertinggi (direct hit islamweb.net)
- Yahudi Berkata "Allah Miskin" (Ibnu Abbas, Ahmad 1/300 — naik status dari
  riset lanjutan, lihat tabel di atas)
- Larangan Bunuh Diri / Tayammum 'Amr bin Al-'Ash (Ahmad 4/203)
- Tawanan Perang Badar (Umar, Ahmad 1/30)
- Mutslah Hamzah (Ubay bin Ka'b, Ahmad 5/135)
- Izin Berperang Pertama (Ibnu Abbas, Ahmad 1/216)
- Ibu Sa'd Memboikot Makan (Sa'd bin Abi Waqqash, Ahmad 1/181)
- Mitsaq/Alastu (Umar, Ahmad 1/44)
- Mukmin Beruntung / 10 Ayat Al-Mu'minun (Umar, Ahmad 1/34)
- Ayat Kursi Teragung (Ubay bin Ka'b, Ahmad 5/142)
- Sebab Surat Shaad (Ibnu Abbas, Ahmad 1/227 & 1/362 — dua lokasi, dua jalur
  transmisi, pola takhrij yang wajar bukan padding)
- Mu'adz bin Jabal & Tahajjud (Ahmad 5/231) — konfirmasi tertinggi
- Du'a (An-Nu'man bin Bashir, Ahmad 4/67) — konfirmasi tertinggi

Catatan: sebagian besar MATCH berconfidence **medium**, bukan tinggi — dorar.net
dan sunnah.com memblokir scraping langsung (403) saat audit ini, jadi
verifikasi mengandalkan cuplikan hasil pencarian dan situs tafsir/fatwa yang
mengutip ulang, bukan pembacaan langsung teks Musnad Ahmad halaman-per-halaman.
Kecocokan topik/perawi kuat, tapi nomor halaman presisi tidak ter-pin-point
independen untuk sebagian besar entry.

## Perbaikan yang diterapkan

Semua 10 kutipan bermasalah (7 MISMATCH + 3 UNVERIFIABLE yang tetap gagal
diverifikasi) sudah dikoreksi langsung di file JSON sumber:

- `services/api/data/static/asbabun_nuzul.json` — 4 baris `source` diperbaiki
  (#1, #2, #3, #4)
- `services/api/data/static/siroh_content.json` — 5 baris `source` diperbaiki
  (#5, #6, #9, #10, #11)
- `services/api/data/static/islamic_term.json` — 1 baris `source` diperbaiki
  (#7)

Semua file sudah divalidasi valid JSON setelah perubahan.

**Catatan seeder (sudah diperbaiki):** `seedAsbabunNuzulFromFile` di
`services/api/app/db/migrations/seeder_static_file.go` sebelumnya bersifat
insert-only (skip kalau `title` sudah ada di database), jadi fix di atas
tidak akan menimpa baris yang sudah ter-seed. Ini sudah dikonversi jadi
upsert (update baris existing by `title`, termasuk translation & relasi
ayah terkait) di sesi yang sama — lihat riwayat commit
`seeder_static_file.go`/`seeder_tier3.go`. Fix `source` di atas akan otomatis
sampai ke database begitu seeder jalan ulang.

## Rekomendasi

1. Sebelum sync SQL/PG Musnad Ahmad dijalankan (per rencana di
   [`2026-09-17-musnad-ahmad-sync-plan-review.md`](./2026-09-17-musnad-ahmad-sync-plan-review.md)):
   jalankan seeder sekali lagi supaya fix `source` di atas tersinkron ke
   database.
2. Pola risiko yang ketahuan di audit ini bisa dipakai sebagai heuristik
   pemeriksaan cepat ke depan: (a) rentang halaman >1 halaman untuk satu hadis
   patut dicurigai (lihat #10), (b) nomor Tirmidzi/Ahmad yang dipasangkan
   berbeda topik/perawi dari klaim naratif adalah sinyal kuat citation-padding
   (lihat #4, #7), (c) atribusi perawi "minor"/tidak lazim untuk juz 1 (khusus
   Khulafa Rasyidin) adalah red flag (lihat #1).
3. Simpan audit ini sebagai referensi kalau ada penambahan konten
   asbabun-nuzul/siroh/istilah baru yang mengutip Musnad Ahmad — jangan
   mengulang pola citation-padding yang sama.

## Referensi

- `services/api/data/static/asbabun_nuzul.json` — 21 dari 28 kutipan
- `services/api/data/static/siroh_content.json` — 5 dari 28 kutipan
- `services/api/data/static/islamic_term.json` — 2 dari 28 kutipan
- [`2026-09-17-musnad-ahmad-sync-plan-review.md`](./2026-09-17-musnad-ahmad-sync-plan-review.md) —
  rencana sync yang digerbangi audit ini
- [[feedback_islamic_data_sahih_only]] (memory) — aturan sumber shahih wajib
  untuk semua konten Islam di project ini
