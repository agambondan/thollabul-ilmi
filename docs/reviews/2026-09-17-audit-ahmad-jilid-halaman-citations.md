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
JSON, bukan cuma "apakah jilid/halaman masuk akal secara rentang".

## Ringkasan

| Verdict                               | Jumlah | %   |
| ------------------------------------- | ------ | --- |
| MATCH                                 | 17     | 61% |
| MISMATCH (terkonfirmasi/kuat condong) | 7      | 25% |
| UNVERIFIABLE                          | 4      | 14% |

**~39% dari kutipan "Ahmad jilid/halaman" bermasalah (mismatch atau tak
terverifikasi).** Sampel tunggal (Ahmad 1/53, entry #1) kebetulan salah satu
yang cocok — memvalidasi kekhawatiran bahwa itu tidak representatif. Field
`source` di konten ini campuran: sebagian ditulis dari takhrij asli yang
diverifikasi, sebagian tampak "citation padding" (menempel referensi yang
tidak benar-benar dicek ke sumbernya).

## Temuan MISMATCH (7) — perlu dikoreksi/dihapus

| #   | File                 | Judul/Term                                       | Kutipan Ahmad | Masalah                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------- | ------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `asbabun_nuzul.json` | Kemenangan Romawi atas Persia (Niyar bin Mukram) | Ahmad 1/304   | Hadis ini rantainya lewat Tirmidzi/Ibnu Khuzaimah/Thabrani/Baihaqi — **bukan** Musnad Ahmad milik Imam Ahmad sendiri. Hanya versi ringkas ada di _Kitab As-Sunnah_ karya anaknya (Abdullah bin Ahmad), bukan di Musnad. Niyar bin Mukram (perawi minor) tidak punya musnad tersendiri di juz 1 (juz 1 khusus Khulafa Rasyidin + 'Asyarah Mubasysyarin). |
| 2   | `asbabun_nuzul.json` | Al-Fil — Pasukan Gajah Abrahah                   | Ahmad 1/215   | Semua sumber independen mengaitkan kisah ini ke Mustadrak Al-Hakim atau Sirah Ibnu Ishaq (mursal), bukan ke Musnad Ahmad. Tidak ada situs yang mereproduksi "Ahmad 1/215" untuk narasi ini.                                                                                                                                                             |
| 3   | `asbabun_nuzul.json` | Al-Isra' — Birrul Walidain / larangan 'Uff'      | Ahmad 1/173   | Hadis Sa'd bin Abi Waqqash "4 ayat turun tentangku" itu nyata, tapi terkait QS. Luqman 14-15/Al-Ankabut 8 (ibu mogok makan), **bukan** QS. Al-Isra 23-24. Takhrij Ahmad Syakir menempatkan hadis ini di lokasi lain (mis. 3/99, 3/82), bukan 1/173. Atribusi "berbagai jalur sahabat" yang vage juga jadi red flag.                                     |
| 4   | `asbabun_nuzul.json` | At-Taubah — Ulama/Rahib Pemakan Harta Batil      | Ahmad 4/378   | Tirmidzi No. 3095 (yang dipasangkan di source yang sama) ternyata dari **'Adi bin Hatim** tentang **QS. At-Taubah ayat 31** (menjadikan pendeta sebagai tuhan) — bukan dari Ibnu Abbas tentang ayat 34-35 (penimbun harta) seperti diklaim. Seluruh klaster kutipan tampak mencampur dua hadis berbeda.                                                 |
| 5   | `siroh_content.json` | Kelahiran Nabi Muhammad ﷺ                        | Ahmad 5/262   | Hadis di lokasi ini adalah riwayat Irbadh bin Sariyah "aku sudah jadi penutup para nabi sejak Adam masih tanah liat" (soal kenabian azali) — tidak menyebut tanggal lahir, ibu susu (Halimah/Tsuwaibah), atau wafatnya Aminah di Al-Abwa'. Sanadnya juga lemah (Al-Faraj bin Fudhalah).                                                                 |
| 6   | `siroh_content.json` | Hilful Fudhul & Pembangunan Ka'bah               | Ahmad 1/193   | Hadis di lokasi ini adalah riwayat Abdurrahman bin Auf tentang **Hilf Al-Muthayyibin** — pakta pra-Islam yang berbeda dari Hilful Fudhul (ulama membedakan keduanya secara eksplisit, lihat fatwa islamqa.info). Tidak menyebut insiden Hajar Aswad usia 35 tahun sama sekali.                                                                          |
| 7   | `islamic_term.json`  | Hikmah                                           | Ahmad 4/79    | Hadis yang cocok secara matan ("da' maa yaribuka ilaa maa laa yaribuka", Al-Hasan bin Ali) ada di Musnad Ahlul Bait — **jilid 1**, bukan jilid 4. Nomor Tirmidzi yang dipasangkan juga meleset (ditemukan 2518, bukan 2520 seperti di source). Tema hadis ini pun lebih ke wara'/zuhud, bukan "hikmah".                                                 |

## Temuan UNVERIFIABLE (4) — butuh cek manual primer sebelum dipercaya

| #   | File                 | Judul                                      | Kutipan Ahmad   | Catatan                                                                                                                                                                                                                               |
| --- | -------------------- | ------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | `asbabun_nuzul.json` | Yahudi Berkata "Allah Miskin" (Ibnu Abbas) | Ahmad 1/300     | Narasi Finhas soal "Allah miskin" biasa disandarkan ke Sirah Ibnu Ishaq (via Ikrimah) di kitab tafsir, bukan eksplisit ke Musnad Ahmad. Ini satu-satunya hadis pendukung entry ini — kalau salah, entry kehilangan dalil sama sekali. |
| 9   | `siroh_content.json` | Fase Dakwah Sirriyah                       | Ahmad 1/55-56   | Tidak ditemukan situs manapun yang mengutip lokasi ini untuk daftar assabiqunal awwalun (Khadijah/Ali/Abu Bakar/Zaid).                                                                                                                |
| 10  | `siroh_content.json` | Hijrah Pertama ke Habasyah                 | Ahmad 1/201-204 | Rentang 4 halaman untuk satu kutipan hadis **tidak lazim** (kutipan hadis tunggal biasanya < 1 halaman) — pola ini sendiri mencurigakan sebagai citation padding, terlepas dari isinya benar atau tidak.                              |
| 11  | `siroh_content.json` | Al-Muakhah (Muhajirin-Anshar)              | Ahmad 1/187     | Kisah Abdurrahman bin Auf menolak setengah harta Sa'd bin Ar-Rabi' ditemukan di Bukhari & sirah, tidak ada yang menyandarkannya ke Musnad Ahmad 1/187 secara spesifik.                                                                |

## Temuan MATCH (17) — dikorroborasi sumber independen

Tidak diulang detail di sini (lihat transkrip verifikasi); ringkasnya kutipan
berikut punya perawi + matan yang cocok dan dikonfirmasi lewat dorar.net,
islamweb.net, Wikisource, atau alukah.net:

- Pengharaman Khamr Bertahap Tahap 1 & 3 (Umar, Ahmad 1/53 — satu hadis yang
  sama untuk dua tahap, bukan duplikasi keliru)
- Pembagian Rampasan Perang Badar (Ubadah bin Shamit, Ahmad 5/322)
- Doa Penutup Al-Baqarah (Abu Hurairah, Ahmad 2/412)
- Nasab Tuhan / Al-Ikhlas (Ubay bin Ka'b, Ahmad 5/133-134)
- Walid bin 'Uqbah & Tabayyun (Al-Harits bin Dhirar, Ahmad 4/279) — konfirmasi
  tertinggi (direct hit islamweb.net)
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

## Rekomendasi

1. **Sebelum sync SQL/PG Musnad Ahmad dijalankan** (per rencana di
   [`2026-09-17-musnad-ahmad-sync-plan-review.md`](./2026-09-17-musnad-ahmad-sync-plan-review.md)):
   selesaikan dulu koreksi 7 MISMATCH di atas — ini bug data agama yang berdiri
   sendiri, tidak terkait pairing Arab↔terjemahan di tabel hadis utama, tapi
   sama-sama menyangkut integritas rujukan Musnad Ahmad di aplikasi.
2. Untuk 7 MISMATCH: hapus token "HR. Ahmad X/Y" yang salah dari field
   `source`, atau ganti dengan lokasi yang benar kalau hadis yang tepat
   ditemukan (mis. Ahmad 4/378 di entry At-Taubah kemungkinan perlu diganti
   total, bukan cuma nomor halamannya, karena perawi & ayatnya pun salah).
3. Untuk 4 UNVERIFIABLE: jangan hapus dulu tanpa cek manual ke edisi cetak
   Musnad Ahmad (mis. Maktabah Syamela / Mu'assasah Risalah), tapi jangan juga
   dipakai sebagai justifikasi tunggal — terutama entry #8 (Yahudi "Allah
   Miskin") yang jadi satu-satunya hadis pendukung.
4. Pola risiko yang ketahuan di audit ini bisa dipakai sebagai heuristik
   pemeriksaan cepat ke depan: (a) rentang halaman >1 halaman untuk satu hadis
   patut dicurigai (lihat #10), (b) nomor Tirmidzi/Ahmad yang dipasangkan
   berbeda topik/perawi dari klaim naratif adalah sinyal kuat citation-padding
   (lihat #4, #7), (c) atribusi perawi "minor"/tidak lazim untuk juz 1 (khusus
   Khulafa Rasyidin) adalah red flag (lihat #1).
5. Simpan audit ini sebagai referensi kalau ada penambahan konten
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
