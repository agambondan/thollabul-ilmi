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

func setupTakhrijBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.Book{}, &model.Takhrij{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	bookID := 1
	bookTr := &model.Translation{Idn: strptrOrNil("Shahih Bukhari"), En: strptrOrNil("Sahih Bukhari")}
	db.Create(bookTr)
	book := &model.Book{
		BaseID:        model.BaseID{ID: &bookID},
		Slug:          strptrOrNil("bukhari"),
		DefaultLanguage: strptrOrNil("idn"),
		TranslationID: bookTr.ID,
	}
	db.Create(book)

	for i := 1; i <= 50; i++ {
		hadithID := 1
		t := &model.Takhrij{
			HadithID:        &hadithID,
			BookID:          book.ID,
			NomorHadisKitab: strptrOrNil(fmt.Sprintf("%d", i)),
			Halaman:         strptrOrNil(fmt.Sprintf("Hal %d", i)),
			Jilid:           strptrOrNil("1"),
			Catatan:         strptrOrNil("Catatan takhrij"),
		}
		db.Create(t)
	}

	return db
}

func findTakhrijByHadithIDPreload(db *gorm.DB, hadithID *int) ([]model.Takhrij, error) {
	var list []model.Takhrij
	err := db.
		Preload("Book").
		Preload("Book.Translation").
		Where("hadith_id = ?", hadithID).
		Order("id").
		Find(&list).Error
	return list, err
}

func BenchmarkTakhrij_GORM_Preload(b *testing.B) {
	db := setupTakhrijBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	hadithID := 1
	for i := 0; i < b.N; i++ {
		list, err := findTakhrijByHadithIDPreload(db, &hadithID)
		if err != nil || len(list) != 50 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkTakhrij_Native_RawScan(b *testing.B) {
	db := setupTakhrijBenchmarkDB(b)
	repo := NewTakhrijRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	hadithID := 1
	for i := 0; i < b.N; i++ {
		list, err := repo.FindByHadithID(&hadithID)
		if err != nil || len(list) != 50 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}