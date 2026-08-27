//go:build ignore

// Import Tafsir Ibnu Katsir (Ringkas) Indonesia dari hasil scraping tafsirweb.com.
// Update/replace field Translation.Idn pada IbnuKatsirTranslation.
//
// Usage:
//
//	go run scripts/import_tafsirweb.go
//	go run scripts/import_tafsirweb.go -data ./data/tafsirweb
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

type AyatResult struct {
	Surah int    `json:"surah"`
	Ayat  int    `json:"ayat"`
	Text  string `json:"text"`
}

func main() {
	dataDir := flag.String("data", "./data/tafsirweb", "Folder berisi dir per surah")
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

	imp := &TafsirwebImporter{db: db}
	imp.buildIndex()

	log.Println("Mulai import Tafsir Ibnu Katsir dari tafsirweb...")
	start := time.Now()
	total := 0

	for surah := 1; surah <= 114; surah++ {
		dir := filepath.Join(*dataDir, fmt.Sprintf("%d", surah))
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}

		inserted := 0
		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}
			path := filepath.Join(dir, entry.Name())
			var ar AyatResult
			data, err := os.ReadFile(path)
			if err != nil {
				continue
			}
			if err := json.Unmarshal(data, &ar); err != nil || ar.Text == "" {
				continue
			}

			if err := imp.update(ar.Surah, ar.Ayat, ar.Text); err != nil {
				log.Printf("ERROR %d:%d: %v", ar.Surah, ar.Ayat, err)
			} else {
				inserted++
			}
		}

		if inserted > 0 {
			log.Printf("Surah %3d: %d updated", surah, inserted)
			total += inserted
		}
	}

	log.Printf("Selesai: %d Translation.Idn diupdate dalam %.1fs", total, time.Since(start).Seconds())
}

type TafsirwebImporter struct {
	db             *gorm.DB
	ayahToIbnuTrID map[string]int
}

func (imp *TafsirwebImporter) buildIndex() {
	log.Println("Membangun index...")

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
	log.Printf("Index: %d records", len(rows))
}

func (imp *TafsirwebImporter) update(surahNum, ayahNum int, text string) error {
	key := fmt.Sprintf("%d:%d", surahNum, ayahNum)
	trID, ok := imp.ayahToIbnuTrID[key]
	if !ok {
		return fmt.Errorf("ayah tidak ditemukan di index")
	}

	return imp.db.Model(&model.Translation{}).
		Where("id = ?", trID).
		Update("idn", text).Error
}
