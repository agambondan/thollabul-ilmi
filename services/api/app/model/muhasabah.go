package model

import "github.com/google/uuid"

type Muhasabah struct {
	BaseID
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index:idx_muhasabah_uid_date"`
	Date      string    `json:"date" gorm:"type:date;not null;index:idx_muhasabah_uid_date"`
	Content   string    `json:"content" gorm:"type:text;not null"`
	MoodScore int       `json:"mood_score" gorm:"default:3"`
	IsPrivate bool      `json:"is_private"`
}

type CreateMuhasabahRequest struct {
	Date      string `json:"date" validate:"required"`
	Content   string `json:"content" validate:"required"`
	MoodScore int    `json:"mood_score" validate:"min=1,max=5"`
	IsPrivate bool   `json:"is_private"`
}

type UpdateMuhasabahRequest struct {
	Content   string `json:"content"`
	MoodScore int    `json:"mood_score" validate:"min=0,max=5"`
	IsPrivate *bool  `json:"is_private"`
}
