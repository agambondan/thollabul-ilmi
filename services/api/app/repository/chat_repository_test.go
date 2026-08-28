package repository

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func newChatRepositoryTestDB(t *testing.T) *gorm.DB {
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
	if err := db.AutoMigrate(&model.ChatMessage{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func createChatRepositoryTestMessage(t *testing.T, db *gorm.DB, author string, authorID *uuid.UUID) *model.ChatMessage {
	t.Helper()
	msg := &model.ChatMessage{
		BaseUUID:  model.BaseUUID{ID: uuid.New()},
		Text:      "assalamualaikum",
		Author:    author,
		AuthorID:  authorID,
		Timestamp: 1,
	}
	if err := db.Create(msg).Error; err != nil {
		t.Fatalf("create chat message: %v", err)
	}
	return msg
}

func TestChatRepositoryDeleteRejectsOtherAuthors(t *testing.T) {
	db := newChatRepositoryTestDB(t)
	repo := NewChatRepository(db)

	owner := uuid.New()
	intruder := uuid.New()
	msg := createChatRepositoryTestMessage(t, db, "owner", &owner)

	err := repo.Delete(msg.ID.String(), &intruder)
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("expected ErrRecordNotFound for another author's message, got %v", err)
	}

	var count int64
	if err := db.Model(&model.ChatMessage{}).Where("id = ?", msg.ID).Count(&count).Error; err != nil {
		t.Fatalf("count: %v", err)
	}
	if count != 1 {
		t.Fatalf("message should survive a delete by a different author, count=%d", count)
	}
}

func TestChatRepositoryDeleteAllowsOwnMessage(t *testing.T) {
	db := newChatRepositoryTestDB(t)
	repo := NewChatRepository(db)

	owner := uuid.New()
	msg := createChatRepositoryTestMessage(t, db, "owner", &owner)

	if err := repo.Delete(msg.ID.String(), &owner); err != nil {
		t.Fatalf("author should be able to delete own message: %v", err)
	}
}

// A nil ownerID is how the controller expresses "caller is an admin".
func TestChatRepositoryDeleteAllowsAdminAnyMessage(t *testing.T) {
	db := newChatRepositoryTestDB(t)
	repo := NewChatRepository(db)

	owner := uuid.New()
	msg := createChatRepositoryTestMessage(t, db, "owner", &owner)

	if err := repo.Delete(msg.ID.String(), nil); err != nil {
		t.Fatalf("admin should be able to delete any message: %v", err)
	}
}

func TestChatRepositoryDeleteMissingMessage(t *testing.T) {
	db := newChatRepositoryTestDB(t)
	repo := NewChatRepository(db)

	if err := repo.Delete(uuid.New().String(), nil); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("expected ErrRecordNotFound for unknown id, got %v", err)
	}
}
