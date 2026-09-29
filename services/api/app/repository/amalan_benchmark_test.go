package repository

import (
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupAmalanBenchmarkDB(b *testing.B) (*gorm.DB, uuid.UUID) {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.AmalanItem{}, &model.AmalanLog{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	userID := uuid.New()

	for i := 1; i <= 30; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Amalan item %d", i)),
			Ar:  strptrOrNil("عمل"),
		}
		db.Create(tr)

		item := &model.AmalanItem{
			Name:          fmt.Sprintf("Amalan %d", i),
			Description:   fmt.Sprintf("Deskripsi amalan %d", i),
			Category:      model.AmalanSholat,
			IsActive:      true,
			TranslationID: tr.ID,
		}
		db.Create(item)

		log := &model.AmalanLog{
			UserID:       userID,
			AmalanItemID: *item.ID,
			Date:         fmt.Sprintf("2026-09-%02d", (i%28)+1),
			IsDone:       true,
		}
		db.Create(log)
	}

	return db, userID
}

func findAmalanHistoryPreload(db *gorm.DB, userID uuid.UUID, from, to string) ([]model.AmalanLog, error) {
	var logs []model.AmalanLog
	err := db.Preload("AmalanItem").
		Where("user_id = ? AND date BETWEEN ? AND ?", userID, from, to).
		Order("date DESC").Find(&logs).Error
	return logs, err
}

func BenchmarkAmalan_GORM_Preload(b *testing.B) {
	db, userID := setupAmalanBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := findAmalanHistoryPreload(db, userID, "2026-09-01", "2026-09-30")
		if err != nil || len(list) != 30 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkAmalan_Native_RawScan(b *testing.B) {
	db, userID := setupAmalanBenchmarkDB(b)
	repo := NewAmalanRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := repo.FindHistory(userID, "2026-09-01", "2026-09-30")
		if err != nil || len(list) != 30 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
