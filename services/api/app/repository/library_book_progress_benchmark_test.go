package repository

import (
	"fmt"
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupLibraryProgressBenchmarkDB(b *testing.B) (*gorm.DB, uuid.UUID) {
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

	if err := db.AutoMigrate(&model.LibraryBook{}, &model.LibraryBookProgress{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	userID := uuid.New()

	for i := 1; i <= 20; i++ {
		book := &model.LibraryBook{
			Title:            fmt.Sprintf("Kitab %d", i),
			Slug:             fmt.Sprintf("kitab-%d", i),
			Author:           fmt.Sprintf("Ulama %d", i),
			Description:      "Deskripsi kitab",
			Category:         "aqidah",
			Level:            "pemula",
			Language:         "id",
			Format:           model.LibraryBookFormatPDF,
			SourceType:       model.LibraryBookSourceUploaded,
			Pages:            100 + i,
			Status:           model.LibraryBookStatusPublished,
			ExtractionStatus: model.LibraryBookExtractDone,
		}
		db.Create(book)

		now := time.Now()
		prog := &model.LibraryBookProgress{
			UserID:        userID,
			LibraryBookID: *book.ID,
			Status:        model.LibraryBookProgressReading,
			CurrentPage:   10 + i,
			Note:          "Catatan belajar",
			LastStudiedAt: &now,
		}
		db.Create(prog)
	}

	return db, userID
}

func findLibraryProgressPreload(db *gorm.DB, userID uuid.UUID) ([]model.LibraryBookProgress, error) {
	var list []model.LibraryBookProgress
	err := db.Preload("Book").Where("user_id = ?", userID).Order("updated_at desc").Find(&list).Error
	return list, err
}

func BenchmarkLibraryProgress_GORM_Preload(b *testing.B) {
	db, userID := setupLibraryProgressBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := findLibraryProgressPreload(db, userID)
		if err != nil || len(list) != 20 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkLibraryProgress_Native_RawScan(b *testing.B) {
	db, userID := setupLibraryProgressBenchmarkDB(b)
	repo := NewLibraryBookProgressRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := repo.FindByUserID(userID)
		if err != nil || len(list) != 20 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
