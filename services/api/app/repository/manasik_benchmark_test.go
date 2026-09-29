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

func setupManasikBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.ManasikStep{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	for i := 1; i <= 30; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Langkah Manasik %d", i)),
			Ar:  strptrOrNil("مناسك"),
		}
		db.Create(tr)

		step := &model.ManasikStep{
			Type:            model.ManasikTypeHaji,
			StepOrder:       i,
			Title:           fmt.Sprintf("Langkah %d", i),
			Description:     "Tata cara pelaksanaan rukun dan wajib haji.",
			Arabic:          "لبيك اللهم لبيك",
			TranslationText: "Aku penuhi panggilan-Mu ya Allah",
			IsWajib:         true,
			Source:          "Shahih Bukhari & Muslim",
			TranslationID:   tr.ID,
		}
		db.Create(step)
	}

	return db
}

func findManasikAllPreload(db *gorm.DB, limit, offset int) ([]model.ManasikStep, error) {
	var steps []model.ManasikStep
	err := db.Preload("Translation").Order("type ASC, step_order ASC").Limit(limit).Offset(offset).Find(&steps).Error
	return steps, err
}

func BenchmarkManasik_GORM_Preload(b *testing.B) {
	db := setupManasikBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := findManasikAllPreload(db, 30, 0)
		if err != nil || len(list) != 30 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkManasik_Native_RawScan(b *testing.B) {
	db := setupManasikBenchmarkDB(b)
	repo := NewManasikRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := repo.FindAll(30, 0)
		if err != nil || len(list) != 30 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
