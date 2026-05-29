package controllers

import (
	"strconv"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestTilawahControllerDeleteReturnsNotFoundForMissingOrOtherUserLog(t *testing.T) {
	app, db, userID := newTilawahControllerTestApp(t)
	otherUserID := uuid.New()
	logID := seedTilawahLog(t, db, otherUserID)

	tests := []struct {
		name string
		id   int
	}{
		{name: "missing log", id: logID + 1},
		{name: "other user log", id: logID},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res, err := app.Test(newAuthRequest(t, fiber.MethodDelete, "/tilawah/"+strconv.Itoa(tt.id), userID))
			if err != nil {
				t.Fatalf("request delete tilawah log: %v", err)
			}
			defer res.Body.Close()
			if res.StatusCode != fiber.StatusNotFound {
				t.Fatalf("expected 404, got %d", res.StatusCode)
			}
		})
	}

	var count int64
	if err := db.Model(&model.TilawahLog{}).Where("id = ?", logID).Count(&count).Error; err != nil {
		t.Fatalf("count other user log: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected other user log to remain, got %d", count)
	}
}

func TestTilawahControllerDeleteRemovesCurrentUserLog(t *testing.T) {
	app, db, userID := newTilawahControllerTestApp(t)
	logID := seedTilawahLog(t, db, userID)

	res, err := app.Test(newAuthRequest(t, fiber.MethodDelete, "/tilawah/"+strconv.Itoa(logID), userID))
	if err != nil {
		t.Fatalf("request delete tilawah log: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}

	var count int64
	if err := db.Model(&model.TilawahLog{}).Where("id = ?", logID).Count(&count).Error; err != nil {
		t.Fatalf("count deleted log: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected current user log to be deleted, got %d", count)
	}
}

func newTilawahControllerTestApp(t *testing.T) (*fiber.App, *gorm.DB, uuid.UUID) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.TilawahLog{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}

	controller := NewTilawahController(&service.Services{
		Tilawah: service.NewTilawahService(repository.NewTilawahRepository(db)),
	})
	app := fiber.New()
	app.Delete("/tilawah/:id", controller.Delete)
	return app, db, uuid.New()
}

func seedTilawahLog(t *testing.T, db *gorm.DB, userID uuid.UUID) int {
	t.Helper()

	log := &model.TilawahLog{
		UserID:    userID,
		Date:      "2026-05-29",
		PagesRead: 3,
		JuzRead:   0.15,
		Note:      "test log",
	}
	if err := db.Create(log).Error; err != nil {
		t.Fatalf("seed tilawah log: %v", err)
	}
	if log.ID == nil {
		t.Fatal("expected seeded tilawah log ID")
	}
	return *log.ID
}
