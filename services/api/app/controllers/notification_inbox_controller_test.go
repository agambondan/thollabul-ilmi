package controllers

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestNotificationInboxControllerDeleteReturnsNotFoundForMissingOrOtherUserNotification(t *testing.T) {
	app, db, userID := newNotificationInboxControllerTestApp(t)
	otherUserID := uuid.New()
	notificationID := seedUserNotification(t, db, otherUserID)

	tests := []struct {
		name string
		id   uuid.UUID
	}{
		{name: "missing notification", id: uuid.New()},
		{name: "other user notification", id: notificationID},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res, err := app.Test(newAuthRequest(t, fiber.MethodDelete, "/notifications/inbox/"+tt.id.String(), userID))
			if err != nil {
				t.Fatalf("request delete notification: %v", err)
			}
			defer res.Body.Close()
			if res.StatusCode != fiber.StatusNotFound {
				t.Fatalf("expected 404, got %d", res.StatusCode)
			}
		})
	}

	var count int64
	if err := db.Model(&model.UserNotification{}).Where("id = ?", notificationID).Count(&count).Error; err != nil {
		t.Fatalf("count other user notification: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected other user notification to remain, got %d", count)
	}
}

func TestNotificationInboxControllerDeleteRemovesCurrentUserNotification(t *testing.T) {
	app, db, userID := newNotificationInboxControllerTestApp(t)
	notificationID := seedUserNotification(t, db, userID)

	res, err := app.Test(newAuthRequest(t, fiber.MethodDelete, "/notifications/inbox/"+notificationID.String(), userID))
	if err != nil {
		t.Fatalf("request delete notification: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}

	var count int64
	if err := db.Model(&model.UserNotification{}).Where("id = ?", notificationID).Count(&count).Error; err != nil {
		t.Fatalf("count deleted notification: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected current user notification to be deleted, got %d", count)
	}
}

func newNotificationInboxControllerTestApp(t *testing.T) (*fiber.App, *gorm.DB, uuid.UUID) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.UserNotification{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}

	controller := NewNotificationInboxController(&service.Services{
		NotificationInbox: service.NewNotificationInboxService(repository.NewNotificationInboxRepository(db)),
	})
	app := fiber.New()
	app.Delete("/notifications/inbox/:id", controller.Delete)
	return app, db, uuid.New()
}

func seedUserNotification(t *testing.T, db *gorm.DB, userID uuid.UUID) uuid.UUID {
	t.Helper()

	notification := &model.UserNotification{
		UserID: userID,
		Title:  "Test notification",
		Body:   "Test body",
		Type:   model.NotificationTypeDailyQuran,
	}
	if err := db.Create(notification).Error; err != nil {
		t.Fatalf("seed user notification: %v", err)
	}
	return notification.ID
}
