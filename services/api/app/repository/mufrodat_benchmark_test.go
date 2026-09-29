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

func setupMufrodatBenchmarkDB(b *testing.B) *gorm.DB {
	b.Helper()
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:memdb_mufrodat_%d?mode=memory&cache=shared", b.N)), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		b.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.Mufrodat{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	surahNum := 1
	surahTr := &model.Translation{Idn: strptrOrNil("Al-Fatihah"), Ar: strptrOrNil("الفاتحة")}
	db.Create(surahTr)
	surah := &model.Surah{Number: &surahNum, TranslationID: surahTr.ID}
	db.Create(surah)

	ayahNum := 1
	ayahTr := &model.Translation{Idn: strptrOrNil("Dengan nama Allah"), Ar: strptrOrNil("بسم الله")}
	db.Create(ayahTr)
	ayah := &model.Ayah{Number: &ayahNum, SurahID: surah.ID, TranslationID: ayahTr.ID}
	db.Create(ayah)

	for i := 1; i <= 20; i++ {
		m := &model.Mufrodat{
			AyahID:          ayah.ID,
			WordIndex:       i,
			Arabic:          "اسم",
			Transliteration: "ismi",
			Indonesian:      "nama",
			RootWord:        "سمو",
		}
		db.Create(m)
	}

	return db
}

func findMufrodatByAyahIDPreload(db *gorm.DB, ayahID int) ([]model.Mufrodat, error) {
	var items []model.Mufrodat
	err := db.Model(&model.Mufrodat{}).
		Preload("Ayah").Preload("Ayah.Surah").Preload("Ayah.Translation").
		Where("ayah_id = ?", ayahID).
		Order("word_index asc").
		Find(&items).Error
	return items, err
}

func BenchmarkMufrodat_GORM_Preload(b *testing.B) {
	db := setupMufrodatBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		items, err := findMufrodatByAyahIDPreload(db, 1)
		if err != nil || len(items) != 20 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(items))
		}
	}
}

func BenchmarkMufrodat_Native_RawScan(b *testing.B) {
	db := setupMufrodatBenchmarkDB(b)
	repo := NewMufrodatRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		items, err := repo.FindByAyahID(1)
		if err != nil || len(items) != 20 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(items))
		}
	}
}
