package model

import (
	"time"

	"github.com/google/uuid"
)

type NotificationType string

const (
	NotificationTypeDailyQuran  NotificationType = "daily_quran"
	NotificationTypeDailyHadith NotificationType = "daily_hadith"
	NotificationTypeDoa         NotificationType = "doa"
	NotificationTypeStreakRisk  NotificationType = "streak_risk"
	NotificationTypeAdzan       NotificationType = "adzan"
)

type NotificationSetting struct {
	BaseID
	UserID     uuid.UUID        `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_notification_user_type"`
	Type       NotificationType `json:"type" gorm:"type:varchar(50);not null;uniqueIndex:idx_notification_user_type"`
	Time       string           `json:"time" gorm:"type:varchar(5);not null"`
	IsActive   bool             `json:"is_active" gorm:"default:true"`
	LastSentAt *time.Time       `json:"last_sent_at,omitempty"`
	User       *User            `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
}

type NotificationSettingRequest struct {
	Type     NotificationType `json:"type" validate:"required,oneof=daily_quran daily_hadith doa streak_risk adzan"`
	Time     string           `json:"time" validate:"required"`
	IsActive *bool            `json:"is_active" validate:"required"`
}

type NotificationSettingsUpsertRequest struct {
	Settings []NotificationSettingRequest `json:"settings" validate:"required,dive"`
}

type PushToken struct {
	BaseID
	UserID     uuid.UUID `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_push_user_token"`
	Token      string    `json:"token" gorm:"type:varchar(512);not null;uniqueIndex:idx_push_user_token"`
	Platform   string    `json:"platform" gorm:"type:varchar(24);not null"`
	Provider   string    `json:"provider" gorm:"type:varchar(24);not null;default:'expo'"`
	DeviceID   string    `json:"device_id,omitempty" gorm:"type:varchar(128);index"`
	KeyP256DH  string    `json:"key_p256dh,omitempty" gorm:"type:varchar(256)"`
	KeyAuth    string    `json:"key_auth,omitempty" gorm:"type:varchar(256)"`
	IsActive   bool      `json:"is_active" gorm:"default:true"`
	LastSeenAt time.Time `json:"last_seen_at"`
	User       *User     `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
}

type PushTokenRegisterRequest struct {
	Token     string `json:"token" validate:"required"`
	Platform  string `json:"platform" validate:"required"`
	Provider  string `json:"provider"`
	DeviceID  string `json:"device_id"`
	KeyP256DH string `json:"key_p256dh"`
	KeyAuth   string `json:"key_auth"`
}

type PushTokenStatus struct {
	DeviceID    string    `json:"device_id,omitempty"`
	ID          *int      `json:"id,omitempty"`
	IsActive    bool      `json:"is_active"`
	LastSeenAt  time.Time `json:"last_seen_at"`
	Platform    string    `json:"platform"`
	Provider    string    `json:"provider"`
	TokenSuffix string    `json:"token_suffix,omitempty"`
}

type PushTokenStatusResponse struct {
	Items       []PushTokenStatus `json:"items"`
	HasActive   bool              `json:"has_active"`
	ActiveCount int               `json:"active_count"`
}

type PushTestResponse struct {
	Message string `json:"message"`
	Sent    int    `json:"sent"`
}

// UserNotification — persisted inbox message per user
type UserNotification struct {
	BaseUUID
	UserID uuid.UUID        `json:"user_id" gorm:"type:uuid;not null;index"`
	Title  string           `json:"title" gorm:"type:varchar(200)"`
	Body   string           `json:"body" gorm:"type:text"`
	Type   NotificationType `json:"type" gorm:"type:varchar(50)"`
	RefID  string           `json:"ref_id,omitempty" gorm:"type:varchar(100)"`
	IsRead bool             `json:"is_read" gorm:"default:false"`
}
