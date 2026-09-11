# Audit Cakupan Dalil pada Fitur Fiqh/Hukum

Tanggal: `2026-09-12`
Scope: seluruh route publik `apps/web/src/app/**` yang menyajikan konten fiqh/hukum syar'i
Status: `SELESAI` — Zakat, Faraidh, dan Wirid diperbaiki; sisanya sudah punya dalil atau memang
tidak relevan (N/A)

Dipicu laporan user: beberapa fitur yang menampilkan hukum fiqh (contoh konkret: Zakat) tidak
menyertakan dalil (ayat/hadits) sebagai rujukan. Investigasi menemukan komponen `SourceBadges`
(`apps/web/src/components/SourceBadges.js`, ada juga port mobile di
`apps/mobile/src/components/SourceBadges.js`) sudah ada dan sudah dipakai di ~10 tempat — task ini
TIDAK membuat komponen baru, hanya memasang ulang komponen yang sama di tempat yang belum
memakainya, plus menambah beberapa dalil baru yang sudah diverifikasi.

`SourceBadges` menerima string `source` (mis. `"HR. Abu Dawud No. 1573, Tirmidzi No. 620"` atau
`"QS. At-Taubah: 60"`), mem-parsing tiap referensi, dan me-render badge yang bisa diklik (link ke
`/hadith/:book/:number` atau `/quran/surah/:surah#ayah-:n`) kalau kitab/pola ayatnya dikenali, atau
badge polos non-klik kalau tidak.

---

## 1. Tabel Audit

| Route                              | Ada dalil?             | Cara / alasan                                                                                                                                                                                                                                 |
| ---------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/fiqh`, `/fiqh/[slug]`            | Ya                     | `SourceBadges` dari field `Source` (Fiqh Ringkas, `seeder_related.go`)                                                                                                                                                                        |
| `/manasik`                         | Ya                     | `SourceBadges`                                                                                                                                                                                                                                |
| `/panduan-sholat`                  | Ya                     | `SourceBadges` (`PanduanSholatClient.js`)                                                                                                                                                                                                     |
| `/doa`                             | Ya                     | `SourceBadges` (`DoaContent.js`)                                                                                                                                                                                                              |
| `/dzikir`                          | Ya                     | `SourceBadges` dari `dzikir.source` (`DzikirContent.js`)                                                                                                                                                                                      |
| `/amalan`, `dashboard/amalan`      | Ya                     | `SourceBadges`                                                                                                                                                                                                                                |
| `/asmaul-husna`                    | Ya                     | `SourceBadges`                                                                                                                                                                                                                                |
| `/asbabun-nuzul`                   | Ya                     | `SourceBadges` (form admin + tampilan)                                                                                                                                                                                                        |
| `/siroh/[slug]`                    | Ya                     | `SourceBadges`                                                                                                                                                                                                                                |
| `dashboard/belajar/lessons`        | Ya                     | `SourceBadges` (`LessonsContent.js`)                                                                                                                                                                                                          |
| `/wirid-custom`                    | Ya                     | `SourceBadges`                                                                                                                                                                                                                                |
| `/quran/[...slug]` (`AyahPage.js`) | Ya                     | `SourceBadges` untuk tafsir/asbabun nuzul per ayat                                                                                                                                                                                            |
| **`/wirid`**                       | **Tidak (diperbaiki)** | Pakai model `Dzikir` yang sama dengan `/dzikir` (field `source` di DB, `services/api/app/model/dzikir.go:30`), tapi `WiridClient.js` cuma render `fadhilah`, tidak pernah render `item.source` lewat `SourceBadges`. Ditambahkan di task ini. |
| **`/zakat`**                       | **Tidak (diperbaiki)** | Lihat bagian 2                                                                                                                                                                                                                                |
| **`/faraidh`**                     | **Tidak (diperbaiki)** | Lihat bagian 3                                                                                                                                                                                                                                |
| `/zakat/history`                   | N/A                    | Cuma daftar riwayat hitungan personal, tidak ada teks hukum baru                                                                                                                                                                              |
| `/jadwal-sholat`                   | N/A                    | Jadwal waktu sholat (dari API Kemenag/aladhan), bukan teks hukum; ada `source_note_be` tapi itu atribusi sumber data jadwal, bukan dalil fiqh                                                                                                 |
| `/kiblat`                          | N/A                    | Kompas arah kiblat (perhitungan geografis), tidak ada teks hukum                                                                                                                                                                              |
| `/hijri`                           | N/A                    | Kalender Hijriyah; `PuasaSunnahPanel` di dalamnya sudah tercakup di audit sebelumnya (sudah pakai `SourceBadges`)                                                                                                                             |
| `/tasbih`                          | N/A                    | Penghitung dzikir (counter), tidak ada teks hukum baru                                                                                                                                                                                        |
| `/kamus`                           | N/A                    | Kamus istilah — field `source`/`origin` di sana adalah etimologi kata, bukan dalil hukum                                                                                                                                                      |
| `/quiz`                            | N/A                    | Kuis, tidak menyajikan hukum baru                                                                                                                                                                                                             |
| `/imsakiyah`                       | N/A                    | Jadwal imsakiyah, atribusi `aladhan.com` untuk data jadwal, bukan dalil fiqh                                                                                                                                                                  |
| `/khatam`                          | N/A                    | Tracker progres baca Quran, `QS. surah:ayah` yang tampil adalah posisi terakhir baca, bukan rujukan hukum                                                                                                                                     |
| `/sholat-tracker`                  | N/A                    | Tracker personal sholat harian, tidak ada teks hukum baru                                                                                                                                                                                     |
| `/muhasabah`                       | N/A                    | Jurnal muhasabah personal, tidak ada teks hukum                                                                                                                                                                                               |
| `/tilawah`                         | N/A                    | Tracker tilawah personal, tidak ada teks hukum baru                                                                                                                                                                                           |

Catatan: kolom "N/A" berarti halaman tidak menyajikan hukum fiqh yang butuh dalil (murni kalkulator
personal, tracker, atau data non-hukum), bukan berarti diabaikan.

---

## 2. Perbaikan `/zakat` (`apps/web/src/app/zakat/page.js`, `ZakatContent`)

Ditambahkan `import SourceBadges from "@/components/SourceBadges";` dan satu blok dalil di tiap tab,
tepat setelah kotak info (`MdInfo`) dan sebelum input pertama:

| Tab                | Source string yang dipakai                                | Asal / verifikasi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zakat Maal         | `HR. Abu Dawud No. 1573, Tirmidzi No. 620`                | Reuse persis dari entri Fiqh Ringkas "Syarat Wajib Zakat Maal" (`seeder_related.go`) yang sudah divalidasi sebelumnya — tidak diriset ulang.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Zakat Fitrah       | `HR. Bukhari No. 1503, Abu Dawud No. 1609`                | Reuse persis dari entri Fiqh Ringkas "Zakat Fitrah: Ketentuan dan Waktu".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Zakat Perdagangan  | `HR. Abu Dawud No. 1573, Tirmidzi No. 620` + catatan teks | **Tidak** memakai hadits Samurah bin Jundub (Abu Dawud No. 3324) tentang zakat `'urudh tijarah` walau itu dalil paling sering dikutip — hadits itu diverifikasi via WebSearch berstatus **dha'if** (sanad ada perawi majhul: Ja'far bin Sa'd bin Samurah, Khabib bin Sulaiman, Sulaiman bin Samurah; dilemahkan Al-Albani di _Irwa'ul Ghalil_ 3/310 no. 827). Sesuai aturan proyek (tidak boleh masukkan riwayat dha'if walau populer, lihat `docs/api/ASBABUN_NUZUL_DATASET_TODO.md`), tab ini malah diberi catatan teks jujur bahwa zakat dagang ditetapkan lewat **qiyas dan ijma' ulama** atas zakat maal (nisab & kadar disamakan), dan me-reuse badge dalil zakat maal sebagai basis analogi. |
| Zakat Pertanian    | `HR. Bukhari No. 1459`                                    | Baru diriset: hadits "_laisa fima duna khamsati awsuqin sadaqah_" (tidak ada zakat pada hasil bumi di bawah 5 wasaq) dari Abu Sa'id Al-Khudri. **Diverifikasi langsung terhadap dataset lokal** `services/api/data/hadits_bukhari.json` — nomor 1459 cocok teks Arab & terjemahan Indonesia-nya (dan sudah selaras/tidak kena masalah mismatch Arab↔terjemahan yang pernah ditemukan di dataset ini sebelumnya), sehingga link `/hadith/bukhari/1459` dari `SourceBadges` akan mengarah ke hadits yang benar.                                                                                                                                                                                       |
| Zakat Emas & Perak | `HR. Abu Dawud No. 1573, Tirmidzi No. 620`                | Reuse dari entri "Syarat Wajib Zakat Maal" — isi kontennya sudah eksplisit menyebut nisab emas 85g dan perak 595g, jadi hadits yang sama relevan untuk tab ini (nisab & kadar sama persis dengan zakat maal, 2,5%).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

---

## 3. Perbaikan `/faraidh` (`apps/web/src/app/faraidh/page.js`, `FaraidhContent`)

Ditambahkan blok "Dasar Hukum Pembagian Waris" setelah kotak disclaimer, sebelum form input:

```
<SourceBadges source='QS. An-Nisa: 11; QS. An-Nisa: 12; QS. An-Nisa: 176; HR. Bukhari No. 6732' />
```

Verifikasi tiap referensi (semua via WebSearch, bukan diasumsikan dari training data):

- **QS. An-Nisa: 11** — kandungan ayat: bagian anak (laki-laki 2x perempuan) dan bagian orang tua
  (ayah/ibu). Cocok dengan `HEIR_FIELDS`/`calculateFaraidh` yang menghitung `anakL`, `anakP`,
  `ayah`, `ibu`.
- **QS. An-Nisa: 12** — kandungan ayat: bagian suami/istri, dan bagian saudara seibu (kalalah
  jalur ibu). Cocok dengan `suami`, `istri`, dan blok `saudaraSeibuL/P` di `faraidh.js`.
- **QS. An-Nisa: 176** — ayat terakhir surat An-Nisa, kandungan: kalalah untuk saudara
  kandung/seayah (tanpa anak/ayah). Cocok dengan blok `saudaraL/P`, `saudaraSeayahL/P` di
  `faraidh.js`.
- **HR. Bukhari No. 6732** — "_Alhiqul fara'idha bi ahliha, fama baqiya fahuwa li-awla rajulin
  dzakar_" ("Berikan bagian fara'idh yang sudah ditetapkan kepada yang berhak, sisanya untuk
  kerabat laki-laki terdekat"), dari Ibnu Abbas. **Diverifikasi langsung terhadap dataset lokal**
  `services/api/data/hadits_bukhari.json` nomor 6732 — teks Arab dan terjemahan Indonesia cocok
  dan selaras. Hadits ini persis menjadi dasar mekanisme _ashabah_ (sisa harta ke kerabat laki-laki
  terdekat) yang diimplementasikan `calculateFaraidh` di `apps/web/src/lib/faraidh.js`.

Slug surah `An-Nisa` pada `SourceBadges` sudah dipakai konsisten di seed data lain (`seeder_related.go`,
mis. `QS. An-Nisa: 29`, `QS. An-Nisa: 4`) sehingga link `/quran/surah/An-Nisa#ayah-N` sudah terbukti
konsisten dengan pola yang ada.

### Sengaja tidak ditambahkan

- **Hadits bagian nenek 1/6** (`HR. Abu Dawud No. 2507` / `Sunan Tirmidzi No. 2026`, kesaksian
  Al-Mughirah bin Syu'bah & Muhammad bin Maslamah di hadapan Abu Bakr) — relevan karena kalkulator
  punya heir `nenek` dengan bagian 1/6 (`faraidh.js`). Kontennya ditemukan konsisten di beberapa
  sumber, tapi **grade/status ke-shahih-annya (Al-Albani / Syu'aib Al-Arnauth) tidak berhasil
  dikonfirmasi dengan yakin** dalam sesi WebSearch ini. Sesuai aturan "jangan tebak, lebih baik
  tidak dikutip", ini **sengaja dibiarkan tanpa sitasi** — bukan lupa. Kalau mau ditambahkan nanti,
  perlu verifikasi grade langsung ke kitab takhrij (mis. _Shahih Sunan Abu Dawud_ karya Al-Albani).

---

## 4. Perbaikan `/wirid` (`apps/web/src/app/wirid/WiridClient.js`)

`/wirid` dan `/dzikir` sama-sama konsumsi model `Dzikir` (`services/api/app/model/dzikir.go`) yang
punya field `source` (line 30). `DzikirContent.js` sudah render `dzikir.source` lewat
`SourceBadges`, tapi `WiridClient.js` cuma render field `fadhilah` (teks keutamaan) dan tidak pernah
menyentuh `item.source` sama sekali — padahal datanya sama-sama sudah ada dan sudah divalidasi
lewat seeder yang sama (`seeder_static_file.go`, `seeder_idempotency.go`). Ditambahkan
`<SourceBadges source={item.source} />` setelah blok fadhilah. Tidak ada riset dalil baru di sini —
murni memasang ulang data yang sudah ada tapi belum ditampilkan.

---

## 5. Verifikasi Build

- `npx eslint src/app/zakat/page.js src/app/faraidh/page.js src/app/wirid/WiridClient.js` → bersih
  (exit 0).
- `npm run build` (di `apps/web/`) → sukses, semua route termasuk `/zakat`, `/faraidh`, `/wirid`
  ter-compile tanpa error.

## 6. Yang Belum/Tidak Dikerjakan

- Hadits nenek 1/6 di `/faraidh` (lihat bagian 3, sengaja tidak dikutip karena grade belum
  terkonfirmasi).
- Route lain di luar daftar tabel bagian 1 (mis. `/masjid`, `/radio-islamic`, `/library`,
  `/tokoh`, `/perawi`, `/sejarah`) tidak diperiksa detail karena bukan halaman fiqh/hukum
  (direktori/biografi/riwayat, bukan penyajian hukum syar'i) — kalau user menganggap salah satu di
  antaranya perlu dalil, perlu task terpisah untuk audit kontennya dulu.
