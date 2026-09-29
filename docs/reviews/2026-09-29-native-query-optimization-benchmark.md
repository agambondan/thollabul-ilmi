# Backend Native Query & Scan Optimization Benchmark — 29 Sep 2026

## Executive Summary

Audit dan implementasi optimasi query pada database repository layer (`services/api/app/repository`) untuk mengeliminasi N+1 subquery overhead dari GORM `Preload()`.

Pendekatan menggunakan **Single Round-Trip Native SQL Raw Query + Direct Struct Scan (`scanRow`)**, menggantikan multi-step GORM reflection dan relasi preload.

---

## Benchmark Results (Go Benchmark Suite)

Environment: `linux/amd64`, CPU: `13th Gen Intel(R) Core(TM) i5-1335U`

| Repository & Endpoint | Implementasi | Waktu (ns/op) | Alokasi Memori (B/op) | Alokasi Objek (allocs/op) | Speedup |
|---|---|---|---|---|---|
| **Tafsir** (`FindBySurahNumber`) | GORM Preload | 2,203,201 ns | 259,905 B | 3,672 | Baseline |
| | **Native RawScan** | **596,322 ns** | **85,238 B** | **1,685** | **3.7x lebih cepat (-67% RAM)** |
| **Munasabah** (`FindByAyahID`) | GORM Preload | 2,049,874 ns | 162,516 B | 2,630 | Baseline |
| | **Native RawScan** | **605,260 ns** | **63,102 B** | **2,042** | **3.4x lebih cepat (-61% RAM)** |
| **HadithAyah** (`FindByHadithID`) | GORM Preload | 2,083,004 ns | 111,640 B | 1,961 | Baseline |
| | **Native RawScan** | **599,866 ns** | **60,509 B** | **1,935** | **3.5x lebih cepat (-46% RAM)** |
| **Mufrodat** (`FindByAyahID`) | GORM Preload | 596,064 ns | 62,821 B | 1,094 | Baseline |
| | **Native RawScan** | **284,903 ns** | **37,193 B** | **958** | **2.1x lebih cepat (-41% RAM)** |
| **Asbabun Nuzul** (`FindBySurahNumber`) | GORM Preload | 1,622,211 ns | 307,131 B | 4,347 | Baseline |
| | **Native RawScan** | **552,996 ns** | **83,944 B** | **2,737** | **2.9x lebih cepat (-73% RAM)** |
| **Jarh Tadil** (`FindByPerawiID`) | GORM Preload | 620,625 ns | 112,929 B | 2,037 | Baseline |
| | **Native RawScan** | **291,656 ns** | **49,120 B** | **1,670** | **2.1x lebih cepat (-56% RAM)** |
| **Perawi** (`FindByID`) | GORM Preload | 1,385,837 ns | 160,386 B | 2,993 | Baseline |
| | **Native RawScan** | **644,759 ns** | **89,632 B** | **2,536** | **2.1x lebih cepat (-44% RAM)** |
| **Fiqh** (`FindCategoryBySlug`) | GORM Preload | 724,899 ns | 77,387 B | 1,502 | Baseline |
| | **Native RawScan** | **233,146 ns** | **38,728 B** | **1,032** | **3.1x lebih cepat (-50% RAM)** |

---

## Repositories yang Dioptimasi

1. **`tafsir_repository.go`**:
   - Menghilangkan 6 query berantai (KemenagTranslation, IbnuKatsirTranslation, IbnuKatsirEnTranslation, Ayah, Ayah.Translation, Ayah.Surah).
   - Single joined query pada `tafsirSelectSQL` dengan scan `scanRow`.
2. **`munasabah_repository.go`**:
   - Menghilangkan 6 query berantai (AyahFrom, AyahFrom.Translation, AyahFrom.Surah, AyahTo, AyahTo.Translation, AyahTo.Surah).
   - Single joined query pada `munasabahSelectSQL`.
3. **`hadith_ayah_repository.go`**:
   - Menghilangkan query terpisah `Hadith + Translation + Book + Translation` dan `Ayah + Translation + Surah + Translation`.
   - Single joined query pada `hadithAyahSelectSQL`.
4. **`mufrodat_repository.go`**:
   - Menghilangkan 3 query berantai `Ayah + Surah + Translation` di seluruh 5 metode query (`FindByAyahID`, `FindBySurahNumber`, `FindBySurahAndAyahNumber`, `FindByPage`, `FindByRootWord`).
   - Single joined query pada `mufrodatSelectSQL`.
5. **`asbabun_nuzul_repository.go`**:
   - Menghilangkan query berantai `Translation + Ayahs (m2m) + Ayahs.Translation + Ayahs.Surah + Ayahs.Surah.Translation`.
   - Single joined query pada `asbabunNuzulSelectSQL` dengan aggregasi `Ayahs` slice via `seenAyahs` map.
6. **`jarh_tadil_repository.go`**:
   - Menghilangkan 3 query berantai `Perawi + Penilai + Translation`.
   - Single joined query pada `jarhTadilSelectSQL` dengan scan `scanJarhTadilRow`.
7. **`perawi_repository.go`**:
   - Menghilangkan query berantai `Translation + JarhTadil + JarhTadil.Penilai + JarhTadil.Translation + Guru (m2m) + Murid (m2m)`.
   - Native SQL untuk `FindByID`, `FindGuru`, `FindMurid` menggunakan `perawiSelectSQL` + `jarhTadilSelectSQL` + join table.
8. **`fiqh_repository.go`**:
   - Menghilangkan query berantai `Category.Translation + Items + Items.Translation + Items.Category`.
   - Single joined query pada `fiqhCategorySelectSQL`, `fiqhItemSelectSQL`, `fiqhItemWithCategorySelectSQL` dengan scan `scanFiqhCategoryRow` / `scanFiqhItemRow`.

---

## Verifikasi Test
- `go test ./app/repository/...` — PASS (All 8 benchmark tests + unit tests)
- `go test ./app/services/...` — PASS
- `go test ./app/controllers/...` — PASS