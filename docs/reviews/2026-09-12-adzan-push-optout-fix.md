# Fix: Push Adzan Tidak Menghormati Toggle Off User

Tanggal: `2026-09-12`
Scope: `services/api/app/services/notification_service.go` (`DispatchDueAdzanPush`),
`services/api/app/repository/notification_repository.go` (`FindDisabledUserIDs`, `UpsertMany`),
`services/api/app/model/notification.go` (`NotificationSetting.IsActive`)
Status: `SELESAI` — build, vet, gofmt, dan test lulus

Dipicu temuan audit sebelumnya (`docs/features/progress/2026-09-08-server-push-notifications.md`
+ review lanjutannya): dispatcher push adzan mengirim ke SEMUA push token aktif tanpa mengecek
apakah user yang bersangkutan sudah mematikan notifikasi adzan di preferensinya. Toggle off di UI
tidak benar-benar menghentikan server mengirim push.

## Root Cause — Dua Bug, Bukan Satu

### Bug 1: `DispatchDueAdzanPush` tidak pernah membaca `NotificationSetting`

`DispatchDueAdzanPush` (services/api/app/services/notification_service.go) mengambil daftar token
lewat `s.repo.FindAllActivePushTokens()` — semua `PushToken` aktif lintas user — lalu loop
langsung mengirim push tanpa pernah menyentuh tabel `notification_setting` sama sekali.

Bandingkan dengan `DispatchDueReminders` (dipakai untuk `daily_quran`/`daily_hadith`/`doa`), yang
sumber datanya adalah `s.repo.FindDue(now)` — query itu sendiri sudah memfilter
`WHERE is_active = true`, jadi setting yang di-nonaktifkan otomatis tidak pernah muncul di hasil.
Pola "cek setting sebelum kirim" untuk reminder biasa sebenarnya implisit di query repository, dan
`DispatchDueAdzanPush` tidak punya query setara karena sumber datanya token, bukan setting (adzan
butuh hitung waktu sholat per lokasi token, beda arsitektur dari reminder terjadwal).

### Bug 2 (lebih dalam, baru ketemu saat verifikasi): `is_active=false` tidak pernah tersimpan

Field `NotificationSetting.IsActive` punya tag `gorm:"default:true"`. `UpsertSettings` ->
`repo.UpsertMany` memakai `db.Clauses(clause.OnConflict{...}).Create(&settings)`. GORM
memperlakukan field bool dengan tag `default:...` yang bernilai zero-value (`false`) sebagai
"tidak diisi", lalu **mengecualikannya sepenuhnya dari daftar kolom INSERT** — baik saat insert
baris baru maupun saat masuk jalur `ON CONFLICT DO UPDATE` (karena `excluded.is_active` merujuk ke
kolom yang memang tidak pernah dikirim di statement INSERT, sehingga ikut memakai default kolom).

Dibuktikan lewat test manual (sqlite in-memory, dibuang setelah verifikasi):

```go
repo.UpsertMany([]model.NotificationSetting{
    {UserID: u1, Type: model.NotificationTypeAdzan, Time: "04:30", IsActive: false},
})
// hasil: IsActive tersimpan sebagai TRUE, bukan FALSE
```

Dicoba juga eksplisit `Select("IsActive")` sebelum `Create` — tetap tidak membantu, karena GORM
mengecualikan field ber-default berdasarkan *value* (zero atau bukan), bukan berdasarkan apakah
field itu ada di daftar `Select`.

Artinya: **sebelum fix ini, toggle-off untuk SEMUA tipe notifikasi** (`adzan`, `daily_quran`,
`daily_hadith`, `doa`, `streak_risk`) **tidak pernah benar-benar persisten** — bukan cuma adzan.
Untuk `daily_quran`/`daily_hadith`/`doa`, dampaknya sama: baris `is_active` selalu ke-flip balik ke
`true` di database walau user memilih mematikannya, sehingga `FindDue` tetap menganggapnya aktif.
Bug ini konsisten dengan gejala yang dilaporkan tapi lebih luas dari yang diduga awal (khusus
adzan) — akar masalahnya di layer persistence yang dipakai bersama semua tipe.

## Fix

1. **`app/model/notification.go`** — hapus tag `gorm:"default:true"` dari
   `NotificationSetting.IsActive`. Tidak dibutuhkan: `UpsertSettings` sudah menghitung default
   `true` sendiri di level aplikasi (`active := true; if setting.IsActive != nil { active =
   *setting.IsActive }`) sebelum memanggil repository, jadi default di level DB redundan dan
   di sinilah letak bug-nya. Field lain yang mirip (`PushToken.IsActive` dkk.) sengaja **tidak**
   disentuh — field itu tidak pernah ditulis lewat jalur `Create`+`OnConflict` seperti ini
   (`PushToken.IsActive` di-update lewat `.Update("is_active", false)` langsung), jadi tidak
   terpengaruh bug yang sama dan di luar scope task ini.

2. **`app/repository/notification_repository.go`** — tambah method baru
   `FindDisabledUserIDs(notifType model.NotificationType) ([]uuid.UUID, error)` yang mengambil
   `user_id` dari baris `notification_setting` dengan `type = ? AND is_active = false`. User yang
   belum pernah menyentuh setting adzan sama sekali (tidak ada baris) dianggap default aktif —
   konsisten dengan perilaku sebelumnya untuk user yang belum pernah membuka pengaturan.

3. **`app/services/notification_service.go`** — di `DispatchDueAdzanPush`, setelah mengambil
   `tokens`, ambil juga `disabledUserIDs` lewat method baru di atas, bentuk jadi `map[uuid.UUID]bool`,
   lalu skip token yang `UserID`-nya ada di map tersebut sebelum menghitung waktu sholat / mengirim
   push — mengikuti pola early-`continue` yang sudah dipakai di loop yang sama untuk
   `!token.IsActive`.

Perubahan sengaja minimal: tidak menyentuh `DispatchDueReminders` (sudah benar via `FindDue`),
tidak refactor arsitektur token-vs-setting adzan, dan tidak menyentuh field `default:true` lain di
model-model yang tidak terlibat.

## Test

- `services/api/app/repository/notification_repository_test.go` —
  `TestFindDisabledUserIDsReturnsOnlyExplicitOptOuts`: seed 1 user opt-out adzan, 1 user opt-in
  adzan, 1 user opt-out tipe lain (`doa`); pastikan hanya user opt-out adzan yang balik dari
  `FindDisabledUserIDs(NotificationTypeAdzan)`. Test ini juga tidak akan lulus tanpa fix bug #2 di
  atas (baris `is_active=false` tidak akan pernah ke-seed dengan benar).
- `services/api/app/services/notification_push_test.go` —
  `TestDispatchDueAdzanPushSkipsUsersWhoDisabledAdzan`: dua user dengan token expo aktif, satu di
  antaranya ada di `disabledUserIDs`; `fakePrayerTimesService` baru dibuat supaya setiap panggilan
  `GetByDate` selalu match Dhuhr dengan waktu saat ini (menghindari ketergantungan pada kalkulasi
  waktu sholat asli/lokasi). Assert hanya user yang tidak disabled yang menerima payload push.
- Fake repo (`fakeNotificationRepo`) diupdate: tambah field `disabledUserIDs` + implementasi method
  baru, dan `FindActivePushTokens` diperbaiki supaya benar-benar memfilter per `userID` (sebelumnya
  mengembalikan semua token tanpa filter — cukup untuk test lama yang cuma pakai 1 token/1 user,
  tapi jadi tidak representatif begitu test baru punya 2 user berbeda).

## Verifikasi

```
cd services/api
gofmt -l app/model/notification.go app/repository/notification_repository.go \
  app/repository/notification_repository_test.go app/services/notification_service.go \
  app/services/notification_push_test.go
# kosong (bersih)

go build ./...      # lulus, tanpa output
go vet ./...         # lulus, tanpa output
go test ./app/services/... ./app/repository/...   # ok, semua PASS
```

## Yang Perlu Diketahui Agent Lain

- Kalau ke depan ada tipe notifikasi baru yang pakai `NotificationSetting`/`UpsertMany`, tag
  `gorm:"default:true"` sudah dihapus dari `IsActive` — jangan tambahkan lagi tag `default:...`
  pada field bool yang ditulis lewat `Create`+`OnConflict` kalau nilai `false` harus bisa persisten;
  ini gotcha umum GORM (field ber-default dengan zero-value dianggap "tidak diisi" dan dikecualikan
  dari daftar kolom INSERT, termasuk di jalur `ON CONFLICT DO UPDATE`).
- Kolom `is_active` di tabel `notification_setting` yang sudah ada di database production mungkin
  masih punya constraint `DEFAULT true` di level kolom (dari migrasi lama) — itu tidak masalah,
  karena setelah fix ini GORM selalu mengirim nilai eksplisit di setiap INSERT, jadi default kolom
  itu tidak akan pernah lagi terpakai. `AutoMigrate` berikutnya kemungkinan akan menyesuaikan
  constraint tersebut juga.
