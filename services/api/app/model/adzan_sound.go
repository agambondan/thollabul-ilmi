package model

import "github.com/google/uuid"

type AdzanSound struct {
	BaseID
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	Name      string    `json:"name" gorm:"type:varchar(255);not null"`
	URL       string    `json:"url" gorm:"type:varchar(1024);not null"`
	FileName  string    `json:"file_name" gorm:"type:varchar(255);not null"`
	ObjectKey string    `json:"-" gorm:"type:varchar(1024);not null"`
}
