# Asbabun Nuzul Dataset — Tracker

> Last updated: 2026-05-09
> Schema: `services/api/app/model/asbabun_nuzul.go` (m2m → Ayah)
> Dataset file: `services/api/app/db/migrations/seeder_asbabun_nuzul_data.go`
> Acuan aturan: `MEMORY.md "Islamic data seeding harus shahih"`

## Status saat ini

| Metric                                         | Angka   |
| ---------------------------------------------- | ------- |
| Entri ter-seed                                 | **216** |
| Ayat ter-cover (range expanded)                | ~380    |
| Surat ter-cover (sebagian)                     | 75      |
| Coverage vs total Quran (6,236 ayat)           | ~6.1%   |
| Coverage vs estimasi total asbab shahih (~270) | ~80%    |

## Target final (MVP shahih)

**~250-350 entri** total — setara dengan dataset:

- _Shahih Asbabun Nuzul_ karya Syaikh Muqbil Al-Wadi'i (~270 riwayat shahih)
- atau _Lubabun Nuqul_ As-Suyuthi setelah filter shahih (~300-400 riwayat)

## Rules wajib

Tiap entri baru WAJIB memenuhi:

1. **Source spesifik**: nama kitab + nomor hadis/halaman + grade. Tidak boleh kabur.
2. **Sumber shahih**: Bukhari, Muslim, atau Sunan dengan tashih ulama mu'tabar (Al-Albani, Syu'aib Al-Arnauth, Muqbil Al-Wadi'i). Lubabun Nuqul boleh kalau jalur shahih sudah dikonfirmasi.
3. **JANGAN** masukkan riwayat dha'if/maudhu' walaupun populer.
4. **JANGAN** auto-scrape situs umum tanpa review manual.
5. **Title** unik (jadi natural key idempotent untuk seeder).
6. **Range AyahFrom..AyahTo** harus akurat — kalau ragu, set keduanya sama (single ayah).

## Backlog per surat (target prioritas tinggi)

Surat-surat berikut paling sering dibuka di mobile app + paling banyak riwayat shahih-nya. Diurutkan dari yang paling kurang coverage-nya.

### Tier 1 — Surat panjang utama

#### Al-Baqarah (2) — covered: 14/286

Sudah ada: 97-98, 104, 115, 142-143, 144, 158, 177, 178-179, 187, 189, 196, 219, 222, 223, 233, 235, 238, 255, 267, 272, 284-286.
Gap target (sisa):

- [ ] **2:1-7** — Pembagian manusia (mukmin/kafir/munafik) — Tafsir Ibnu Katsir

#### An-Nisa' (4) — covered: 11/176

Sudah ada: 7, 11-12, 19, 24, 29, 32, 34, 43, 48, 59, 65, 88, 94, 95, 97-99, 127, 128, 176.

#### Ali 'Imran (3) — covered: 9/200

Sudah ada: 7, 72-73, 118-120, 122, 128-129, 140-142, 154, 172-174, 181, 186, 188, 190-191, 200.

#### Al-Maidah (5) — covered: 10/120

Sudah ada: 3, 6, 27-31, 38, 41-42, 67, 90-91, 93, 101-102, 103.

### Tier 2 — Surat sedang

#### At-Taubah (9) — covered: 8/129

Sudah ada: 1-5, 25-26, 38-41, 42, 79, 84, 107-108, 113, 117-118, 128-129.

#### An-Nur (24) — covered: 6/64

Sudah ada: 6-9, 11-21, 22, 23, 27-28, 31, 33.

#### Al-Anfal (8) — covered: 4/75

Sudah ada: 1, 9-12, 65-66, 67-68.

#### Al-Ahzab (33) — covered: 9/73

Sudah ada: 6, 23, 33, 35, 37, 50-51, 53, 56, 69.

#### Al-Hujurat (49) — covered: 5/18

Sudah ada: 1, 2-3, 6, 11, 13.

### Tier 3 — Surat pendek (Juz Amma)

Banyak surat pendek punya asbab nuzul yang ada di Bukhari/Muslim:

- [x] **Al-Falaq + An-Nas (113-114)** — sudah ada ✓
- [x] **Al-Ikhlas (112)** — sudah ada ✓
- [x] **Al-Fil (105)** — sudah ada ✓ (batch 6)
- [ ] **Al-Humazah (104)** — sudah ada ✓ (batch 6)
- [x] **Al-Ma'un (107)** — sudah ada ✓ (batch 6)
- [ ] **Al-'Ashr (103)** — Tafsir umum
- [x] **At-Takatsur (102)** — sudah ada ✓
- [ ] **Al-Qari'ah (101)** — Tafsir
- [ ] **Az-Zalzalah (99)** — Tafsir
- [ ] **Al-Qadr (97)** — Tafsir umum
- [ ] **Al-Bayyinah (98)** — Tafsir umum
- [x] **Al-Qiyamah (75)** — sudah ada 16-19 ✓
- [ ] **Al-Insan (76)** — Ali, Fatimah, Hasan, Husain — Tafsir
- [x] **Al-Mursalat (77)** — sudah ada ✓
- [ ] **An-Naba' (78)** — Tafsir
- [x] **'Abasa (80)** — sudah ada 1-10 ✓
- [ ] **At-Takwir (81)** — Tafsir
- [ ] **Al-Infithar (82)** — Tafsir
- [x] **Al-Muthaffifin (83)** — sudah ada ✓
- [ ] **Al-Insyiqaq (84)** — Tafsir
- [x] **Al-Buruj (85)** — sudah ada ✓

### Tier 4 — Mekah klasik

- [x] **Al-An'am (6)** — sudah ada 52, 82, 151-153 ✓
- [x] **Al-A'raf (7)** — sudah ada 31-32, 172-173, 180, 199, 204 ✓
- [ ] **Yusuf (12)** — Tafsir umum (sebab nuzul jarang)
- [x] **Al-Isra' (17)** — sudah ada 1, 23-24, 73-75, 85, 88, 110 ✓
- [x] **Al-Kahf (18)** — sudah ada 9-26, 23-24, 28, 60-82 ✓
- [x] **Maryam (19)** — sudah ada 64, 77-80, 88-95 ✓
- [x] **Thaha (20)** — sudah ada 1-2, 114 ✓
- [x] **Al-Anbiya' (21)** — sudah ada 36-37 ✓ (batch 7)
- [x] **Al-Hajj (22)** — sudah ada 19-22 ✓ (batch 7)
- [x] **Al-Furqan (25)** — sudah ada 25:32 ✓ (batch 7)
- [x] **Asy-Syu'ara' (26)** — sudah ada 214-216 ✓ (batch 7)
- [x] **Al-'Ankabut (29)** — sudah ada 1-3 ✓ (batch 7)
- [x] **Luqman (31)** — sudah ada 6-7 ✓ (batch 7)
- [x] **Al-Ahqaf (46)** — sudah ada 29-31 ✓ (batch 7)
- [x] **An-Najm (53)** — sudah ada 19-23 ✓ (batch 7)
- [x] **Al-Mumtahanah (60)** — sudah ada 8-9 ✓ (batch 7)
- [x] **Al-Qalam (68)** — sudah ada 10-13 ✓ (batch 7)
- [x] **Al-Muzzammil (73)** — sudah ada 1-9 ✓ (batch 7)
- [x] **Al-Balad (90)** — sudah ada 1-4 ✓ (batch 7)
- [x] **Al-Lail (92)** — sudah ada 1-11 ✓ (batch 7)

## Workflow tambah batch

Setiap batch:

1. Ambil 25-40 entri dari satu/dua tier prioritas.
2. Cross-check tiap riwayat di:
    - Maktabah Syamilah (kitab digital ulama)
    - Sahih Bukhari/Muslim numbering (cek nomor hadis)
    - Tashih ulama: cek di Maktabah Asy-Syamilah atau dorar.net
3. Append ke `verifiedAsbabunNuzulDataset()` di `seeder_asbabun_nuzul_data.go`.
4. Update angka di section "Status saat ini" doc ini.
5. `go build ./...` → harus hijau.
6. Commit per batch dengan pesan: `feat(api): seed asbabun nuzul batch <N> (<topik>, +<count> entri)`

## Sumber digital yang sudah dikonfirmasi terpercaya

- Maktabah Asy-Syamilah (kitab digital lengkap, manhaj klasik)
- dorar.net (mausu'ah dorar — derajat hadis)
- almanhaj.or.id (rujukan jelas, manhaj salaf, perlu re-verify per entri)
- shamela.ws (kitab digital, cross-check dengan teks asli)

**Hindari** auto-scrape situs umum (kompasiana, dakwatuna, blog umum) — manhaj-nya tidak konsisten.

## Catatan derajat hadis

Saat menulis field `Source`:

- **Shahih (Muttafaq 'alaih)**: ada di Bukhari + Muslim
- **Shahih (Bukhari)** atau **Shahih (Muslim)**: hanya di salah satu
- **Hasan Shahih**: derajat di bawah shahih lighairih
- **Hasan**: hadis hasan
- **Shahih oleh Al-Albani**: Sunan dengan tashih Al-Albani di Sahih At-Targhib atau Silsilah As-Sahihah
- **Shahih oleh Muqbil**: yang dipilih di Shahih Asbabun Nuzul

JANGAN tulis "Shahih" tanpa attribution kalau bukan dari Shahihain.
