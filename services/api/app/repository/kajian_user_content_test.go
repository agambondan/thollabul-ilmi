package repository

import (
	"os"
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func openUserContentDB(t *testing.T) *gorm.DB {
	t.Helper()
	cfg := &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	}
	var db *gorm.DB
	var err error
	if dsn := os.Getenv("USER_CONTENT_PG_DSN"); dsn != "" {
		db, err = gorm.Open(postgres.Open(dsn), cfg)
		if err == nil {
			err = db.Migrator().DropTable(&model.KajianUserBookmark{}, &model.KajianUserNote{})
		}
	} else {
		db, err = gorm.Open(sqlite.Open("file:user_content_"+t.Name()+"?mode=memory&cache=shared"), cfg)
	}
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if sqlDB, sqlErr := db.DB(); sqlErr == nil {
		sqlDB.SetMaxOpenConns(1)
		t.Cleanup(func() { _ = sqlDB.Close() })
	}
	if err := db.AutoMigrate(&model.KajianUserBookmark{}, &model.KajianUserNote{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func liveBookmarks(t *testing.T, db *gorm.DB, userID uuid.UUID) []model.KajianUserBookmark {
	t.Helper()
	var rows []model.KajianUserBookmark
	if err := db.Where("user_id = ?", userID).Find(&rows).Error; err != nil {
		t.Fatalf("read bookmarks: %v", err)
	}
	return rows
}

func TestKajianBookmarkAddStoresTimestampAndRejectsDuplicates(t *testing.T) {
	db := openUserContentDB(t)
	repo := NewKajianBookmarkRepository(db)
	user := uuid.New()

	created, err := repo.Add(user, 10, 1, "catatan")
	if err != nil || !created {
		t.Fatalf("first Add: created=%v err=%v", created, err)
	}
	created, err = repo.Add(user, 10, 1, "catatan lain")
	if err != nil || created {
		t.Fatalf("duplicate Add of a live bookmark: created=%v err=%v, want false and no error", created, err)
	}

	rows := liveBookmarks(t, db, user)
	if len(rows) != 1 {
		t.Fatalf("expected one live bookmark, got %d", len(rows))
	}
	if rows[0].CreatedAt == nil || time.Since(time.Unix(*rows[0].CreatedAt, 0)) > time.Minute {
		t.Fatalf("created_at not stored as a recent unix time: %v", rows[0].CreatedAt)
	}
	if rows[0].Note != "catatan" {
		t.Fatalf("a duplicate Add must not overwrite the live bookmark, note=%q", rows[0].Note)
	}
}

func TestKajianBookmarkCanBeAddedAgainAfterRemoval(t *testing.T) {
	db := openUserContentDB(t)
	repo := NewKajianBookmarkRepository(db)
	user := uuid.New()
	other := uuid.New()

	if _, err := repo.Add(user, 10, 1, "pertama"); err != nil {
		t.Fatalf("Add: %v", err)
	}
	if _, err := repo.Add(other, 10, 1, "milik orang lain"); err != nil {
		t.Fatalf("Add other: %v", err)
	}
	if err := repo.Remove(user, 10); err != nil {
		t.Fatalf("Remove: %v", err)
	}
	if got := liveBookmarks(t, db, user); len(got) != 0 {
		t.Fatalf("removed bookmark still live: %d", len(got))
	}

	created, err := repo.Add(user, 10, 2, "kedua")
	if err != nil || !created {
		t.Fatalf("re-adding a removed bookmark: created=%v err=%v", created, err)
	}
	rows := liveBookmarks(t, db, user)
	if len(rows) != 1 || rows[0].Note != "kedua" || rows[0].KajianID != 2 {
		t.Fatalf("re-added bookmark not revived with new values: %+v", rows)
	}
	if got := liveBookmarks(t, db, other); len(got) != 1 || got[0].Note != "milik orang lain" {
		t.Fatalf("another user's bookmark was touched: %+v", got)
	}
}

func TestKajianNoteCreateAndUpdateSetTimestamps(t *testing.T) {
	db := openUserContentDB(t)
	repo := NewKajianNoteRepository(db)
	user := uuid.New()

	note := &model.KajianUserNote{UserID: user, KajianID: 1, StartSec: 5, Content: "awal"}
	if err := repo.Create(note); err != nil {
		t.Fatalf("Create: %v", err)
	}
	if note.ID == nil || note.CreatedAt == nil || note.UpdatedAt == nil {
		t.Fatalf("note not stored with id and timestamps: %+v", note)
	}

	note.Content = "diubah"
	if err := repo.Update(note); err != nil {
		t.Fatalf("Update: %v", err)
	}
	got, err := repo.GetByID(user, *note.ID)
	if err != nil {
		t.Fatalf("GetByID: %v", err)
	}
	if got.Content != "diubah" || got.UpdatedAt == nil || got.CreatedAt == nil || *got.UpdatedAt < *got.CreatedAt {
		t.Fatalf("updated note wrong: %+v", got)
	}
}
