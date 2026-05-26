//go:build ignore

// Seed data Al-Quran (surah + ayah) dari data/quran_base.json ke PostgreSQL.
// Jalankan setelah DB kosong atau di-reset.
//
// Dependency: data/quran_base.json harus ada (dihasilkan oleh fetch_quran_base.go)
//
// Usage:
//
//	go run scripts/seed_quran_base.go
//	go run scripts/seed_quran_base.go -from 1 -to 10
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
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

// ── File types (mirror fetch_quran_base.go output) ───────────────────────────

type QuranBaseFile struct {
	Surahs []SurahFile `json:"surahs"`
}

type SurahFile struct {
	Number          int        `json:"number"`
	NameAr          string     `json:"name_ar"`
	NameEn          string     `json:"name_en"`
	NameTranslation string     `json:"name_translation"`
	Slug            string     `json:"slug"`
	RevelationType  string     `json:"revelation_type"`
	Ayahs           []AyahFile `json:"ayahs"`
}

type AyahFile struct {
	Number      int    `json:"number"`
	Arabic      string `json:"arabic"`
	Indonesian  string `json:"indonesian"`
	English     string `json:"english"`
	Juz         int    `json:"juz"`
	Page        int    `json:"page"`
	Manzil      int    `json:"manzil"`
	Ruku        int    `json:"ruku"`
	HizbQuarter int    `json:"hizb_quarter"`
	Sajda       bool   `json:"sajda"`
}

var quranBasmalahPrefixes = []string{
	"بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
	"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
	"بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ",
	"بسم الله الرحمن الرحيم",
}

func cleanQuranArabicText(surahNumber int, ayahNumber int, text string) string {
	if ayahNumber != 1 || surahNumber == 1 || surahNumber == 9 {
		return text
	}
	return stripLeadingQuranBasmalah(text)
}

func stripLeadingQuranBasmalah(text string) string {
	trimmed := strings.TrimLeft(text, " \n\t\r")
	for _, prefix := range quranBasmalahPrefixes {
		if strings.HasPrefix(trimmed, prefix) {
			return strings.TrimLeft(strings.TrimPrefix(trimmed, prefix), " \n\t\r")
		}
	}
	return text
}

// ── Seeder ────────────────────────────────────────────────────────────────────

func seedQuranBase(db *gorm.DB, surahs []SurahFile, from, to int) {
	for _, sf := range surahs {
		if sf.Number < from || sf.Number > to {
			continue
		}

		// Upsert surah translation
		tr := model.Translation{
			Ar:      lib.Strptr(sf.NameAr),
			LatinEn: lib.Strptr(sf.NameEn),
			En:      lib.Strptr(sf.NameTranslation),
			Idn:     lib.Strptr(sf.NameTranslation),
		}
		if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&tr).Error; err != nil {
			log.Printf("[surah %d] ERROR surah translation: %v — skip", sf.Number, err)
			continue
		}

		// Upsert surah
		surah := model.Surah{
			Number:         lib.Intptr(sf.Number),
			TranslationID:  tr.ID,
			NumberOfAyahs:  lib.Intptr(len(sf.Ayahs)),
			RevelationType: lib.Strptr(sf.RevelationType),
			Slug:           lib.Strptr(sf.Slug),
			Identifier:     lib.Strptr(sf.NameEn),
		}
		if err := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "number"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"translation_id", "number_of_ayahs", "revelation_type", "slug", "identifier", "updated_at",
			}),
		}).Create(&surah).Error; err != nil {
			log.Printf("[surah %d] ERROR upsert surah: %v — skip", sf.Number, err)
			continue
		}
		if surah.ID == nil {
			// Reload ID if upsert didn't return it (DoNothing path)
			db.Where("number = ?", sf.Number).Select("id").First(&surah)
		}
		if surah.ID == nil {
			log.Printf("[surah %d] ERROR: surah.ID nil — skip", sf.Number)
			continue
		}

		ayahCount := 0
		for _, af := range sf.Ayahs {
			arabic := cleanQuranArabicText(sf.Number, af.Number, af.Arabic)
			ayahTr := model.Translation{
				Ar:  lib.Strptr(arabic),
				Idn: lib.Strptr(af.Indonesian),
				En:  lib.Strptr(af.English),
			}
			if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&ayahTr).Error; err != nil {
				log.Printf("[surah %d, ayah %d] ERROR ayah translation: %v", sf.Number, af.Number, err)
				continue
			}

			ayah := model.Ayah{
				Number:        lib.Intptr(af.Number),
				SurahID:       surah.ID,
				TranslationID: ayahTr.ID,
				JuzNumber:     lib.Intptr(af.Juz),
				Page:          lib.Intptr(af.Page),
				Manzil:        lib.Intptr(af.Manzil),
				Ruku:          lib.Intptr(af.Ruku),
				HizbQuarter:   lib.Intptr(af.HizbQuarter),
				Sajda:         lib.Boolptr(af.Sajda),
			}
			if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&ayah).Error; err != nil {
				log.Printf("[surah %d, ayah %d] ERROR ayah: %v", sf.Number, af.Number, err)
				continue
			}
			ayahCount++
		}
		log.Printf("[surah %3d] %-20s → %d ayat", sf.Number, sf.NameEn, ayahCount)
	}
}

// ── main ──────────────────────────────────────────────────────────────────────

func main() {
	fromFlag := flag.Int("from", 1, "Mulai dari surah (inklusif)")
	toFlag := flag.Int("to", 114, "Sampai surah (inklusif)")
	inFlag := flag.String("in", "data/quran_base.json", "Path file input")
	flag.Parse()

	for _, f := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(f); err == nil {
			log.Printf("Config: %s", f)
			break
		}
	}

	f, err := os.Open(*inFlag)
	if err != nil {
		log.Fatalf("Buka %s: %v\nJalankan fetch_quran_base.go terlebih dahulu.", *inFlag, err)
	}
	defer f.Close()

	var data QuranBaseFile
	if err := json.NewDecoder(f).Decode(&data); err != nil {
		log.Fatalf("Parse %s: %v", *inFlag, err)
	}
	log.Printf("Loaded %d surahs dari %s", len(data.Surahs), *inFlag)

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

	start := time.Now()
	log.Printf("Seeding surah %d–%d ...", *fromFlag, *toFlag)
	seedQuranBase(db, data.Surahs, *fromFlag, *toFlag)
	log.Printf("Selesai dalam %.1fs", time.Since(start).Seconds())
}
