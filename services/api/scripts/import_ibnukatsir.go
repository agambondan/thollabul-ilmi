//go:build ignore

// Import Tafsir Ibnu Katsir (Abridged English) dari JSON hasil scraping.
// Update field Translation.En pada IbnuKatsirTranslation yang sudah ada.
//
// Usage:
//
//	go run scripts/import_ibnukatsir.go
//	go run scripts/import_ibnukatsir.go -data ./data/ibnukatsir
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

type CDNVerse struct {
	VerseKey string `json:"verse_key"`
	Text     string `json:"text"`
}

func main() {
	dataDir := flag.String("data", "./data/ibnukatsir", "Folder berisi file tafsir per surah")
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

	imp := &IbnuImporter{db: db}
	imp.buildIndex()

	log.Println("Mulai import Tafsir Ibnu Katsir...")
	start := time.Now()
	total := 0

	for surah := 1; surah <= 114; surah++ {
		path := filepath.Join(*dataDir, fmt.Sprintf("%d.json", surah))
		verses := loadVerses(path)
		if len(verses) == 0 {
			continue
		}
		n, err := imp.importSurah(surah, verses)
		if err != nil {
			log.Printf("ERROR surah %d: %v", surah, err)
			continue
		}
		log.Printf("Surah %3d: %d updated", surah, n)
		total += n
	}

	log.Printf("Selesai: %d Translation.En diupdate dalam %.1fs", total, time.Since(start).Seconds())
}

type IbnuImporter struct {
	db *gorm.DB
	// ayahIndex: "surah:ayah" → tafsir.ibnu_katsir_translation_id
	ayahToIbnuTrID map[string]int
	// surahIndex: surahNumber → ayah count
}

func (imp *IbnuImporter) buildIndex() {
	log.Println("Membangun index dari tafsir table...")

	type row struct {
		SurahNumber             int
		AyahNumber              int
		IbnuKatsirTranslationID int
	}

	var rows []row
	err := imp.db.Raw(`
		SELECT surah.number AS surah_number, ayah.number AS ayah_number,
		       tafsir.ibnu_katsir_translation_id
		FROM tafsir
		JOIN ayah ON ayah.id = tafsir.ayah_id
		JOIN surah ON surah.id = ayah.surah_id
		WHERE tafsir.deleted_at IS NULL
		  AND tafsir.ibnu_katsir_translation_id IS NOT NULL
		  AND ayah.deleted_at IS NULL
		  AND surah.deleted_at IS NULL
	`).Scan(&rows).Error
	if err != nil {
		log.Fatalf("gagal build index: %v", err)
	}

	imp.ayahToIbnuTrID = make(map[string]int, len(rows))
	for _, r := range rows {
		key := fmt.Sprintf("%d:%d", r.SurahNumber, r.AyahNumber)
		imp.ayahToIbnuTrID[key] = r.IbnuKatsirTranslationID
	}
	log.Printf("Index: %d tafsir records dimuat", len(rows))
}

func (imp *IbnuImporter) importSurah(surahNum int, verses []CDNVerse) (int, error) {
	updated := 0
	for _, v := range verses {
		if v.Text == "" {
			continue
		}

		// Parse verse_key "surah:ayah"
		parts := strings.SplitN(v.VerseKey, ":", 2)
		if len(parts) != 2 {
			continue
		}
		ayahNum, err := strconv.Atoi(parts[1])
		if err != nil {
			continue
		}

		key := fmt.Sprintf("%d:%d", surahNum, ayahNum)
		ibnuTrID, ok := imp.ayahToIbnuTrID[key]
		if !ok {
			continue
		}

		if err := imp.db.Model(&model.Translation{}).
			Where("id = ?", ibnuTrID).
			Update("en", v.Text).Error; err != nil {
			return updated, fmt.Errorf("update translation %d: %w", ibnuTrID, err)
		}
		updated++
	}
	return updated, nil
}

func loadVerses(path string) []CDNVerse {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	var verses []CDNVerse
	if err := json.NewDecoder(f).Decode(&verses); err != nil {
		log.Printf("WARN parse %s: %v", path, err)
		return nil
	}
	return verses
}
