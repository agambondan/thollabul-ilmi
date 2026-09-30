package rijal

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"gorm.io/gorm"
)

func seedTakhrij(t *testing.T) *gorm.DB {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Book{}, &model.Takhrij{})

	mustCreate(t, db, &model.Translation{BaseID: baseID(1), Idn: testdb.Str("book-tr-live")})
	mustCreate(t, db, &model.Translation{BaseID: baseID(2), Idn: testdb.Str("book-tr-dead")})
	testdb.Delete(t, db, &model.Translation{BaseID: baseID(2)})

	book := func(id int, slug string, translationID int) {
		mustCreate(t, db, &model.Book{
			BaseID:        baseID(id),
			Slug:          testdb.Str(slug),
			TranslationID: testdb.Int(translationID),
		})
	}
	book(1, "book-live", 1)
	book(2, "book-translation-dead", 2)
	book(3, "book-dead", 1)
	testdb.Delete(t, db, &model.Book{BaseID: baseID(3)})

	takhrij := func(id, hadithID, bookID int, nomor string) {
		row := &model.Takhrij{
			BaseID:          baseID(id),
			HadithID:        testdb.Int(hadithID),
			NomorHadisKitab: testdb.Str(nomor),
		}
		if bookID > 0 {
			row.BookID = testdb.Int(bookID)
		}
		mustCreate(t, db, row)
	}
	takhrij(1, 10, 1, "live")
	takhrij(2, 10, 1, "deleted-twin")
	takhrij(3, 10, 2, "live-book-translation-dead")
	takhrij(4, 10, 3, "live-book-dead")
	takhrij(5, 10, 0, "live-no-book")
	takhrij(6, 11, 1, "other-hadith-live")
	takhrij(7, 11, 1, "other-hadith-deleted")
	testdb.Delete(t, db, &model.Takhrij{BaseID: baseID(2)})
	testdb.Delete(t, db, &model.Takhrij{BaseID: baseID(7)})
	return db
}

func takhrijIDs(list []model.Takhrij) []int {
	ids := make([]int, 0, len(list))
	for _, row := range list {
		ids = append(ids, *row.ID)
	}
	return ids
}

func findTakhrij(list []model.Takhrij, id int) *model.Takhrij {
	for i := range list {
		if *list[i].ID == id {
			return &list[i]
		}
	}
	return nil
}

func assertLiveTakhrij(t *testing.T, label string, row *model.Takhrij) {
	t.Helper()
	if row.Book == nil || *row.Book.ID != 1 {
		t.Fatalf("%s: live row lost its live book: %+v", label, row.Book)
	}
	if row.Book.Translation == nil || str(row.Book.Translation.Idn) != "book-tr-live" {
		t.Fatalf("%s: live book lost its live translation: %+v", label, row.Book.Translation)
	}
}

func assertTakhrijAssociations(t *testing.T, label string, list []model.Takhrij) {
	t.Helper()
	live := findTakhrij(list, 1)
	if live == nil {
		t.Fatalf("%s: live row 1 missing, got %v", label, takhrijIDs(list))
	}
	assertLiveTakhrij(t, label, live)

	translationDead := findTakhrij(list, 3)
	if translationDead == nil {
		t.Fatalf("%s: live row 3 (book with soft-deleted translation) was dropped, got %v", label, takhrijIDs(list))
	}
	if translationDead.Book == nil || *translationDead.Book.ID != 2 {
		t.Fatalf("%s: live book 2 with soft-deleted translation must be kept, got %+v", label, translationDead.Book)
	}
	if translationDead.Book.Translation != nil {
		t.Fatalf("%s: soft-deleted book translation leaked: %+v", label, translationDead.Book.Translation)
	}

	bookDead := findTakhrij(list, 4)
	if bookDead == nil {
		t.Fatalf("%s: live row 4 (soft-deleted book) was dropped, got %v", label, takhrijIDs(list))
	}
	if bookDead.Book != nil {
		t.Fatalf("%s: soft-deleted book leaked: %+v", label, bookDead.Book)
	}

	noBook := findTakhrij(list, 5)
	if noBook == nil || noBook.Book != nil {
		t.Fatalf("%s: live row 5 without a book must be kept as is, got %+v", label, noBook)
	}
}

func TestSoftDeleteTakhrijFindAll(t *testing.T) {
	repo := repository.NewTakhrijRepository(seedTakhrij(t))

	list, err := repo.FindAll()
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	assertIDs(t, "FindAll", takhrijIDs(list), 1, 3, 4, 5, 6)
	assertTakhrijAssociations(t, "FindAll", list)
}

func TestSoftDeleteTakhrijFindByID(t *testing.T) {
	repo := repository.NewTakhrijRepository(seedTakhrij(t))

	for _, id := range []int{2, 7} {
		if _, err := repo.FindByID(testdb.Int(id)); !errors.Is(err, gorm.ErrRecordNotFound) {
			t.Fatalf("FindByID(soft-deleted %d): want ErrRecordNotFound, got %v", id, err)
		}
	}

	live, err := repo.FindByID(testdb.Int(1))
	if err != nil {
		t.Fatalf("FindByID(live): %v", err)
	}
	assertLiveTakhrij(t, "FindByID(1)", live)

	translationDead, err := repo.FindByID(testdb.Int(3))
	if err != nil {
		t.Fatalf("FindByID(live, book translation soft-deleted) must be found: %v", err)
	}
	if translationDead.Book == nil || translationDead.Book.Translation != nil {
		t.Fatalf("FindByID(3): want live book without its soft-deleted translation, got %+v", translationDead.Book)
	}

	bookDead, err := repo.FindByID(testdb.Int(4))
	if err != nil {
		t.Fatalf("FindByID(live, book soft-deleted) must be found: %v", err)
	}
	if bookDead.Book != nil {
		t.Fatalf("FindByID(4): soft-deleted book leaked: %+v", bookDead.Book)
	}
}

func TestSoftDeleteTakhrijFindByHadithID(t *testing.T) {
	repo := repository.NewTakhrijRepository(seedTakhrij(t))

	list, err := repo.FindByHadithID(testdb.Int(10))
	if err != nil {
		t.Fatalf("FindByHadithID(10): %v", err)
	}
	assertIDs(t, "FindByHadithID(10)", takhrijIDs(list), 1, 3, 4, 5)
	assertTakhrijAssociations(t, "FindByHadithID(10)", list)

	other, err := repo.FindByHadithID(testdb.Int(11))
	if err != nil {
		t.Fatalf("FindByHadithID(11): %v", err)
	}
	assertIDs(t, "FindByHadithID(11)", takhrijIDs(other), 6)
}

func TestSoftDeleteTakhrijMutationsRejectDeletedRow(t *testing.T) {
	repo := repository.NewTakhrijRepository(seedTakhrij(t))

	if _, err := repo.UpdateByID(testdb.Int(2), &model.Takhrij{Catatan: testdb.Str("resurrect")}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("UpdateByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
	if err := repo.DeleteByID(testdb.Int(2)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("DeleteByID(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
}
