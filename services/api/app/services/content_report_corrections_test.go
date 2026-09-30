package service

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func newCorrectionDB(t *testing.T, models ...interface{}) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file:corrections_"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	sqlDB, _ := db.DB()
	sqlDB.SetMaxOpenConns(1)
	t.Cleanup(func() { _ = sqlDB.Close() })
	if err := db.AutoMigrate(models...); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func strPtr(value string) *string { return &value }

func translationIdn(t *testing.T, db *gorm.DB, id int) string {
	t.Helper()
	var row model.Translation
	if err := db.First(&row, id).Error; err != nil {
		t.Fatalf("read translation %d: %v", id, err)
	}
	if row.Idn == nil {
		return ""
	}
	return *row.Idn
}

func TestApplyCorrectionToAyahTranslation(t *testing.T) {
	db := newCorrectionDB(t, &model.Translation{}, &model.Surah{}, &model.Ayah{})
	svc := &contentReportService{}

	tr := &model.Translation{Idn: strPtr("lama")}
	db.Create(tr)
	surah := &model.Surah{Number: intPtr(1)}
	db.Create(surah)
	db.Create(&model.Ayah{Number: intPtr(2), SurahID: surah.ID, TranslationID: tr.ID})

	old, err := svc.updateTranslationByAyahNumber(db, "1:2", "idn", "baru")
	if err != nil {
		t.Fatalf("updateTranslationByAyahNumber: %v", err)
	}
	if old != "lama" || translationIdn(t, db, *tr.ID) != "baru" {
		t.Fatalf("old=%q stored=%q", old, translationIdn(t, db, *tr.ID))
	}
}

func TestApplyCorrectionToHadithTranslation(t *testing.T) {
	db := newCorrectionDB(t, &model.Translation{}, &model.Book{}, &model.Hadith{})
	svc := &contentReportService{}

	tr := &model.Translation{Idn: strPtr("lama")}
	db.Create(tr)
	book := &model.Book{Slug: strPtr("bukhari")}
	db.Create(book)
	db.Create(&model.Hadith{Number: intPtr(7), BookID: book.ID, TranslationID: tr.ID})

	old, err := svc.updateTranslationByHadithSlugNumber(db, "bukhari", 7, "idn", "baru")
	if err != nil {
		t.Fatalf("updateTranslationByHadithSlugNumber: %v", err)
	}
	if old != "lama" || translationIdn(t, db, *tr.ID) != "baru" {
		t.Fatalf("old=%q stored=%q", old, translationIdn(t, db, *tr.ID))
	}
}

func TestApplyCorrectionToDoaAndDzikirColumns(t *testing.T) {
	db := newCorrectionDB(t, &model.Translation{}, &model.Doa{}, &model.Dzikir{})
	svc := &contentReportService{}

	db.Create(&model.Doa{Category: "harian", Title: "doa", Arabic: "a", TranslationText: "lama"})
	db.Create(&model.Dzikir{Category: "pagi", Title: "dzikir", Arabic: "a", TranslationText: "lama"})

	if _, err := svc.updateDoaTranslation(db, "1", "idn", "baru"); err != nil {
		t.Fatalf("updateDoaTranslation: %v", err)
	}
	if _, err := svc.updateDzikirTranslation(db, "1", "idn", "baru"); err != nil {
		t.Fatalf("updateDzikirTranslation: %v", err)
	}
	var doa model.Doa
	var dzikir model.Dzikir
	db.First(&doa)
	db.First(&dzikir)
	if doa.TranslationText != "baru" || dzikir.TranslationText != "baru" {
		t.Fatalf("doa=%q dzikir=%q", doa.TranslationText, dzikir.TranslationText)
	}
}

func TestApplyCorrectionToFiqhAndSirohContent(t *testing.T) {
	db := newCorrectionDB(t, &model.Translation{}, &model.FiqhItem{}, &model.SirohContent{})
	svc := &contentReportService{}

	db.Create(&model.FiqhItem{CategoryID: intPtr(1), Title: "f", Slug: "f", Content: "lama"})
	db.Create(&model.SirohContent{CategoryID: intPtr(1), Title: "s", Slug: "s", Content: "lama"})

	if old, err := svc.updateFiqhItemContent(db, "1", "idn", "baru"); err != nil || old != "lama" {
		t.Fatalf("updateFiqhItemContent old=%q err=%v", old, err)
	}
	if old, err := svc.updateSirohContent(db, "1", "idn", "baru"); err != nil || old != "lama" {
		t.Fatalf("updateSirohContent old=%q err=%v", old, err)
	}
	var fiqh model.FiqhItem
	var siroh model.SirohContent
	db.First(&fiqh)
	db.First(&siroh)
	if fiqh.Content != "baru" || siroh.Content != "baru" {
		t.Fatalf("fiqh=%q siroh=%q", fiqh.Content, siroh.Content)
	}
}
