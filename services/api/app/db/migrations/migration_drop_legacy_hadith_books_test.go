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

func TestDropLegacyNonCanonicalHadithBooks(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Silent),
		DisableForeignKeyConstraintWhenMigrating: true,
		NamingStrategy:                           schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(
		&model.Book{},
		&model.Hadith{},
		&model.Theme{},
		&model.Chapter{},
		&model.BookThemes{},
		&model.BookAsset{},
		&model.Translation{},
		&model.SeedFileState{},
	); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}

	bukhariTr := model.Translation{Idn: lib.Strptr("Shahih Bukhari")}
	db.Create(&bukhariTr)
	bukhari := model.Book{Slug: lib.Strptr("bukhari"), TranslationID: bukhariTr.ID}
	db.Create(&bukhari)

	arbainTr := model.Translation{Idn: lib.Strptr("Arbain Nawawi")}
	db.Create(&arbainTr)
	arbain := model.Book{Slug: lib.Strptr("arbain-nawawi"), TranslationID: arbainTr.ID}
	db.Create(&arbain)

	riyadhusTr := model.Translation{Idn: lib.Strptr("Riyadhus Shalihin")}
	db.Create(&riyadhusTr)
	riyadhus := model.Book{Slug: lib.Strptr("riyadhus-shalihin"), TranslationID: riyadhusTr.ID}
	db.Create(&riyadhus)

	themeTr := model.Translation{Idn: lib.Strptr("Niat")}
	db.Create(&themeTr)
	theme := model.Theme{TranslationID: themeTr.ID}
	db.Create(&theme)
	db.Create(&model.BookThemes{BookID: arbain.ID, ThemeID: theme.ID})

	chapterTr := model.Translation{Idn: lib.Strptr("Bab 1")}
	db.Create(&chapterTr)
	chapter := model.Chapter{ThemeID: theme.ID, TranslationID: chapterTr.ID}
	db.Create(&chapter)

	hTr := model.Translation{Idn: lib.Strptr("Innamal a'malu binniyat")}
	db.Create(&hTr)
	h := model.Hadith{Number: lib.Intptr(1), BookID: arbain.ID, ThemeID: theme.ID, ChapterID: chapter.ID, TranslationID: hTr.ID}
	db.Create(&h)

	db.Create(&model.SeedFileState{Name: "hadith_arbain_riyadhus.json"})

	DropLegacyNonCanonicalHadithBooks(db)

	var bukhariCount int64
	db.Model(&model.Book{}).Where("slug = ?", "bukhari").Count(&bukhariCount)
	if bukhariCount != 1 {
		t.Fatalf("expected bukhari book to remain, got %d", bukhariCount)
	}

	var legacyCount int64
	db.Model(&model.Book{}).Where("slug IN ?", []string{"arbain-nawawi", "riyadhus-shalihin"}).Count(&legacyCount)
	if legacyCount != 0 {
		t.Fatalf("expected 0 legacy books, got %d", legacyCount)
	}

	var hadithCount int64
	db.Model(&model.Hadith{}).Where("book_id IN ?", []int{*arbain.ID, *riyadhus.ID}).Count(&hadithCount)
	if hadithCount != 0 {
		t.Fatalf("expected 0 legacy hadiths, got %d", hadithCount)
	}

	var seedStateCount int64
	db.Model(&model.SeedFileState{}).Where("name = ?", "hadith_arbain_riyadhus.json").Count(&seedStateCount)
	if seedStateCount != 0 {
		t.Fatalf("expected 0 seed file state records, got %d", seedStateCount)
	}
}
