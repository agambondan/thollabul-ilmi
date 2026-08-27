//go:build ignore

// Seed data per-kata (mufrodat) dari data/mufrodat.json ke PostgreSQL.
// Jalankan setelah seed_quran_base.go (ayah harus sudah ada di DB).
//
// Dependency: data/mufrodat.json harus ada (dihasilkan oleh fetch_mufrodat.go)
//
// Usage:
//
//	go run scripts/seed_mufrodat.go
//	go run scripts/seed_mufrodat.go -from 1 -to 10
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// ── File types (mirror fetch_mufrodat.go output) ──────────────────────────────

type MufrodatFile struct {
	Entries []AyahWordEntry `json:"entries"`
}

type AyahWordEntry struct {
	Surah int        `json:"surah"`
	Ayah  int        `json:"ayah"`
	Words []WordItem `json:"words"`
}

type WordItem struct {
	Index           int    `json:"index"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	Indonesian      string `json:"indonesian"`
}

// ── Seeder ────────────────────────────────────────────────────────────────────

func buildAyahIndex(db *gorm.DB) map[string]int {
	log.Println("Membangun index ayah dari DB...")
	type row struct {
		ID          int
		Number      int
		SurahNumber int
	}
	var rows []row
	db.Raw(`
		SELECT ayah.id, ayah.number, surah.number AS surah_number
		FROM ayah
		JOIN surah ON surah.id = ayah.surah_id
	`).Scan(&rows)
	idx := make(map[string]int, len(rows))
	for _, r := range rows {
		idx[fmt.Sprintf("%d:%d", r.SurahNumber, r.Number)] = r.ID
	}
	log.Printf("Index ayah: %d entries", len(idx))
	return idx
}

func seedMufrodat(db *gorm.DB, entries []AyahWordEntry, ayahIdx map[string]int, from, to int) int {
	total := 0
	for _, entry := range entries {
		if entry.Surah < from || entry.Surah > to {
			continue
		}
		ayahID, ok := ayahIdx[fmt.Sprintf("%d:%d", entry.Surah, entry.Ayah)]
		if !ok {
			log.Printf("  SKIP: ayah tidak ada di DB (%d:%d)", entry.Surah, entry.Ayah)
			continue
		}
		for _, w := range entry.Words {
			item := model.Mufrodat{
				AyahID:          lib.Intptr(ayahID),
				WordIndex:       w.Index,
				Arabic:          w.Arabic,
				Transliteration: w.Transliteration,
				Indonesian:      w.Indonesian,
			}
			if err := db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "ayah_id"}, {Name: "word_index"}},
				DoUpdates: clause.AssignmentColumns([]string{"arabic", "transliteration", "indonesian"}),
			}).Create(&item).Error; err != nil {
				log.Printf("  ERROR %d:%d w%d: %v", entry.Surah, entry.Ayah, w.Index, err)
			} else {
				total++
			}
		}
	}
	return total
}

// ── main ──────────────────────────────────────────────────────────────────────

func main() {
	fromFlag := flag.Int("from", 1, "Mulai dari surah (inklusif)")
	toFlag := flag.Int("to", 114, "Sampai surah (inklusif)")
	inFlag := flag.String("in", "data/mufrodat.json", "Path file input")
	flag.Parse()

	for _, f := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(f); err == nil {
			log.Printf("Config: %s", f)
			break
		}
	}

	f, err := os.Open(*inFlag)
	if err != nil {
		log.Fatalf("Buka %s: %v\nJalankan fetch_mufrodat.go terlebih dahulu.", *inFlag, err)
	}
	defer f.Close()

	var data MufrodatFile
	if err := json.NewDecoder(f).Decode(&data); err != nil {
		log.Fatalf("Parse %s: %v", *inFlag, err)
	}
	log.Printf("Loaded %d ayah entries dari %s", len(data.Entries), *inFlag)

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		viper.GetString("db_host"), viper.GetString("db_port"),
		viper.GetString("db_user"), viper.GetString("db_pass"),
		viper.GetString("db_name"),
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Warn),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("Koneksi DB gagal: %v", err)
	}

	ayahIdx := buildAyahIndex(db)

	start := time.Now()
	log.Printf("Seeding mufrodat surah %d–%d ...", *fromFlag, *toFlag)
	total := seedMufrodat(db, data.Entries, ayahIdx, *fromFlag, *toFlag)
	log.Printf("Selesai: %d kata dalam %.1fs", total, time.Since(start).Seconds())
}
