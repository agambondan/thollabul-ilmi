package migrations

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func newBackfillSourcesTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Silent),
		DisableForeignKeyConstraintWhenMigrating: true,
		NamingStrategy:                           schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.ManasikStep{}, &model.AsmaUlHusna{}, &model.AmalanItem{}, &model.FiqhItem{}); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}
	return db
}

func TestBackfillSourcesFillsManasikCitationsOnly(t *testing.T) {
	db := newBackfillSourcesTestDB(t)

	steps := []model.ManasikStep{
		{Type: model.ManasikTypeUmrah, StepOrder: 5, Title: "Sholat di Maqam Ibrahim"},
		{Type: model.ManasikTypeHaji, StepOrder: 3, Title: "Wukuf di Arafah"},
		// A step with no known citation — must stay empty, not get a guess.
		{Type: model.ManasikTypeHaji, StepOrder: 2, Title: "Mabit di Mina"},
	}
	for i := range steps {
		if err := db.Create(&steps[i]).Error; err != nil {
			t.Fatalf("seed manasik step: %v", err)
		}
	}

	if err := BackfillSources(db); err != nil {
		t.Fatalf("BackfillSources: %v", err)
	}

	var umrah5 model.ManasikStep
	if err := db.Where("type = ? AND step_order = ?", model.ManasikTypeUmrah, 5).First(&umrah5).Error; err != nil {
		t.Fatalf("query umrah step 5: %v", err)
	}
	if umrah5.Source != "QS. Al-Baqarah: 125" {
		t.Fatalf("umrah step 5 source = %q, want %q", umrah5.Source, "QS. Al-Baqarah: 125")
	}

	var haji3 model.ManasikStep
	if err := db.Where("type = ? AND step_order = ?", model.ManasikTypeHaji, 3).First(&haji3).Error; err != nil {
		t.Fatalf("query haji step 3: %v", err)
	}
	if haji3.Source != "HR. Abu Dawud; HR. Tirmidzi No. 3585" {
		t.Fatalf("haji step 3 source = %q, want %q", haji3.Source, "HR. Abu Dawud; HR. Tirmidzi No. 3585")
	}

	var haji2 model.ManasikStep
	if err := db.Where("type = ? AND step_order = ?", model.ManasikTypeHaji, 2).First(&haji2).Error; err != nil {
		t.Fatalf("query haji step 2: %v", err)
	}
	if haji2.Source != "" {
		t.Fatalf("haji step 2 has no known citation but got source = %q — a value must not be invented", haji2.Source)
	}
}

func TestBackfillSourcesFillsAsmaUlHusnaForEveryRow(t *testing.T) {
	db := newBackfillSourcesTestDB(t)

	for i := 1; i <= 99; i++ {
		row := model.AsmaUlHusna{Number: i, Arabic: "ا", Transliteration: "a", Indonesian: "a", English: "a"}
		if err := db.Create(&row).Error; err != nil {
			t.Fatalf("seed asmaul husna #%d: %v", i, err)
		}
	}

	if err := BackfillSources(db); err != nil {
		t.Fatalf("BackfillSources: %v", err)
	}

	var count int64
	if err := db.Model(&model.AsmaUlHusna{}).
		Where("source = ?", asmaUlHusnaSource).
		Count(&count).Error; err != nil {
		t.Fatalf("count sourced rows: %v", err)
	}
	if count != 99 {
		t.Fatalf("expected all 99 Asmaul Husna rows to have the source, got %d", count)
	}
}

func TestBackfillSourcesDoesNotOverwriteAnExistingSource(t *testing.T) {
	db := newBackfillSourcesTestDB(t)

	custom := "HR. Bukhari No. 1"
	row := model.AsmaUlHusna{Number: 1, Arabic: "ا", Transliteration: "a", Indonesian: "a", English: "a", Source: custom}
	if err := db.Create(&row).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}

	if err := BackfillSources(db); err != nil {
		t.Fatalf("BackfillSources: %v", err)
	}

	var got model.AsmaUlHusna
	if err := db.First(&got, "number = 1").Error; err != nil {
		t.Fatalf("query: %v", err)
	}
	if got.Source != custom {
		t.Fatalf("BackfillSources overwrote an existing source: got %q, want %q", got.Source, custom)
	}
}

func TestBackfillSourcesIsIdempotent(t *testing.T) {
	db := newBackfillSourcesTestDB(t)
	row := model.ManasikStep{Type: model.ManasikTypeUmrah, StepOrder: 5, Title: "x"}
	if err := db.Create(&row).Error; err != nil {
		t.Fatalf("seed: %v", err)
	}

	if err := BackfillSources(db); err != nil {
		t.Fatalf("first BackfillSources: %v", err)
	}
	if err := BackfillSources(db); err != nil {
		t.Fatalf("second BackfillSources: %v", err)
	}

	var got model.ManasikStep
	if err := db.First(&got).Error; err != nil {
		t.Fatalf("query: %v", err)
	}
	if got.Source != "QS. Al-Baqarah: 125" {
		t.Fatalf("source drifted after re-running backfill: %q", got.Source)
	}
}

func TestBackfillSourcesFillsAmalanCitations(t *testing.T) {
	db := newBackfillSourcesTestDB(t)

	items := []model.AmalanItem{
		{Category: model.AmalanSholat, Name: "Sholat Tahajud"},
		{Category: model.AmalanPuasa, Name: "Puasa Senin"},
		// Item without verified citation — must stay empty
		{Category: model.AmalanDzikir, Name: "Sholawat 100x"},
	}
	for i := range items {
		if err := db.Create(&items[i]).Error; err != nil {
			t.Fatalf("seed amalan item: %v", err)
		}
	}

	if err := BackfillSources(db); err != nil {
		t.Fatalf("BackfillSources: %v", err)
	}

	var tahajud model.AmalanItem
	if err := db.Where("name = ?", "Sholat Tahajud").First(&tahajud).Error; err != nil {
		t.Fatalf("query tahajud: %v", err)
	}
	if tahajud.Source != "QS. Al-Isra: 79; HR. Muslim No. 1163" {
		t.Fatalf("tahajud source = %q, want %q", tahajud.Source, "QS. Al-Isra: 79; HR. Muslim No. 1163")
	}

	var sholawat model.AmalanItem
	if err := db.Where("name = ?", "Sholawat 100x").First(&sholawat).Error; err != nil {
		t.Fatalf("query sholawat: %v", err)
	}
	if sholawat.Source != "" {
		t.Fatalf("sholawat 100x has no verified citation but got source = %q", sholawat.Source)
	}
}
