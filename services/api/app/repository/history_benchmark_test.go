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

func setupHistoryBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.HistoryEvent{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	for i := 1; i <= 30; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Peristiwa Sejarah %d", i)),
			En:  strptrOrNil(fmt.Sprintf("Historical Event %d", i)),
		}
		db.Create(tr)

		event := &model.HistoryEvent{
			YearHijri:     i,
			YearMiladi:    622 + i,
			Title:         fmt.Sprintf("Peristiwa %d", i),
			Slug:          fmt.Sprintf("peristiwa-%d", i),
			Description:   "Penjelasan peristiwa penting dalam sejarah Islam.",
			Category:      model.HistoryCategoryNabi,
			IsSignificant: true,
			Source:        "Tarikh At-Thabari",
			TranslationID: tr.ID,
		}
		db.Create(event)
	}

	return db
}

func findHistoryAllPreload(db *gorm.DB, limit, offset int) ([]model.HistoryEvent, error) {
	var items []model.HistoryEvent
	err := db.Preload("Translation").Order("year_miladi ASC").Limit(limit).Offset(offset).Find(&items).Error
	return items, err
}

func BenchmarkHistory_GORM_Preload(b *testing.B) {
	db := setupHistoryBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := findHistoryAllPreload(db, 30, 0)
		if err != nil || len(list) != 30 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkHistory_Native_RawScan(b *testing.B) {
	db := setupHistoryBenchmarkDB(b)
	repo := NewHistoryRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := repo.FindAll("", 0, 0, 30, 0)
		if err != nil || len(list) != 30 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
