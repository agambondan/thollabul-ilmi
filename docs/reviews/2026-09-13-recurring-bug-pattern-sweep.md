# Sweep: 3 Recurring Bug Classes Ditemukan Ulang Hari Ini

Tanggal: `2026-09-13`
Scope: `services/api/app/model/*.go` (Pattern 1 & 2), `apps/web/src` + `apps/mobile/src`
(Pattern 3)
Status: `SELESAI` — 4 bug baru diperbaiki (Pattern 1), Pattern 2 & 3 nihil temuan baru
setelah verifikasi menyeluruh

Retry bersih dari task sweep yang sebelumnya crash karena timeout infrastruktur (bukan
masalah logic). Konteks: hari ini beberapa sesi lain masing-masing menemukan dan
memperbaiki 3 kelas bug berulang di file berbeda —
`NotificationSetting.IsActive` (GORM default+bool+upsert),
`HadithAyah.Hadith`/`.Ayah` (`gorm:"-"` yang tetap di-`Preload()`), dan
`SearchClient.js`/`QuizContent.js` (key mismatch FE/BE). Task ini adalah sweep sistematis:
apakah ada instance LAIN dari masing-masing kelas bug tersebut.

## Pattern 1 — `gorm:"default:..."` pada bool + upsert/Create

Gejala: GORM memperlakukan field bool ber-tag `default:` yang bernilai `false` (zero-value)
sebagai "tidak diisi" dan mengecualikannya dari INSERT — default kolom di DB menang,
`false` eksplisit dari caller hilang tanpa error.

`grep -rn 'gorm:"[^"]*default:' services/api/app/model/*.go` menemukan puluhan field
ber-`default:`, tapi hanya field **bool dengan `default:true`** yang berisiko (bool
`default:false` — zero value == default, tidak pernah bug; tipe non-bool di luar scope task
ini). Dicek satu per satu: apakah field itu ditulis lewat `.Create()`/`.Save()`/OnConflict,
dan apakah ada jalur caller yang secara sah ingin mengirim `false` eksplisit.

### Diperbaiki (4 file)

| Field | File | Bukti caller bisa kirim `false` eksplisit |
| --- | --- | --- |
| `Masjid.IsActive` | `app/model/masjid.go` | Form admin `/admin/masjid` (`apps/web/src/app/admin/masjid/page.js`) punya checkbox "Aktif (tampil di publik)"; `GenericAdminCRUD` (`EMPTY_FORM`) meng-inisialisasi field boolean baru ke `false` — jadi record baru **selalu** berakhir aktif regardless kondisi checkbox, sebelum fix ini |
| `RadioIslamic.IsActive` | `app/model/masjid.go` | Sama persis: form admin `/admin/radio-islamic` punya checkbox `is_active`, jalur `Save()` → `.Create()` sama |
| `KalkulasiZakat.Haul` | `app/model/kalkulasi_zakat.go` | Checkbox "haul" di kalkulator zakat (`apps/web/src/app/zakat/page.js` line 234, dan native mobile `WebAppZakatRoute.js`) selalu ikut dikirim eksplisit di payload `haul: haulVal` |
| `Muhasabah.IsPrivate` | `app/model/muhasabah.go` | Field publik di `CreateMuhasabahRequest.is_private`; API contract mengizinkan caller mana pun set `false` eksplisit |

Fix: hapus tag `default:true`/`default:...;index` → jadi `gorm:"type:boolean;index"` (masjid/
radio) atau tanpa tag gorm sama sekali (zakat/muhasabah), mengikuti pola persis fix
`NotificationSetting.IsActive` sebelumnya. Tidak perlu ubah request DTO ke pointer karena
semua caller yang teridentifikasi sudah selalu mengirim key tsb eksplisit (lihat nuansa di
bawah).

**Catatan penting soal dampak nyata (bukan cuma teoretis):**

- **Masjid & RadioIslamic**: bug ini **aktif reachable** via admin panel hari ini — setiap
  masjid/radio baru yang dibuat lewat form admin **selalu berakhir aktif** walau admin
  uncheck "Aktif" (karena form default checkbox baru = `false`, lalu di-drop oleh bug, DB
  default `true` menang). Setelah fix ini, checkbox sekarang benar-benar dihormati — efek
  sampingnya: admin yang terbiasa masjid baru otomatis publik sekarang **harus eksplisit
  centang "Aktif"** kalau memang ingin publik. Ini bukan regresi, tapi perubahan perilaku yang
  perlu diketahui admin — sengaja tidak diperbaiki dengan mengubah default form
  (`GenericAdminCRUD.EMPTY_FORM`) karena itu komponen shared dipakai banyak resource admin
  lain dan di luar scope kelas bug ini.
- **KalkulasiZakat.Haul**: bug ini **tidak actually pernah termanifestasi lewat UI** — baik
  web (`zakat/page.js`) maupun native mobile (`WebAppZakatRoute.js`) menghitung
  `zakatMaal/zakatTrade/zakatGold = 0` ketika `haul === false`, dan tombol "Simpan" hanya
  muncul saat hasil `> 0` — jadi tombol simpan tersembunyi total saat haul dicentang off.
  Diperbaiki tetap karena ini bug nyata di level API contract (request/model), berisiko untuk
  konsumen API lain (mobile lain, direct API call, atau kalau UI berubah nanti).
- **Muhasabah.IsPrivate**: satu-satunya caller yang teridentifikasi
  (`apps/web/src/lib/personalSync.js` → `muhasabahCreatePayload`/`muhasabahUpdatePayload`)
  selalu mengirim `is_private: true` hardcoded — jadi fix ini **tidak mengubah perilaku
  observable apa pun hari ini**, murni menutup celah untuk API consumer masa depan yang
  mungkin mengekspos toggle privasi.

### Bukan match (bool `default:true` lain)

- `PerawiKatalog.TahunHijri *bool default:true` — pointer, bukan `bool` biasa. Zero value
  pointer adalah `nil`, bukan `false`, jadi eksplisit `false` (via `&false`) tidak pernah
  ke-treat sebagai "tidak diisi". Tidak match.
- `PushToken.IsActive default:true` — sudah dicek di fix sebelumnya (adzan opt-out review):
  repo selalu set `token.IsActive = true` eksplisit di jalur Create, dan update-nya pakai
  `.Update("is_active", false)` langsung (bukan Create+OnConflict), jadi tidak kena bug ini.
- `DailyReminder.IsActive default:true` — repo `Create()` (`app/repository/daily_reminder_repository.go`)
  sudah menghandle ini dengan benar: pakai `db.Select("*").Create(item)` (`Select("*")`
  memaksa semua kolom masuk regardless zero-value) DITAMBAH fallback `Update("is_active",
  false)` kalau `requestedActive` awalnya `false`. Sudah correct/over-engineered, bukan bug.
- Field non-bool ber-`default:` (string/int/float, mis. `DefaultLanguage`, `Rate`,
  `Difficulty`, status enum string) — di luar scope task ini per instruksi (fokus bool), dan
  polanya beda karena zero-value string/int (`""`/`0`) biasanya bukan nilai yang sah user
  ingin submit eksplisit untuk field-field tsb.

## Pattern 2 — `gorm:"-"` yang tetap kena `.Preload()`

`grep -rln 'gorm:"-"' app/model/*.go` → 7 file: `bookmark.go`, `surah.go`, `book.go`,
`content_embedding.go`, `comment.go`, `forum.go`, `theme.go`. Field ter-ignore:
`Bookmark.Ayah/.Hadith/.LibraryBook`, `Surah.NextSurah/.PrevSurah`, `Book.Count/.Theme`,
`Theme.Book`, `Comment.Username`, `ForumQuestion.User/.Answers`, `ForumAnswer.User/.Question`,
`ContentEmbedding.Similarity`.

Di-cross-check ke semua `.Preload(...)` call di `app/repository/*.go`: **tidak ada satu pun**
yang menarget nama field-field di atas. Catatan khusus: `Book`/`Theme` punya pasangan field
membingungkan (`Themes []Theme` relasi many2many asli vs `Theme []Theme gorm:"-"` field
manual — mirip persis pola `HadithAyah` yang kena bug kemarin), tapi semua `Preload()` yang
ada memakai nama jamak (`"Themes.Translation"`, dst.) yang memang relasi asli, bukan field
ignore-nya. `Preload("Book")` yang ditemukan di `search_repository.go`,
`library_book_progress_repository.go`, `takhrij_repository.go` menarget field `Book` di
struct LAIN (`Takhrij.Book`, `LibraryBookProgress.Book`) yang relasinya nyata
(`gorm:"foreignKey:..."`), bukan field ignore milik struct `Book`/`Theme` itu sendiri. Tidak
ada match baru untuk Pattern 2.

## Pattern 3 — FE/BE key mismatch di payload submit/merge

Diperiksa sistematis: semua fungsi POST/PUT di `apps/web/src/lib/api.js` yang membangun body
dari state lokal, plus caller-nya di komponen (goal, muhasabah, zakat, tilawah, hafalan,
lesson progress) — dibandingkan field-by-field ke `json:"..."` tag DTO Go terkait. Semua
cocok:

- `tilawahApi.add` → `{date, pages_read, juz_read, note}` ↔ `CreateTilawahRequest` — match
- `lessonsApi.saveProgress` → `{module_id, step, done}` ↔ `SaveLessonProgressRequest` — match
- `goalsApi` via `personalSync.js` (`goalCreatePayload`/`goalUpdatePayload`) →
  `{title, target, type, start_date, end_date, description, progress, is_completed}` ↔
  `CreateGoalRequest`/`UpdateGoalRequest` — match, meski nama field state lokal (`current`,
  `unit`, `deadline`, `category`, `completed`) beda total dari nama field API; transform
  layer-nya benar
- `hafalanApi.update` → `{status}` ↔ `UpdateHafalanRequest` — match

Mobile (`apps/mobile/src/api/client.js`, `api/personal.js`, `api/social.js`, `api/forum.js`)
**belum pernah dicek untuk pola ini** — jadi jadi fokus utama tambahan di sweep ini. Semua
fungsi submit yang membangun payload dari local state diverifikasi ke DTO Go:

| Fungsi mobile | Payload | DTO Go | Hasil |
| --- | --- | --- | --- |
| `saveQuranProgress` | `surah_number, ayah_number, ayah_id` | `UpdateQuranProgressRequest` | match |
| `saveLibraryProgress` | `current_page, note, status` | `UpdateLibraryBookProgressRequest` | match |
| `savePrayerLog` | `date, prayer, status` | `LogSholatRequest` | match |
| `createNote`/`updateNote` | `ref_type, ref_id, content` | `CreateNoteRequest`/`UpdateNoteRequest` | match |
| `saveNotificationSettings` | `settings[].{is_active,time,type}` | `NotificationSettingRequest` | match |
| `registerPushToken` | `device_id, platform, provider, token` | `PushTokenRegisterRequest` | match |
| `saveMurojaahResult` | `surah_id, from_ayah, to_ayah, score, duration_seconds, note` | `RecordMurojaahRequest` | match |
| `createComment` | `content, parent_id, ref_id, ref_type` | `CreateCommentRequest` | match |
| `voteForum` | `target_type, target_id, value` | `VoteRequest` | match |
| `createUserWird`/`updateUserWird` (payload dibangun di `ExploreScreen.js`) | `title, arabic, count, note, occasion, source, translation, transliteration` | `CreateUserWirdRequest`/`UpdateUserWirdRequest` | match |
| `saveFaraidh` (payload di `WebAppFaraidhRoute.js`) | `debt, funeral, will` | `CreateSimpanFaraidhRequest` | match |
| `saveKalkulasiZakat` (payload di `WebAppZakatRoute.js`, native reimplementation kalkulator zakat, bukan webview) | `jenis, nama_jenis, jumlah_zakat, nilai_harta, nisab, rate, haul, catatan` | `CreateKalkulasiZakatRequest` | match |

Tidak ditemukan mismatch baru di web maupun mobile. `kajian/TranscriptSearchView.js` dan
`SavedNotesView.js` (kandidat pola merge/akumulasi ala `SearchClient.js`) dicek juga — tidak
ada logic merge kategori/pagination dengan pola cek-key seperti bug `SearchClient.js`, domain
datanya beda (transkrip kajian, bukan hasil pencarian multi-kategori).

## Verifikasi

```
cd services/api
gofmt -l app/model/masjid.go app/model/kalkulasi_zakat.go app/model/muhasabah.go
# kosong (bersih)
go build ./...   # lulus, tanpa output
go vet ./...     # lulus, tanpa output
go test ./...    # semua package PASS
```

Tidak ada perubahan JS/mobile (Pattern 3 nihil temuan baru), jadi tidak ada
`eslint` yang perlu dijalankan.

## File yang di-skip (sudah dirty dari sesi lain, sesuai instruksi)

`apps/web/src/components/QuizContent.js`,
`services/api/app/controllers/page_view_controller.go`,
`services/api/app/repository/note_repository.go`,
`services/api/app/services/note_service.go` — tidak disentuh sama sekali.

## Yang Perlu Diketahui Agent Lain

- Field bool ber-`default:true` yang ditulis lewat `.Create()`/`.Save()`/OnConflict sekarang
  tinggal `PerawiKatalog.TahunHijri` (pointer, aman) dan `PushToken.IsActive`/
  `DailyReminder.IsActive` (sudah dikonfirmasi aman di repo masing-masing, jangan diutak-atik
  tanpa alasan baru).
- Kalau menambah field bool baru dengan makna "opt-out"/"nonaktifkan" yang ditulis lewat
  `Create`/OnConflict, jangan pakai tag `gorm:"default:true"` — pola gotcha ini sudah muncul 5x
  (notification, masjid, radio-islamic, zakat, muhasabah) di codebase ini.
- Admin masjid & radio-islamic: setelah fix ini, record baru default **tidak aktif** kecuali
  admin eksplisit centang "Aktif" di form create — beda dari perilaku sebelumnya (selalu aktif
  akibat bug). Perlu disosialisasikan ke admin/tim konten kalau ada laporan "masjid baru kok
  gak muncul".
