package repository

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func TestDzikirRepositoryCreateUpdateAndQueries(t *testing.T) {
	db := newStaticContentRepositoryTestDB(t)
	repo := NewDzikirRepository(db)

	created, err := repo.Create(&model.Dzikir{
		Category:        model.DzikirPagi,
		Occasion:        "pagi",
		Title:           "Istighfar",
		Arabic:          "أَسْتَغْفِرُ اللهَ",
		Transliteration: "Astaghfirullah",
		TranslationText: "Aku memohon ampun kepada Allah",
		Count:           3,
		Source:          "Hisnul Muslim",
	})
	if err != nil {
		t.Fatalf("create dzikir: %v", err)
	}
	if created.TranslationID == nil || created.Translation == nil {
		t.Fatal("expected dzikir translation to be created and preloaded")
	}
	if created.Translation.Idn == nil || *created.Translation.Idn != "Istighfar" {
		t.Fatalf("expected translated title, got %#v", created.Translation)
	}

	updated, err := repo.Update(*created.ID, &model.Dzikir{
		Category:        model.DzikirPetang,
		Occasion:        "petang",
		Title:           "Istighfar Petang",
		Arabic:          "أَسْتَغْفِرُ اللهَ",
		Transliteration: "Astaghfirullah",
		TranslationText: "Dzikir petang",
		Count:           33,
		FadhilahIdn:     "Keutamaan petang",
		Source:          "Hisnul Muslim",
	})
	if err != nil {
		t.Fatalf("update dzikir: %v", err)
	}
	if updated.Count != 33 || updated.Category != model.DzikirPetang {
		t.Fatalf("expected updated dzikir fields, got %#v", updated)
	}
	if updated.Translation == nil || updated.Translation.Idn == nil || *updated.Translation.Idn != "Istighfar Petang" {
		t.Fatalf("expected translation update, got %#v", updated.Translation)
	}

	byOccasion, err := repo.FindByOccasion("petang", 20, 0)
	if err != nil {
		t.Fatalf("find dzikir by occasion: %v", err)
	}
	if len(byOccasion) != 1 || byOccasion[0].Translation == nil {
		t.Fatalf("expected one preloaded dzikir by occasion, got %#v", byOccasion)
	}
}

func TestManasikRepositoryCreateUpdateAndOrder(t *testing.T) {
	db := newStaticContentRepositoryTestDB(t)
	repo := NewManasikRepository(db)

	stepTwo, err := repo.Create(&model.ManasikStep{
		Type:            model.ManasikTypeHaji,
		StepOrder:       2,
		Title:           "Wukuf",
		Description:     "Berdiam di Arafah",
		Arabic:          "الوقوف بعرفة",
		Transliteration: "Al-wuquf bi Arafah",
		TranslationText: "Wukuf di Arafah",
	})
	if err != nil {
		t.Fatalf("create manasik step 2: %v", err)
	}
	if stepTwo.TranslationID == nil || stepTwo.Translation == nil {
		t.Fatal("expected manasik translation to be created and preloaded")
	}

	if _, err := repo.Create(&model.ManasikStep{
		Type:            model.ManasikTypeHaji,
		StepOrder:       1,
		Title:           "Ihram",
		Arabic:          "الإحرام",
		Transliteration: "Ihram",
		TranslationText: "Niat ihram",
	}); err != nil {
		t.Fatalf("create manasik step 1: %v", err)
	}

	steps, err := repo.FindByType(model.ManasikTypeHaji, 20, 0)
	if err != nil {
		t.Fatalf("find manasik by type: %v", err)
	}
	if len(steps) != 2 || steps[0].StepOrder != 1 || steps[1].StepOrder != 2 {
		t.Fatalf("expected steps ordered by step_order, got %#v", steps)
	}

	updated, err := repo.Update(*stepTwo.ID, &model.ManasikStep{
		Type:            model.ManasikTypeHaji,
		StepOrder:       3,
		Title:           "Wukuf Arafah",
		Description:     "Puncak ibadah haji",
		Arabic:          "الوقوف بعرفة",
		Transliteration: "Al-wuquf bi Arafah",
		TranslationText: "Wukuf Arafah",
		Notes:           "Dilakukan pada 9 Dzulhijjah",
		IsWajib:         true,
	})
	if err != nil {
		t.Fatalf("update manasik: %v", err)
	}
	if !updated.IsWajib || updated.StepOrder != 3 {
		t.Fatalf("expected updated manasik fields, got %#v", updated)
	}
	if updated.Translation == nil || updated.Translation.Idn == nil || *updated.Translation.Idn != "Wukuf Arafah" {
		t.Fatalf("expected translation update, got %#v", updated.Translation)
	}
}

func TestFiqhRepositoryItemCRUDKeepsDalilSeparate(t *testing.T) {
	db := newStaticContentRepositoryTestDB(t)
	repo := NewFiqhRepository(db)

	category, err := repo.CreateCategory(&model.FiqhCategory{
		Name:        "Thaharah",
		Slug:        "thaharah",
		Description: "Bersuci",
	})
	if err != nil {
		t.Fatalf("create fiqh category: %v", err)
	}

	item, err := repo.CreateItem(&model.FiqhItem{
		CategoryID: category.ID,
		Title:      "Wudhu",
		Slug:       "wudhu",
		Content:    "Tata cara wudhu",
		Source:     "Kitab Fiqih",
		Dalil:      "QS Al-Maidah: 6",
		SortOrder:  2,
	})
	if err != nil {
		t.Fatalf("create fiqh item: %v", err)
	}

	updated, err := repo.UpdateItem(*item.ID, &model.FiqhItem{
		CategoryID: category.ID,
		Title:      "Wudhu Sempurna",
		Slug:       "wudhu-sempurna",
		Content:    "Rukun dan sunnah wudhu",
		Source:     "Kitab Fiqih Baru",
		Dalil:      "HR Bukhari",
		SortOrder:  1,
	})
	if err != nil {
		t.Fatalf("update fiqh item: %v", err)
	}
	if updated.Dalil != "HR Bukhari" || updated.Source != "Kitab Fiqih Baru" {
		t.Fatalf("expected source and dalil to stay separate, got source=%q dalil=%q", updated.Source, updated.Dalil)
	}

	loaded, err := repo.FindItemByCategoryAndID("thaharah", *item.ID)
	if err != nil {
		t.Fatalf("find item by category and id: %v", err)
	}
	if loaded.Dalil != "HR Bukhari" || loaded.Source != "Kitab Fiqih Baru" {
		t.Fatalf("expected persisted source and dalil, got source=%q dalil=%q", loaded.Source, loaded.Dalil)
	}

	allItems, err := repo.FindAllItems(20, 0)
	if err != nil {
		t.Fatalf("find all fiqh items: %v", err)
	}
	if len(allItems) != 1 || allItems[0].Category == nil {
		t.Fatalf("expected item with preloaded category, got %#v", allItems)
	}
}

func newStaticContentRepositoryTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	// Mirror the app's naming strategy (app/db/postgresql.go, app/db/db_sqlite.go)
	// so queries that qualify columns by table name are exercised realistically.
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
		Logger:         logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(
		&model.Translation{},
		&model.Dzikir{},
		&model.ManasikStep{},
		&model.FiqhCategory{},
		&model.FiqhItem{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}
