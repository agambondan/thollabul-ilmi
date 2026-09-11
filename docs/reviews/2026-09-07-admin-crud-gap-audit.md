# Audit Gap CRUD Admin untuk Data Dinamis

Status: `IN_PROGRESS` (Gelombang 1, 2 & 3 selesai, lihat Todo Implementasi)
Tanggal: `2026-09-07`

## Ringkasan

Beberapa fitur sudah memakai data dari backend/DB, tetapi belum semuanya punya
halaman CRUD di `/admin`. Audit ini memisahkan antara:

- data dinamis dengan admin UI sudah tersedia,
- data dinamis tanpa admin UI,
- data user-generated yang memang tidak perlu admin CRUD konten penuh.

Referensi utama:

- Admin navigation: `apps/web/src/app/admin/layout.js:42`
- API routes: `services/api/app/http/routes.go:251`
- Static seed awal: `services/api/data/static/`

## Sudah Ada Admin UI

| Fitur             | Admin route            |
| ----------------- | ---------------------- |
| Blog              | `/admin/blog`          |
| Library           | `/admin/library`       |
| Kajian            | `/admin/kajian`        |
| Siroh             | `/admin/siroh`         |
| Sejarah           | `/admin/sejarah`       |
| Asbabun Nuzul     | `/admin/asbabun-nuzul` |
| Reminder Carousel | `/admin/reminders`     |
| Modul Belajar     | `/admin/lessons`       |
| Fiqh              | `/admin/fiqh`          |
| Doa               | `/admin/doa`           |
| Dzikir            | `/admin/dzikir`        |
| Wirid             | `/admin/wirid`         |
| Asmaul Husna      | `/admin/asmaul-husna`  |
| Manasik           | `/admin/manasik`       |
| Kamus             | `/admin/kamus`         |
| Quiz              | `/admin/quiz`          |
| Users             | `/admin/users`         |
| Push Notification | `/admin/push`          |
| Laporan Koreksi   | `/admin/reports`       |
| Audit Log Dalil   | `/admin/audit-logs`    |

## Gap Prioritas

### P0 — Konten tampil ke user, DB-backed, belum ada write API/admin UI

**Selesai (diverifikasi ulang 2026-09-11 terhadap kode):** ketiga baris di
bawah sudah punya write API + halaman `/admin` + link nav (Gelombang 1 & 2
di Todo Implementasi). Tabel di bawah adalah arsip gap yang tadinya ada —
jangan jadikan acuan status terkini.

| Fitur              | Seed/model                         | Endpoint publik              | Catatan                                                                                         |
| ------------------ | ---------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------- |
| Panduan Sholat     | `sholat_guide.json`, `SholatGuide` | `GET /api/v1/panduan-sholat` | Sudah ada `/admin/panduan-sholat` + `POST/PUT/DELETE /panduan-sholat`. |
| Achievements       | `achievement.json`, `Achievement`  | `GET /api/v1/achievements`   | Sudah ada `/admin/achievements` + `POST/PUT/DELETE /achievements`. |
| Amalan master item | `amalan_item.json`, `AmalanItem`   | `GET /api/v1/amalan`         | Sudah ada `/admin/amalan` + `POST/PUT/DELETE /amalan/items`. |

### P1 — Write API sudah ada, admin UI belum ada

| Fitur                                      | Endpoint write                               | Catatan                                                                          |
| ------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------- |
| Quran core: ayah/surah/juz                 | `/ayah`, `/surah`, `/juz`                    | Admin API ada. UI belum ada, tapi risiko edit tinggi karena data Quran sensitif. |
| Hadith core: books/themes/chapters/hadiths | `/books`, `/themes`, `/chapters`, `/hadiths` | Admin API ada. UI belum ada.                                                     |
| Ilmu Rijal: perawi                         | `/perawi`                                    | **Selesai (2026-09-11)**: `/admin/perawi`. Sempat ada bug field `biografis` tidak pernah ter-serialize (`json:"-"`) — sudah diperbaiki, plus opsi dropdown status/tabaqah disamakan dengan enum backend. |
| Jarh wa Ta'dil                             | `/jarh-tadil`                                | **Selesai (2026-09-11)**: `/admin/jarh-tadil`. Sama seperti perawi, field `teks_nilai`/`catatan` sempat tidak ter-serialize — sudah diperbaiki. |
| Sanad & mata sanad                         | `/sanad`, `/mata-sanad`                      | **Selesai (2026-09-11)**: `/admin/sanad`. Halaman sudah ada sebelumnya tapi rusak total (`list()` salah endpoint, backend belum punya `GET /sanad`) — sudah ditambah endpoint list + editor mata sanad nested. |
| Takhrij                                    | `/takhrij`                                   | **Selesai (2026-09-11)**: `/admin/takhrij` (baru).                              |
| Hadith-Ayah cross-reference                | `/hadith-ayahs`                              | **Selesai (2026-09-11)**: `/admin/hadith-ayah` (baru). Backend ditambah `GET /hadith-ayahs` (list), `GET /hadith-ayahs/:id`, `PUT /hadith-ayahs/:id` yang sebelumnya belum ada. |
| Munasabah                                  | `/munasabah`                                 | Admin API ada. Belum ada UI.                                                     |
| Tokoh Tarikh                               | `/tokoh-tarikh`                              | Create/delete API ada. Belum ada UI; update API juga belum terlihat.             |
| Peta Islam / Locations                     | `/locations`                                 | Create/delete API ada. Belum ada UI; update API juga belum terlihat.             |
| Audio Murotal                              | `/audio/surah`, `/audio/ayah`                | Admin API ada. Belum ada UI.                                                     |
| Notification Templates                     | `/notification-templates`                    | Admin API ada. Belum ada UI.                                                     |

### P2 — Data dinamis, tapi CRUD admin penuh belum tentu perlu

| Fitur                                                           | Alasan                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Feed, forum, comments, komunitas chat                           | User-generated. Lebih butuh moderation queue daripada CRUD konten biasa.       |
| Bookmarks, notes, goals, muhasabah, tilawah, hafalan, murojaah  | Data personal user. Admin CRUD bukan prioritas.                                |
| Dzikir log, sholat tracker, zakat/faraidh history, adzan sounds | Data personal/transaksional. Admin CRUD penuh berisiko.                        |
| Jadwal sholat, imsakiyah, kiblat, hijri                         | Data dihitung/service, bukan konten seed biasa.                                |
| Mufrodat, tafsir                                                | Perlu audit terpisah karena sumber/model tidak masuk daftar static seed utama. |

## Todo Implementasi

### Gelombang 1 — Dampak konten tinggi, diff kecil

- [x] Tambah CRUD API `panduan-sholat`.
- [x] Tambah halaman `/admin/panduan-sholat`.
- [x] Tambah link Panduan Sholat di grup Worship admin nav.
- [x] Pastikan field `arabic`, `transliteration`, `translation_text`, `description`, `source`, `notes`, `step` bisa diedit.
- [x] Tambah validasi step unik dan reorder sederhana.
- [x] Tambah audit log saat panduan sholat diubah.

### Gelombang 2 — Master data ringan

- [x] Tambah CRUD API/admin untuk `achievements`.
- [x] Tambah CRUD API/admin untuk master `amalan` item.
- [x] Tambah filter kategori/status aktif untuk amalan.

### Gelombang 3 — Hadith/Rijal editor

- [x] Buat `/admin/perawi`. Plus fix bug: `Perawi.Biografis` punya tag
      `json:"-"` di `model/perawi.go` — field tidak pernah ter-serialize ke
      response publik maupun tersimpan lewat form admin. Sudah diperbaiki
      jadi `json:"biografis,omitempty"`. Opsi dropdown status/tabaqah juga
      disamakan dengan konstanta `PerawiStatus`/`PerawiTabaqah` yang asli.
- [x] Buat `/admin/jarh-tadil`. Bug serupa: `TeksNilai` & `Catatan` di
      `model/jarh_tadil.go` juga `json:"-"` — sudah diperbaiki.
- [x] Buat `/admin/sanad` dengan editor mata sanad. Halaman lama sudah ada
      tapi rusak (`adminSanadApi.list()` memanggil endpoint yang salah,
      backend belum punya `GET /sanad`) — ditambah `FindAll` di
      repository/service/controller/route Sanad, endpoint list diperbaiki,
      dan `MataSanadEditor` (baru) disisipkan lewat prop `renderExtra` baru
      di `GenericAdminCRUD` (backward-compatible, opsional).
- [x] Buat `/admin/takhrij`. Backend sudah full CRUD sebelumnya, tinggal
      halaman + `adminTakhrijApi`.
- [x] Buat UI relasi `hadith-ayahs`. Backend sebelumnya cuma create+delete —
      ditambah `FindAll`, `FindByID`, `Update` di repository/service/
      controller + route `GET/PUT /hadith-ayahs`.
- [ ] Tambah guardrails data integrity untuk sanad/perawi. **Di-skip**:
      guardrail relasi guru/murid perawi tidak actionable karena belum ada
      endpoint TULIS untuk relasi itu sama sekali (`/perawi/:id/guru` &
      `/perawi/:id/murid` cuma `GET`) — menambah fitur kelola guru/murid di
      luar scope gelombang ini. Satu guardrail ringan yang masuk akal (warning
      urutan duplikat dalam satu sanad) sudah ditambahkan di sisi UI
      `MataSanadEditor` (bukan blocking, karena tidak ada unique constraint
      di DB untuk itu).

Diverifikasi: `go build ./...` & `go vet ./...` bersih, `next build` bersih,
smoke test manual via curl (create/read/update/delete) untuk `/sanad`,
`/mata-sanad`, `/takhrij`, `/hadith-ayahs` dengan akun admin uji lokal — data
uji sudah dibersihkan sesudahnya. Belum sempat click-through di browser
sungguhan (server dev lokal shared dengan sesi lain, cek dulu sebelum
dianggap final secara UX).

### Gelombang 4 — Quran/Hadith core editor

- [ ] Evaluasi apakah Quran core perlu admin UI atau hanya correction workflow.
- [ ] Jika perlu, buat editor read-heavy dengan confirmation kuat untuk ayah/surah/juz.
- [ ] Buat editor books/themes/chapters/hadiths.
- [ ] Tambah diff preview sebelum menyimpan konten agama sensitif.

### Gelombang 5 — Konten pelengkap

- [ ] Tambah UI admin `munasabah`.
- [ ] Tambah UI admin `tokoh-tarikh`.
- [ ] Lengkapi update API untuk `tokoh-tarikh` bila belum ada.
- [ ] Tambah UI admin `locations`.
- [ ] Lengkapi update API untuk `locations` bila belum ada.
- [ ] Tambah UI admin `audio`.
- [ ] Tambah UI admin `notification-templates`.

## Catatan Keputusan

Prioritas pertama sebaiknya `panduan-sholat`, bukan bikin semua CRUD sekaligus.
Alasannya sudah ada kebutuhan nyata, payload kecil, dan risiko implementasi rendah.
