//go:build ignore

// Import tafsir dari JSON hasil scraping ke PostgreSQL.
//
// Sumber:
//
//	./data/tafsir/ind-jalaladdinalmah/{1..114}.json  → KemenagTranslation
//	./data/tafsir/ind-muhammadquraish/{1..114}.json  → IbnuKatsirTranslation
//
// Usage:
//
//	go run scripts/import_tafsir.go
//	go run scripts/import_tafsir.go -data ./data/tafsir
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

type VerseRow struct {
	Chapter int    `json:"chapter"`
	Verse   int    `json:"verse"`
	Text    string `json:"text"`
}

type SurahFile struct {
	Chapter []VerseRow `json:"chapter"`
}

func main() {
	dataDir := flag.String("data", "./data/tafsir", "Folder berisi dir edition")
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

	imp := &TafsirImporter{db: db}
	imp.buildAyahIndex()

	jalalaynDir := filepath.Join(*dataDir, "ind-jalaladdinalmah")
	quraishDir := filepath.Join(*dataDir, "ind-muhammadquraish")

	log.Println("Mulai import tafsir...")
	start := time.Now()

	for surah := 1; surah <= 114; surah++ {
		jPath := filepath.Join(jalalaynDir, fmt.Sprintf("%d.json", surah))
		qPath := filepath.Join(quraishDir, fmt.Sprintf("%d.json", surah))

		jVerses := loadSurah(jPath)
		qVerses := loadSurah(qPath)

		if err := imp.importSurah(surah, jVerses, qVerses); err != nil {
			log.Printf("ERROR surah %d: %v", surah, err)
		}
	}

	log.Printf("Selesai dalam %.1fs", time.Since(start).Seconds())
}

// TafsirImporter memegang ayah index dan state import.
type TafsirImporter struct {
	db        *gorm.DB
	ayahIndex map[string]int // "surah:verse" → ayah.id
}

// buildAyahIndex memuat semua ayah dari DB ke memory.
func (imp *TafsirImporter) buildAyahIndex() {
	log.Println("Membangun ayah index dari DB...")

	type row struct {
		AyahID      int
		SurahNumber int
		AyahNumber  int
	}

	var rows []row
	err := imp.db.Raw(`
		SELECT ayah.id AS ayah_id, surah.number AS surah_number, ayah.number AS ayah_number
		FROM ayah
		JOIN surah ON surah.id = ayah.surah_id
		WHERE ayah.deleted_at IS NULL AND surah.deleted_at IS NULL
	`).Scan(&rows).Error
	if err != nil {
		log.Fatalf("gagal build ayah index: %v", err)
	}

	imp.ayahIndex = make(map[string]int, len(rows))
	for _, r := range rows {
		key := fmt.Sprintf("%d:%d", r.SurahNumber, r.AyahNumber)
		imp.ayahIndex[key] = r.AyahID
	}
	log.Printf("Ayah index: %d ayat dimuat", len(rows))
}

func (imp *TafsirImporter) importSurah(surahNum int, jalalayn, quraish []VerseRow) error {
	// Build lookup map per verse number
	jalMap := make(map[int]string, len(jalalayn))
	for _, v := range jalalayn {
		jalMap[v.Verse] = v.Text
	}
	quraishMap := make(map[int]string, len(quraish))
	for _, v := range quraish {
		quraishMap[v.Verse] = v.Text
	}

	// Tentukan jumlah ayat dari yang tersedia
	maxVerse := 0
	for _, v := range jalalayn {
		if v.Verse > maxVerse {
			maxVerse = v.Verse
		}
	}
	for _, v := range quraish {
		if v.Verse > maxVerse {
			maxVerse = v.Verse
		}
	}
	if maxVerse == 0 {
		return nil
	}

	inserted := 0
	updated := 0

	for verse := 1; verse <= maxVerse; verse++ {
		key := fmt.Sprintf("%d:%d", surahNum, verse)
		ayahID, ok := imp.ayahIndex[key]
		if !ok {
			continue
		}

		jalText := jalMap[verse]
		qurText := quraishMap[verse]

		if jalText == "" && qurText == "" {
			continue
		}

		var existing model.Tafsir
		err := imp.db.Where("ayah_id = ?", ayahID).First(&existing).Error

		if err == gorm.ErrRecordNotFound {
			// Buat dua Translation baru
			kemenagTrID, qErr := imp.upsertTranslation(nil, jalText)
			if qErr != nil {
				return fmt.Errorf("surah %d ayat %d kemenag: %w", surahNum, verse, qErr)
			}
			ibnuTrID, qErr := imp.upsertTranslation(nil, qurText)
			if qErr != nil {
				return fmt.Errorf("surah %d ayat %d ibnu_katsir: %w", surahNum, verse, qErr)
			}

			tafsir := &model.Tafsir{
				AyahID:                  lib.Intptr(ayahID),
				KemenagTranslationID:    kemenagTrID,
				IbnuKatsirTranslationID: ibnuTrID,
			}
			if err := imp.db.Create(tafsir).Error; err != nil {
				return fmt.Errorf("surah %d ayat %d create tafsir: %w", surahNum, verse, err)
			}
			inserted++

		} else if err == nil {
			// Update teks yang ada jika berubah
			changed := false

			if existing.KemenagTranslationID != nil && jalText != "" {
				if err := imp.db.Model(&model.Translation{}).
					Where("id = ?", *existing.KemenagTranslationID).
					Update("idn", jalText).Error; err != nil {
					return err
				}
				changed = true
			} else if existing.KemenagTranslationID == nil && jalText != "" {
				id, qErr := imp.upsertTranslation(nil, jalText)
				if qErr != nil {
					return qErr
				}
				existing.KemenagTranslationID = id
				changed = true
			}

			if existing.IbnuKatsirTranslationID != nil && qurText != "" {
				if err := imp.db.Model(&model.Translation{}).
					Where("id = ?", *existing.IbnuKatsirTranslationID).
					Update("idn", qurText).Error; err != nil {
					return err
				}
				changed = true
			} else if existing.IbnuKatsirTranslationID == nil && qurText != "" {
				id, qErr := imp.upsertTranslation(nil, qurText)
				if qErr != nil {
					return qErr
				}
				existing.IbnuKatsirTranslationID = id
				changed = true
			}

			if changed {
				imp.db.Save(&existing)
				updated++
			}
		} else {
			return err
		}
	}

	log.Printf("Surah %3d: +%d inserted, ~%d updated", surahNum, inserted, updated)
	return nil
}

func (imp *TafsirImporter) upsertTranslation(existingID *int, idn string) (*int, error) {
	if existingID != nil {
		return existingID, nil
	}
	if idn == "" {
		return nil, nil
	}
	tr := &model.Translation{Idn: lib.Strptr(idn)}
	if err := imp.db.Create(tr).Error; err != nil {
		return nil, err
	}
	return tr.ID, nil
}

func loadSurah(path string) []VerseRow {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()

	var sf SurahFile
	if err := json.NewDecoder(f).Decode(&sf); err != nil {
		log.Printf("WARN parse %s: %v", path, err)
		return nil
	}
	return sf.Chapter
}
