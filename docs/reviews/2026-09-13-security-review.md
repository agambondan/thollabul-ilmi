# Security Review — API, Web, Mobile

Tanggal: `2026-09-13`
Scope: `services/api` (Go/Fiber), `apps/web` (Next.js), `apps/mobile` (Expo) — dimensi keamanan
(IDOR, admin/role authorization, JWT, SQL injection, secrets, rate limiting, mass assignment, CORS)
Status: `SELESAI` — read-only review; 0 kode diperbaiki di sesi ini (1 fix terkait sudah masuk dari
sesi lain sebelum review ini dimulai, lihat §1.9)

Dipicu permintaan user: review keamanan mendalam — dimensi yang belum pernah disentuh review
sebelumnya (semua review lain fokus feature-completeness/data-quality).

---

## Ringkasan Eksekutif

Kabar baik: backend (`services/api`) menunjukkan pola disiplin yang **sangat konsisten** untuk
ownership check. Diperiksa lebih dari 20 jenis resource milik user (bookmark, tilawah, sholat,
hafalan, wird, muhasabah, goal, kalkulasi zakat, faraidh, push token, adzan sound, kajian
bookmark/note, library progress, API key partner, komentar, feed, forum, blog, session) — **semua**
endpoint Update/Delete memverifikasi `user_id` di query WHERE (repository) atau di service layer
sebelum memanggil repo, mengikuti pola yang sama persis di seluruh codebase:
`extractUserID(ctx)` dari JWT claims → filter `WHERE id = ? AND user_id = ?` atau fetch-then-compare
`existing.UserID != userID → forbidden`. Tidak ditemukan IDOR baru.

JWT, rate limiting, SQL query construction, dan secret management juga solid. Temuan nyata ada di
sisi web frontend (`apps/web`): access token disimpan di `localStorage` (bukan cookie httpOnly saja),
dan sanitizer HTML kustom untuk konten blog. Tidak ada temuan CRITICAL/HIGH.

| #   | Kategori                                                      | Severity            | Status                                           |
| --- | ------------------------------------------------------------- | ------------------- | ------------------------------------------------ |
| 1.1 | IDOR — 20+ resource type diperiksa                            | —                   | PASS, tidak ada temuan baru                      |
| 1.9 | IDOR `notes` (`Update`)                                       | LOW (sudah selesai) | Sudah diperbaiki sesi lain, diverifikasi di sini |
| 2   | Admin/role authorization (`routes.go`)                        | —                   | PASS                                             |
| 3.1 | JWT: role di-bake ke claim, tidak revoked sampai token expire | LOW/MEDIUM          | Dilaporkan                                       |
| 3.2 | JWT: secret, algoritma, refresh rotation                      | —                   | PASS                                             |
| 4   | SQL injection                                                 | —                   | PASS                                             |
| 5   | Hardcoded secrets                                             | —                   | PASS                                             |
| 6   | Rate limiting `/auth/*`                                       | —                   | PASS                                             |
| 7   | Mass assignment / overposting                                 | —                   | PASS                                             |
| 8   | CORS                                                          | —                   | PASS (dengan catatan verifikasi env prod)        |
| 9   | Web: JWT access token di `localStorage`                       | MEDIUM              | Dilaporkan                                       |
| 10  | Web: sanitizer HTML blog kustom (bukan library teraudit)      | MEDIUM              | Dilaporkan                                       |
| 11  | Web: tidak ada CSP header                                     | LOW                 | Dilaporkan                                       |

---

## 1. IDOR (Insecure Direct Object Reference)

### 1.1 Resource milik user — semua diperiksa, semua PASS

Diperiksa file repository + service + controller untuk tiap resource, fokus ke jalur Update/Delete
(yang paling rawan lupa filter `user_id`):

| Resource                            | File                                                           | Pola yang ditemukan                                                                                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bookmark                            | `bookmark_repository.go:82,102`                                | `Where("id = ? AND user_id = ?", ...)` di `UpdateMeta` & `DeleteByID`                                                                                                                               |
| Tilawah log                         | `tilawah_repository.go:78`                                     | sama                                                                                                                                                                                                |
| Muhasabah                           | `muhasabah_repository.go:42,48,56`                             | fetch dengan filter user_id sebelum update/delete                                                                                                                                                   |
| Study Goal                          | `goal_repository.go:38,44,52`                                  | sama                                                                                                                                                                                                |
| Kalkulasi Zakat                     | `kalkulasi_zakat_repository.go:47`                             | sama                                                                                                                                                                                                |
| Faraidh simpan                      | `simpan_faraidh_repository.go:47`                              | sama                                                                                                                                                                                                |
| Dzikir log                          | `dzikir_log_repository.go:47`                                  | sama                                                                                                                                                                                                |
| User Wird                           | `user_wird_repository.go` + `user_wird_service.go:51-59,89-97` | `Update`/`Delete` repo tidak filter user_id sendiri (`Save`/generic), tapi service **fetch by ID lalu bandingkan `w.UserID != userID → forbidden`** sebelum panggil repo — aman                     |
| Adzan Sound                         | `adzan_sound_service.go:42-48`                                 | `FindByIDAndUserID` dulu, baru `Delete(sound)` — aman                                                                                                                                               |
| Kajian Note                         | `kajian_note_repository.go:29-36` + service                    | `GetByID(userID, id)` sudah scoped user_id, dipakai sebelum `Update`/`Delete` — aman                                                                                                                |
| Kajian Bookmark                     | `kajian_bookmark_repository.go`                                | `Remove(userID, chunkID)`, `ListByUser(userID, ...)` — semua scoped                                                                                                                                 |
| Push token                          | `notification_repository.go:142`                               | `UnregisterPushToken` di-scope `user_id = ? AND token = ?`; `DeletePushToken(id)` tanpa user_id **hanya dipanggil dari path admin** (`DeletePushTokenAdmin`, di belakang middleware `admin`) — aman |
| Notification inbox                  | `notification_repository.go:204,216`                           | `Where("id = ? AND user_id = ?", ...)`                                                                                                                                                              |
| Library book progress               | `library_book_progress_controller.go`                          | `userID` selalu dari `extractUserID(ctx)`, tidak pernah dari body                                                                                                                                   |
| Hafalan                             | `hafalan_controller.go`                                        | sama                                                                                                                                                                                                |
| API Key partner (`/developer/keys`) | `api_key_repository.go:52`                                     | `Revoke`: `Where("id = ? AND user_id = ?", ...)`                                                                                                                                                    |
| Comment                             | `comment_controller.go:146-163`                                | `svc.Delete(id, userID, isAdmin)`, forbidden check di service                                                                                                                                       |
| Feed post                           | `feed_controller.go` Delete                                    | `svc.DeletePost(id, userID, isAdmin)` dengan forbidden check                                                                                                                                        |
| Forum question/answer               | `forum_service.go:100-145`                                     | `DeleteQuestion/DeleteAnswer(id, userID)` repo-scoped; `AcceptAnswer` cek `q.UserID != userID`                                                                                                      |
| Blog post                           | `blog_service.go:141-148`                                      | fetch-then-compare `!isAdmin && existing.AuthorID != authorID → forbidden`                                                                                                                          |
| Auth session (`/auth/sessions/:id`) | `user_service.go:339-358`                                      | `RevokeSession` cari token milik `userID` dulu, ID di luar itu tidak ketemu → no-op                                                                                                                 |
| User profile (`/users/:id`)         | `user_controller.go:176-190`                                   | eksplisit cek `claims["role"] != "admin" && claims["user_id"] != id → 403`                                                                                                                          |

**Kesimpulan §1.1**: pola ownership-check diterapkan konsisten di seluruh 20+ resource type. Tidak
ada satu pun endpoint Update/Delete yang hanya mengandalkan "apakah ID ini ada" tanpa mencocokkan ke
user peminta.

### 1.9 `notes` — sudah diperbaiki sesi lain sebelum review ini (diverifikasi, tidak disentuh ulang)

`services/api/app/repository/note_repository.go` dan `services/api/app/services/note_service.go`
sudah dalam status `git diff` (dirty) sejak sebelum sesi ini mulai — hasil sesi lain yang menambah
parameter `userID` ke `NoteRepository.Update` untuk defense-in-depth: sebelumnya service sudah
mengecek `n.UserID != userID → forbidden` sebelum memanggil `repo.Update(id, ...)`, tapi query
`Update` di repository sendiri cuma `Where("id = ?", id)` — kalau saja pengecekan di service pernah
terlewat/di-refactor keliru di masa depan, repo akan tetap meng-update note siapa saja. Fix menambah
`AND user_id = ?` di level repo juga. **Sesuai instruksi task, file ini tidak disentuh ulang** —
sudah direview & di-keep oleh sesi yang mengorkestrasi. `go build ./...` di sesi ini tetap hijau
dengan perubahan itu di working tree.

---

## 2. Admin/Role Authorization

Dibaca `app/http/middlewares/middlewares.go` (`AdminMiddleware`, `EditorOrAdminMiddleware`,
`AuthorOrAdminMiddleware`, `RequireRole`) lalu di-cross-check ke seluruh 938 baris
`app/http/routes.go` baris per baris.

- Semua endpoint create/update/delete untuk content model (surah, ayah, hadith, tafsir, doa,
  asmaul husna, siroh, blog category/tag, dzikir, wirid, fiqh, kajian, masjid, radio, sanad,
  takhrij, perawi, jarh-tadil, munasabah, history, manasik, quiz, dictionary, lessons,
  notification templates, tokoh tarikh, locations) memakai `admin` atau
  `EditorOrAdminMiddleware`/`AuthorOrAdminMiddleware` — tidak ada yang lolos tanpa middleware.
- User management: `PUT /users/:id/role` → `admin` saja. `PUT /users/:id` → `admin`, dan
  controller eksplisit menge-nolkan `data.Role = ""` sebelum update (lihat §7).
- API key management partner: `/developer/*` di belakang `jwt` (user biasa boleh generate
  keynya sendiri, sesuai desain program partner) — bukan bug, hanya scope milik user sendiri
  (`ListByUser`, `Revoke` scoped).
- Push broadcast (`/notifications/admin/broadcast`), push token admin listing/delete, dan
  audit-log export semuanya di belakang `admin`.
- Pola "Create/Delete = admin-only, Update = editor-or-admin" berulang di beberapa resource
  (`tokoh-tarikh`, `locations`, `masjids`, `radio-islamic`) — konsisten, tampak disengaja (editor
  boleh mengoreksi tapi tidak menambah/menghapus record), bukan gap.

**Kesimpulan §2**: tidak ditemukan endpoint admin-shaped yang lolos tanpa middleware yang sesuai.

---

## 3. JWT Handling

File: `app/lib/auth.go`, `app/services/user_service.go` (`createToken`, `Login`,
`RefreshAccessToken`).

**PASS** (§3.2):

- Signing secret dari `ACCESS_SECRET` env — **panic saat startup** kalau kosong, tidak ada fallback
  hardcoded (komentar eksplisit di kode: "there is no hardcoded fallback, since a shared default
  secret lets anyone forge admin tokens").
- Algoritma dipin ke HMAC (`extractToken` menolak token yang bukan `*jwt.SigningMethodHMAC`) — aman
  dari serangan klasik "alg: none" atau RS256→HS256 confusion.
- Access token exp 24 jam.
- Refresh token: UUID acak, disimpan **hash SHA-256** di DB (bukan plaintext), exp 7 hari, dan
  **rotasi single-use** — `RefreshAccessToken` men-delete refresh token lama begitu dipakai
  (`user_service.go:306`), jadi refresh token lama tidak bisa dipakai ulang (replay).
- Password hashing pakai bcrypt default cost (`app/lib/password.go`).
- `ForgotPassword` mengembalikan `nil` walau email tidak ditemukan (anti user-enumeration), token
  reset password juga di-hash SHA-256 sebelum disimpan, exp 1 jam.
- Google OAuth: state token CSRF check (`google_oauth_state` cookie httpOnly vs `state` query param
  dicocokkan sebelum exchange), `verified_email` dari Google divalidasi (email belum verified
  ditolak — mencegah account takeover via email yang belum benar-benar dikonfirmasi pemiliknya),
  token dikirim lewat cookie httpOnly, bukan lewat query string redirect (jadi tidak nyangkut di
  browser history/access log/referrer).

**LOW/MEDIUM (§3.1) — role di-bake ke JWT claim, tidak ada revocation sampai token expire**

`createToken()` (`user_service.go:526-539`) menaruh `"role"` langsung di JWT claims saat login, dan
`RequireRole`/`AdminMiddleware` (`middlewares.go:82-106`) memvalidasi role **hanya dari claim token**,
tidak query ulang ke DB per-request.

**Skenario**: admin men-demote seorang editor/admin yang diduga disusupi lewat `PUT /users/:id/role`
— akun itu tetap bisa memakai endpoint admin/editor sampai _access token lama-nya_ kedaluwarsa
(maksimal 24 jam) karena token lama belum expired dan tidak ada mekanisme revoke access token
individual (beda dengan refresh token yang punya tabel & bisa di-`DeleteRefreshTokenByID`). Sebalik-
nya, promosi role juga baru "efektif penuh" setelah refresh token berikutnya untuk endpoint yang
bergantung role-in-claim.

Ini trade-off umum di desain JWT stateless dan bukan bug implementasi (tidak ada cara "murah" untuk
memperbaiki tanpa infrastruktur token-blacklist/versioning), jadi dilaporkan sebagai catatan
arsitektur, bukan dieksekusi sebagai fix. Kalau mau ditutup: cara paling murah adalah menambah
kolom `token_version`/`role_version` di tabel user, disertakan di claim, dan dicek ulang (tanpa perlu
query per-request penuh — cukup ambil dari cache/Redis) saat `RequireRole`.

---

## 4. SQL Injection

Digrep semua pemakaian `.Raw(` dan `.Exec(` di `app/repository` dan `app/db/migrations`
(lihat lampiran command di bawah). Semua raw query di jalur yang menerima input dari HTTP request
menggunakan placeholder `?` untuk nilai — termasuk query builder kompleks di
`app/repository/kajian_repository.go` (`SearchTranscripts`, dipakai endpoint publik
`GET /kajian/search`) yang menyusun SQL full-text search multi-CTE: bagian yang di-`fmt.Sprintf`
hanya nama tabel tetap (`t`, `k` dari `transcriptTables()`, dua kemungkinan nama tabel fixed,
bukan dari request) dan angka limit konstan (`searchPhraseFetch` dkk, konstanta Go) — nilai dari
user (`query`, `speaker`, regex hasil parsing) selalu lewat `s.add(sql, arg)` yang menambahkan `?`

- append ke `s.args`, lalu dieksekusi via `r.db.Raw(s.String(), s.args...)`. Tidak ada konkatenasi
  string milik request ke teks SQL.

Satu-satunya string-concat SQL murni (`app/db/migrations/seeder_idempotency.go:35`) memakai nama
tabel/kolom internal yang di-hardcode di source (dipanggil dari migration runner, bukan dari HTTP
request) — tidak reachable dari input user.

**Kesimpulan §4**: tidak ditemukan SQL injection.

---

## 5. Hardcoded Secrets

```
grep -rniE '(api[_-]?key|secret|password|token)\s*[:=]\s*"[A-Za-z0-9+/_=-]{12,}"' services/api/app --include="*.go"
grep -rniE '(api[_-]?key|secret|password|token)\s*[:=]\s*["\'][A-Za-z0-9+/_=-]{16,}["\']' apps/web/src
```

Tidak ada hit (di luar placeholder di `.env.example`). Secret Google OAuth, JWT, dll semuanya
dibaca dari env/viper.

---

## 6. Rate Limiting

`app/http/routes.go:38-58, 220-283, 769-778`. Konfirmasi:

- Global limiter per user-atau-IP (`RATE_LIMIT_GLOBAL`, default 180/menit).
- `authLimiter` (`RATE_LIMIT_AUTH`, default 10/menit) di semua endpoint `/auth/*` termasuk
  register, login, refresh, forgot/reset password, verify-email/whatsapp, resend-verification.
- `loginLockout` tambahan khusus `/auth/login` (`RATE_LIMIT_LOGIN_ACCOUNT`, default 5/15menit)
  di-key oleh **email akun** (bukan cuma IP) dengan `SkipSuccessfulRequests: true` — brute force
  ke satu akun tetap dibatasi walau attacker rotasi IP.
- Search & semantic search punya limiter sendiri (mencegah abuse endpoint mahal/LLM).
- Developer API key punya limiter sendiri di-key oleh API key.
- Diverifikasi juga: kalau env var `RATE_LIMIT_*` sampai tidak ke-set (`viper.GetInt` → 0), fiber
  `middleware/limiter` **fail-closed** — `cfg.Max <= 0` di-default ke `5` oleh library
  (`gofiber/fiber/v2@.../middleware/limiter/config.go:112-113`), bukan jadi unlimited. Jadi
  kesalahan konfigurasi env tidak membuka celah rate-limit-bypass.

**Kesimpulan §6**: rate limiting sudah memadai untuk endpoint auth.

---

## 7. Mass Assignment / Overposting

- `PUT /auth/me` (`UpdateProfile`): controller membangun `&model.User{Name, Avatar,
PreferredLang}` manual dari `UpdateProfileRequest` — field lain (role, email, is_verified) tidak
  bisa disuntik lewat body karena tidak pernah dibaca dari DTO tersebut.
- `PUT /users/:id` (admin-only `UpdateById`): `data := new(model.User); BodyParser(ctx, data)`
  bind seluruh struct `User` — **tapi** baris berikutnya eksplisit `data.Role = ""` sebelum
  dikirim ke repo, dengan komentar "role changes must go through UpdateRole". Endpoint ini admin-
  only jadi risiko overposting field lain (mis. set password hash mentah) sudah dianggap dalam
  batas kewenangan admin yang sah, bukan celah untuk user biasa.
- `PUT /users/:id/role` (`UpdateRole`): DTO terpisah `UpdateRoleRequest`, admin-only.
- `POST /blog/posts`, `PUT /blog/posts/:id`: pakai `CreateBlogPostRequest`/`UpdateBlogPostRequest`
  terpisah, `AuthorID` di-set dari `extractUserID(ctx)` bukan dari body.
- Pola yang sama (DTO terpisah + `extractUserID`) dikonfirmasi juga di comment, feed, forum,
  kajian note/bookmark, user-wird, muhasabah, goal, dll — tidak ada resource user-owned yang
  menerima `user_id` dari body request.

**Kesimpulan §7**: tidak ditemukan overposting yang bisa dieksploitasi user biasa.

---

## 8. CORS

`app/http/middlewares/middlewares.go:28-48` (`Cors()`):

- `AllowOrigins` dari env `ALLOW_ORIGINS`, default ke daftar eksplisit origin localhost dev (bukan
  wildcard `*`).
- `AllowCredentials: true` — ini valid **hanya karena** origin selalu daftar eksplisit, bukan `*`
  (browser menolak kombinasi wildcard-origin + credentials, tapi fiber/gofiber tidak mem-validasi
  ini di level kode — kalau `ALLOW_ORIGINS` production di-set jadi `*` oleh kesalahan config, ini
  jadi lubang CORS yang serius: origin manapun bisa memanggil API dengan cookie korban).
- **Tidak bisa diverifikasi dari repo** apa isi `ALLOW_ORIGINS` yang benar-benar dipakai di server
  production (env production tidak ada di repo, dan memang seharusnya begitu). `docker-compose.yaml`
  (dev, bukan prod) memakai daftar origin localhost eksplisit — bukan indikasi config prod.
  **Rekomendasi**: verifikasi manual bahwa `ALLOW_ORIGINS` di server production **tidak** `*`
  dan hanya mencantumkan domain web resmi (`https://thollabul.jangkauin.site` dkk).

---

## 9. [MEDIUM] Web: JWT access token disimpan di `localStorage`

**File**: `apps/web/src/context/Auth.js` (baris 20, 58, 122, 163, 172-173, dan `src/lib/api.js:70`)

Backend sudah mengirim token lewat **cookie httpOnly** (lihat `setAuthCookies` yang dipakai baik di
login biasa maupun Google OAuth callback — `user_controller.go:55-65`,
`google_auth_controller.go:153`), yang kebal dari pencurian lewat XSS karena JavaScript tidak bisa
membacanya. Tapi `apps/web` **juga** menyimpan token yang sama di `localStorage.setItem("auth_token",
...)` dan mengirimkannya manual lewat header `Authorization: Bearer` di setiap fetch
(`fetchMe`, dll) — jalur cookie httpOnly jadi mubazir karena localStorage yang jadi sumber utama
otentikasi di sisi client.

**Skenario eksploitasi**: kalau ada XSS di manapun di `apps/web` (lihat §10 — jalur paling mungkin
adalah render konten blog/forum yang datang dari akun author/admin yang disusupi), payload XSS
tinggal `localStorage.getItem("auth_token")` lalu kirim ke server attacker → attacker punya access
token korban selama sampai 24 jam, bisa memanggil API apa pun atas nama korban (termasuk kalau
korban kebetulan admin yang sedang membuka halaman blog untuk preview/moderasi). Dengan cookie
httpOnly-only, XSS yang sama tidak bisa membaca token sama sekali (walau tetap bisa melakukan
same-origin request atas nama korban selama sesi terbuka — tapi tidak bisa mengeksfiltrasi token
untuk dipakai dari luar browser korban).

**Catatan pembanding**: mobile app (`apps/mobile/src/storage/session.js`) sudah benar — pakai
`expo-secure-store` (Keychain/Keystore terenkripsi), bukan `AsyncStorage` biasa.

**Rekomendasi** (tidak dieksekusi — perlu perubahan arsitektur auth flow client, bukan one-liner):
hapus penyimpanan `localStorage` untuk `auth_token`, andalkan cookie httpOnly yang sudah dikirim
backend untuk seluruh request (`credentials: "include"` sudah dipakai di semua fetch call), dan
untuk kebutuhan cek `isAuthenticated` di client pakai response dari `/auth/me` (yang sudah dipanggil)
bukan keberadaan token di localStorage.

---

## 10. [MEDIUM] Web: sanitizer HTML kustom untuk konten blog, bukan library teraudit

**File**: `apps/web/src/lib/blogContent.js` (`sanitizeBlogHtml`, dipakai `renderBlogContent`,
dirender lewat `dangerouslySetInnerHTML` di `apps/web/src/app/blog/[slug]/page.js:449-454`)

Konten blog post (dibuat oleh role `author`/`admin`, lihat §2) dirender sebagai HTML mentah.
Sanitizer-nya hand-rolled, bukan library teraudit (mis. DOMPurify):

- Jalur browser (`DOMParser` tersedia): allowlist tag + allowlist atribut, `javascript:` di
  `href`/`src` di-strip, `on*` attribute otomatis hilang karena tidak ada di allowlist atribut —
  desain ini cukup masuk akal (default-deny, bukan default-allow-minus-blocklist).
- Jalur fallback (`typeof window === "undefined"`, dipakai kalau komponen ini sempat dievaluasi di
  server/SSR): **hanya blocklist regex** (`on\w+=`, `javascript:` di href/src) — **tidak ada
  pembatasan tag sama sekali**. Tag seperti `<base href="https://evil.com/">` tidak di-strip oleh
  regex pembersih tag berbahaya di awal (`script|style|iframe|object|embed|link|meta` — `base`
  tidak termasuk) maupun oleh fallback regex — kalau context render ini benar-benar jalan di SSR
  dengan `raw` yang sudah terisi (belum dikonfirmasi terjadi di flow actual `blog/[slug]/page.js`
  karena `post` di-fetch client-side setelah mount, jadi `raw` kemungkinan masih kosong saat SSR
  pass pertama — **confidence sedang, bukan exploit yang dibuktikan end-to-end**), tag `<base>`
  bisa membajak resolusi semua URL relatif di halaman itu.

**Skenario risiko**: akun `author` yang disusupi (kredensial bocor, atau endpoint
`AuthorOrAdminMiddleware` di masa depan longgar) menaruh payload di judul/isi blog post; setiap
pengunjung — termasuk admin yang mereview — kena stored XSS begitu halaman itu dibuka. Digabung
dengan temuan §9 (token di localStorage), ini naik dari "XSS biasa" jadi "full session takeover
termasuk kalau korbannya admin".

**Rekomendasi** (tidak dieksekusi — butuh integrasi library baru + audit ulang semua allowlist,
bukan one-liner low-risk): ganti `sanitizeBlogHtml` dengan DOMPurify (ada varian yang jalan di
Node/SSR lewat `jsdom`), pertahankan allowlist yang sudah ada sebagai konfigurasi
`ALLOWED_TAGS`/`ALLOWED_ATTR`, dan pastikan satu implementasi dipakai di kedua jalur (client & SSR)
alih-alih dua implementasi regex terpisah.

---

## 11. [LOW] Web: tidak ada Content-Security-Policy header

`apps/web/next.config.js:74-108` set `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy` untuk semua route, tapi tidak ada `Content-Security-Policy`. Bukan
prioritas tinggi untuk situs konten (bukan SPA murni), tapi memperkuat mitigasi kalau §10 sampai
tereksploitasi (CSP `script-src` yang ketat akan memblokir eksekusi payload XSS walau sanitizer
lolos). Direkomendasikan sebagai lapisan pertahanan tambahan, bukan fix mandiri untuk §9/§10.

---

## Yang Diperbaiki di Sesi Ini

**Tidak ada.** Tidak ditemukan bug correctness kecil dan jelas-scoped yang aman diperbaiki tanpa
menyentuh file yang sudah dirty oleh sesi lain. Satu perbaikan terkait (`notes` ownership,
§1.9) sudah masuk dari sesi lain sebelum review ini dimulai — diverifikasi lewat `go build ./...`
(hijau), tidak disentuh ulang sesuai instruksi task.

## File yang Di-skip (sudah dirty, di luar scope task ini)

- `services/api/app/repository/note_repository.go`, `services/api/app/services/note_service.go` —
  fix ownership `notes` dari sesi crash sebelumnya (lihat §1.9).
- `services/api/app/controllers/page_view_controller.go` — dirty oleh sesi lain, tidak diperiksa
  isi diff-nya (di luar scope security, dan berisiko bentrok kalau ikut disentuh).
- `apps/web/src/components/QuizContent.js` — dirty oleh sesi lain, di luar scope security review
  (komponen quiz, bukan permukaan yang relevan ke temuan di atas).

## Perlu Judgment Manusia / Follow-up

1. **§3.1** — putuskan apakah revocation role/token sesegera mungkin (butuh `token_version` +
   Redis check) sepadan dengan kompleksitas tambahan untuk profil risiko aplikasi ini (bukan
   fintech/kesehatan; role admin terbatas ke tim internal).
2. **§8** — verifikasi manual nilai `ALLOW_ORIGINS` yang sebenarnya dipakai di server production
   (tidak ada di repo, dan memang seharusnya begitu) — pastikan bukan `*`.
3. **§9** — keputusan produk: pindah auth flow web sepenuhnya ke cookie httpOnly (butuh mengubah
   `Auth.js`, `api.js`, dan kemungkinan kode lain yang membaca `token` dari context) — perubahan
   lintas-file, bukan patch kecil.
4. **§10** — putuskan mau adopsi DOMPurify atau audit lebih dalam apakah SSR fallback path
   benar-benar reachable dengan konten attacker-controlled di flow `blog/[slug]/page.js` saat ini
   (butuh trace lebih jauh ke bagaimana `post` di-fetch — client-only vs ada jalur SSR/prefetch).
