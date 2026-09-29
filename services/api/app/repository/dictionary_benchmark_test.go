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

func setupDictionaryBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.IslamicTerm{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	for i := 1; i <= 100; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Definisi istilah %d", i)),
			Ar:  strptrOrNil("تعريف"),
		}
		db.Create(tr)

		term := &model.IslamicTerm{
			Term:          fmt.Sprintf("Istilah %d", i),
			Category:      model.TermCategoryFiqh,
			Definition:    fmt.Sprintf("Definisi untuk istilah ke-%d", i),
			Example:       "Contoh penggunaan",
			Source:        "Kitab referensi",
			Origin:        "Arab",
			TranslationID: tr.ID,
		}
		db.Create(term)
	}

	return db
}

func findDictionaryPreload(db *gorm.DB, category string, search string) ([]model.IslamicTerm, error) {
	var items []model.IslamicTerm
	q := db.Preload("Translation").Order("term ASC")
	if category != "" {
		q = q.Where("category = ?", category)
	}
	if search != "" {
		q = q.Where("term ILIKE ? OR definition ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	return items, q.Limit(500).Find(&items).Error
}

func BenchmarkDictionary_GORM_Preload(b *testing.B) {
	db := setupDictionaryBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := findDictionaryPreload(db, "fiqh", "")
		if err != nil || len(list) != 100 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkDictionary_Native_RawScan(b *testing.B) {
	db := setupDictionaryBenchmarkDB(b)
	repo := NewDictionaryRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		list, err := repo.FindAll("fiqh", "")
		if err != nil || len(list) != 100 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
