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

func setupAsmaBenchmarkDB(b *testing.B) *gorm.DB {
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

	if err := db.AutoMigrate(&model.Translation{}, &model.AsmaUlHusna{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	for i := 1; i <= 99; i++ {
		tr := &model.Translation{
			Idn: strptrOrNil(fmt.Sprintf("Nama indonesian %d", i)),
			Ar:  strptrOrNil("اسم"),
		}
		db.Create(tr)

		a := &model.AsmaUlHusna{
			Number:          i,
			Arabic:          fmt.Sprintf("الاسم %d", i),
			Transliteration: fmt.Sprintf("al-ism %d", i),
			Indonesian:      fmt.Sprintf("Nama %d", i),
			English:         fmt.Sprintf("Name %d", i),
			Meaning:         fmt.Sprintf("Makna nama ke-%d", i),
			Source:          "Quran/Hadith",
			AudioURL:        fmt.Sprintf("https://example.com/audio/%d.mp3", i),
			TranslationID:   tr.ID,
		}
		db.Create(a)
	}

	return db
}

func findAsmaPreload(db *gorm.DB, limit, offset int) ([]model.AsmaUlHusna, error) {
	if limit <= 0 {
		limit = 99
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.AsmaUlHusna
	err := db.Preload("Translation").Order("number asc").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func BenchmarkAsma_GORM_Preload(b *testing.B) {
	db := setupAsmaBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := findAsmaPreload(db, 99, 0)
		if err != nil || len(list) != 99 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkAsma_Native_RawScan(b *testing.B) {
	db := setupAsmaBenchmarkDB(b)
	repo := NewAsmaUlHusnaRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := repo.FindAll(99, 0)
		if err != nil || len(list) != 99 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}