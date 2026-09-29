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

func setupFiqhBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.FiqhCategory{}, &model.FiqhItem{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	catID := 1
	catTr := &model.Translation{Idn: strptrOrNil("Thaharah")}
	db.Create(catTr)
	cat := &model.FiqhCategory{
		BaseID:        model.BaseID{ID: &catID},
		Name:          "Thaharah",
		Slug:          "thaharah",
		Description:   "Hukum bersuci",
		TranslationID: catTr.ID,
	}
	db.Create(cat)

	for i := 1; i <= 20; i++ {
		itemID := i
		itemTr := &model.Translation{Idn: strptrOrNil(fmt.Sprintf("Item %d", i))}
		db.Create(itemTr)

		item := &model.FiqhItem{
			BaseID:        model.BaseID{ID: &itemID},
			CategoryID:    cat.ID,
			Title:         fmt.Sprintf("Bab Wudhu %d", i),
			Slug:          fmt.Sprintf("bab-wudhu-%d", i),
			Content:       "Penjelasan rukun dan syarat",
			Source:        "Matan Abu Syuja",
			Dalil:         "QS Al-Maidah 6",
			SortOrder:     i,
			TranslationID: itemTr.ID,
		}
		db.Create(item)
	}

	return db
}

func findCategoryBySlugPreload(db *gorm.DB, slug string, limit, offset int) (*model.FiqhCategory, error) {
	var cat model.FiqhCategory
	err := db.
		Preload("Translation").
		Preload("Items.Translation").
		Preload("Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order, id").Limit(limit).Offset(offset)
		}).
		Where("slug = ?", slug).
		First(&cat).Error
	return &cat, err
}

func BenchmarkFiqh_GORM_Preload(b *testing.B) {
	db := setupFiqhBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		cat, err := findCategoryBySlugPreload(db, "thaharah", 20, 0)
		if err != nil || len(cat.Items) != 20 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(cat.Items))
		}
	}
}

func BenchmarkFiqh_Native_RawScan(b *testing.B) {
	db := setupFiqhBenchmarkDB(b)
	repo := NewFiqhRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		cat, err := repo.FindCategoryBySlug("thaharah", 20, 0)
		if err != nil || len(cat.Items) != 20 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(cat.Items))
		}
	}
}