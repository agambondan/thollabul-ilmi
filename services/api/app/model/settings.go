package model

import "github.com/google/uuid"

type UserSettings struct {
	BaseUUID
	UserID   uuid.UUID `json:"user_id" gorm:"type:uuid;uniqueIndex;not null"`
	Settings string    `json:"settings" gorm:"type:text;not null"`
}

type UpdateSettingsRequest struct {
	Settings string `json:"settings" validate:"required"`
}
