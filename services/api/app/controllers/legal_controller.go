package controllers

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/gofiber/fiber/v2"
)

type LegalPageResponse struct {
	Title   string `json:"title"`
	Slug    string `json:"slug"`
	Content string `json:"content"`
	Updated string `json:"updated_at"`
}

func GetPrivacyPolicy(c *fiber.Ctx) error {
	return lib.OK(c, LegalPageResponse{
		Title:   "Kebijakan Privasi - Thullaabul Ilmi",
		Slug:    "privacy-policy",
		Content: privacyPolicyMD,
		Updated: "2024-01-01",
	})
}

func GetTermsOfService(c *fiber.Ctx) error {
	return lib.OK(c, LegalPageResponse{
		Title:   "Syarat & Ketentuan - Thullaabul Ilmi",
		Slug:    "terms-of-service",
		Content: termsOfServiceMD,
		Updated: "2024-01-01",
	})
}

func GetDataDeletion(c *fiber.Ctx) error {
	return lib.OK(c, LegalPageResponse{
		Title:   "Penghapusan Data - Thullaabul Ilmi",
		Slug:    "data-deletion",
		Content: dataDeletionMD,
		Updated: "2024-01-01",
	})
}

func PrivacyPolicyHTMLHandler(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.SendString(PrivacyPolicyHTML)
}

func TermsOfServiceHTMLHandler(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.SendString(TermsOfServiceHTML)
}

const PrivacyPolicyHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kebijakan Privasi - Thullaabul Ilmi</title>
  <style>
    :root { --primary: #065f46; --accent: #d97706; --bg: #f8fafc; --text: #1e293b; --card: #ffffff; --border: #e2e8f0; }
    @media (prefers-color-scheme: dark) { :root { --bg: #0f172a; --text: #f1f5f9; --card: #1e293b; --border: #334155; } }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.65; margin: 0; padding: 24px 16px; }
    .container { max-width: 800px; margin: 0 auto; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    h1 { color: var(--primary); font-size: 28px; border-bottom: 2px solid var(--border); padding-bottom: 12px; margin-top: 0; }
    h2 { color: var(--primary); font-size: 20px; margin-top: 28px; }
    h3 { font-size: 16px; margin-top: 18px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    th, td { border: 1px solid var(--border); padding: 10px 12px; text-align: left; }
    th { background: rgba(6, 95, 70, 0.08); font-weight: 600; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
    code { background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: monospace; }
    .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid var(--border); font-size: 13px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Kebijakan Privasi — Thullaabul Ilmi</h1>
    <p><strong>Berlaku sejak:</strong> 1 Januari 2024 &nbsp;|&nbsp; <strong>Versi:</strong> 1.0 &nbsp;|&nbsp; <span class="badge">100% Bebas Iklan</span></p>

    <h2>1. Ringkasan & Komitmen Privasi</h2>
    <p>Thullaabul Ilmi ("kami", "aplikasi") menghormati privasi Anda. Aplikasi ini:</p>
    <ul>
      <li><strong>Tidak menjual atau membagikan data Anda ke pihak ketiga untuk iklan</strong></li>
      <li><strong>Tidak menampilkan iklan komersial</strong></li>
      <li>Data preferensi dan progres belajar disimpan secara lokal di perangkat Anda</li>
      <li>Izin lokasi bersifat opsional, hanya dipakai menghitung waktu sholat & arah kiblat</li>
    </ul>

    <h2>2. Data yang Dikumpulkan</h2>
    <table>
      <thead>
        <tr><th>Jenis Data</th><th>Tujuan</th><th>Penyimpanan</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>Lokasi GPS</strong> (Opsional)</td><td>Menghitung waktu sholat & arah kiblat secara akurat</td><td>Lokal saat app dibuka, tidak disimpan di server</td></tr>
        <tr><td><strong>Akun / Email</strong> (Opsional)</td><td>Sinkronisasi bookmark, progres khatam & catatan multi-device</td><td>Server (terenkripsi TLS/bcrypt)</td></tr>
        <tr><td><strong>Notifikasi</strong></td><td>Reminder jadwal sholat & dzikir harian</td><td>FCM Token (Google)</td></tr>
        <tr><td><strong>Data Lokal</strong></td><td>Progress Qur'an, hafalan, muroja'ah, tema UI</td><td>Expo SecureStore / SQLite di perangkat</td></tr>
      </tbody>
    </table>

    <h2>3. Izin Android yang Digunakan</h2>
    <ul>
      <li><code>ACCESS_FINE_LOCATION</code> / <code>ACCESS_COARSE_LOCATION</code>: Menghitung jadwal sholat dan kiblat berbasis koordinat GPS.</li>
      <li><code>POST_NOTIFICATIONS</code>: Mengirim notifikasi adzan dan pengingat ibadah (Android 13+).</li>
      <li><code>INTERNET</code>: Sinkronisasi data konten Islam dan akun (bila login).</li>
      <li><code>VIBRATE</code>: Umpan balik getar pada fitur tasbih counter.</li>
    </ul>

    <h2>4. Hak Pengguna & Penghapusan Akun</h2>
    <p>Sesuai regulasi privasi (UU PDP Indonesia & GDPR), Anda berhak menghapus akun dan seluruh data terkait kapan saja melalui menu:</p>
    <p><strong>Profil &rarr; Keamanan &rarr; Hapus Akun</strong></p>
    <p>Atau kirim permintaan penghapusan data via email ke: <code>privacy@thullaabulilmi.site</code>.</p>

    <h2>5. Hubungi Kami</h2>
    <p>Jika ada pertanyaan terkait kebijakan privasi, silakan hubungi tim kami di:<br>
    Email: <strong>privacy@thullaabulilmi.site</strong><br>
    Pengembang: Firman Alamsyah (Jakarta, Indonesia)</p>

    <div class="footer">
      &copy; 2024 Thullaabul Ilmi. Hak Cipta Dilindungi.
    </div>
  </div>
</body>
</html>`

const TermsOfServiceHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Syarat & Ketentuan - Thullaabul Ilmi</title>
  <style>
    :root { --primary: #065f46; --bg: #f8fafc; --text: #1e293b; --card: #ffffff; --border: #e2e8f0; }
    @media (prefers-color-scheme: dark) { :root { --bg: #0f172a; --text: #f1f5f9; --card: #1e293b; --border: #334155; } }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.65; margin: 0; padding: 24px 16px; }
    .container { max-width: 800px; margin: 0 auto; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 32px 28px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    h1 { color: var(--primary); font-size: 28px; border-bottom: 2px solid var(--border); padding-bottom: 12px; margin-top: 0; }
    h2 { color: var(--primary); font-size: 20px; margin-top: 28px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 6px; }
    .footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid var(--border); font-size: 13px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Syarat & Ketentuan Penggunaan — Thullaabul Ilmi</h1>
    <p><strong>Berlaku sejak:</strong> 1 Januari 2024 &nbsp;|&nbsp; <strong>Versi:</strong> 1.0</p>

    <h2>1. Penerimaan Ketentuan</h2>
    <p>Dengan mengunduh, memasang, atau menggunakan aplikasi <strong>Thullaabul Ilmi</strong>, Anda menyetujui seluruh syarat dan ketentuan ini.</p>

    <h2>2. Penggunaan Aplikasi</h2>
    <ul>
      <li>Aplikasi ini disediakan gratis untuk keperluan ibadah, belajar, dan pencarian ilmu Islam pribadi non-komersial.</li>
      <li>Dilarang menyalahgunakan API, melakukan reverse engineering, atau mendistribusikan ulang aplikasi secara ilegal.</li>
    </ul>

    <h2>3. Konten & Keakuratan</h2>
    <p>Kami berupaya menyajikan Al-Qur'an, riwayat hadits shahih, dan jadwal sholat seakurat mungkin dari rujukan terpercaya. Namun, aplikasi ini disediakan "sebagaimana adanya" dan pengguna disarankan mengonfirmasi jadwal sholat dengan masjid atau muadzin setempat bila terdapat perbedaan kondisi lokal.</p>

    <h2>4. Kontak</h2>
    <p>Pertanyaan hukum & ketentuan dapat dikirimkan ke: <strong>legal@thullaabulilmi.site</strong></p>

    <div class="footer">
      &copy; 2024 Thullaabul Ilmi. Hak Cipta Dilindungi.
    </div>
  </div>
</body>
</html>`

const privacyPolicyMD = `# Kebijakan Privasi - Thullaabul Ilmi`
const termsOfServiceMD = `# Syarat & Ketentuan - Thullaabul Ilmi`
const dataDeletionMD = `# Panduan Penghapusan Data - Thullaabul Ilmi`
