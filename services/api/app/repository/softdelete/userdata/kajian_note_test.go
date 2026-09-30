package userdata

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func seedKajianNote(t *testing.T, db *gorm.DB, userID uuid.UUID, kajian *model.Kajian, content string, startSec int, createdAt int64) *model.KajianUserNote {
	t.Helper()
	note := &model.KajianUserNote{
		UserID:    userID,
		KajianID:  *kajian.ID,
		StartSec:  startSec,
		Content:   content,
		CreatedAt: &createdAt,
		UpdatedAt: &createdAt,
	}
	create(t, db, note)
	return note
}

func kajianNoteContents(notes []model.KajianUserNote) []string {
	out := make([]string, 0, len(notes))
	for _, note := range notes {
		out = append(out, note.Content)
	}
	return out
}

func TestSoftDeleteKajianNoteList(t *testing.T) {
	db := testdb.Open(t, &model.Kajian{}, &model.KajianUserNote{})
	repo := repository.NewKajianNoteRepository(db)
	alice := uuid.New()
	bob := uuid.New()

	liveKajian := seedKajian(t, db, "live")
	goneKajian := seedKajian(t, db, "gone")
	testdb.Delete(t, db, goneKajian)

	seedKajianNote(t, db, alice, liveKajian, "alice live", 10, 100)
	seedKajianNote(t, db, alice, goneKajian, "alice under deleted kajian", 20, 200)
	deleted := seedKajianNote(t, db, alice, liveKajian, "alice deleted", 30, 900)
	testdb.Delete(t, db, deleted)
	seedKajianNote(t, db, bob, liveKajian, "bob live", 40, 300)

	got, err := repo.List(alice, model.KajianNoteListQuery{})
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if !equalStrings(kajianNoteContents(got), []string{"alice live", "alice under deleted kajian"}) {
		t.Fatalf("expected only alice's live notes, got %v", kajianNoteContents(got))
	}

	for _, note := range got {
		switch note.Content {
		case "alice live":
			if note.Kajian == nil || note.Kajian.Title != "live" {
				t.Fatalf("live note should carry its live kajian: %#v", note)
			}
		case "alice under deleted kajian":
			if note.Kajian != nil {
				t.Fatalf("soft-deleted kajian leaked through note: %#v", note.Kajian)
			}
		}
	}

	bobs, err := repo.List(bob, model.KajianNoteListQuery{})
	if err != nil {
		t.Fatalf("List bob: %v", err)
	}
	if !equalStrings(kajianNoteContents(bobs), []string{"bob live"}) {
		t.Fatalf("expected only bob's note, got %v", kajianNoteContents(bobs))
	}
}

func TestSoftDeleteKajianNoteListFiltersAndPaging(t *testing.T) {
	db := testdb.Open(t, &model.Kajian{}, &model.KajianUserNote{})
	repo := repository.NewKajianNoteRepository(db)
	alice := uuid.New()

	kajian := seedKajian(t, db, "paging")
	other := seedKajian(t, db, "paging-other")

	seedKajianNote(t, db, alice, kajian, "oldest live", 10, 100)
	seedKajianNote(t, db, alice, kajian, "newer live", 20, 200)
	seedKajianNote(t, db, alice, other, "other kajian live", 30, 150)
	newestDeleted := seedKajianNote(t, db, alice, kajian, "newest deleted", 40, 900)
	testdb.Delete(t, db, newestDeleted)

	byKajian, err := repo.List(alice, model.KajianNoteListQuery{KajianID: kajian.ID})
	if err != nil {
		t.Fatalf("List by kajian: %v", err)
	}
	if !equalStrings(kajianNoteContents(byKajian), []string{"oldest live", "newer live"}) {
		t.Fatalf("kajian scope leaked a deleted note, got %v", kajianNoteContents(byKajian))
	}

	firstPage, err := repo.List(alice, model.KajianNoteListQuery{Limit: 1})
	if err != nil {
		t.Fatalf("List limit: %v", err)
	}
	if !equalStrings(kajianNoteContents(firstPage), []string{"newer live"}) {
		t.Fatalf("limit must count live rows only, got %v", kajianNoteContents(firstPage))
	}

	secondPage, err := repo.List(alice, model.KajianNoteListQuery{Limit: 1, Offset: 1})
	if err != nil {
		t.Fatalf("List offset: %v", err)
	}
	if !equalStrings(kajianNoteContents(secondPage), []string{"other kajian live"}) {
		t.Fatalf("offset must skip live rows only, got %v", kajianNoteContents(secondPage))
	}
}

func TestSoftDeleteKajianNoteGetByID(t *testing.T) {
	db := testdb.Open(t, &model.Kajian{}, &model.KajianUserNote{})
	repo := repository.NewKajianNoteRepository(db)
	alice := uuid.New()
	bob := uuid.New()

	kajian := seedKajian(t, db, "get")
	live := seedKajianNote(t, db, alice, kajian, "live", 10, 100)
	deleted := seedKajianNote(t, db, alice, kajian, "deleted", 20, 200)
	testdb.Delete(t, db, deleted)
	bobs := seedKajianNote(t, db, bob, kajian, "bob", 30, 300)

	got, err := repo.GetByID(alice, *live.ID)
	if err != nil || got.Content != "live" {
		t.Fatalf("live note should be found, got %#v err=%v", got, err)
	}

	if _, err := repo.GetByID(alice, *deleted.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted note must be not found, got err=%v", err)
	}

	if _, err := repo.GetByID(alice, *bobs.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("another user's note must be not found, got err=%v", err)
	}
}
