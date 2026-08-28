package repository

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func TestBookmarkRepositoryDeleteAllowsRecreateSameReference(t *testing.T) {
	db := newBookmarkTestDB(t)
	repo := NewBookmarkRepository(db)
	userID := uuid.New()

	first, err := repo.Save(&model.Bookmark{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   userID,
		RefType:  model.BookmarkAyah,
		RefID:    255,
		RefSlug:  "al-baqarah-255",
		Color:    "emerald",
		Label:    "Awal",
	})
	if err != nil {
		t.Fatalf("save first bookmark: %v", err)
	}

	if err := repo.DeleteByID(first.ID, userID); err != nil {
		t.Fatalf("delete bookmark: %v", err)
	}

	second, err := repo.Save(&model.Bookmark{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   userID,
		RefType:  model.BookmarkAyah,
		RefID:    255,
		RefSlug:  "al-baqarah-255",
		Color:    "amber",
		Label:    "Ulang",
	})
	if err != nil {
		t.Fatalf("save same reference after delete: %v", err)
	}
	if second.ID == first.ID {
		t.Fatalf("expected recreated bookmark id, got original id %s", second.ID)
	}
	if second.Color != "amber" || second.Label != "Ulang" {
		t.Fatalf("expected recreated metadata, got color=%q label=%q", second.Color, second.Label)
	}
}

func TestBookmarkRepositorySaveRestoresExistingSoftDeletedReference(t *testing.T) {
	db := newBookmarkTestDB(t)
	repo := NewBookmarkRepository(db)
	userID := uuid.New()
	bookmarkID := uuid.New()

	if err := db.Create(&model.Bookmark{
		BaseUUID: model.BaseUUID{ID: bookmarkID},
		UserID:   userID,
		RefType:  model.BookmarkAyah,
		RefID:    2,
		RefSlug:  "al-baqarah-2",
		Color:    "emerald",
		Label:    "Lama",
	}).Error; err != nil {
		t.Fatalf("seed bookmark: %v", err)
	}
	if err := db.Where("id = ? AND user_id = ?", bookmarkID, userID).Delete(&model.Bookmark{}).Error; err != nil {
		t.Fatalf("soft delete bookmark: %v", err)
	}

	restored, err := repo.Save(&model.Bookmark{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   userID,
		RefType:  model.BookmarkAyah,
		RefID:    2,
		RefSlug:  "al-baqarah-2",
		Color:    "amber",
		Label:    "Baru",
	})
	if err != nil {
		t.Fatalf("restore bookmark: %v", err)
	}
	if restored.ID != bookmarkID {
		t.Fatalf("expected restored bookmark id %s, got %s", bookmarkID, restored.ID)
	}
	if restored.Color != "amber" || restored.Label != "Baru" {
		t.Fatalf("expected restored metadata, got color=%q label=%q", restored.Color, restored.Label)
	}
}

func newBookmarkTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	// Mirror the app's naming strategy (app/db/postgresql.go) so queries that
	// qualify columns by table name behave the same as in production.
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Bookmark{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	return db
}
