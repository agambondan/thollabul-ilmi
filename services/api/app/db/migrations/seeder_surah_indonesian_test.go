package migrations

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func newBackfillSurahTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Silent),
		DisableForeignKeyConstraintWhenMigrating: true,
		NamingStrategy:                           schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Surah{}, &model.Translation{}); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}
	return db
}

func TestBackfillSurahIndonesian(t *testing.T) {
	db := newBackfillSurahTestDB(t)

	// Seed surah 1 with English-only translation
	tr1 := model.Translation{
		LatinEn: lib.Strptr("Al-Faatiha"),
		En:      lib.Strptr("The Opening"),
		Idn:     lib.Strptr("The Opening"), // raw API unlocalized
	}
	if err := db.Create(&tr1).Error; err != nil {
		t.Fatalf("seed translation 1: %v", err)
	}
	surah1 := model.Surah{
		Number:        lib.Intptr(1),
		TranslationID: tr1.ID,
	}
	if err := db.Create(&surah1).Error; err != nil {
		t.Fatalf("seed surah 1: %v", err)
	}

	// Seed surah 2 with English-only translation
	tr2 := model.Translation{
		LatinEn: lib.Strptr("Al-Baqara"),
		En:      lib.Strptr("The Cow"),
		Idn:     lib.Strptr("The Cow"),
	}
	if err := db.Create(&tr2).Error; err != nil {
		t.Fatalf("seed translation 2: %v", err)
	}
	surah2 := model.Surah{
		Number:        lib.Intptr(2),
		TranslationID: tr2.ID,
	}
	if err := db.Create(&surah2).Error; err != nil {
		t.Fatalf("seed surah 2: %v", err)
	}

	// Run backfill
	if err := BackfillSurahIndonesian(db); err != nil {
		t.Fatalf("BackfillSurahIndonesian error: %v", err)
	}

	// Verify surah 1 updated
	var updated1 model.Translation
	if err := db.First(&updated1, tr1.ID).Error; err != nil {
		t.Fatalf("fetch updated tr1: %v", err)
	}
	if updated1.LatinIdn == nil || *updated1.LatinIdn != "Al-Fatihah" {
		t.Fatalf("expected LatinIdn 'Al-Fatihah', got %v", updated1.LatinIdn)
	}
	if updated1.Idn == nil || *updated1.Idn != "Pembukaan" {
		t.Fatalf("expected Idn 'Pembukaan', got %v", updated1.Idn)
	}

	// Verify surah 2 updated
	var updated2 model.Translation
	if err := db.First(&updated2, tr2.ID).Error; err != nil {
		t.Fatalf("fetch updated tr2: %v", err)
	}
	if updated2.LatinIdn == nil || *updated2.LatinIdn != "Al-Baqarah" {
		t.Fatalf("expected LatinIdn 'Al-Baqarah', got %v", updated2.LatinIdn)
	}
	if updated2.Idn == nil || *updated2.Idn != "Sapi Betina" {
		t.Fatalf("expected Idn 'Sapi Betina', got %v", updated2.Idn)
	}
}
