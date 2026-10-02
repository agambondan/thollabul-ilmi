# Tafsir Data Rendering

Status: `VERIFIED_STRUCTURAL`
Priority: `P0`
Tanggal: `2026-05-14`

## Objective

Memastikan data tafsir yang sudah tersedia di API tampil di web dan mobile, bukan
terlihat kosong karena UI membaca field yang salah.

## Scope Slice Ini

- Web public tafsir dan dashboard tafsir memakai helper `tafsirContent` untuk
  membaca bentuk data nested dari API.
- Mobile Belajar > Tafsir menampilkan kartu ayat dengan teks Arab, terjemahan,
  `Tafsir Jalalain`, dan `Tafsir Quraish Shihab`.
- Card tafsir mobile sekarang menjadi preview; tap card membuka halaman detail
  penuh agar tafsir panjang lebih nyaman dibaca.
- Copy teknikal di mobile tafsir diganti menjadi wording produk yang lebih
  natural.
- Selector surah tafsir mobile tidak lagi terbatas 12 surah awal; layar awal
  menampilkan pilihan ringkas dan surah lain bisa dicari lewat input.
- Seeder tafsir sekarang bisa mengisi ulang row yang sudah ada tetapi belum
  punya translation tafsir, sehingga DB partial tidak tertinggal kosong.
- Endpoint tafsir per surah sekarang menerima `limit` dan `offset`, sehingga
  mobile bisa mengambil data ayat bertahap dan infinite scroll tidak perlu
  memuat seluruh surah panjang sekaligus.
- Endpoint tafsir per surah juga mendukung response meta opt-in via `meta=1`,
  dengan `has_more` dan `next_offset` agar mobile tidak menebak akhir data.

## Evidence

- `curl -fsS --max-time 3 http://localhost:9900/api/v1/tafsir/surah/1`
  mengembalikan 7 ayat dengan teks Arab, Jalalain, dan Quraish.
- `node --check apps/mobile/src/api/explore.js`
- `node --check apps/mobile/src/screens/ExploreScreen.js`
- `node --check apps/web/src/lib/tafsirContent.js`
- `node --check apps/web/src/app/tafsir/[slug]/page.js`
- `node --check apps/web/src/app/dashboard/tafsir/[slug]/page.js`
- `cd services/api && go test ./app/db/migrations ./app/repository ./app/services`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-tafsir-mobile-polish-export`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-tafsir-mobile-polish-export-2`
- `node --check apps/mobile/src/screens/ExploreScreen.js`
- `cd apps/web && npm run lint`
- `git diff --check`
- `adb shell am start -a android.intent.action.VIEW -d exp://10.102.116.208:19007/--/belajar/tafsir`
- `adb exec-out screencap -p > /tmp/thollabul-tafsir-mobile-selector.png`
- `cd services/api && go test ./app/repository ./app/services ./app/controllers ./app/http`
- `node --check apps/mobile/src/api/explore.js`
- `node --check apps/mobile/src/screens/ExploreScreen.js`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-infinite-scroll-export`
- `cd apps/mobile && npx expo export --platform android --dev --output-dir /tmp/thollabul-mobile-pagination-flatlist-export`

## Remaining

- Device smoke konten tafsir perlu dicek manual setelah memilih surah, karena
  `adb shell input tap` diblok device dengan `INJECT_EVENTS`.
- Device belum terdeteksi di `adb devices` saat slice pagination/FlatList ini
  diverifikasi, jadi runtime smoke ditunda sampai HP tersambung lagi.
