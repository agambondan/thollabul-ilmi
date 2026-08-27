//go:build ignore

// fix_idn.go — Overwrite kolom idn di tabel translation untuk 7 kitab fawazahmed0
// menggunakan sumber gadingnst/hadith-api yang nomornya konsisten dengan Arab/Inggris.
//
// Masalah yang diselesaikan:
//
//	fawazahmed0 edisi Indonesia (ind) memakai penomoran berbeda dari edisi Arab/Inggris,
//	sehingga beberapa hadits punya teks idn yang tidak sesuai dengan ar/en-nya.
//
// Usage:
//
//	go run scripts/fix_idn.go
//	go run scripts/fix_idn.go -imam bukhari
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var gadingnstSlugMap = map[string]string{
	"bukhari":   "bukhari",
	"muslim":    "muslim",
	"abudaud":   "abu-daud",
	"tirmidzi":  "tirmidzi",
	"nasai":     "nasai",
	"ibnumajah": "ibnu-majah",
	"malik":     "malik",
}

const gadingnstBaseURL = "https://raw.githubusercontent.com/gadingnst/hadith-api/master/books"

type gadingnstHadith struct {
	Number int    `json:"number"`
	Arab   string `json:"arab"`
	ID     string `json:"id"`
}

func main() {
	imamFlag := flag.String("imam", "", "Fix hanya satu imam (opsional)")
	flag.Parse()

	for _, envFile := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(envFile); err == nil {
			log.Printf("Config: %s", envFile)
			break
		}
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		viper.GetString("db_host"),
		viper.GetString("db_port"),
		viper.GetString("db_user"),
		viper.GetString("db_pass"),
		viper.GetString("db_name"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Warn),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("koneksi DB gagal: %v", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}

	targets := gadingnstSlugMap
	if *imamFlag != "" {
		if _, ok := gadingnstSlugMap[*imamFlag]; !ok {
			log.Fatalf("imam '%s' tidak ada di daftar gadingnst", *imamFlag)
		}
		targets = map[string]string{*imamFlag: gadingnstSlugMap[*imamFlag]}
	}

	for imam, gadSlug := range targets {
		if err := fixIdnForBook(db, client, imam, gadSlug); err != nil {
			log.Printf("[%s] ERROR: %v", imam, err)
		}
	}

	log.Println("Fix idn selesai!")
}

func fixIdnForBook(db *gorm.DB, client *http.Client, imam, gadSlug string) error {
	url := fmt.Sprintf("%s/%s.json", gadingnstBaseURL, gadSlug)
	log.Printf("[%s] Download dari gadingnst: %s", imam, url)

	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("download gagal: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var hadiths []gadingnstHadith
	if err := json.Unmarshal(body, &hadiths); err != nil {
		return fmt.Errorf("parse JSON gagal: %w", err)
	}

	// Build map: hadith_number → idn
	idnMap := make(map[int]string, len(hadiths))
	for _, h := range hadiths {
		if h.ID != "" {
			idnMap[h.Number] = h.ID
		}
	}
	log.Printf("[%s] %d hadiths dari gadingnst", imam, len(idnMap))

	// Ambil book_id
	var book model.Book
	if err := db.Where("slug = ?", imam).First(&book).Error; err != nil {
		return fmt.Errorf("book '%s' tidak ditemukan: %w", imam, err)
	}

	// Ambil semua hadith + translation_id dari buku ini
	type row struct {
		HadithNumber  int
		TranslationID int
	}
	var rows []row
	db.Raw(`
		SELECT h.number as hadith_number, h.translation_id
		FROM hadith h
		WHERE h.book_id = ? AND h.deleted_at IS NULL
		ORDER BY h.number
	`, book.ID).Scan(&rows)

	if len(rows) == 0 {
		return fmt.Errorf("tidak ada hadith untuk book_id=%d", *book.ID)
	}

	updated := 0
	skipped := 0
	for _, r := range rows {
		idn, ok := idnMap[r.HadithNumber]
		if !ok || idn == "" {
			skipped++
			continue
		}
		res := db.Model(&model.Translation{}).
			Where("id = ?", r.TranslationID).
			Update("idn", idn)
		if res.Error != nil {
			log.Printf("[%s] WARNING update translation_id=%d: %v", imam, r.TranslationID, res.Error)
		} else {
			updated++
		}
	}

	log.Printf("[%s] ✓ updated=%d, skipped=%d (no gadingnst match)", imam, updated, skipped)
	return nil
}
