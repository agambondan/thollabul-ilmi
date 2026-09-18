//go:build ignore

package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

type PublicDomainBookItem struct {
	Slug        string
	Title       string
	Author      string
	DownloadURL string
	FileName    string
	MimeType    string
	Format      model.LibraryBookFormat
	License     string
	LicenseNote string
}

var publicDomainCatalog = []PublicDomainBookItem{
	{
		Slug:        "arbain-nawawi",
		Title:       "Hadits Arbain An-Nawawi",
		Author:      "Imam An-Nawawi",
		DownloadURL: "https://archive.org/download/40-hadith-nawawi-arabic/40_hadith_nawawi_arabic.pdf",
		FileName:    "hadits-arbain-an-nawawi.pdf",
		MimeType:    "application/pdf",
		Format:      model.LibraryBookFormatPDF,
		License:     "Domain Publik (Karya Ulama Klasik)",
		LicenseNote: "Teks hadits klasik abad ke-7 H, bebas dari hak cipta.",
	},
	{
		Slug:        "shamail-at-tirmidzi",
		Title:       "Shamail At-Tirmidzi: Sifat-Sifat Fisik & Akhlak Nabi ﷺ",
		Author:      "Imam At-Tirmidzi",
		DownloadURL: "https://archive.org/download/ash-shamail-al-muhammadiyyah/ash_shamail_al_muhammadiyyah.pdf",
		FileName:    "ash-shamail-at-tirmidzi.pdf",
		MimeType:    "application/pdf",
		Format:      model.LibraryBookFormatPDF,
		License:     "Domain Publik (Karya Ulama Klasik)",
		LicenseNote: "Matan klasik abad ke-3 H, bebas dari hak cipta.",
	},
	{
		Slug:        "al-adab-al-mufrad",
		Title:       "Al-Adab Al-Mufrad",
		Author:      "Imam Al-Bukhari",
		DownloadURL: "https://archive.org/download/al-adab-al-mufrad-bukhari/al_adab_al_mufrad.pdf",
		FileName:    "al-adab-al-mufrad-imam-bukhari.pdf",
		MimeType:    "application/pdf",
		Format:      model.LibraryBookFormatPDF,
		License:     "Domain Publik (Karya Ulama Klasik)",
		LicenseNote: "Koleksi hadits adab klasik abad ke-3 H.",
	},
	{
		Slug:        "riyadhus-shalihin",
		Title:       "Riyadhus Shalihin",
		Author:      "Imam An-Nawawi",
		DownloadURL: "https://archive.org/download/riyadh-as-saliheen-arabic/riyadh_as_saliheen.pdf",
		FileName:    "riyadhus-shalihin-an-nawawi.pdf",
		MimeType:    "application/pdf",
		Format:      model.LibraryBookFormatPDF,
		License:     "Domain Publik (Karya Ulama Klasik)",
		LicenseNote: "Kitab hadits klasik abad ke-7 H.",
	},
}

func main() {
	slugFlag := flag.String("slug", "", "Sync specific book by slug (e.g. arbain-nawawi)")
	fileFlag := flag.String("file", "", "Upload a local PDF file directly for the specified slug")
	allFlag := flag.Bool("all", false, "Sync all available public domain books")
	dryRunFlag := flag.Bool("dry-run", false, "Simulate downloads and inspect metadata without uploading to MinIO or DB")
	flag.Parse()

	if *slugFlag == "" && !*allFlag {
		fmt.Println("Usage: go run scripts/sync_library_minio.go [-all | -slug=<slug>] [-file=<local_file.pdf>] [-dry-run]")
		fmt.Println("\nTersedia dalam katalog domain publik:")
		for _, item := range publicDomainCatalog {
			fmt.Printf(" - %s (%s)\n", item.Slug, item.Title)
		}
		return
	}

	var targets []PublicDomainBookItem
	for _, item := range publicDomainCatalog {
		if *allFlag || item.Slug == *slugFlag {
			targets = append(targets, item)
		}
	}

	if len(targets) == 0 && *fileFlag != "" && *slugFlag != "" {
		// Custom slug with local file
		targets = append(targets, PublicDomainBookItem{
			Slug:        *slugFlag,
			Title:       *slugFlag,
			FileName:    *slugFlag + ".pdf",
			MimeType:    "application/pdf",
			Format:      model.LibraryBookFormatPDF,
			License:     "Periksa lisensi edisi",
			LicenseNote: "Uploaded via sync CLI tool",
		})
	} else if len(targets) == 0 {
		log.Fatalf("Tidak ada buku yang cocok dengan filter slug='%s'", *slugFlag)
	}

	var db *gorm.DB
	var mc *minioClient
	if !*dryRunFlag {
		db = initDB()
		mc = newMinioClient()
	}

	log.Printf("[sync] Memproses %d buku (dry-run=%v)...", len(targets), *dryRunFlag)

	client := &http.Client{Timeout: 90 * time.Second}
	for _, item := range targets {
		log.Printf("[sync] Memeriksa: %s (%s)...", item.Slug, item.Title)

		var bodyBytes []byte
		var err error

		if *fileFlag != "" && (*slugFlag == item.Slug || len(targets) == 1) {
			log.Printf("[sync] Menggunakan file lokal: %s", *fileFlag)
			bodyBytes, err = os.ReadFile(*fileFlag)
			if err != nil {
				log.Printf("[sync] Gagal membaca file lokal %s: %v", *fileFlag, err)
				continue
			}
		} else {
			req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, item.DownloadURL, nil)
			if err != nil {
				log.Printf("[sync] Gagal membuat request untuk %s: %v", item.Slug, err)
				continue
			}
			req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; ThollabulIlmiSync/1.0)")

			resp, err := client.Do(req)
			if err != nil {
				log.Printf("[sync] Download error %s: %v", item.DownloadURL, err)
				continue
			}

			if resp.StatusCode != http.StatusOK {
				resp.Body.Close()
				log.Printf("[sync] HTTP %d untuk %s, dilewati", resp.StatusCode, item.DownloadURL)
				continue
			}

			bodyBytes, err = io.ReadAll(resp.Body)
			resp.Body.Close()
			if err != nil {
				log.Printf("[sync] Gagal membaca response body %s: %v", item.Slug, err)
				continue
			}
		}

		hash := sha256.Sum256(bodyBytes)
		shaHex := hex.EncodeToString(hash[:])
		sizeBytes := int64(len(bodyBytes))

		log.Printf("[sync] Berhasil unduh %s: %d bytes (%.2f MB), SHA256=%s",
			item.FileName, sizeBytes, float64(sizeBytes)/(1024*1024), shaHex[:12]+"...")

		if *dryRunFlag {
			continue
		}

		objectKey := fmt.Sprintf("library/books/%s/%s", item.Slug, item.FileName)
		publicURL, err := mc.uploadBytes(objectKey, bodyBytes, item.MimeType)
		if err != nil {
			log.Printf("[sync] Upload MinIO gagal untuk %s: %v", item.Slug, err)
			continue
		}

		log.Printf("[sync] Uploaded to MinIO: %s", publicURL)

		// Update or insert in database
		var book model.LibraryBook
		err = db.Where("slug = ?", item.Slug).First(&book).Error
		if err != nil {
			// create if not exists
			book = model.LibraryBook{
				Title:            item.Title,
				Slug:             item.Slug,
				Author:           item.Author,
				Format:           item.Format,
				SourceType:       model.LibraryBookSourceUploaded,
				SourceURL:        publicURL,
				FileURL:          publicURL,
				FileName:         item.FileName,
				FileMimeType:     item.MimeType,
				FileSizeBytes:    sizeBytes,
				FileObjectKey:    objectKey,
				ChecksumSHA256:   shaHex,
				License:          item.License,
				LicenseStatus:    model.LibraryBookLicenseVerified,
				SourceNote:       item.LicenseNote,
				IsSourceVerified: true,
				Status:           model.LibraryBookStatusPublished,
			}
			if err := db.Create(&book).Error; err != nil {
				log.Printf("[sync] Gagal membuat buku di DB %s: %v", item.Slug, err)
			} else {
				log.Printf("[sync] Record buku berhasil dibuat: %s", item.Slug)
			}
		} else {
			updates := map[string]interface{}{
				"source_type":        model.LibraryBookSourceUploaded,
				"source_url":         publicURL,
				"file_url":           publicURL,
				"file_name":          item.FileName,
				"file_mime_type":     item.MimeType,
				"file_size_bytes":    sizeBytes,
				"file_object_key":    objectKey,
				"checksum_sha256":    shaHex,
				"format":             item.Format,
				"license":            item.License,
				"license_status":     model.LibraryBookLicenseVerified,
				"is_source_verified": true,
			}
			if err := db.Model(&book).Updates(updates).Error; err != nil {
				log.Printf("[sync] Gagal update buku di DB %s: %v", item.Slug, err)
			} else {
				log.Printf("[sync] Record buku berhasil di-update: %s", item.Slug)
			}
		}
	}
	log.Println("[sync] Selesai.")
}

func initDB() *gorm.DB {
	host := envOr("DB_HOST", "localhost")
	port := envOr("DB_PORT", "5432")
	user := envOr("DB_USER", "postgres")
	pass := envOr("DB_PASS", "postgres")
	name := envOr("DB_NAME", "thollabul_ilmi")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		host, port, user, pass, name)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("Koneksi database gagal: %v", err)
	}
	return db
}

type minioClient struct {
	mc        *minio.Client
	bucket    string
	publicURL string
	ctx       context.Context
}

func newMinioClient() *minioClient {
	endpoint := envOr("MINIO_ENDPOINT", "localhost:9020")
	access := envOr("MINIO_ACCESS", "minioadmin")
	secret := envOr("MINIO_SECRET", "minioadmin")
	bucket := envOr("MINIO_LIBRARY_BUCKET", "thollabul-ilmi-library")
	useSSL := envOr("MINIO_USE_SSL", "false") == "true"
	publicURL := strings.TrimRight(envOr("MINIO_PUBLIC_URL", ""), "/")

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
		policy := fmt.Sprintf(`{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": ["*"]},
    "Action": ["s3:GetObject"],
    "Resource": ["arn:aws:s3:::%s/*"]
  }]
}`, bucket)
		_ = mc.SetBucketPolicy(ctx, bucket, policy)
		log.Printf("[minio] bucket '%s' dibuat dengan public-read policy", bucket)
	}

	if publicURL == "" {
		scheme := "http"
		if useSSL {
			scheme = "https"
		}
		publicURL = fmt.Sprintf("%s://%s", scheme, endpoint)
	}

	return &minioClient{mc: mc, bucket: bucket, publicURL: publicURL, ctx: ctx}
}

func (m *minioClient) uploadBytes(objectKey string, data []byte, contentType string) (string, error) {
	reader := bytes.NewReader(data)
	_, err := m.mc.PutObject(m.ctx, m.bucket, objectKey, reader, int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s/%s/%s", m.publicURL, m.bucket, objectKey), nil
}

func envOr(key, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}
