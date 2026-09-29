# Play Console — Data Safety Questionnaire Guide

Panduan pengisian form **Data Safety** di Google Play Console untuk **Thullaabul Ilmi**.

---

## 1. Overview Pertanyaan Awal

| Pertanyaan | Jawaban | Keterangan |
|------------|---------|------------|
| Apakah aplikasi mengumpulkan atau membagikan data pengguna? | **Yes** | Karena ada login (email), lokasi (sholat), dan notifikasi |
| Apakah semua data yang dikumpulkan dienkripsi saat transit? | **Yes** | Semua endpoint menggunakan HTTPS / TLS |
| Apakah Anda menyediakan cara bagi pengguna untuk meminta penghapusan data mereka? | **Yes** | Ada fitur Delete Account di Profile → Security |

---

## 2. Rincian Tipe Data (Data Types)

### A. Location (Lokasi)
| Item | Nilai |
|------|-------|
| **Approximate location** (Lokasi perkiraan) | **Collected** (Dikumpulkan) |
| **Precise location** (Lokasi akurat) | **Collected** (Dikumpulkan) |
| Apakah data ini dibagikan ke pihak ketiga? | **No** |
| Apakah data ini diproses secara ephemeral (sementara)? | **Yes** (hanya dihitung lokal saat app buka / GPS aktif) |
| Apakah data ini diperlukan atau opsional? | **Optional** (pengguna bisa memilih input koordinat manual) |
| **Tujuan penggunaan data**: | Centang: **App functionality** (Fungsi aplikasi — jadwal sholat & kiblat) |

### B. Personal Info (Informasi Pribadi)
| Item | Nilai |
|------|-------|
| **Name** (Nama) | **Collected** (Jika user register akun) |
| **Email address** | **Collected** (Jika user register akun) |
| **User IDs** | **Collected** (Account identifier) |
| Apakah data ini dibagikan ke pihak ketiga? | **No** |
| Apakah data ini diproses secara ephemeral? | **No** (disimpan di database akun) |
| Apakah data ini diperlukan atau opsional? | **Optional** (aplikasi bisa dipakai sebagai Tamu/Guest tanpa login) |
| **Tujuan penggunaan data**: | Centang: **App functionality** & **Account management** |

### C. Audio Files / Voice (Audio & Rekaman)
| Item | Nilai |
|------|-------|
| Voice or sound recordings | **Not collected** (Aplikasi TIDAK mengumpulkan atau merekam audio) |

### D. App Activity & Performance (Aktivitas Aplikasi)
| Item | Nilai |
|------|-------|
| App interactions / Crash logs | **Not collected** (Kecuali jika Sentry/Firebase Crashlytics diaktifkan ke depan) |

---

## 3. Financial Info, Health, Messages, Photos
- Semua pilih: **Not collected**

---

## 4. Security Practices Summary
1. **Data is encrypted in transit**: Yes (HTTPS / TLS 1.2+)
2. **Users can request data deletion**: Yes (In-app deletion via Profile)
3. **Target Age Group**: 13 years and older (atau All Ages / Everyone jika questionnaire IARC memilih kategori umum)
4. **Families Policy**: Not enrolled in Designed for Families.

---

## 5. Ringkasan File Siap Upload
- **AAB File**: `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab`
- **Icon (512x512 PNG, no alpha)**: `apps/mobile/assets/play-store-icon-512.png`
- **Feature Graphic (1024x500 PNG)**: `apps/mobile/assets/play-store-feature-graphic-1024x500.png`
- **Listing Copy**: `apps/mobile/store-assets/play_store_listing.md`
- **Privacy Policy**: `apps/mobile/store-assets/privacy_policy.md`
- **Data Safety Guide**: `apps/mobile/store-assets/data_safety_answers.md`
