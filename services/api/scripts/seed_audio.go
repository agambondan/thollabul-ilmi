//go:build ignore

// seed_audio.go — inject surah & ayah audio URLs ke database, lalu upload ke MinIO.
//
// CDN sumber: EveryAyah.com (per-ayah) + QuranicAudio (per-surah)
// Qari default: Mishary Rashid Al-Afasy
//
// Usage:
//
//	# Insert CDN URL langsung ke DB (tanpa upload MinIO)
//	go run scripts/seed_audio.go
//
//	# Download dari CDN, upload ke MinIO, lalu insert MinIO URL ke DB
//	go run scripts/seed_audio.go -minio
//
//	# Hanya surah-level audio (lebih cepat)
//	go run scripts/seed_audio.go -mode=surah
//
//	# Hanya ayah-level audio
//	go run scripts/seed_audio.go -mode=ayah
//
// Env vars (sama seperti API service):
//
//	DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
//	MINIO_ENDPOINT  (default: localhost:9020)
//	MINIO_ACCESS    (default: minioadmin)
//	MINIO_SECRET    (default: minioadmin)
//	MINIO_BUCKET    (default: thollabul-ilmi-audio)
//	MINIO_USE_SSL   (default: false)

package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/schema"

	"github.com/agambondan/islamic-explorer/app/model"
)

// ── Qari catalog ─────────────────────────────────────────────────────────────

type qariInfo struct {
	Name         string
	Slug         string
	EveryAyahDir string // directory name on everyayah.com
	QuranicAudio string // directory name on quranicaudio CDN
}

var qariCatalog = []qariInfo{
	{
		Name:         "Mishary Rashid Al-Afasy",
		Slug:         "mishary-rashid-alafasy",
		EveryAyahDir: "Alafasy_128kbps",
		QuranicAudio: "mishaari_raashid_al-`afaasee",
	},
	{
		Name:         "Abdurrahman As-Sudais",
		Slug:         "abdurrahman-as-sudais",
		EveryAyahDir: "Abdurrahmaan_As-Sudais_192kbps",
		QuranicAudio: "abdurrahmaan_as-sudays",
	},
	{
		Name:         "Abdul Basit Abdul Samad",
		Slug:         "abdul-basit",
		EveryAyahDir: "Abdul_Basit_Murattal_192kbps",
		QuranicAudio: "abdul_basit",
	},
	{
		Name:         "Saad Al-Ghamidi",
		Slug:         "saad-al-ghamidi",
		EveryAyahDir: "Saad_Al-Ghamidi_128kbps",
		QuranicAudio: "sa`d_al-ghaamidi",
	},
	{
		Name:         "Yasser Al-Dosari",
		Slug:         "yasser-al-dosari",
		EveryAyahDir: "Yasser_Ad-Dosari_128kbps",
		QuranicAudio: "yaasir_ad-dusaari",
	},
	{
		Name:         "Maher Al-Muaiqly",
		Slug:         "maher-al-muaiqly",
		EveryAyahDir: "Maher_Al-Muaiqly_128kbps",
		QuranicAudio: "maahir_ibnaa_`ali_haashim_ibn_`abdul_`aziiz_al-mu`ayqiliy",
	},
	{
		Name:         "Hani Ar-Rifai",
		Slug:         "hani-ar-rifai",
		EveryAyahDir: "Hani_Rifai_192kbps",
		QuranicAudio: "haani_ar-rifaa`i",
	},
	{
		Name:         "Salah Bukhatir",
		Slug:         "salah-bukhatir",
		EveryAyahDir: "Salah_Bukhatir_128kbps",
		QuranicAudio: "salaah_`abdul_`aziiz_bukhaatir",
	},
	{
		Name:         "Abdullah Al-Juhany",
		Slug:         "abdullah-al-juhany",
		EveryAyahDir: "Abdullah_Al_Juhany_128kbps",
		QuranicAudio: "abdullaah_`abdul_`aziiz_`abdullaah_aal-juhany",
	},
	{
		Name:         "Ali Abdurrahman Al-Hudhaify",
		Slug:         "ali-al-hudhaify",
		EveryAyahDir: "Ali_Bin_Abdur_Rahman_Al_Huthaify_128kbps",
		QuranicAudio: "`ali_ibn_`abd_ar-rahman_al-hudhaify",
	},
}

// ── URL builders ─────────────────────────────────────────────────────────────

// surahURL returns the QuranicAudio CDN URL for a full surah recitation.
func surahURL(q qariInfo, surahNum int) string {
	return fmt.Sprintf("https://download.quranicaudio.com/quran/%s/%03d.mp3", q.QuranicAudio, surahNum)
}

// ayahURL returns the EveryAyah CDN URL for a single ayah.
func ayahURL(q qariInfo, surahNum, ayahNum int) string {
	return fmt.Sprintf("https://everyayah.com/data/%s/%03d%03d.mp3", q.EveryAyahDir, surahNum, ayahNum)
}

// ── DB helpers ───────────────────────────────────────────────────────────────

func openDB() *gorm.DB {
	host := envOr("DB_HOST", "localhost")
	port := envOr("DB_PORT", "54320")
	user := envOr("DB_USER", "postgres")
	pass := envOr("DB_PASS", "postgres")
	name := envOr("DB_NAME", "thullabul_ilmi")
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		host, port, user, pass, name)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("DB connect gagal: %v", err)
	}
	return db
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// ── MinIO helpers ─────────────────────────────────────────────────────────────

type minioClient struct {
	mc     *minio.Client
	bucket string
	ctx    context.Context
}

func newMinioClient() *minioClient {
	endpoint := envOr("MINIO_ENDPOINT", "localhost:9020")
	access := envOr("MINIO_ACCESS", "minioadmin")
	secret := envOr("MINIO_SECRET", "minioadmin")
	bucket := envOr("MINIO_BUCKET", "thollabul-ilmi-audio")
	useSSL := envOr("MINIO_USE_SSL", "false") == "true"

	mc, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(access, secret, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalf("MinIO init gagal: %v", err)
	}

	ctx := context.Background()
	exists, err := mc.BucketExists(ctx, bucket)
	if err != nil {
		log.Fatalf("MinIO BucketExists gagal: %v", err)
	}
	if !exists {
		if err := mc.MakeBucket(ctx, bucket, minio.MakeBucketOptions{}); err != nil {
			log.Fatalf("MinIO MakeBucket %s gagal: %v", bucket, err)
		}
		log.Printf("[minio] bucket '%s' dibuat", bucket)
	}
	return &minioClient{mc: mc, bucket: bucket, ctx: ctx}
}

// uploadFromURL downloads srcURL and uploads to MinIO at objectKey.
// Returns the public MinIO URL.
func (m *minioClient) uploadFromURL(srcURL, objectKey string) (string, error) {
	resp, err := http.Get(srcURL)
	if err != nil {
		return "", fmt.Errorf("download %s: %w", srcURL, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download %s: HTTP %d", srcURL, resp.StatusCode)
	}

	_, err = m.mc.PutObject(m.ctx, m.bucket, objectKey,
		resp.Body, resp.ContentLength,
		minio.PutObjectOptions{ContentType: "audio/mpeg"},
	)
	if err != nil {
		return "", fmt.Errorf("upload %s: %w", objectKey, err)
	}

	endpoint := envOr("MINIO_ENDPOINT", "localhost:9020")
	scheme := "http"
	if envOr("MINIO_USE_SSL", "false") == "true" {
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s/%s/%s", scheme, endpoint, m.bucket, objectKey), nil
}

// ── Surah audio seeder ───────────────────────────────────────────────────────

func seedSurahAudio(db *gorm.DB, q qariInfo, mc *minioClient) {
	var surahs []struct {
		ID     int
		Number int
	}
	db.Raw(`SELECT id, number FROM surah WHERE deleted_at IS NULL ORDER BY number`).Scan(&surahs)
	if len(surahs) == 0 {
		log.Fatal("[audio] tabel surah kosong — jalankan seeder quran dulu")
	}

	log.Printf("[audio] seeding surah audio: %d surahs, qari=%s", len(surahs), q.Slug)
	ok, skip, fail := 0, 0, 0
	start := time.Now()

	for _, s := range surahs {
		cdnURL := surahURL(q, s.Number)
		audioURL := cdnURL

		if mc != nil {
			objectKey := fmt.Sprintf("surah/%s/%03d.mp3", q.Slug, s.Number)
			url, err := mc.uploadFromURL(cdnURL, objectKey)
			if err != nil {
				log.Printf("[audio] surah %03d upload gagal: %v", s.Number, err)
				fail++
				continue
			}
			audioURL = url
		}

		row := model.SurahAudio{
			SurahID:  &s.ID,
			QariName: q.Name,
			QariSlug: q.Slug,
			AudioURL: audioURL,
		}
		res := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "surah_id"}, {Name: "qari_slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"audio_url", "qari_name"}),
		}).Create(&row)
		if res.Error != nil {
			log.Printf("[audio] surah %03d DB error: %v", s.Number, res.Error)
			fail++
		} else if res.RowsAffected == 0 {
			skip++
		} else {
			ok++
		}
	}

	log.Printf("[audio] surah selesai: ok=%d skip=%d fail=%d (%.1fs)", ok, skip, fail, time.Since(start).Seconds())
}

// ── Ayah audio seeder ────────────────────────────────────────────────────────

func seedAyahAudio(db *gorm.DB, q qariInfo, mc *minioClient) {
	type ayahRow struct {
		ID          int
		Number      int
		SurahNumber int
	}
	var ayahs []ayahRow
	db.Raw(`
		SELECT ayah.id, ayah.number, surah.number AS surah_number
		FROM ayah
		JOIN surah ON surah.id = ayah.surah_id
		WHERE ayah.deleted_at IS NULL AND surah.deleted_at IS NULL
		ORDER BY surah.number, ayah.number
	`).Scan(&ayahs)
	if len(ayahs) == 0 {
		log.Fatal("[audio] tabel ayah kosong — jalankan seeder quran dulu")
	}

	log.Printf("[audio] seeding ayah audio: %d ayahs, qari=%s", len(ayahs), q.Slug)
	ok, skip, fail := 0, 0, 0
	start := time.Now()

	for i, a := range ayahs {
		cdnURL := ayahURL(q, a.SurahNumber, a.Number)
		audioURL := cdnURL

		if mc != nil {
			objectKey := fmt.Sprintf("ayah/%s/%03d%03d.mp3", q.Slug, a.SurahNumber, a.Number)
			url, err := mc.uploadFromURL(cdnURL, objectKey)
			if err != nil {
				log.Printf("[audio] ayah %03d:%03d upload gagal: %v", a.SurahNumber, a.Number, err)
				fail++
				continue
			}
			audioURL = url
		}

		row := model.AyahAudio{
			AyahID:   &a.ID,
			QariName: q.Name,
			QariSlug: q.Slug,
			AudioURL: audioURL,
		}
		res := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "ayah_id"}, {Name: "qari_slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"audio_url", "qari_name"}),
		}).Create(&row)
		if res.Error != nil {
			log.Printf("[audio] ayah %03d:%03d DB error: %v", a.SurahNumber, a.Number, res.Error)
			fail++
		} else if res.RowsAffected == 0 {
			skip++
		} else {
			ok++
		}

		if (i+1)%500 == 0 {
			log.Printf("[audio]   ayah %d/%d (%.1fs)", i+1, len(ayahs), time.Since(start).Seconds())
		}
	}

	log.Printf("[audio] ayah selesai: ok=%d skip=%d fail=%d (%.1fs)", ok, skip, fail, time.Since(start).Seconds())
}

// ── main ─────────────────────────────────────────────────────────────────────

func main() {
	mode := flag.String("mode", "surah", "surah | ayah | all")
	useMinio := flag.Bool("minio", false, "download dari CDN dan upload ke MinIO sebelum insert DB")
	qariSlug := flag.String("qari", "mishary-rashid-alafasy", "slug qari — lihat daftar lengkap di catalog")
	listQari := flag.Bool("list", false, "tampilkan daftar qari yang tersedia")
	flag.Parse()

	if *listQari {
		fmt.Println("Qari yang tersedia:")
		for _, q := range qariCatalog {
			fmt.Printf("  %-20s → %s\n", q.Slug, q.Name)
		}
		return
	}

	var q *qariInfo
	for i := range qariCatalog {
		if qariCatalog[i].Slug == *qariSlug {
			q = &qariCatalog[i]
			break
		}
	}
	if q == nil {
		fmt.Printf("Qari '%s' tidak ditemukan. Gunakan -list untuk melihat daftar.\n", *qariSlug)
		return
	}

	db := openDB()

	var mc *minioClient
	if *useMinio {
		mc = newMinioClient()
		log.Printf("[minio] menggunakan bucket '%s' di %s", mc.bucket, envOr("MINIO_ENDPOINT", "localhost:9020"))
	} else {
		log.Println("[audio] mode CDN URL langsung (tanpa upload MinIO). Gunakan -minio untuk upload ke MinIO.")
	}

	switch *mode {
	case "surah":
		seedSurahAudio(db, *q, mc)
	case "ayah":
		seedAyahAudio(db, *q, mc)
	case "all":
		seedSurahAudio(db, *q, mc)
		seedAyahAudio(db, *q, mc)
	default:
		log.Fatalf("mode tidak dikenal: %s. Pilih: surah | ayah | all", *mode)
	}
}
