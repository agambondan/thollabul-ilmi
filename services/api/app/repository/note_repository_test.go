package repository

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func TestNoteRepositoryCreateArticleBySlugIsRetrievable(t *testing.T) {
	db := newNoteTestDB(t)
	repo := NewNoteRepository(db)
	userID := uuid.New()

	created, err := repo.Create(&model.Note{
		UserID:  userID,
		RefType: model.NoteRefTypeArticle,
		RefSlug: "artikel-hijrah",
		Content: "Catatan tentang hijrah",
	})
	if err != nil {
		t.Fatalf("create article note: %v", err)
	}
	if created.ID == nil {
		t.Fatalf("expected generated note id")
	}

	found, err := repo.FindByUser(userID, model.NoteRefTypeArticle, 0, "artikel-hijrah")
	if err != nil {
		t.Fatalf("find by user+slug: %v", err)
	}
	if len(found) != 1 || found[0].Content != "Catatan tentang hijrah" {
		t.Fatalf("expected 1 note with matching content, got %+v", found)
	}
}

func TestNoteRepositoryCreateAllowsTwoDistinctArticleSlugs(t *testing.T) {
	db := newNoteTestDB(t)
	repo := NewNoteRepository(db)
	userID := uuid.New()

	if _, err := repo.Create(&model.Note{
		UserID:  userID,
		RefType: model.NoteRefTypeArticle,
		RefSlug: "artikel-satu",
		Content: "Catatan satu",
	}); err != nil {
		t.Fatalf("create first article note: %v", err)
	}
	if _, err := repo.Create(&model.Note{
		UserID:  userID,
		RefType: model.NoteRefTypeArticle,
		RefSlug: "artikel-dua",
		Content: "Catatan dua",
	}); err != nil {
		t.Fatalf("create second (distinct) article note: %v", err)
	}

	all, err := repo.FindByUser(userID, model.NoteRefTypeArticle, 0, "")
	if err != nil {
		t.Fatalf("find all article notes for user: %v", err)
	}
	if len(all) != 2 {
		t.Fatalf("expected 2 independent article notes, got %d", len(all))
	}

	onlySlugTwo, err := repo.FindByUser(userID, model.NoteRefTypeArticle, 0, "artikel-dua")
	if err != nil {
		t.Fatalf("find by user+slug: %v", err)
	}
	if len(onlySlugTwo) != 1 || onlySlugTwo[0].Content != "Catatan dua" {
		t.Fatalf("expected slug filter to isolate 1 note, got %+v", onlySlugTwo)
	}
}

func TestNoteRepositoryCreateNumericRefUnchanged(t *testing.T) {
	db := newNoteTestDB(t)
	repo := NewNoteRepository(db)
	userID := uuid.New()

	if _, err := repo.Create(&model.Note{
		UserID:  userID,
		RefType: model.NoteRefTypeAyah,
		RefID:   255,
		Content: "Catatan ayat kursi pertama",
	}); err != nil {
		t.Fatalf("create first ayah note: %v", err)
	}
	if _, err := repo.Create(&model.Note{
		UserID:  userID,
		RefType: model.NoteRefTypeAyah,
		RefID:   255,
		Content: "Catatan ayat kursi kedua",
	}); err != nil {
		t.Fatalf("create second ayah note on same ref_id: %v", err)
	}

	found, err := repo.FindByUser(userID, model.NoteRefTypeAyah, 255, "")
	if err != nil {
		t.Fatalf("find by user+ref_id: %v", err)
	}
	if len(found) != 2 {
		t.Fatalf("expected notes on same ayah ref_id to both persist (no dedup), got %d", len(found))
	}
}

func newNoteTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Note{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	return db
}
