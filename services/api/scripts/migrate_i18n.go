//go:build ignore

// Migrate string-based content fields to Translation records for i18n support.
// One-time data migration: reads existing text from each table and creates a
// Translation{Idn: existingText} record, then sets translation_id FK back.
//
// Safe to re-run — skips records that already have translation_id set.
//
// Usage:
//
//	go run scripts/migrate_i18n.go
//	DB_HOST=localhost DB_PORT=54320 DB_USER=postgres DB_PASS=postgres DB_NAME=thullabul_ilmi go run scripts/migrate_i18n.go
package main

import (
	"fmt"
	"log"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var modelsToMigrate = []interface{}{
	model.Doa{},
	model.Dzikir{},
	model.ManasikStep{},
	model.SholatGuide{},
	model.AsbabunNuzul{},
	model.FiqhCategory{},
	model.FiqhItem{},
	model.SirohCategory{},
	model.SirohContent{},
	model.Quiz{},
	model.IslamicTerm{},
	model.AmalanItem{},
	model.Kajian{},
}

func main() {
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

	log.Println("Menjalankan AutoMigrate untuk menambah kolom translation_id...")
	if err := db.AutoMigrate(modelsToMigrate...); err != nil {
		log.Fatalf("AutoMigrate gagal: %v", err)
	}
	log.Println("AutoMigrate selesai.")

	start := time.Now()
	total := 0

	total += migrateDoa(db)
	total += migrateDzikir(db)
	total += migrateManasikStep(db)
	total += migrateSholatGuide(db)
	total += migrateAsbabunNuzul(db)
	total += migrateFiqhCategory(db)
	total += migrateFiqhItem(db)
	total += migrateSirohCategory(db)
	total += migrateSirohContent(db)
	total += migrateQuiz(db)
	total += migrateIslamicTerm(db)
	total += migrateAmalanItem(db)
	total += migrateKajian(db)

	log.Printf("Selesai: %d Translation records dibuat dalam %.1fs", total, time.Since(start).Seconds())
}

func strptr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func createTranslation(db *gorm.DB, idn string) (*int, error) {
	if idn == "" {
		return nil, nil
	}
	tr := &model.Translation{Idn: strptr(idn)}
	if err := db.Create(tr).Error; err != nil {
		return nil, err
	}
	return tr.ID, nil
}

func migrateDoa(db *gorm.DB) int {
	var rows []model.Doa
	db.Where("translation_id IS NULL AND translation != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Translation)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("doa %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("doa: %d migrated", n)
	return n
}

func migrateDzikir(db *gorm.DB) int {
	var rows []model.Dzikir
	db.Where("translation_id IS NULL AND translation != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Translation)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("dzikir %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("dzikir: %d migrated", n)
	return n
}

func migrateManasikStep(db *gorm.DB) int {
	var rows []model.ManasikStep
	db.Where("translation_id IS NULL AND translation != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Translation)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("manasik_step %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("manasik_step: %d migrated", n)
	return n
}

func migrateSholatGuide(db *gorm.DB) int {
	var rows []model.SholatGuide
	db.Where("translation_id IS NULL AND translation != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Translation)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("sholat_guide %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("sholat_guide: %d migrated", n)
	return n
}

func migrateAsbabunNuzul(db *gorm.DB) int {
	var rows []model.AsbabunNuzul
	db.Where("translation_id IS NULL AND content != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Content)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("asbabun_nuzul %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("asbabun_nuzul: %d migrated", n)
	return n
}

func migrateFiqhCategory(db *gorm.DB) int {
	var rows []model.FiqhCategory
	db.Where("translation_id IS NULL AND description != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Description)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("fiqh_category %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("fiqh_category: %d migrated", n)
	return n
}

func migrateFiqhItem(db *gorm.DB) int {
	var rows []model.FiqhItem
	db.Where("translation_id IS NULL AND content != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Content)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("fiqh_item %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("fiqh_item: %d migrated", n)
	return n
}

func migrateSirohCategory(db *gorm.DB) int {
	var rows []model.SirohCategory
	db.Where("translation_id IS NULL AND title != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Title)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("siroh_category %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("siroh_category: %d migrated", n)
	return n
}

func migrateSirohContent(db *gorm.DB) int {
	var rows []model.SirohContent
	db.Where("translation_id IS NULL AND content != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Content)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("siroh_content %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("siroh_content: %d migrated", n)
	return n
}

func migrateQuiz(db *gorm.DB) int {
	var rows []model.Quiz
	db.Where("translation_id IS NULL AND question_text != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.QuestionText)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("quiz %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("quiz: %d migrated", n)
	return n
}

func migrateIslamicTerm(db *gorm.DB) int {
	var rows []model.IslamicTerm
	db.Where("translation_id IS NULL AND definition != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Definition)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("islamic_term %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("islamic_term: %d migrated", n)
	return n
}

func migrateAmalanItem(db *gorm.DB) int {
	var rows []model.AmalanItem
	db.Where("translation_id IS NULL AND description != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Description)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("amalan_item %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("amalan_item: %d migrated", n)
	return n
}

func migrateKajian(db *gorm.DB) int {
	var rows []model.Kajian
	db.Where("translation_id IS NULL AND description != ''").Find(&rows)
	n := 0
	for _, r := range rows {
		id, err := createTranslation(db, r.Description)
		if err != nil || id == nil {
			continue
		}
		if err := db.Model(&r).Update("translation_id", *id).Error; err != nil {
			log.Printf("kajian %d: %v", *r.ID, err)
			continue
		}
		n++
	}
	log.Printf("kajian: %d migrated", n)
	return n
}
