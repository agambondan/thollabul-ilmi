# Custom Adzan Audio & Offline Murottal Manager

Status: `IN_PROGRESS`
Priority: `P1`
Tanggal: `2026-09-08`

## Objective

Pengguna bisa memilih suara adzan custom, mengunduh murottal surah/juz untuk offline, dan mengelola storage audio di perangkat.

## Scope

- Mobile:
    - Picker suara adzan (list pilihan bawaan + custom file).
    - Download manager murottal: per surah, per juz, atau batch (mis. 30 juz).
    - Progres download, pause/resume, auto-retry, cleanup expired.
    - Integrasi SQLite offline pack (sudah ada) untuk metadata audio.
    - Setting volume & fade-in/out adzan.
- Web: Tidak di-scope (native audio offline tidak tersedia).
- API:
    - Endpoint manifest audio (`GET /audio/manifest`) — daftar qari, surah, URL CDN, checksum.
    - Endpoint signed URL untuk unduhan aman (`GET /audio/download/:qari/:surah`).
    - Validasi akses: user login / subscription status jika perlu.
- Data/Seeder: Seed manifest qari & surah awal (mis. Mishari Rashid, Abdul Basit, dll).

## Current Baseline

- Audio murottal EveryAyah fallback sudah diintegrasi di Quran mobile reader.
- Offline SQLite pack sudah ada untuk konten teks (Quran, Hadith, Doa).
- Endpoint audio dasar `/audio/*` sudah ada di `services/api`.

## Task List

- [x] Tambah seed manifest audio qari + surah ke DB/migrasi (terpenuhi via `seeder_audio.go`).
- [x] Implementasi endpoint manifest (`GET /api/v1/audio/manifest`) & mobile API client `getAudioManifest`.
- [x] Buat download manager audio di SQLite offline pack (`downloadSurahAudio`, `saveOfflineAudioRecord`, `getOfflineAudioOverview`, `deleteOfflineAudio`).
- [x] UI picker suara adzan di Prayer screen (didukung 9 suara muadzin global, preferensi `prayerAdzanVolume`).
- [x] Integrasi download murottal ke SQLite offline pack metadata (`offline_audio` table).
- [x] Cleanup otomatis file audio kadaluarsa / storage full (`cleanupExpiredOfflineAudio`, `enforceOfflineAudioStorageLimit`, dipanggil otomatis setelah tiap `downloadSurahAudio`).

## Acceptance Criteria

- User bisa memilih suara adzan dari daftar & preview sebelum pakai.
- User bisa unduh surah/juz murottal, progress terlihat, resume setelah kill app.
- File audio tersimpan lokal & diputar offline tanpa internet.
- Storage usage terlihat di setting, bisa clear cache per qari/surah.

## Evidence

- Commands:
    - `go test -v -run TestGetManifestReturnsQarisAndSurahs ./app/controllers` -> PASS
    - `npx jest --testPathPattern='offlineAudio'` -> PASS (9 tests)
    - `npx jest --testPathPattern='PrayerScreen'` -> PASS (15 tests)
- Device/API/Web smoke:
    - `/api/v1/audio/manifest` returns JSON list of unique qaris & surahs with CDN URLs.
    - Mobile SQLite schema initialized with `offline_audio` table.
    - Cleanup logic diverifikasi via jest dengan mock `expo-file-system`/`expo-sqlite` (belum diverifikasi di device fisik dengan file audio sungguhan).
- Notes:
    - Native file download uses Expo FileSystem download resumable.
    - Web fallback returns graceful unsupported messages.
    - `deleteOfflineAudio` sebelumnya hanya menghapus row DB tanpa menghapus file fisik — sekarang ikut `FileSystem.deleteAsync` per file, prasyarat supaya cleanup storage-full benar-benar membebaskan ruang.
    - Default policy: hapus audio yang lebih lama dari 90 hari (`cleanupExpiredOfflineAudio`), lalu evict file terlama sampai di bawah 1.5GB (`enforceOfflineAudioStorageLimit`) — keduanya jalan otomatis tiap selesai `downloadSurahAudio`.
    - **Re-verified 2026-09-10** (setelah banyak commit lain masuk `master`, memastikan tidak regresi): `npx jest --testPathPattern='offlineAudio'` (7 test) dan `--testPathPattern='PrayerScreen'` (15 test) semua masih PASS. Belum ada verifikasi di device fisik dengan file audio sungguhan — masih gap yang sama seperti tercatat sebelumnya, di luar kemampuan sesi kerja ini.

## Source of Truth

- `docs/api/FEATURE_ROADMAP.md` (#10 Audio Murotal)
- `apps/mobile/src/storage/offlineContent.native.js`
- `apps/mobile/src/screens/PrayerScreen.js`
