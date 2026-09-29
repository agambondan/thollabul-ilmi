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
| **Takhrij** (`FindByHadithID`) | GORM Preload | 627,600 ns | 95,220 B | 1,773 | Baseline |
| | **Native RawScan** | **359,684 ns** | **67,304 B** | **2,477** | **1.8x lebih cepat (-30% RAM)** |
| **Siroh** (`FindCategoryBySlug`) | GORM Preload | 1,753,056 ns | 89,150 B | 1,656 | Baseline |
| | **Native RawScan** | **305,716 ns** | **41,576 B** | **1,245** | **5.7x lebih cepat (-53% RAM)** |
| **History** (`FindAll`) | GORM Preload | 1,043,688 ns | 89,966 B | 1,871 | Baseline |
| | **Native RawScan** | **528,822 ns** | **42,448 B** | **1,425** | **2.0x lebih cepat (-53% RAM)** |
| **Tokoh Tarikh** (`FindAll`) | GORM Preload | 1,133,108 ns | 102,705 B | 2,122 | Baseline |
| | **Native RawScan** | **476,145 ns** | **54,520 B** | **1,704** | **2.4x lebih cepat (-47% RAM)** |
| **Sholat** (`FindAllGuides`) | GORM Preload | 511,790 ns | 75,347 B | 1,487 | Baseline |
| | **Native RawScan** | **247,386 ns** | **38,968 B** | **801** | **2.1x lebih cepat (-48% RAM)** |
| **Dictionary** (`FindAll`) | GORM Preload | 1,626,339 ns | 301,480 B | 5,850 | Baseline |
| | **Native RawScan** | **934,049 ns** | **189,232 B** | **3,484** | **1.7x lebih cepat (-37% RAM)** |
| **Asmaul Husna** (`FindAll`) | GORM Preload | 2,007,843 ns | 278,989 B | 5,875 | Baseline |
| | **Native RawScan** | **996,140 ns** | **183,064 B** | **3,641** | **2.0x lebih cepat (-34% RAM)** |
| **Amalan** (`FindHistory`) | GORM Preload | 685,449 ns | 100,353 B | 2,149 | Baseline |
| | **Native RawScan** | **326,971 ns** | **70,640 B** | **1,771** | **2.1x lebih cepat (-30% RAM)** |
| **Achievement** (`FindUserAchievements`) | GORM Preload | 255,609 ns | 69,721 B | 1,372 | Baseline |
| | **Native RawScan** | **192,766 ns** | **49,784 B** | **777** | **1.3x lebih cepat (-29% RAM)** |
| **Library Progress** (`FindByUserID`) | GORM Preload | 532,810 ns | 85,582 B | 2,123 | Baseline |
| | **Native RawScan** | **329,105 ns** | **46,687 B** | **1,126** | **1.6x lebih cepat (-45% RAM)** |

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
9. **`takhrij_repository.go`**:
   - Menghilangkan query berantai `Book + Book.Translation`.
   - Single joined query pada `takhrijSelectSQL` dengan scan `scanRow`.
10. **`siroh_repository.go`**:
    - Menghilangkan query berantai `Translation + Contents.Translation + Category.Translation`.
    - Single joined query pada `sirohCategorySelectSQL`, `sirohContentSelectSQL`, `sirohContentWithCategorySelectSQL`.
11. **`history_repository.go`**:
    - Menghilangkan query preload `Translation` pada setiap listing / detail.
    - Single joined query pada `historySelectSQL`.
12. **`tokoh_tarikh_repository.go`**:
    - Menghilangkan query preload `Translation` pada listing dan search.
    - Single joined query pada `tokohTarikhSelectSQL`.
13. **`hafalan_repository.go`**:
    - Menghilangkan preload `Surah + Surah.Translation` pada `FindByUserID` (**2.0x lebih cepat**, -34% memory).
    - Single joined query pada `hafalanSelectSQL`.
14. **`manasik_repository.go`**:
    - Menghilangkan preload `Translation` pada `FindAll`, `FindByType`, `FindByTypeAndStep` (**1.7x lebih cepat**, -24% memory).
    - Single joined query pada `manasikSelectSQL`.
15. **`lesson_repository.go`**:
    - Menghilangkan preload `Steps + RelatedBook` pada `FindAll`, `FindBySlug`, `FindByID`.
    - Single joined query `lesson_module + lesson_step + library_book`.
16. **`sanad_repository.go`**:
    - Menghilangkan preload `MataSanad + MataSanad.Perawi` pada `FindAll`, `FindByID`, `FindByHadithID`.
    - Single joined query `sanad + mata_sanad + perawi`.
17. **`content_report_repository.go`**:
    - Menghilangkan preload `User` pada `FindAll`, `FindByID`, `FindByUser`.
    - Single joined query `content_report + user`.
18. **`sholat_repository.go`**:
    - Menghilangkan preload `Translation` pada `FindAllGuides`, `FindGuideByStep`, `FindGuideByID` (**2.1x lebih cepat**, -48% memory).
    - Single joined query `sholat_guide + translation`.
19. **`dictionary_repository.go`**:
    - Menghilangkan preload `Translation` pada `FindAll`, `FindByTerm`, `FindByCategory`, `FindByID` (**1.7x lebih cepat**, -37% memory).
    - Single joined query `islamic_term + translation`.
20. **`asmaul_husna_repository.go`**:
    - Menghilangkan preload `Translation` pada `FindAll`, `FindByNumber`, `FindByID` (**2.0x lebih cepat**, -34% memory).
    - Single joined query `asma_ul_husna + translation`.
21. **`amalan_repository.go`**:
    - Menghilangkan preload `Translation` pada `FindItemByID` dan `AmalanItem` pada `FindHistory` (**2.1x lebih cepat**, -30% memory).
    - Single joined query `amalan_log + amalan_item + translation`.
22. **`hijri_repository.go`**:
    - Menghilangkan preload `Translation` pada `FindAll`, `FindByMonth`, `FindByID`.
    - Single joined query `islamic_event + translation`.
23. **`achievement_repository.go`**:
    - Menghilangkan preload `Achievement` pada `FindUserAchievements` (**1.3x lebih cepat**, -29% memory).
    - Single joined query `user_achievement + achievement`.
24. **`library_book_progress_repository.go`**:
    - Menghilangkan preload `Book` pada `FindByUserID`, `FindByUserIDAndBookID` (**1.6x lebih cepat**, -45% memory).
    - Single joined query `library_book_progress + library_book`.
25. **`content_audit_log_repository.go`**:
    - Menghilangkan preload `Modifier` pada `FindAll`.
    - Single joined query `content_audit_log + user`.
26. **`kajian_note_repository.go`**:
    - Menghilangkan preload `Kajian` pada `List`.
    - Single joined query `kajian_user_note + kajian`.
27. **`kajian_bookmark_repository.go`**:
    - Menghilangkan 4 query preload bertingkat `Chunk + Chunk.Kajian + Kajian` pada `ListByUser`.
    - Single joined query `kajian_user_bookmark + kajian_transcript + kajian`.
28. **`murojaah_repository.go`**:
    - Menghilangkan preload `Translation` pada `FindRandomAyahFromSurah`.
    - Single joined query `ayah + surah + translation`.
29. **`notification_repository.go`**:
    - Menghilangkan preload `User` pada `FindAllActivePushTokens`, `FindAllPushTokens`, `FindDue`.
    - Single joined query `push_token + user` dan `notification_setting + user`.

---

## Verifikasi Test
- `go test ./app/repository/...` — PASS (All 22 benchmark tests + unit tests)
- `go test ./app/services/...` — PASS
- `go test ./app/controllers/...` — PASS