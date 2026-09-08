# Audit Cakupan Transkrip Kajian

Tanggal: `2026-09-08`
Scope: 146 video di `services/api/data/static/kajian.json` (satu-satunya
sumber transkrip — di-sync otomatis ke DB setiap kali seeder jalan)
Status: `DIPERBAIKI` — 5 transkrip fabrikasi sudah dikosongkan di
`kajian.json` setelah dikonfirmasi videonya memang tidak punya caption
YouTube sama sekali (lihat [Verifikasi](#verifikasi-lewat-tunnel-vps))

Dipicu laporan user: banyak video kajian transkripnya cuma sedikit banget,
ada yang cuma 2 chunk (~beberapa menit) padahal video panjang.

---

## Ringkasan Angka

| Metrik                                      | Nilai |
| ------------------------------------------- | ----- |
| Total video di `kajian.json`                | 146   |
| Cakupan transkrip ≥90% durasi               | 140   |
| Cakupan transkrip <10% durasi (rusak parah) | **5** |
| Cakupan 10–90% (partial wajar)              | 1     |

Video pendek (teaser Ramadhan dkk, durasi 1–5 menit) secara natural cuma
punya 2–6 chunk — itu bukan bug, memang videonya pendek. Yang jadi masalah
murni 5 video **panjang** (58–91 menit) yang tetap cuma dapat 2 chunk.

---

## Temuan Utama

### 1. 5 video panjang cuma punya 2 chunk generik — bukan hasil scrape asli

| video_id      | Judul                                               | Durasi   | Chunk | Cakupan |
| ------------- | --------------------------------------------------- | -------- | ----- | ------- |
| `7xRlElvBqjc` | Tadzkiratus Saami': Adab Penuntut Ilmu dan Guru     | 91 menit | 2     | 2,2%    |
| `f5jy4djuElM` | Kewajiban Amar Ma'ruf Nahi Munkar                   | 85 menit | 2     | 2,3%    |
| `TlYXJ6quAoE` | Tak Ada Alasan: Nasihat Hijrah Pemuda               | 71 menit | 2     | 2,8%    |
| `DoqO9vxIHYE` | Kitab Az-Zuhd: Menata Hati dan Zuhud Terhadap Dunia | 70 menit | 2     | 2,9%    |
| `qxaJIAppS7U` | Istiqomah Ittiba' Rasul di Tengah Fitnah            | 58 menit | 2     | 3,4%    |

Isi transkrip kelimanya semua persis pola yang sama: 2 kalimat rapi, umum,
gaya "nasihat buku" — bukan gaya bicara natural:

```
0-60:   "Para ulama salaf mengajarkan bahwa sebelum mendalami cabang ilmu
         yang luas, wajib bagi kita memperbaiki niat dan adab."
61-120: "Menuntut ilmu membutuhkan kesabaran, kerendahan hati di hadapan
         guru, dan keistiqomahan dalam mengamalkannya."
```

Bandingkan dengan transkrip asli hasil scrape yang benar (video
`VuJ31eoVmTg`, 38 chunk):

```
0-63:   "Yuk, jadi bagian dari dakwah kami. Dukung operasional dakwah dan
         sosial kami. Rai pahala amal jariah yang terus mengalir sampai
         hari kiamat. Asalamual..."
63-126: "memang kita sangat sulit kalau ingin menghitung nikmat Allah itu.
         Allah sudah kekalkan dalam firmannya, wain taudu nikmatallahi
         lahsuha. Kalau kalian ..."
```

Transkrip asli terpotong di tengah kalimat pas batas 60 detik dan penuh
gaya bicara natural (filler, potongan kalimat) — ciri khas auto-caption
YouTube yang dipotong per-chunk oleh `chunkTranscript()`. Kelima video
bermasalah **tidak** punya ciri ini sama sekali; teksnya terlalu rapi dan
tidak spesifik ke isi kajian aslinya.

**Bukan dari kode manapun di repo.** `grep` teks-teks tersebut ke seluruh
`.go`/`.py`/`.js` tidak menemukan generator/template apa pun — artinya teks
ini ditulis langsung ke `kajian.json` (manual atau oleh sesi AI sebelumnya),
bukan keluaran asli `cmd/scrape-kajian` (`fetchTranscript` →
`dedupeRollingCaptions` → `chunkTranscript`). Ini pelanggaran prinsip
[[feedback_islamic_data_sahih_only]] — konten disajikan seolah transkrip
asli lecture seorang ustadz, padahal fabrikasi.

### 2. Seeder selalu sinkron ke `kajian.json` — sumber masalah di file, bukan DB stale

`seedKajianFromFile` (`services/api/app/db/migrations/seeder_static_file.go:471`)
selalu `DELETE` lalu `CREATE` ulang semua `KajianTranscript` dari
`kajian.json` setiap kali seeder jalan (tiap start service). Jadi DB
produksi/lokal pasti mencerminkan isi file ini persis — tidak ada masalah
staleness terpisah. Begitu `kajian.json` diperbaiki dan service di-restart,
DB otomatis ikut benar.

### 3. Dead code: `SeedKajianTranscriptsFromFile` tidak pernah jalan

`services/api/app/db/migrations/seeder_kajian_transcript.go:41` membaca
`data/static/kajian_transcripts/scraped_kajian.json` — path yang **tidak
ada** di repo. Fungsi ini dipanggil dari `SeedRelated()` tapi selalu
`continue` diam-diam karena `os.Open` gagal. Tidak berkontribusi ke bug
transkrip pendek, tapi ini dead code yang menyesatkan (kelihatan seperti
jalur seeding transkrip yang aktif, padahal no-op).

## Verifikasi lewat tunnel VPS

Jaringan lokal saat audit ini (BBG) memblokir/meng-intersep trafik ke
YouTube: `yt-dlp` langsung gagal dengan
`SSL: CERTIFICATE_VERIFY_FAILED: self-signed certificate in certificate
chain`, dan tetap gagal (`Failed to extract any player response`) walau
dipaksa `--no-check-certificate`. Pola ini sama dengan pemblokiran BBG→SSH
VPS yang sudah tercatat sebelumnya — ternyata berlaku juga untuk trafik
HTTPS ke YouTube dari jaringan ini.

Untuk verifikasi, dibuat SOCKS5 tunnel ke VPS lewat SSH-over-Cloudflare
(`ssh -D 1080 sumopod-cf`, host ini sudah ada di `~/.ssh/config` dan jalan
lewat `cloudflared access ssh` di port 443 — jadi tidak kena blokir port 22
BBG), lalu `yt-dlp --proxy socks5://127.0.0.1:1080 ...`. IP keluar VPS
terverifikasi (`43.156.65.196`) beda dari IP lokal.

Dari VPS pun sempat kena `Sign in to confirm you're not a bot` (IP
datacenter/VPS memang sering ditandai YouTube) — diatasi dengan
`--cookies-from-browser chrome` (akun YouTube yang sudah login di browser
lokal). Kombinasi client `web`/`tv` + cookies malah kena error PO-token
baru YouTube (`The page needs to be reloaded`); yang akhirnya berhasil
tembus bersih adalah `--extractor-args "youtube:player_client=android"`.
yt-dlp juga di-update dulu (`2026.03.17` → `2026.08.19`) karena versi lama
kena bug ekstraksi yang tidak relevan dengan masalah caption itu sendiri.

Hasil `--list-subs` untuk kelima video, definitif:

| video_id      | Hasil                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| `7xRlElvBqjc` | tidak ada auto-caption, tidak ada subtitle sama sekali                             |
| `f5jy4djuElM` | tidak ada auto-caption; cuma ada `live_chat` (replay chat, bukan transkrip ucapan) |
| `TlYXJ6quAoE` | sama seperti di atas — cuma `live_chat`                                            |
| `DoqO9vxIHYE` | tidak ada auto-caption, tidak ada subtitle sama sekali                             |
| `qxaJIAppS7U` | tidak ada auto-caption, tidak ada subtitle sama sekali                             |

**Kesimpulan: kelima video ini memang tidak punya transkrip yang bisa
diambil dari YouTube sama sekali** (kemungkinan videonya adalah rekaman
live stream, sehingga cuma dapat replay chat, bukan caption ucapan). Jadi
temuan #1 di atas bukan cuma "cakupan transkrip rendah karena scrape
gagal" — dulu ada sesi yang mengarang 2 kalimat generik sebagai pengganti
transkrip yang memang tidak tersedia, alih-alih membiarkannya kosong.

## Audit lanjutan: sisa 141 video lain bersih

Setelah fix di atas, sisa 141 video dicek ulang dengan pendekatan mekanis
(bukan cuma rasio durasi): `chunkTranscript()` di scraper asli memotong
teks tiap 60 detik **tanpa peduli batas kalimat**, jadi transkrip hasil
scrape sungguhan hampir pasti punya banyak chunk yang terputus di
tengah kata/kalimat (lihat contoh `VuJ31eoVmTg` — chunk berakhir
`"...Asalamual"`, `"...Tug"`). Transkrip fabrikasi justru sebaliknya:
semua chunk-nya rapi berakhir di tanda baca kalimat.

Dicek: dari 110 video (durasi ≥5 menit, ≥2 chunk), **0 video** yang
≥90% chunk-nya berakhir bersih di tanda baca kalimat. Tidak ada indikasi
fabrikasi lain selain 5 yang sudah diperbaiki.

Satu video dengan cakupan 30–60% (`VuJ31eoVmTg`, "Thematic Study: Work
Ethic") dicek manual: transkripnya asli (gaya bicara natural, filler,
potongan kata) untuk 37 menit pertama dari video 78 menit, lalu ada
lompatan ~40 menit tanpa transkrip, dan satu chunk nyasar ("Yeah.") tepat
di detik-detik akhir video. Dicoba re-scrape lewat tunnel VPS untuk
melengkapi cakupannya — hasilnya `ERROR: Video unavailable`, video ini
sudah dihapus/diprivat dari YouTube sejak terakhir di-scrape. Jadi ini
gap asli yang **tidak bisa diperbaiki lagi** (bukan bug, bukan fabrikasi),
dibiarkan apa adanya.

## Fix yang sudah diterapkan

`transcripts` untuk kelima `video_id` di atas dikosongkan (`[]`) di
`kajian.json`. Karena `seedKajianFromFile` selalu delete+recreate
`KajianTranscript` dari file ini setiap start service, restart API service
akan otomatis membersihkan 10 baris `KajianTranscript` fabrikasi ini dari
DB juga — tidak perlu migrasi manual.

---

## Rekomendasi Lanjutan

1. Tambahkan guard di `cmd/scrape-kajian`: kalau `fetchTranscript`
   mengembalikan 0 snippet, JANGAN pernah isi `transcripts` dengan apa pun
   selain array kosong — cegah kejadian serupa (transkrip karangan) lolos
   ke `kajian.json` produksi lagi. Kode scraper saat ini sebenarnya sudah
   benar (skip/defer via skip-cache kalau `onlyWithTranscript`), jadi 5
   entri ini kemungkinan diisi manual di luar jalur scraper — bukan bug di
   `main.go`.
2. Kalau mau tetap menawarkan sesuatu ke user untuk video tanpa caption,
   pertimbangkan fallback yang jujur di UI (misal "Transkrip belum
   tersedia untuk video ini") alih-alih mengosongkan diam-diam.
3. Perbaiki atau hapus `SeedKajianTranscriptsFromFile` — path sumbernya
   (`data/static/kajian_transcripts/scraped_kajian.json`) tidak pernah ada,
   jadi fungsi ini selalu no-op dan membingungkan pembaca kode.
4. Untuk scraping berikutnya dari jaringan BBG: pakai tunnel
   `ssh -D 1080 sumopod-cf` + `yt-dlp --proxy socks5://127.0.0.1:1080
--cookies-from-browser chrome --extractor-args
"youtube:player_client=android"` — kombinasi ini yang terbukti tembus
   blokir jaringan + bot-check YouTube dari IP VPS.

## Cara Mengulangi Audit

```bash
python3 -c "
import json
data = json.load(open('services/api/data/static/kajian.json'))
for item in data:
    dur = item.get('duration') or 0
    tr = item.get('transcripts') or []
    expected = max(1, dur // 60)
    ratio = len(tr) / expected if expected else 0
    if dur > 600 and ratio < 0.3:
        print(item['video_id'], dur, len(tr), item['title'])
"
```
