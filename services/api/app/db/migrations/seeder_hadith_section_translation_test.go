package migrations

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func TestBackfillHadithSectionTranslations(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "hadith_section_translations_id.json")
	if err := os.WriteFile(file, []byte(`{"Blood Money (Ad-Diyat)":"Diyat"}`), 0o600); err != nil {
		t.Fatalf("write translations: %v", err)
	}

	oldPaths := hadithSectionTranslationPaths
	hadithSectionTranslationPaths = []string{file}
	defer func() { hadithSectionTranslationPaths = oldPaths }()

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Silent),
		DisableForeignKeyConstraintWhenMigrating: true,
		NamingStrategy:                           schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Translation{}, &model.Theme{}, &model.Chapter{}); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}

	row := model.Translation{En: stringPtr("Blood Money (Ad-Diyat)"), Idn: stringPtr("Blood Money (Ad-Diyat)")}
	if err := db.Create(&row).Error; err != nil {
		t.Fatalf("seed translation: %v", err)
	}
	blank := model.Translation{En: stringPtr(""), Idn: stringPtr("")}
	if err := db.Create(&blank).Error; err != nil {
		t.Fatalf("seed blank translation: %v", err)
	}
	if err := db.Create(&model.Theme{TranslationID: blank.ID}).Error; err != nil {
		t.Fatalf("seed theme: %v", err)
	}

	if err := BackfillHadithSectionTranslations(db); err != nil {
		t.Fatalf("backfill: %v", err)
	}

	var updated model.Translation
	if err := db.First(&updated, row.ID).Error; err != nil {
		t.Fatalf("read translation: %v", err)
	}
	if updated.Idn == nil || *updated.Idn != "Diyat" {
		t.Fatalf("expected Diyat, got %#v", updated.Idn)
	}

	var fixed model.Translation
	if err := db.First(&fixed, blank.ID).Error; err != nil {
		t.Fatalf("read blank translation: %v", err)
	}
	if fixed.Idn == nil || *fixed.Idn == "" || fixed.En == nil || *fixed.En == "" {
		t.Fatalf("expected non-empty fallback, got %#v %#v", fixed.Idn, fixed.En)
	}
}
