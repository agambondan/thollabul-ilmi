# Privacy Policy — Thullaabul Ilmi

**Effective Date:** 2024-01-01
**Last Updated:** 2024-01-01
**Version:** 1.0

---

## 1. Overview

Thullaabul Ilmi ("kami", "aplikasi") menghormati privasi Anda. Kebijakan ini menjelaskan data apa yang dikumpulkan, bagaimana data digunakan, dan hak Anda terkait data pribadi.

Aplikasi ini **tidak menjual data pengguna** dan **tidak menampilkan iklan**.

---

## 2. Data yang Kami Kumpulkan

### 2.1 Data yang Anda Berikan Secara Sukarela
| Data | Tujuan | Disimpan Di |
|------|--------|-------------|
| Email, nama, password (saat registrasi) | Autentikasi akun, sinkron progres | Backend server (Firebase/Node.js) |
| Foto profil (opsional) | Personalisasi akun | Cloud storage (Firebase Storage) |

### 2.2 Data yang Dikumpulkan Otomatis (Dengan Izin)
| Izin | Data | Tujuan | Durasi Simpan |
|------|------|--------|---------------|
| **Lokasi (ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION)** | Koordinat GPS (lat/lng) | Menghitung jadwal sholat & arah kiblat | Saat aplikasi aktif; **tidak** dikirim ke server tanpa aksi user |
| **Notifikasi (POST_NOTIFICATIONS)** | Token FCM | Mengirim reminder adzan & notifikasi harian | Selama token valid |

### 2.3 Data Lokal (Tersimpan di Device — Tidak Dikirim ke Server)
| Data | Contoh | Storage |
|------|--------|---------|
| Progress Al-Qur'an | Bookmark ayat, posisi baca terakhir, khatam, hafalan, muroja'ah | Expo SecureStore (encrypted) |
| Preferensi UI | Tema (light/dark), bahasa, layout mode, madhhab, metode kalkulasi sholat | AsyncStorage / SecureStore |
| Offline Pack | Data Al-Qur'an & hadits yang diunduh user | SQLite (expo-sqlite) |
| Catatan & Wird pribadi | Catatan user, wird custom, target tasbih | SecureStore |

---

## 3. Penggunaan Data

Data digunakan **hanya** untuk:
- Menyediakan fitur inti: jadwal sholat, kiblat, audio Qur'an, sinkron progres
- Meningkatkan pengalaman user (preferensi, bahasa, tema)
- Keamanan akun (autentikasi, verifikasi email)
- **Tidak** untuk: profiling iklan, penjualan data, tracking lintas aplikasi

---

## 4. Berbagi Data

| Penerima | Data | Alasan |
|----------|------|--------|
| Firebase Authentication | Email, password hash, UID | Login / register |
| Firestore / Realtime Database | Profil user, progres sinkron | Multi-device sync |
| Google Play Services | FCM token | Push notification |
| **Tidak ada pihak ketiga** untuk analitik/iklan | — | — |

---

## 5. Hak Pengguna (GDPR / UU PDP Indonesia)

Anda berhak:
- **Akses**: Melihat data apa yang kami simpan
- **Koreksi**: Memperbaiki data tidak akurat
- **Penghapusan**: Menghapus akun & semua data terkait (via menu Profile → Security → Delete Account)
- **Portabilitas**: Ekspor data progres (fitur akan datang)
- **Pembatasan**: Menonaktifkan sinkron / lokasi / notifikasi kapan saja

---

## 6. Keamanan Data

- Enkripsi transit: TLS 1.2+ (HTTPS)
- Enkripsi lokal: Expo SecureStore (iOS Keychain / Android Keystore)
- Password: Hash bcrypt (server-side), tidak pernah dikembalikan ke client
- API key & secret: Disimpan di server environment, tidak di-bundle ke aplikasi

---

## 7. Retensi Data

| Jenis Data | Retensi |
|------------|---------|
| Akun & profil | Selama akun aktif + 30 hari setelah penghapusan |
| Progres Qur'an (server) | Selama akun aktif |
| Data lokal (device) | Hingga user uninstall / clear data |
| Log server (audit) | 90 hari |

---

## 8. Anak di Bawah 13 Tahun

Aplikasi **tidak sengaja** mengumpulkan data anak di bawah 13 tahun tanpa persetujuan orang tua. Jika Anda percaya kami memiliki data anak, hubungi kami untuk penghapusan segera.

---

## 9. Perubahan Kebijakan

Perubahan material akan diberitahu via:
- Notifikasi in-app
- Email terdaftar (jika ada)
- Update halaman ini dengan tanggal "Last Updated"

---

## 10. Hubungi Kami

**Data Protection Officer:** Firman Alamsyah
**Email:** privacy@thullaabulilmi.com (placeholder)
**Alamat:** Jakarta, Indonesia

---

## 11. Izin Khusus — Penjelasan Detail

| Izin Android | Digunakan Untuk | Opsional? |
|--------------|----------------|-----------|
| `ACCESS_FINE_LOCATION` | GPS presisi untuk jadwal sholat & kiblat | Ya (user boleh input manual) |
| `ACCESS_COARSE_LOCATION` | Fallback lokasi jaringan | Ya |
| `POST_NOTIFICATIONS` | Reminder adzan, notifikasi harian | Ya (Android 13+) |
| `INTERNET` | Sinkron data, download offline pack, auth | Tidak (wajib) |
| `VIBRATE` | Feedback tasbih counter | Tidak (wajib) |

> **Catatan:** Izin `RECORD_AUDIO` & `MODIFY_AUDIO_SETTINGS` **telah dihapus** pada v1.0. Aplikasi **tidak** merekam audio.

---

*Dokumen ini adalah template. Sesuaikan URL, email, dan detail hukum sebelum publish ke Play Console.*