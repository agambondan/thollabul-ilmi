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

func setupMunasabahBenchmarkDB(b *testing.B) *gorm.DB {
	b.Helper()
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:memdb_munasabah_%d?mode=memory&cache=shared", b.N)), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		b.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.Munasabah{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	// Seed 1 surah with 20 ayahs and 20 munasabah where ayah_from_id = 1
	surahNum := 1
	surahTr := &model.Translation{Idn: strptrOrNil("Al-Fatihah"), Ar: strptrOrNil("الفاتحة")}
	db.Create(surahTr)
	surah := &model.Surah{Number: &surahNum, TranslationID: surahTr.ID}
	db.Create(surah)

	firstAyahNum := 1
	firstAyahTr := &model.Translation{Idn: strptrOrNil("Ayat 1"), Ar: strptrOrNil("آية")}
	db.Create(firstAyahTr)
	firstAyah := &model.Ayah{Number: &firstAyahNum, SurahID: surah.ID, TranslationID: firstAyahTr.ID}
	db.Create(firstAyah)

	for i := 1; i <= 20; i++ {
		ayahNum := i
		ayahTr := &model.Translation{Idn: strptrOrNil(fmt.Sprintf("Ayat %d", i)), Ar: strptrOrNil("آية")}
		db.Create(ayahTr)
		ayah := &model.Ayah{Number: &ayahNum, SurahID: surah.ID, TranslationID: ayahTr.ID}
		db.Create(ayah)

		munasabah := &model.Munasabah{
			AyahFromID:  firstAyah.ID,
			AyahToID:    ayah.ID,
			Description: fmt.Sprintf("Munasabah %d", i),
		}
		db.Create(munasabah)
	}

	return db
}

// GORM Preload implementation for benchmark comparison
func findMunasabahByAyahIDPreload(db *gorm.DB, ayahID int) ([]model.Munasabah, error) {
	var items []model.Munasabah
	err := db.Preload("AyahFrom").Preload("AyahFrom.Translation").Preload("AyahFrom.Surah").Preload("AyahFrom.Surah.Translation").
		Preload("AyahTo").Preload("AyahTo.Translation").Preload("AyahTo.Surah").Preload("AyahTo.Surah.Translation").
		Where("ayah_from_id = ? OR ayah_to_id = ?", ayahID, ayahID).
		Order("id asc").Find(&items).Error
	return items, err
}

func BenchmarkMunasabah_GORM_Preload(b *testing.B) {
	db := setupMunasabahBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		items, err := findMunasabahByAyahIDPreload(db, 1)
		if err != nil || len(items) != 20 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(items))
		}
	}
}

func BenchmarkMunasabah_Native_RawScan(b *testing.B) {
	db := setupMunasabahBenchmarkDB(b)
	repo := NewMunasabahRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		items, err := repo.FindByAyahID(1)
		if err != nil || len(items) != 20 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(items))
		}
	}
}