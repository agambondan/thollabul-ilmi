package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type NotificationRepository interface {
	FindByUser(userID uuid.UUID) ([]model.NotificationSetting, error)
	UpsertMany(settings []model.NotificationSetting) ([]model.NotificationSetting, error)
	UpsertPushToken(token model.PushToken) (model.PushToken, error)
	FindActivePushTokens(userID uuid.UUID) ([]model.PushToken, error)
	FindPushTokensByUser(userID uuid.UUID) ([]model.PushToken, error)
	DeactivatePushToken(id int) error
	FindDue(now time.Time) ([]model.NotificationSetting, error)
	MarkSent(id int, sentAt time.Time) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db}
}

func (r *notificationRepository) FindByUser(userID uuid.UUID) ([]model.NotificationSetting, error) {
	var items []model.NotificationSetting
	err := r.db.Where("user_id = ?", userID).Order("type ASC").Find(&items).Error
	return items, err
}

func (r *notificationRepository) UpsertMany(settings []model.NotificationSetting) ([]model.NotificationSetting, error) {
	if len(settings) == 0 {
		return []model.NotificationSetting{}, nil
	}
	err := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "type"}},
		DoUpdates: clause.AssignmentColumns([]string{"time", "is_active", "updated_at"}),
	}).Create(&settings).Error
	if err != nil {
		return nil, err
	}
	return r.FindByUser(settings[0].UserID)
}

func (r *notificationRepository) UpsertPushToken(token model.PushToken) (model.PushToken, error) {
	now := time.Now()
	token.LastSeenAt = now
	token.IsActive = true
	err := r.db.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "user_id"}, {Name: "token"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"platform":     token.Platform,
			"provider":     token.Provider,
			"device_id":    token.DeviceID,
			"key_p256_dh":  token.KeyP256DH,
			"key_auth":     token.KeyAuth,
			"is_active":    true,
			"last_seen_at": now,
			"updated_at":   now,
		}),
	}).Create(&token).Error
	if err != nil {
		return model.PushToken{}, err
	}
	return token, nil
}

func (r *notificationRepository) FindActivePushTokens(userID uuid.UUID) ([]model.PushToken, error) {
	var items []model.PushToken
	err := r.db.
		Where("user_id = ? AND is_active = true", userID).
		Order("last_seen_at DESC").
		Limit(20).
		Find(&items).Error
	return items, err
}

func (r *notificationRepository) FindPushTokensByUser(userID uuid.UUID) ([]model.PushToken, error) {
	var items []model.PushToken
	err := r.db.
		Where("user_id = ?", userID).
		Order("last_seen_at DESC").
		Limit(20).
		Find(&items).Error
	return items, err
}

func (r *notificationRepository) DeactivatePushToken(id int) error {
	return r.db.Model(&model.PushToken{}).Where("id = ?", id).Update("is_active", false).Error
}

func (r *notificationRepository) FindDue(now time.Time) ([]model.NotificationSetting, error) {
	var items []model.NotificationSetting
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	err := r.db.
		Preload("User").
		Where("is_active = true AND time = ? AND (last_sent_at IS NULL OR last_sent_at < ?)", now.Format("15:04"), startOfDay).
		Order("type ASC").
		Find(&items).Error
	return items, err
}

func (r *notificationRepository) MarkSent(id int, sentAt time.Time) error {
	return r.db.Model(&model.NotificationSetting{}).Where("id = ?", id).Update("last_sent_at", sentAt).Error
}

// Inbox repository

type NotificationInboxRepository interface {
	ListByUser(userID uuid.UUID, limit int) ([]model.UserNotification, error)
	UnreadCount(userID uuid.UUID) (int64, error)
	MarkRead(id uuid.UUID, userID uuid.UUID) error
	MarkAllRead(userID uuid.UUID) error
	Create(n model.UserNotification) (model.UserNotification, error)
}

type notificationInboxRepository struct {
	db *gorm.DB
}

func NewNotificationInboxRepository(db *gorm.DB) NotificationInboxRepository {
	return &notificationInboxRepository{db}
}

func (r *notificationInboxRepository) ListByUser(userID uuid.UUID, limit int) ([]model.UserNotification, error) {
	var items []model.UserNotification
	q := r.db.Where("user_id = ?", userID).Order("created_at DESC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	return items, q.Find(&items).Error
}

func (r *notificationInboxRepository) UnreadCount(userID uuid.UUID) (int64, error) {
	var count int64
	return count, r.db.Model(&model.UserNotification{}).Where("user_id = ? AND is_read = false", userID).Count(&count).Error
}

func (r *notificationInboxRepository) MarkRead(id uuid.UUID, userID uuid.UUID) error {
	return r.db.Model(&model.UserNotification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("is_read", true).Error
}

func (r *notificationInboxRepository) MarkAllRead(userID uuid.UUID) error {
	return r.db.Model(&model.UserNotification{}).
		Where("user_id = ? AND is_read = false", userID).
		Update("is_read", true).Error
}

func (r *notificationInboxRepository) Create(n model.UserNotification) (model.UserNotification, error) {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return n, r.db.Create(&n).Error
}
