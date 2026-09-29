package repository

import (
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/morkid/paginate"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupTafsirBenchmarkDB(b *testing.B) *gorm.DB {
	b.Helper()
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:memdb_tafsir_%d?mode=memory&cache=shared", b.N)), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		b.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.Tafsir{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	// Seed 1 surah with 20 ayahs and 20 tafsirs
	surahNum := 1
	surahTr := &model.Translation{Idn: strptrOrNil("Al-Fatihah"), Ar: strptrOrNil("الفاتحة")}
	db.Create(surahTr)
	surah := &model.Surah{Number: &surahNum, TranslationID: surahTr.ID}
	db.Create(surah)

	for i := 1; i <= 20; i++ {
		ayahNum := i
		ayahTr := &model.Translation{Idn: strptrOrNil(fmt.Sprintf("Ayat %d", i)), Ar: strptrOrNil("آية")}
		db.Create(ayahTr)
		ayah := &model.Ayah{Number: &ayahNum, SurahID: surah.ID, TranslationID: ayahTr.ID}
		db.Create(ayah)

		kt := &model.Translation{Idn: strptrOrNil("Tafsir Jalalain"), Ar: strptrOrNil("تفسير")}
		db.Create(kt)
		ikt := &model.Translation{Idn: strptrOrNil("Tafsir Quraish Shihab")}
		db.Create(ikt)
		iket := &model.Translation{En: strptrOrNil("Tafsir Ibn Kathir En")}
		db.Create(iket)

		tafsir := &model.Tafsir{
			AyahID:                    ayah.ID,
			KemenagTranslationID:      kt.ID,
			IbnuKatsirTranslationID:   ikt.ID,
			IbnuKatsirEnTranslationID: iket.ID,
		}
		db.Create(tafsir)
	}

	return db
}

// GORM Preload implementation for benchmark comparison
func findBySurahNumberPreload(db *gorm.DB, surahNumber, limit, offset int) ([]model.Tafsir, error) {
	var list []model.Tafsir
	err := db.
		Select("tafsir.*").
		Preload("KemenagTranslation").
		Preload("IbnuKatsirTranslation").
		Preload("IbnuKatsirEnTranslation").
		Preload("Ayah").Preload("Ayah.Translation").Preload("Ayah.Surah").Preload("Ayah.Surah.Translation").
		Joins("JOIN ayah ON ayah.id = tafsir.ayah_id").
		Joins("JOIN surah ON surah.id = ayah.surah_id").
		Where("surah.number = ?", surahNumber).
		Order("ayah.number asc").
		Limit(limit).
		Offset(offset).
		Find(&list).Error
	return list, err
}

func BenchmarkTafsir_GORM_Preload(b *testing.B) {
	db := setupTafsirBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := findBySurahNumberPreload(db, 1, 20, 0)
		if err != nil || len(list) != 20 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(list))
		}
	}
}

func BenchmarkTafsir_Native_RawScan(b *testing.B) {
	db := setupTafsirBenchmarkDB(b)
	repo := NewTafsirRepository(db, paginate.New())
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		list, err := repo.FindBySurahNumber(1, 20, 0)
		if err != nil || len(list) != 20 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(list))
		}
	}
}
