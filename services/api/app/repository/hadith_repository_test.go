package repository

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/morkid/paginate"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupHadithTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Translation{}, &model.Book{}, &model.Theme{}, &model.Chapter{}, &model.Hadith{}, &model.HadithAsset{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	bookTr := &model.Translation{Idn: strptrOrNil("Shahih Bukhari")}
	db.Create(bookTr)
	book := &model.Book{Slug: strptrOrNil("bukhari"), TranslationID: bookTr.ID}
	db.Create(book)

	for i := 1; i <= 5; i++ {
		number := i
		hadithTr := &model.Translation{Idn: strptrOrNil("Terjemahan hadits")}
		db.Create(hadithTr)
		hadith := &model.Hadith{
			Number:        &number,
			BookID:        book.ID,
			TranslationID: hadithTr.ID,
		}
		db.Create(hadith)
	}

	return db
}

func TestHadithFindByOffsetReturnsRowAtPosition(t *testing.T) {
	db := setupHadithTestDB(t)
	repo := NewHadithRepository(db, paginate.New())

	hadith, err := repo.FindByOffset(2)
	if err != nil {
		t.Fatalf("FindByOffset returned error: %v", err)
	}
	if hadith == nil || hadith.Number == nil || *hadith.Number != 3 {
		t.Fatalf("expected hadith number 3 at offset 2, got %+v", hadith)
	}
}

func TestHadithFindByOffsetOutOfRange(t *testing.T) {
	db := setupHadithTestDB(t)
	repo := NewHadithRepository(db, paginate.New())

	if _, err := repo.FindByOffset(50); err == nil {
		t.Fatal("expected an error for an out-of-range offset, got nil")
	}
}
