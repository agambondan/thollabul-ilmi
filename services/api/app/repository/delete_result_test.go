package repository

import (
	"errors"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

type deleteResultTestRow struct {
	ID int `gorm:"primaryKey"`
}

func TestDeleteResultErrorReturnsNotFoundWhenNoRowsDeleted(t *testing.T) {
	db := newDeleteResultTestDB(t)

	err := deleteResultError(db.Where("id = ?", 404).Delete(&deleteResultTestRow{}))
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("expected ErrRecordNotFound, got %v", err)
	}
}

func TestDeleteResultErrorAllowsDeletedRows(t *testing.T) {
	db := newDeleteResultTestDB(t)
	if err := db.Create(&deleteResultTestRow{ID: 1}).Error; err != nil {
		t.Fatalf("seed row: %v", err)
	}

	if err := deleteResultError(db.Where("id = ?", 1).Delete(&deleteResultTestRow{})); err != nil {
		t.Fatalf("deleteResultError: %v", err)
	}
}

func newDeleteResultTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	// Mirror the app's naming strategy (app/db/postgresql.go) so queries that
	// qualify columns by table name behave the same as in production.
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&deleteResultTestRow{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	return db
}
