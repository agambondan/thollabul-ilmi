# Mobile Visual Redesign (pen.dev)

> Dibuat: 2026-09-24
> File: [`assets/design/mobile.pen`](../assets/design/mobile.pen) — dibuka/diedit lewat pencil MCP tools
> (`mcp__pencil__*`) di pen.dev. **Jangan pernah buka/Read/Grep file `.pen`** — encrypted,
> cuma bisa diakses via tool-nya.

## Apa ini

Eksplorasi redesign visual mobile app (`apps/mobile`) untuk kedua layout mode yang sudah ada
(`classic` dan `web_app`/modern — lihat [`MOBILE_LAYOUT_MODES.md`](./MOBILE_LAYOUT_MODES.md)).
Ini **bukan** desain baru dari nol secara konten — **informasi/struktur setiap layar dibuat
setia ke app yang sekarang berjalan** (diverifikasi lewat screenshot APK asli di emulator, lihat
[`docs/reviews/2026-09-24-mobile-app-screenshot-baseline.md`](./reviews/2026-09-24-mobile-app-screenshot-baseline.md)).
Yang di-redesign adalah **lapisan visual**: sistem token warna/tipografi yang konsisten,
komponen yang reusable & benar-benar theme-aware, dan pembenahan penempatan
tombol/kartu yang di app asli banyak hand-rolled beda-beda gaya per screen.

**Aturan wajib kalau lanjut kerja di file ini**: sebelum bikin/ubah layar apa pun, baca dulu
screenshot asli app di `apps/mobile/output/native/2026-09-24/*.png` (atau ambil baru kalau
sudah basi) untuk layar yang bersangkutan. Jangan mengarang konten dari asumsi/kode saja —
riwayat awal kerjaan ini sempat salah karena konten di-karang dari hasil baca kode
(`theme.js`, dll) tanpa lihat rendering asli, dan hasilnya meleset jauh dari app sungguhan
(quick actions cuma 4 padahal aslinya 8, dsb).

## Status (2026-09-24)

Layar yang sudah ada, masing-masing 2 tema (Classic di atas, Modern di bawah, disusun grid
per kolom fitur — lihat catatan layout di bawah):

- Beranda, Quran (hub saja), Hadis (hub + detail), Ibadah (hub, 5 section lengkap), Belajar
  (hub, 7 section lengkap), Profile.

Belum digarap: sub-halaman detail lain (Quran reader per-surah, Ibadah sub-tools individual,
~25 sub-route Belajar secara detail). Cek dulu `docs/INDEX.md` / tanya user sebelum menganggap
scope ini final.

**Use Case + UI Flow lanes** (area kanvas `x≈4910` ke kanan, lihat section di bawah) — 7 lane
wajib per keputusan user, semua entry point dari Beranda - Modern. **Semua 7 lane SELESAI
dibangun** (2026-09-24), Y-stride 3750px per lane, diverifikasi manual node-by-node lewat
`Get`+`ctx.bounds` (26 node dicek satu-satu) + spot-check screenshot 7 layar baru — bukan cuma
percaya laporan agent (disiplin yang sama yang dulu menemukan insiden penghapusan flow lanes):

1. **Login / Masuk ke Akun** (y=100) — Beranda → tap avatar → menu dropdown → tap Profil →
   Profile → tap "Masuk/Daftar" → layar Akun baru (tab Masuk/Daftar/Lupa Sandi, tombol Google,
   form email+password). Dibangun manual, bukan lewat agent paralel.
2. **Baca Surah Al-Qur'an** (y=3850) — Beranda → tab Al-Quran → Quran hub → tap surah → layar
   baru "Quran Reader - Modern" (Al-Fatihah ayat 1, arabic+terjemahan, nav ayat, progress dots).
3. **Baca Hadis** (y=7600) — Beranda → tab Hadis → Hadis Hub → tap hadis → Hadis Detail
   (pakai screen yang sudah ada, tidak perlu dibangun baru). *Catatan: lompat langsung dari
   daftar kitab ke detail 1 hadis, belum ada layar antara "daftar hadis dalam 1 kitab" —
   lihat `modern-hadis-reader.png` kalau mau ditambah nanti.*
4. **Cari Arah Kiblat** (y=11350) — Beranda → tab Ibadah → Ibadah hub → tap kartu Qibla →
   layar baru "Kiblat - Modern" (kompas + info jarak/sudut/lokasi, representasi state
   "sudah dapat lokasi", bukan state loading yang ada di screenshot asli).
5. **Cek Jadwal Sholat & Set Reminder** (y=15100) — Beranda → tab Ibadah → Ibadah hub → tap
   "Jadwal Sholat" → layar Jadwal (daftar waktu sholat) → tap ikon gear → layar terpisah
   "Pengaturan Sholat - Modern" (kartu Koreksi Manual + kartu Pengingat Adzan). Dibangun
   sebagai 2 screen terpisah (bukan overlay/toggle di 1 screen) sesuai gotcha #8.
6. **Ikuti Kuis Islami** (y=18850) — Beranda → tab Belajar → Belajar hub → tap "Quiz Islami" →
   layar Kuis Soal (progress bar + 4 pilihan) → pilih jawaban → layar Kuis Jawaban (state
   benar/salah + kartu penjelasan + tombol Lanjut).
7. **Ikuti Kajian Islam** (y=22600) — Beranda → tab Belajar → Belajar hub → tap "Kajian" →
   layar baru "Kajian - Modern" (stat card, tab Transkrip/Tersimpan/Kajian, filter kategori,
   kartu video kajian).

**Insiden penghapusan #2 (2026-09-25)**: sesi/agent lain (di window pen.dev yang sama) kembali
menghapus SELURUH area flow diagram di atas (7 lane + komponen `Flow/HandoffCard` + header) —
diverifikasi node-by-node (`Get` per id, semua "Can't find node"), sementara komponen inti
(Button/Primary, Card, screen hub, dst.) tidak terganggu. Root cause sama seperti insiden #1:
"active canvas" pen.dev itu satu pointer shared per window, bukan per-sesi. Ke-7 lane di atas
sudah **dibangun ulang** dengan id node baru (id lama di atas sudah basi/tidak berlaku — cari
ulang lewat nama kalau perlu id pastinya).

**Mitigasi baru (berlaku seterusnya)**: setiap 1 use case/lane selesai dibangun DAN
diverifikasi (`Get`+bounds, bukan cuma laporan agent), langsung `git add` (scope: cuma
`assets/design/mobile.pen`, jangan `git add -A`) + commit + `git push` ke `origin/master` saat
itu juga — jangan tunggu semua lane selesai. Ini membatasi kerugian ke maksimal 1 lane yang
belum ter-commit kalau kanvas kehapus lagi, bukan seluruh kerjaan. Catatan teknis: file
on-disk `mobile.pen` yang di-`git diff` kadang **lag beberapa detik-menit** di belakang state
live kanvas (bukan langsung ter-flush tiap edit) — kalau `git add` tidak menghasilkan diff
padahal baru saja menyelesaikan lane baru, JANGAN asumsikan lane-nya hilang; tunggu file
`mtime` berubah dulu (poll `stat -c %Y`), baru commit.

**Perluasan scope (2026-09-25)**: user menunjukkan kalau 1 feature bisa punya 1-10 usecase,
dan ada ~50 feature di roadmap ⇒ potensi 50-500 usecase total. Kesepakatan: 1 usecase PRIMARY
per feature dulu (bukan exhaustive 10/feature), prioritaskan feature yang SUDAH punya UI nyata
di app (grounded via screenshot asli) di atas feature yang masih murni roadmap/belum
dibangun. Lanjutan lane (round 2, y mulai 26400, stride 3750 tetap) — semua dibangun via
agent paralel + commit-per-lane:

8. **Baca Doa Harian** (y=26400) — Beranda → tab Ibadah → Ibadah hub (Harian) → tap "Doa" →
   layar baru "Doa - Modern" (filter kategori, kartu-kartu doa).
9. **Baca Asmaul Husna** (y=30150) — Beranda → tab Ibadah → Ibadah hub (Dzikir & Bacaan) → tap
   "Asmaul Husna" → layar baru "Asmaul Husna - Modern" (search, filter, kartu nama).
10. **Gunakan Tasbih Digital** (y=33900) — Beranda → tab Ibadah → Ibadah hub (Alat) → tap
    "Tasbih" → layar baru "Tasbih - Modern" (counter besar, target, pilih dzikir).
11. **Hitung Zakat** (y=37650) — Beranda → tab Ibadah → Ibadah hub (Alat) → tap "Zakat" →
    layar baru "Zakat - Modern" (jenis zakat, input harta, hasil perhitungan).
12. **Hitung Waris (Faraidh)** (y=41400) — Beranda → tab Ibadah → Ibadah hub (Alat) → tap
    "Faraidh" → layar baru "Faraidh - Modern" (harta & pengurang, ahli waris, hasil
    pembagian).
13. **Baca Tafsir Al-Qur'an** (y=45150) — Beranda → tab Belajar → Belajar hub (Referensi) →
    tap "Tafsir" → layar baru "Tafsir - Modern" (daftar surah) → tap surah → layar baru
    "Tafsir Detail - Modern" (ayat + terjemahan + tafsir ringkas).
14. **Baca Siroh Nabawiyah** (y=48900) — Beranda → tab Belajar → Belajar hub (Siroh &
    Sejarah) → tap "Siroh" → layar baru "Siroh - Modern" (daftar peristiwa, pakai komponen
    baru `Siroh/EventCard`) → tap peristiwa → layar baru "Siroh Detail - Modern" (narasi
    lengkap 1 peristiwa).
15. **Baca Fiqh Ringkas** (y=52650) — Beranda → tab Belajar → Belajar hub (Fiqh & Panduan) →
    tap "Fiqh Ringkas" → layar baru "Fiqh Ringkas - Modern" (daftar topik) → tap topik →
    layar baru "Fiqh Detail - Modern" (penjelasan 1 topik, contoh: Thaharah).

**Catatan penting round 2**: beberapa tile (Zakat, Faraidh) namanya di file screenshot
tertulis "belajar" tapi tap path sebenarnya di app adalah **Ibadah hub → section Alat** —
sudah diverifikasi via `Get` struktur hub, bukan cuma nebak dari nama file. Kalau nambah lane
baru dan nama file screenshot ambigu, selalu cross-check ke struktur hub asli dulu.

**Belum digarap (kandidat round 3+)**: Komunitas, Blog/Artikel, Radio Islam, Leaderboard,
Muhasabah/Jurnal, Kamus, Imsakiyah, Wirid Saya, Khatam, Modul & Kelas/Lessons Detail (semua
sudah punya screenshot asli, tinggal dibangun) — plus tile tanpa screenshot dedicated
(Hafalan, Jurnal quick-action, Statistik, Bookmark, Catatan, Target Belajar, Log Sholat,
Manasik, Kalender Hijriah, Masjid, Dzikir, Wirid non-Saya, Lainnya).

Semua HandoffCard pakai instance (`ref`) dari komponen `Flow/HandoffCard` (id `epPoG`, definisi
diparkir di `x=-600,y=-600` — JANGAN pindah/edit definisinya langsung, lihat gotcha #1).

## Sistem desain

- Theme axis: `SetVariables` pakai `theme: {style: "classic"}` vs `{style: "modern"}`.
  Classic = cream/parchment, sage-green, font Lora (serif). Modern = putih/slate, emerald,
  font Manrope.
- Token warna/spacing/radius: `bg`, `surface`, `border`, `ink`, `text-secondary`, `primary`,
  `primary-foreground`, `accent`, `accent-foreground`, `chip-fill`, `highlight-fill`,
  `tabbar-fill`, `shadow-color`, `radius-card`, `radius-tile`, `radius-pill`, `shadow-blur`,
  `shadow-offset-y`, `font-heading`, `font-body`, `gap-lg/md/sm`, `pad-screen`, `pad-card`.
  Cek nilai aktual & komponen yang ada lewat `GetVariables()` dan sweep
  `Get(n => n.reusable && Print(n.id, n.name))` — jangan asumsi ID node dari dokumen ini,
  ID di-generate random tiap kali dibuat dan bisa beda.
- Komponen reusable yang sudah ada (nama, bukan ID — cari ID-nya live): `Button/Primary`,
  `Button/IconOnly`, `Card`, `Section/Header`, `QuickAction/Tile`, `TabBar/Item`, `TabBar`,
  `Prayer/TimeChip`, `MiniReadingCard`, `Quran/SurahRow`, `Hub/Tile`, `Hub/Row`, `Filter/Pill`,
  `Hadis/BookCard`, `Hadis/RowCard`. Pakai ulang salah satu dari ini kalau kontennya cocok,
  daripada bikin frame mentah baru — lebih konsisten dan (lihat gotcha di bawah) lebih jarang
  kena bug render.
- Layout kanvas: komponen dikelompokkan di area atas (y negatif) berdasar ukuran — Icon
  Kecil / Icon-Tile Sedang / Komponen — masing-masing baris Classic lalu baris Modern di
  bawahnya. Layar disusun grid di bawahnya (y positif), kolom per fitur, baris Classic di atas
  (y≈932) dan baris Modern jauh di bawahnya (y≈4600, dikasih buffer besar karena beberapa
  layar seperti Belajar bisa setinggi ~3300px — kalau nambah layar baru yang jauh lebih
  tinggi dari itu, geser baris Modern lebih jauh lagi daripada nabrak).

## Use Case + UI Flow diagram (rules desain wajib)

Setiap alur/fitur baru yang didesain di file ini **harus** didokumentasikan sebagai diagram
Use Case + UI Flow, bukan cuma screen lepas berdiri sendiri — ini permintaan eksplisit user,
jadi berlaku ke semua pekerjaan berikutnya di `mobile.pen`, tidak cuma dua contoh yang sudah
ada.

Bentuknya (contoh yang sudah ada: alur "Baca Surah Al-Qur'an" dan "Baca Hadis", area kanvas
mulai `x≈4910`):

- Header 2 kolom di baris paling atas: teks **"USE CASE"** (kiri) dan **"UI AND FLOW"**
  (kanan), dipisahkan garis vertikal pendek + garis horizontal (underline) — **cuma
  setinggi header**, jangan dibuat garis panjang menembus ke bawah, karena akan numpuk
  sama connector line di lane manapun.
- Tiap alur = satu "lane" horizontal, isinya:
    1. Kartu hijau `Flow/HandoffCard` (reusable, di kolom "Use Case") — badge HAND-OFF,
       judul use case, deskripsi singkat alurnya, "Person in Charge".
    2. Connector: titik kecil (ellipse) + garis tipis + icon `chevron-right`, jangan
       ditempel pas di tepi card (kasih jarak ~8px) supaya tidak numpuk sama border card.
    3. Screen-screen yang terlibat, disusun berurutan sesuai urutan tap user, masing-masing
       dihubungkan connector yang sama.
- **Screen di dalam lane HARUS hasil `Copy()` dari screen yang sudah ada di grid utama**,
  bukan dibangun ulang dari nol — supaya konsisten dan menghindari bug render `Insert()`
  mentah (lihat gotcha #3 di bawah).
- Spasi antar lane: hitung dari tinggi konten lane sebelumnya yang sebenarnya (`Get` +
  `ctx.bounds`), jangan menebak — dua kali kejadian jarak lane kelebihan (~580px kosong)
  karena ditebak asal, bukan diukur.

**Gotcha khusus bagian ini** — sudah dua kali kejadian (`Quran/AyatCard`, lalu
`Flow/HandoffCard`): begitu selesai `Copy()` dari sebuah komponen reusable buat pertama
kali, **langsung pindahkan definisi aslinya** ke area "sumber" yang aman (misal
`y` jauh negatif dari lane manapun) di eksekusi yang sama — jangan ditunda, karena definisi
yang dibiarkan di posisi awal gampang numpuk persis di bawah instance pertama yang baru
dibuat, dan gak kelihatan sampai user zoom in manual.

## Gotcha pen.dev (mahal ditemukan ulang, baca sebelum kerja)

1. **JANGAN PERNAH set `theme` langsung di definisi komponen reusable** (node yang
   `reusable: true`). Ini bukan cuma mengubah tampilan preview definisinya — SEMUA instance
   (`ref`) ke komponen itu di seluruh dokumen ikut kepaksa pakai theme itu, termasuk di layar
   tema lain. Ini bikin semua layar Modern sempat ke-render pakai warna Classic. Kalau butuh
   preview satu komponen dalam kedua tema, buat **instance (`ref`) terpisah** dengan `theme`
   di-set di instance-nya, biarkan definisi aslinya theme-neutral (`theme: {}` atau tidak
   di-set sama sekali — otomatis fallback ke branch tema pertama yang dideklarasikan saat
   preview berdiri sendiri, tanpa mempengaruhi instance lain).
2. **`TakeScreenshot` sering blank/pudar kalau dipanggil di call yang sama dengan
   `Update(..., {placeholder:false})`** yang baru saja menyelesaikan section itu — selalu
   screenshot di call terpisah setelahnya. Bahkan di call terpisah, kadang masih blank/pudar
   dan butuh **2-6x retry** sebelum akhirnya render benar (tampaknya delay render backend,
   bukan bug data — verifikasi data lewat `Get(id, {depth}, ...)` + `ctx.bounds` kalau
   screenshot terus gagal, jangan langsung asumsi desainnya rusak).
3. Kalau blank/pudar itu **tidak kunjung membaik** setelah banyak retry (beda dari kasus di
   atas yang biasanya sembuh sendiri), coba `Copy()` dari komponen yang sudah terbukti render
   benar lalu override lewat `descendants`, daripada `Insert()` frame mentah baru — pola ini
   pernah jadi workaround yang konsisten berhasil saat `Insert()` mentok.
4. **Nama icon lucide sering meleset dari tebakan**: `home` → pakai `house`, `clock` → pakai
   `timer`. `Mosque` malah tidak ada sama sekali di `lucide-react-native` versi yang kepasang
   di app (ini yang sampai bikin app asli crash — lihat
   [baseline review](./reviews/2026-09-24-mobile-app-screenshot-baseline.md)). Selalu perhatikan
   "issues detected" di response `execute` dan benerin icon yang invalid di call berikutnya.
5. Screenshot layar penuh: untuk layar dashboard/varied (banyak komponen beda ditumpuk),
   screenshot 1 viewport gak cukup — perlu full-page (scroll+stitch). Untuk list homogen
   berulang (114 surah Quran, dst.), 1 viewport cukup, jangan discroll semua — dashboard =
   scroll penuh, list = 1 layar saja.
6. **`TakeScreenshot` di node DEFINISI komponen reusable (`reusable:true`) sendiri sering
   blank permanen**, walaupun instance (`ref`) ke komponen itu render sempurna. Ini bukan
   bug data — selalu verifikasi lewat screenshot instance/ref-nya, bukan definisinya
   langsung.
7. Icon di connector/flow diagram pakai icon set **"Material Symbols Rounded"**, beda dari
   icon set yang dipakai kode app asli (`lucide-react-native`, lihat gotcha #4). Nama icon
   di sini snake_case (`chevron_right`, `bar_chart`, `notifications`), bukan kebab-case
   ala lucide (`chevron-right`). Cek "issues detected" di response `execute` seperti biasa.
8. **`layoutPosition: "absolute"` di dalam frame yang punya `clip: true`, jangan dipakai**
   buat overlay/dropdown/popover di atas screen lain — konsisten gagal render total (bukan
   soal retry, data & bounds benar tapi children-nya beneran invisible). Kalau butuh
   menampilkan state popover/menu/dropdown di flow diagram, buat sebagai frame top-level
   terpisah (mandiri, kayak `Flow/HandoffCard`) alih-alih overlay di atas screenshot screen
   lain.
9. Kadang satu subtree tertentu **tetap blank di `TakeScreenshot` walau sudah >6x retry
   DAN sudah dibangun ulang dari nol dengan id baru** — sementara node lain yang dibuat
   persis sesudahnya di file yang sama render normal. Kejadian ini kebetulan bertepatan
   dengan beberapa agent lain sedang jalan bareng (paralel) di file yang sama — dugaan kuat
   ini kontensi di render backend, bukan data rusak (selalu dobel-cek lewat `Get`+`ctx.bounds`
   dulu sebelum menyimpulkan). Kalau ini terjadi: jangan buang banyak retry, catat node id-nya,
   lanjut kerjaan lain, lalu screenshot ulang setelah beban paralel selesai/berkurang.
10. **Workaround lain buat blank persisten (terbukti berhasil di beberapa agent round 2)**:
    kalau screen baru tetap blank walau bounds-nya sudah benar, `Copy()` seluruh screen itu ke
    posisi (x,y) yang SAMA PERSIS, lalu `Delete()` versi originalnya — hasil copy-nya biasanya
    langsung render normal. Lebih murah daripada rebuild dari nol.
11. **Jangan `Insert()` langsung ke path slot instance** (`instanceId + "/slotChildId"`) — ini
    silently succeeds (gak ada error) tapi kontennya gak pernah muncul. Pola yang benar:
    `Replace(instanceId + "/slotChildId", {...frame baru...})` dulu, baru `Insert()` ke id hasil
    `Replace`-nya.
12. Field warna semantik yang belum ada token-nya (misal warning/amber buat kartu peringatan)
    boleh pakai hex literal langsung (`#FFFBEB` dst.) — jangan bikin token variabel baru cuma
    buat 1 pemakaian, dan jangan maksa pakai token existing yang gak sesuai maknanya.
13. **Nama tile di file screenshot vs tap path asli bisa beda** (misal `modern-belajar-zakat.png`
    tapi Zakat sebenarnya tile Ibadah hub, bukan Belajar) — screenshot dipakai buat grounding
    KONTEN, tapi tap path/entry point tetap harus diverifikasi dari struktur hub asli
    (`Get` pada `EBKk2`/`yOkbK` dst.), jangan nebak dari nama file semata.
14. **Disiplin recovery kalau kanvas kehapus lagi (sudah kejadian 2x)**: jangan langsung
    rebuild — verifikasi dulu satu-satu via `Get(id)` per node yang seharusnya ada (bukan cuma
    beberapa sampel), baru simpulkan seberapa parah. Begitu rebuild selesai per-lane, langsung
    commit+push (lihat catatan insiden #2 di section Status) sebelum lanjut ke lane berikutnya.
