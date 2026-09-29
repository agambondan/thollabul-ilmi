package repository

import (
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupTokohTarikhBenchmarkDB(b *testing.B) *gorm.DB {
	b.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=private"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		b.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&model.Translation{}, &model.TokohTarikh{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	for i := 1; i <= 30; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Tokoh %d", i)),
			En:  strptrOrNil(fmt.Sprintf("Figure %d", i)),
		}
		db.Create(tr)

		tokoh := &model.TokohTarikh{
			Nama:          fmt.Sprintf("Tokoh Ke-%d", i),
			Era:           "Sahabat",
			TahunLahir:    "590 M",
			TahunWafat:    "661 M",
			Biografi:      "Biografi tokoh sahabat mulia",
			Kontribusi:    "Penulisan mushaf Al-Qur'an",
			Kategori:      "sahabat",
			ImageURL:      "https://example.com/img.jpg",
			Source:        "Al-Bidayah wan Nihayah",
			TranslationID: tr.ID,
		}
		db.Create(tokoh)
	}

	return db
}

func findTokohTarikhAllPreload(db *gorm.DB, limit, offset int) ([]model.TokohTarikh, int64, error) {
	var list []model.TokohTarikh
	var total int64
	query := db.Model(&model.TokohTarikh{}).Preload("Translation")
	query.Count(&total)
	err := query.Order("id asc").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func BenchmarkTokohTarikh_GORM_Preload(b *testing.B) {
	db := setupTokohTarikhBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, _, err := findTokohTarikhAllPreload(db, 30, 0)
		if err != nil || len(list) != 30 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkTokohTarikh_Native_RawScan(b *testing.B) {
	db := setupTokohTarikhBenchmarkDB(b)
	repo := NewTokohTarikhRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, _, err := repo.FindAll("", "", "", 30, 0)
		if err != nil || len(list) != 30 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
