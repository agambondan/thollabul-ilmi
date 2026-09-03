# Audit Pasangan Arab ↔ Terjemahan Hadis

Tanggal: `2026-09-03`
Scope: seluruh data hadis di API produksi (9 kitab, 61.125 baris)
Status: `SUDAH DITERAPKAN DI PRODUKSI 2026-09-03`
Branch: `master @ b13d228`

Audit ini berangkat dari satu keluhan konkret: gambar share hadis menampilkan
teks Arab dan terjemahan Indonesia yang isinya hadis berbeda. Bug render-nya
sudah diperbaiki terpisah; dokumen ini soal **datanya**.

Semua angka di bawah hasil pengukuran. Alat dan cara mengulangnya ada di
[`scripts/audit-hadith-pairing/`](../../scripts/audit-hadith-pairing/README.md).

---

## Ringkasan Angka

| Metrik                                       | Nilai                          |
| -------------------------------------------- | ------------------------------ |
| Baris hadis diperiksa                        | 61.125 (9 kitab)               |
| Bisa dinilai otomatis                        | 35.968 (58,8%)                 |
| Ditandai pasangan beda                       | 4.134                          |
| Perkiraan benar-benar beda (setelah koreksi) | ~3.800                         |
| Ketelitian penanda (sampel dibaca manual)    | 11 dari 12 benar (~92%)        |
| Akurasi matcher di 95 baris berlabel manual  | 98,9%                          |
| Kitab terparah                               | muslim — ~23% baris            |
| Kitab paling bersih                          | ibnumajah — 1,6%               |
| Musnad Ahmad tanpa teks Arab                 | 21.588 dari 25.863 baris (83%) |
| Muslim tanpa terjemahan Indonesia            | 966 baris                      |

---

## Temuan Utama

### 1. Pasangan salah tersebar di semua kitab, terparah di Shahih Muslim

Persentase dihitung dari baris yang bisa dinilai, lalu dikoreksi dengan
ketelitian penanda (~92%).

| Kitab     | Baris  | Dinilai | Ditandai beda | % ditandai | Perkiraan wajar |
| --------- | ------ | ------- | ------------- | ---------- | --------------- |
| muslim    | 7.063  | 6.051   | 1.529         | 25,3%      | **~23%**        |
| malik     | 1.358  | 1.309   | 228           | 17,4%      | ~16%            |
| abudaud   | 4.774  | 4.623   | 674           | 14,6%      | ~13%            |
| bukhari   | 7.063  | 6.906   | 790           | 11,4%      | ~10%            |
| tirmidzi  | 3.456  | 3.396   | 364           | 10,7%      | ~10%            |
| nasai     | 5.258  | 5.142   | 280           | 5,4%       | ~5%             |
| ahmad     | 25.863 | 4.268   | 159           | 3,7%       | ~3%             |
| darimi    | 2.449  | 2.441   | 50            | 2,0%       | ~2%             |
| ibnumajah | 3.841  | 3.832   | 60            | 1,6%       | ~1,5%           |

Contoh yang sudah diverifikasi dengan mata:

| Kitab   | No.  | Perawi pertama versi Arab | Perawi pertama versi Indonesia |
| ------- | ---- | ------------------------- | ------------------------------ |
| bukhari | 6896 | ابن بشار → ابن عمر        | Hafsh bin Umar → Anas          |
| muslim  | 2450 | محمد بن المثنى            | Yahya bin Ayyub                |
| muslim  | 4921 | إسحاق بن إبراهيم          | 'Ubaidullah bin Mu'adz         |
| abudaud | 2279 | محمد بن عيسى              | Musaddad                       |
| nasai   | 5180 | هارون بن عبد الله         | Ali bin Hujr                   |

### 2. Ini BUKAN geseran nomor, jadi tidak bisa diperbaiki dengan pasang ulang

Hipotesis awal: dua dataset dengan penomoran beda, sehingga terjemahan yang
benar sebetulnya ada di nomor tetangga. **Hipotesis ini gugur.**

Kalau seluruh terjemahan digeser `k` nomor, tingkat kecocokan jadi:

| Kitab   |    −3 |    −2 |    −1 |     **0** |    +1 |    +2 |    +3 |
| ------- | ----: | ----: | ----: | --------: | ----: | ----: | ----: |
| bukhari | 11,2% | 11,1% | 13,8% | **88,6%** | 14,2% | 10,8% | 10,9% |
| muslim  | 13,1% | 12,8% | 14,5% | **74,7%** | 16,1% | 13,5% | 13,3% |
| abudaud | 13,3% | 13,8% | 14,0% | **85,4%** | 15,7% | 13,8% | 13,4% |
| malik   | 19,8% | 20,3% | 19,8% | **82,6%** | 21,0% | 19,3% | 18,4% |

Posisi asli jauh lebih baik daripada geseran mana pun, dan angka geseran (11–21%)
sama dengan tingkat kecocokan kebetulan. Blok berurutan yang tergeser konsisten
juga nyaris tidak ada: bukhari 0 blok, abudaud 0 blok, muslim hanya 2 blok
(11 baris).

> Catatan metode: pencarian "terjemahan cocok dalam jarak ±25 nomor" menemukan
> 65–87% kandidat, dan itu **menyesatkan**. Hadis bertetangga sering berbagi
> perawi pertama, jadi dari 50 posisi kandidat hampir selalu ada yang cocok
> secara kebetulan. Uji geseran global di atas yang menjawab pertanyaannya.

Konsekuensinya: baris yang salah pasang **tidak punya terjemahan yang benar di
dalam database**. Perbaikan harus lewat impor ulang dari sumber yang
penomorannya sudah selaras, bukan menukar-nukar data yang ada.

### 3. Musnad Ahmad praktis tanpa teks Arab

21.588 dari 25.863 baris (83%) `translation.ar`-nya kosong. Yang bisa dinilai
cuma 4.268 baris. Fitur apa pun yang menampilkan Arab untuk Ahmad akan kosong.

| Kitab     | ar kosong | idn kosong | ar duplikat | idn duplikat |
| --------- | --------- | ---------- | ----------- | ------------ |
| ahmad     | 21.588    | 0          | 11          | 300          |
| muslim    | 78        | 966        | 70          | 50           |
| abudaud   | 0         | 146        | 4           | 2            |
| bukhari   | 2         | 133        | 295         | 250          |
| nasai     | 26        | 79         | 3           | 1            |
| tirmidzi  | 3         | 54         | 1           | 0            |
| malik     | 3         | 41         | 0           | 0            |
| ibnumajah | 0         | 3          | 0           | 0            |
| darimi    | 0         | 0          | 3           | 0            |

### 4. `translation.id` adalah angka, bukan teks Indonesia

Field `translation.id` berisi id record (mis. `56358`), teks Indonesianya ada di
`translation.idn`. Kode yang memetakan bahasa `"ID"` ke `.id` akan mendapat
angka, bukan kalimat. Perlu dicek di helper `getLocalizedTranslation`.

---

## Dampak

Setiap permukaan yang menyandingkan Arab dan terjemahan ikut menyebarkan
pasangan yang salah — share gambar, copy teks, detail hadis, hasil pencarian,
hafalan. Untuk Shahih Muslim kira-kira **1 dari 4 hadis** menampilkan terjemahan
milik hadis lain.

Ini bukan sekadar cacat tampilan. Menisbatkan terjemahan ke sanad yang bukan
miliknya adalah kesalahan penyampaian riwayat, dan wajib diselesaikan dari
sumbernya — sejalan dengan aturan seeding data Islam di repo ini.

## Rekomendasi

| Prioritas | Tindakan                                                                          |
| --------- | --------------------------------------------------------------------------------- |
| P0        | Impor ulang muslim, malik, abudaud dari sumber yang Arab + terjemahannya sepasang |
| P0        | Sebelum impor selesai, pertimbangkan menyembunyikan terjemahan Muslim             |
| P1        | Lengkapi teks Arab Musnad Ahmad, atau tandai kitabnya "Arab belum tersedia"       |
| P1        | Impor ulang bukhari dan tirmidzi                                                  |
| P2        | Isi 966 terjemahan Muslim yang kosong dan 133 di Bukhari                          |
| P2        | Audit `getLocalizedTranslation` terhadap `translation.id` yang berupa angka       |
| P2        | Jalankan `validate.py` sebagai gerbang mutu setiap kali data hadis di-seed ulang  |

Sumber impor harus dipilih yang satu edisi untuk Arab dan terjemahannya
sekaligus, supaya penomorannya tidak bisa berbeda sejak awal.

---

## Verification Log

```bash
# tarik seluruh data dari API produksi
python3 scripts/audit-hadith-pairing/fetch_all.py bukhari muslim abudaud \
    tirmidzi nasai ibnumajah malik ahmad darimi

# uji matcher ke 95 baris yang dilabeli manual  -> 98,9%
python3 scripts/audit-hadith-pairing/validate.py

# sensus per kitab
python3 scripts/audit-hadith-pairing/census.py

# uji hipotesis geseran nomor
python3 scripts/audit-hadith-pairing/offset.py bukhari muslim abudaud malik
```

Ketelitian penanda diukur dengan mengambil 12 baris bertanda "beda" dan 12
bertanda "cocok" secara acak (seed 2026) lintas 6 kitab, lalu membacanya satu
per satu: 11 dari 12 yang ditandai beda memang beda, dan 12 dari 12 yang
dinyatakan cocok memang cocok.

---

## Penyebab dan Perbaikan (ditambahkan 2026-09-03)

### Penyebabnya: tiga berkas dijahit berdasarkan nomor

[`scripts/scrape_all.go`](../../services/api/scripts/scrape_all.go) mengunduh
edisi Arab, Indonesia, dan Inggris dari fawazahmed0 sebagai **tiga berkas
terpisah**, lalu menjahitnya berdasarkan nomor hadis. Penomoran ketiga edisi itu
tidak identik, jadi sebagian baris memasangkan sanad Arab satu hadis dengan
terjemahan hadis lain.

Bukti pendukungnya ada di data sendiri: dua kitab yang **tidak** lewat jalur itu
— Ahmad dan Darimi, keduanya dari gadingnst yang menyimpan `arab` dan `id` dalam
satu record — justru paling bersih.

### Perbaikannya: dijodohkan lewat isi terjemahan, bukan nomor

Penomoran gadingnst berbeda dengan database (hanya ~9% nomor bukhari sejajar),
dan mengganti nomor akan memutus bookmark, progres baca, hafalan, serta URL yang
sudah dibagikan pengguna. Karena terjemahan di kedua sisi berasal dari terjemahan
yang sama, penjodohan dilakukan lewat **isi teks terjemahan**.

Hasil penjodohan: **31.391 dari 31.391** baris bertemu pasangannya, tanpa satu
pun kandidat ambigu.

| Hasil                                  | Jumlah    |
| -------------------------------------- | --------- |
| Sudah benar, tidak disentuh            | 26.379    |
| **Diperbaiki**                         | **3.631** |
| Karantina — terjemahan kosong          | 1.422     |
| Karantina — usulan pun tidak lolos uji | 1.381     |
| Gagal berjodoh                         | 0         |

Yang diganti hanya kolom `translation.ar` pada baris yang gagal uji. Nomor
hadis, terjemahan, dan id record tidak berubah.

Contoh, bukhari 6896 — kasus yang memicu audit ini:

|                      | Teks                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| Arab lama (skor 1/7) | `وقال لي ابن بشار حدثنا يحيى، عن عبيد الله، عن نافع، عن ابن عمر`                        |
| Arab baru (skor 6/7) | `حدثنا حفص بن عمر حدثنا هشام عن قتادة عن أنس رضي الله عنه`                              |
| Terjemahan (tetap)   | `Telah menceritakan kepada kami [Hafsh bin Umar] ... [Hisyam] ... [Qatadah] ... [Anas]` |

### Gerbang mutu

Ambang lolos 0,70 pada skor keselarasan sanad. Dipilih dari data berlabel
manual: pasangan yang salah tidak pernah melewati 0,60. Yang tidak lolos tidak
ditulis ke berkas perbaikan, melainkan dikarantina untuk ditinjau manusia.

Dua belas baris hasil perbaikan diambil acak lintas empat kitab dan dibaca satu
per satu — dua belas-duanya benar, sanad Arab barunya cocok dengan rantai perawi
di terjemahannya.

### Yang masih harus dikerjakan manusia

- **1.381 baris karantina** perlu dibaca orang yang paham hadis.
- **1.422 baris tanpa terjemahan** perlu diisi dari sumber terjemahan.
- **Musnad Ahmad**: 21.588 baris tanpa teks Arab; gadingnst hanya punya 4.305
  baris sehingga tidak bisa ditambal dari sana.
- Gerbang ini memeriksa **sanad**, bukan matan. Pasangan yang sanadnya benar tapi
  matannya tertukar tidak akan tertangkap.

### Hasil setelah diterapkan

Diterapkan ke database produksi 2026-09-03, tujuh kitab, 3.631 UPDATE.
Dump database diambil lebih dulu (`/works/me/backups/`, 35 MB, integritas gzip
diuji), dan setiap kitab punya berkas rollback.

Angka sebelum dan sesudah di bawah diukur dengan **matcher versi yang sama**.
Perbandingan mentah antar-waktu tidak sahih karena matcher-nya ikut diperbaiki
di tengah pengerjaan; Ahmad dan Darimi yang tidak disentuh dipakai sebagai
kontrol dan keduanya bergerak 0,0% — itu yang menjadikan angka ini bisa
dipercaya.

| Kitab     | Sebelum  | Sesudah  | Turun    |
| --------- | -------- | -------- | -------- |
| muslim    | 24,0%    | 3,3%     | 20,7%    |
| abudaud   | 13,6%    | 1,9%     | 11,7%    |
| malik     | 13,3%    | 3,6%     | 9,7%     |
| tirmidzi  | 9,9%     | 1,6%     | 8,4%     |
| bukhari   | 9,0%     | 1,7%     | 7,3%     |
| nasai     | 4,6%     | 0,6%     | 3,9%     |
| ibnumajah | 0,9%     | 0,4%     | 0,5%     |
| ahmad \*  | 1,7%     | 1,7%     | 0,0%     |
| darimi \* | 0,5%     | 0,5%     | 0,0%     |
| **TOTAL** | **9,4%** | **1,7%** | **7,7%** |

\* kontrol, tidak disentuh

Baris yang ditandai beda: **3.581 → 642**.

Pemeriksaan regresi baris per baris: **3.609 baris membaik, 0 baris memburuk.**

Sisa 642 baris sebagian besar adalah baris yang sengaja dikarantina — teks Arab
penggantinya pun tidak lolos uji, jadi dibiarkan apa adanya alih-alih ditukar
dengan yang belum pasti. Baris-baris itu masih menunggu pembacaan manusia.

### Menjalankan ulang

Lihat
[`services/api/scripts/repair_hadith_pairing/README.md`](../../services/api/scripts/repair_hadith_pairing/README.md).
Ambil dump database dulu sebelum apply; tiap `apply_*.sql` punya pasangan
`rollback_*.sql`.
