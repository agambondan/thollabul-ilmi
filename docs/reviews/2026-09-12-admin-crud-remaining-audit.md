# Audit CRUD Admin — Sisa Section yang Belum Dicek

Status: `SELESAI`
Tanggal: `2026-09-12`

## Konteks

Spot-check sebelumnya di sesi yang sama sudah memverifikasi 9 admin section
(masjid, radio-islamic, tokoh-tarikh, sanad, takhrij, hadith-ayah, locations,
jarh-tadil, perawi) — semua memakai `GenericAdminCRUD`
(`apps/web/src/components/panel/GenericAdminCRUD.js`) dengan create/edit/delete
yang benar-benar tersambung, bukan stub.

Audit ini melanjutkan ke **24 section admin sisanya** (hasil `ls
apps/web/src/app/admin/` saat ini), dibagi ke 4 sub-audit paralel yang
masing-masing membaca penuh `page.js` (dan file form terkait untuk section
custom), mengecek create/edit/delete, mencari TODO/placeholder, memverifikasi
fungsi `apps/web/src/lib/api.js` benar-benar menunjuk ke route backend nyata
(cross-check ke `services/api/app/http/routes.go` untuk section yang lebih
niche), dan mencari bug UI non-obvious (modal stuck-open, field mismatch,
raw JSON di tabel, dll) — mengikuti pola bug nyata yang pernah ditemukan di
project ini (mis. "fix broken Sanad admin page", "repair stuck-open modals").

**Temuan utama: tidak ada satu pun dari 24 section ini yang merupakan
GenericAdminCRUD.** Semuanya custom hand-rolled form (state lokal +
`ModalShell`), berbeda dari 9 section yang dicek sebelumnya. Meski begitu,
seluruhnya benar-benar tersambung ke backend nyata — tidak ditemukan CRUD
yang stub/no-op.

## Tabel Hasil

| Section          | Create               | Edit                 | Delete              | Komponen        | Bug ditemukan                                                                                                                                                                                                                                                             | Status                                                    |
| ---------------- | -------------------- | -------------------- | ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| achievements     | wired                | wired                | wired               | custom          | tidak ada                                                                                                                                                                                                                                                                 | —                                                         |
| amalan           | wired                | wired                | wired               | custom          | tidak ada                                                                                                                                                                                                                                                                 | —                                                         |
| asbabun-nuzul    | wired                | wired                | wired               | custom          | tidak ada                                                                                                                                                                                                                                                                 | —                                                         |
| asmaul-husna     | wired                | wired                | wired               | custom          | tidak ada (dicek: field `meaning`↔`description` sengaja beda nama, sesuai DTO backend)                                                                                                                                                                                    | —                                                         |
| audit-logs       | n/a (read-only)      | n/a                  | n/a                 | custom          | **event toast salah nama** (`admin:toast-error/success` vs listener `admin:mutation-error`/`admin:success`) + `parseApiError(err)` dipanggil tanpa `await` pada `Error` biasa sehingga fallback pesan gagal tidak pernah jalan → toast gagal/berhasil tidak pernah muncul | **Diperbaiki**                                            |
| blog             | wired                | wired                | wired               | custom (4 file) | tidak ada (catatan: halaman edit fetch seluruh list lalu cari by id — inefisien, bukan bug)                                                                                                                                                                               | —                                                         |
| doa              | wired                | wired                | wired               | custom          | gap: gagal load list tidak menampilkan pesan error ke admin (silent, hanya jadi list kosong)                                                                                                                                                                              | dilaporkan saja (pola lintas 5 file, bukan fix kecil)     |
| dzikir           | wired                | wired                | wired               | custom          | gap sama seperti doa (silent load-error)                                                                                                                                                                                                                                  | dilaporkan saja                                           |
| fiqh             | wired                | wired                | wired               | custom          | gap sama seperti doa (silent load-error)                                                                                                                                                                                                                                  | dilaporkan saja                                           |
| kajian (listing) | wired                | wired                | wired               | custom          | gap: field `published_at` dikirim di payload tapi tidak ada input-nya di form (tidak bisa diisi/diubah dari UI)                                                                                                                                                           | dilaporkan saja                                           |
| kamus            | wired                | wired                | wired               | custom          | gap: kategori `kosakata` (istilah Arab, sudah ada di model `IslamicTerm`) tidak muncul di dropdown kategori frontend maupun DTO backend                                                                                                                                   | dilaporkan saja (gap fitur lintas FE+BE, bukan fix kecil) |
| lessons          | wired                | wired                | wired               | custom          | tidak ada (satu-satunya di grup ini yang sudah handle load-error dengan benar)                                                                                                                                                                                            | —                                                         |
| library          | wired                | wired                | wired               | custom          | tidak ada                                                                                                                                                                                                                                                                 | —                                                         |
| manasik          | wired                | wired                | wired               | custom          | tidak ada                                                                                                                                                                                                                                                                 | —                                                         |
| panduan-sholat   | wired                | wired                | wired               | custom          | tidak ada                                                                                                                                                                                                                                                                 | —                                                         |
| push (broadcast) | wired (send)         | n/a                  | wired (hapus token) | custom          | tidak ada (catatan: pakai native `confirm`/`alert`, bukan toast standar — gaya beda, bukan bug)                                                                                                                                                                           | —                                                         |
| quiz             | wired                | wired                | wired               | custom          | tidak ada                                                                                                                                                                                                                                                                 | —                                                         |
| reminders        | wired                | wired                | wired               | custom          | tidak ada                                                                                                                                                                                                                                                                 | —                                                         |
| reports          | n/a (user-submitted) | wired (review/apply) | n/a                 | custom          | gap: 4 kartu statistik (pending/reviewed/resolved/rejected) dihitung dari `items` yang sudah difilter status — saat filter aktif, angka 3 kartu lain jadi 0, bukan total asli                                                                                             | dilaporkan saja (perlu fetch summary terpisah)            |
| sejarah          | wired                | wired                | wired               | custom          | tidak ada                                                                                                                                                                                                                                                                 | —                                                         |
| siroh            | wired                | wired                | wired               | custom (4 file) | tidak ada (catatan: halaman edit fetch seluruh list, sama seperti blog — inefisien bukan bug)                                                                                                                                                                             | —                                                         |
| users            | n/a (self-register)  | wired (ganti role)   | wired               | custom          | tidak ada (guard self-demote/self-delete di klien sudah benar; guard di backend tidak diverifikasi ulang di sini)                                                                                                                                                         | —                                                         |
| whatsapp         | wired (pairing SSE)  | n/a                  | wired (logout)      | custom          | minor: `es.onerror` tidak menampilkan pesan error ke user saat koneksi SSE putus (bukan stuck state, cuma tanpa pesan)                                                                                                                                                    | dilaporkan saja (severity rendah)                         |
| wirid            | wired                | wired                | wired               | custom          | tidak ada (dicek: field flat di save vs nested `translation.*` di baca — sengaja, dijembatani backend via `upsertContentTranslation`)                                                                                                                                     | —                                                         |

## Yang Diperbaiki

**`apps/web/src/app/admin/audit-logs/page.js`** — satu-satunya file yang
diedit dalam audit ini (file lain di 24 section ini bersih di
`git status --porcelain` sebelum dicek, tidak ada yang di-skip karena dirty).

- `fb("admin:toast-error", parseApiError(err) || "Gagal memuat log")` →
  `fb("admin:mutation-error", err.message || "Gagal memuat log")`
- `fb("admin:toast-success", ...)` → `fb("admin:success", ...)`
- Import `parseApiError` dihapus (sudah tidak dipakai; juga sebelumnya salah
  dipakai — `parseApiError` adalah fungsi `async` dan dipanggil tanpa
  `await` di jalur pertama, jadi hasilnya selalu `Promise` yang truthy,
  bikin fallback pesan tidak pernah jalan).
- Verifikasi: `apps/web/src/components/admin/AdminMutationToast.js` memang
  hanya listen ke `admin:mutation-error` dan `admin:success` — nama event
  lama di halaman ini tidak pernah ditangkap listener manapun, jadi
  sebelumnya setiap gagal load atau gagal export CSV di halaman ini **diam
  saja tanpa toast apapun** ke admin.
- Sanity check: `npx eslint apps/web/src/app/admin/audit-logs/page.js` —
  bersih.

## Gap yang Dilaporkan Saja (Bukan Bug Kecil / Butuh Kerja Lebih Besar)

1. **doa/dzikir/fiqh/kajian/kamus** — gagal load list tidak menyetel state
   error, hanya membuat `items=[]`. Admin melihat "tidak ada data" tanpa tahu
   itu kegagalan fetch. Pola berulang di 5 file berbeda, layak jadi task
   tersendiri (mis. tambahkan `error` state + banner, konsisten dengan pola
   `lessons` yang sudah benar).
2. **kajian** — field `published_at` ada di payload tapi tidak ada UI untuk
   mengisinya (unreachable field, bukan merusak data existing).
3. **kamus** — kategori `kosakata` (istilah Arab) tidak ada di dropdown
   frontend maupun DTO request backend, padahal model `IslamicTerm` sudah
   punya field `Arabic`/`Latin`/`Root` untuk kategori ini. Gap fitur
   lintas FE+BE, bukan fix satu baris.
4. **reports** — kartu ringkasan status salah hitung ketika filter status
   aktif (menampilkan 0 untuk status lain, bukan total sebenarnya). Perlu
   fetch count agregat terpisah dari list yang difilter.
5. **whatsapp** — `onerror` SSE tidak menampilkan pesan kegagalan koneksi
   (severity rendah, bukan stuck state).
6. **blog & siroh** — halaman edit fetch seluruh list lalu cari by id di
   klien, bukan panggil endpoint detail. Berfungsi benar, tapi boros seiring
   data bertambah.

## Verifikasi Route Backend (spot-check)

Route berikut dikonfirmasi ada di `services/api/app/http/routes.go` untuk
section yang lebih niche (bukan diasumsikan):

- `asbabun-nuzul`: baris 794/798-800 — `FindAll/Create/Update/Delete`
- `audit-logs`: baris 925-926 — `GET /admin/audit-logs`, `GET
/admin/audit-logs/export`
- `kajian`: `POST/PUT/DELETE /kajian` (metadata listing, bukan transkrip)
- `kamus` (dictionary): `POST/PUT/DELETE /dictionary`
- `push`/notifications: baris 397-399 — `broadcast`, `push-tokens`
  (list+delete)
- `manasik`: baris 695-701 — `FindAllAdmin/Create/Update/Delete`
- `reports`: baris 918-922 — `FindAll/UpdateStatus/ApplyCorrection/Export`
- `whatsapp`: baris 265-267 — `status/pair-stream/logout`

Semua cocok dengan fungsi yang dipanggil di `apps/web/src/lib/api.js`, tidak
ada endpoint yang hilang.

## Tidak Diaudit (Sudah Dicek di Spot-Check Sebelumnya)

masjid, radio-islamic, tokoh-tarikh, sanad, takhrij, hadith-ayah, locations,
jarh-tadil, perawi — lihat percakapan sesi ini untuk detail, tidak diulang
di dokumen ini.
