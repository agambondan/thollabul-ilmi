package model

import "github.com/google/uuid"

type KajianUserNote struct {
	BaseID
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index:idx_kajian_user_note_user_kajian,priority:1;index"`
	KajianID  int       `json:"kajian_id" gorm:"not null;index:idx_kajian_user_note_user_kajian,priority:2;index"`
	StartSec  int       `json:"start_sec" gorm:"not null"`
	EndSec    *int      `json:"end_sec" gorm:""`
	Content   string    `json:"content" gorm:"type:text;not null"`
	CreatedAt *int64    `json:"created_at,omitempty" gorm:"autoCreateTime"`
	UpdatedAt *int64    `json:"updated_at,omitempty" gorm:"autoUpdateTime"`

	Kajian *Kajian `json:"kajian,omitempty" gorm:"foreignKey:KajianID;-:migration"`
}

type CreateKajianNoteRequest struct {
	KajianID int    `json:"kajian_id" validate:"required"`
	StartSec int    `json:"start_sec" validate:"required,min=0"`
	EndSec   *int   `json:"end_sec" validate:"omitempty,gtfield=StartSec"`
	Content  string `json:"content" validate:"required,max=5000"`
}

type UpdateKajianNoteRequest struct {
	StartSec *int   `json:"start_sec" validate:"omitempty,min=0"`
	EndSec   *int   `json:"end_sec" validate:"omitempty"`
	Content  string `json:"content" validate:"required,max=5000"`
}

type KajianNoteListQuery struct {
	KajianID *int `json:"kajian_id" form:"kajian_id"`
	Limit    int  `json:"limit" form:"limit"`
	Offset   int  `json:"offset" form:"offset"`
}