package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Ad struct {
	BaseUUID
	Title    string     `json:"title" gorm:"type:varchar(100);not null"`
	ImageURL string     `json:"image_url" gorm:"type:varchar(500)"`
	ClickURL string     `json:"click_url" gorm:"type:varchar(500)"`
	SlotType string     `json:"slot_type" gorm:"type:varchar(20);not null;index"`
	Priority int        `json:"priority" gorm:"default:0"`
	IsActive bool       `json:"is_active" gorm:"default:true;index"`
	StartAt  *time.Time `json:"start_at"`
	EndAt    *time.Time `json:"end_at"`
}

func (a *Ad) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

type CreateAdRequest struct {
	Title    string     `json:"title" validate:"required"`
	ImageURL string     `json:"image_url"`
	ClickURL string     `json:"click_url" validate:"required"`
	SlotType string     `json:"slot_type" validate:"required"`
	Priority int        `json:"priority"`
	IsActive *bool      `json:"is_active"`
	StartAt  *time.Time `json:"start_at"`
	EndAt    *time.Time `json:"end_at"`
}

type UpdateAdRequest struct {
	Title    *string    `json:"title"`
	ImageURL *string    `json:"image_url"`
	ClickURL *string    `json:"click_url"`
	SlotType *string    `json:"slot_type"`
	Priority *int       `json:"priority"`
	IsActive *bool      `json:"is_active"`
	StartAt  *time.Time `json:"start_at"`
	EndAt    *time.Time `json:"end_at"`
}
