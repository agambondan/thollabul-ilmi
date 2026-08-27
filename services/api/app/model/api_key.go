package model

import (
	"time"

	"github.com/google/uuid"
)

type APIKey struct {
	BaseID
	UserID       uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	Name         string     `json:"name" gorm:"type:varchar(100);not null"`
	Key          string     `json:"key,omitempty" gorm:"type:varchar(64);uniqueIndex;not null"`
	IsActive     bool       `json:"is_active" gorm:"default:true"`
	LastUsedAt   *time.Time `json:"last_used_at,omitempty"`
	RequestCount int        `json:"request_count" gorm:"default:0"`
}

type CreateAPIKeyRequest struct {
	Name string `json:"name" validate:"required"`
}

type APIKeyPublic struct {
	ID           *int       `json:"id"`
	Name         string     `json:"name"`
	KeyPrefix    string     `json:"key_prefix"`
	IsActive     bool       `json:"is_active"`
	LastUsedAt   *time.Time `json:"last_used_at,omitempty"`
	RequestCount int        `json:"request_count"`
}
