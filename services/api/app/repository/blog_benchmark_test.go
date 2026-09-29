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

func setupBlogBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.BlogCategory{}, &model.BlogTag{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	for i := 1; i <= 20; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Kategori %d", i)),
			Ar:  strptrOrNil("فئة"),
		}
		db.Create(tr)

		cat := &model.BlogCategory{
			Name:          fmt.Sprintf("Category %d", i),
			Slug:          fmt.Sprintf("category-%d", i),
			Description:   fmt.Sprintf("Description for category %d", i),
			TranslationID: tr.ID,
		}
		db.Create(cat)
	}

	return db
}

func findBlogCategoriesPreload(db *gorm.DB) ([]model.BlogCategory, error) {
	var list []model.BlogCategory
	err := db.Preload("Translation").Order("name asc").Find(&list).Error
	return list, err
}

func BenchmarkBlog_GORM_Preload(b *testing.B) {
	db := setupBlogBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := findBlogCategoriesPreload(db)
		if err != nil || len(list) != 20 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkBlog_Native_RawScan(b *testing.B) {
	db := setupBlogBenchmarkDB(b)
	repo := NewBlogRepository(db, nil)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := repo.FindAllCategories()
		if err != nil || len(list) != 20 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
