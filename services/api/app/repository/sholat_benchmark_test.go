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

func setupSholatBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.SholatGuide{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	for i := 1; i <= 25; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Gerakan %d", i)),
			Ar:  strptrOrNil("حركة"),
		}
		db.Create(tr)

		guide := &model.SholatGuide{
			Step:            i,
			Title:           fmt.Sprintf("Step %d", i),
			Arabic:          "الله أكبر",
			Transliteration: "Allahu Akbar",
			TranslationText: "Allah Maha Besar",
			TranslationID:   tr.ID,
		}
		db.Create(guide)
	}

	return db
}

func findSholatGuidesPreload(db *gorm.DB) ([]model.SholatGuide, error) {
	var list []model.SholatGuide
	err := db.Preload("Translation").Order("step").Find(&list).Error
	return list, err
}

func BenchmarkSholat_GORM_Preload(b *testing.B) {
	db := setupSholatBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := findSholatGuidesPreload(db)
		if err != nil || len(list) != 25 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkSholat_Native_RawScan(b *testing.B) {
	db := setupSholatBenchmarkDB(b)
	repo := NewSholatRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := repo.FindAllGuides()
		if err != nil || len(list) != 25 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
