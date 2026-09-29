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

func setupSirohBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.SirohCategory{}, &model.SirohContent{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	catID := 1
	catTr := &model.Translation{Idn: strptrOrNil("Periode Mekkah")}
	db.Create(catTr)
	cat := &model.SirohCategory{
		BaseID:        model.BaseID{ID: &catID},
		Title:         "Periode Mekkah",
		Slug:          "periode-mekkah",
		Order:         1,
		TranslationID: catTr.ID,
	}
	db.Create(cat)

	for i := 1; i <= 25; i++ {
		itemID := i
		itemTr := &model.Translation{Idn: strptrOrNil(fmt.Sprintf("Peristiwa %d", i))}
		db.Create(itemTr)

		item := &model.SirohContent{
			BaseID:        model.BaseID{ID: &itemID},
			CategoryID:    cat.ID,
			Title:         fmt.Sprintf("Kisah ke-%d", i),
			Slug:          fmt.Sprintf("kisah-ke-%d", i),
			Content:       "Penjelasan peristiwa siroh nabawiyah yang mulia.",
			Source:        "Ar-Rahiq Al-Makhtum",
			Order:         i,
			TranslationID: itemTr.ID,
		}
		db.Create(item)
	}

	return db
}

func findSirohCategoryBySlugPreload(db *gorm.DB, slug string) (*model.SirohCategory, error) {
	var c model.SirohCategory
	err := db.
		Preload("Translation").
		Preload("Contents.Translation").
		Where("slug = ?", slug).
		First(&c).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func BenchmarkSiroh_GORM_Preload(b *testing.B) {
	db := setupSirohBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		cat, err := findSirohCategoryBySlugPreload(db, "periode-mekkah")
		if err != nil || len(cat.Contents) != 25 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(cat.Contents))
		}
	}
}

func BenchmarkSiroh_Native_RawScan(b *testing.B) {
	db := setupSirohBenchmarkDB(b)
	repo := NewSirohRepository(db, nil)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		cat, err := repo.FindCategoryBySlug("periode-mekkah")
		if err != nil || len(cat.Contents) != 25 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(cat.Contents))
		}
	}
}
