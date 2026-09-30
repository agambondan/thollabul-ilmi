package userdata

import (
	"errors"
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func seedLibraryBook(t *testing.T, db *gorm.DB, slug string) *model.LibraryBook {
	t.Helper()
	book := &model.LibraryBook{
		Title:            "Kitab " + slug,
		Slug:             slug,
		Author:           "Ulama " + slug,
		Category:         "aqidah",
		Level:            "pemula",
		Language:         "id",
		Format:           model.LibraryBookFormatPDF,
		SourceType:       model.LibraryBookSourceUploaded,
		LicenseStatus:    model.LibraryBookLicenseVerified,
		Pages:            100,
		Status:           model.LibraryBookStatusPublished,
		ExtractionStatus: model.LibraryBookExtractDone,
	}
	create(t, db, book)
	return book
}

func seedLibraryProgress(t *testing.T, db *gorm.DB, userID uuid.UUID, book *model.LibraryBook, page int) *model.LibraryBookProgress {
	t.Helper()
	progress := &model.LibraryBookProgress{
		UserID:        userID,
		LibraryBookID: *book.ID,
		Status:        model.LibraryBookProgressReading,
		CurrentPage:   page,
		Note:          fmt.Sprintf("page %d", page),
	}
	create(t, db, progress)
	return progress
}

func libraryProgressBookIDs(list []model.LibraryBookProgress) []int {
	out := make([]int, 0, len(list))
	for _, progress := range list {
		out = append(out, progress.LibraryBookID)
	}
	return out
}

type libraryProgressFixture struct {
	repo  repository.LibraryBookProgressRepository
	alice uuid.UUID
	bob   uuid.UUID

	live            int
	deletedProgress int
	deletedBook     int
	bobOnly         int
}

func newLibraryProgressFixture(t *testing.T) *libraryProgressFixture {
	t.Helper()
	db := testdb.Open(t, &model.LibraryBook{}, &model.LibraryBookProgress{})
	f := &libraryProgressFixture{
		repo:  repository.NewLibraryBookProgressRepository(db),
		alice: uuid.New(),
		bob:   uuid.New(),
	}

	live := seedLibraryBook(t, db, "live")
	deletedProgressBook := seedLibraryBook(t, db, "deleted-progress")
	deletedBook := seedLibraryBook(t, db, "deleted-book")
	bobOnly := seedLibraryBook(t, db, "bob-only")
	testdb.Delete(t, db, deletedBook)

	f.live = *live.ID
	f.deletedProgress = *deletedProgressBook.ID
	f.deletedBook = *deletedBook.ID
	f.bobOnly = *bobOnly.ID

	seedLibraryProgress(t, db, f.alice, live, 10)
	testdb.Delete(t, db, seedLibraryProgress(t, db, f.alice, deletedProgressBook, 20))
	seedLibraryProgress(t, db, f.alice, deletedBook, 30)
	seedLibraryProgress(t, db, f.bob, live, 40)
	seedLibraryProgress(t, db, f.bob, bobOnly, 50)
	return f
}

func TestSoftDeleteLibraryBookProgressFindByUserID(t *testing.T) {
	f := newLibraryProgressFixture(t)

	got, err := f.repo.FindByUserID(f.alice)
	if err != nil {
		t.Fatalf("FindByUserID: %v", err)
	}
	if !equalInts(libraryProgressBookIDs(got), []int{f.live}) {
		t.Fatalf("expected only the live progress on a live book, got books %v", libraryProgressBookIDs(got))
	}
	if got[0].UserID != f.alice || got[0].CurrentPage != 10 || got[0].Book == nil || got[0].Book.Slug != "live" {
		t.Fatalf("unexpected progress row: %#v", got[0])
	}

	bobs, err := f.repo.FindByUserID(f.bob)
	if err != nil {
		t.Fatalf("FindByUserID bob: %v", err)
	}
	if !equalInts(libraryProgressBookIDs(bobs), []int{f.live, f.bobOnly}) {
		t.Fatalf("expected bob's own progress, got books %v", libraryProgressBookIDs(bobs))
	}
}

func TestSoftDeleteLibraryBookProgressFindByUserIDAndBookID(t *testing.T) {
	f := newLibraryProgressFixture(t)

	live, err := f.repo.FindByUserIDAndBookID(f.alice, f.live)
	if err != nil {
		t.Fatalf("live progress should be found: %v", err)
	}
	if live.CurrentPage != 10 || live.Book == nil || live.Book.Slug != "live" {
		t.Fatalf("unexpected progress: %#v", live)
	}

	for name, bookID := range map[string]int{
		"soft-deleted progress": f.deletedProgress,
		"soft-deleted book":     f.deletedBook,
		"another user's book":   f.bobOnly,
	} {
		if _, err := f.repo.FindByUserIDAndBookID(f.alice, bookID); !errors.Is(err, gorm.ErrRecordNotFound) {
			t.Fatalf("%s must be not found, got err=%v", name, err)
		}
	}
}
