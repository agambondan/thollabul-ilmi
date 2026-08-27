package model

import (
	"time"

	"github.com/google/uuid"
)

type HafalanStatus string

const (
	HafalanNotStarted HafalanStatus = "not_started"
	HafalanInProgress HafalanStatus = "in_progress"
	HafalanMemorized  HafalanStatus = "memorized"
)

type HafalanProgress struct {
	BaseUUID
	UserID      uuid.UUID     `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_hafalan_user_surah"`
	SurahID     int           `json:"surah_id" gorm:"not null;uniqueIndex:idx_hafalan_user_surah"`
	Status      HafalanStatus `json:"status" gorm:"type:varchar(50);default:'not_started'"`
	StartedAt   *time.Time    `json:"started_at,omitempty"`
	CompletedAt *time.Time    `json:"completed_at,omitempty"`
	Surah       *Surah        `json:"surah,omitempty" gorm:"foreignKey:SurahID"`
}

type HafalanSummary struct {
	Total      int `json:"total"`
	NotStarted int `json:"not_started"`
	InProgress int `json:"in_progress"`
	Memorized  int `json:"memorized"`
}

type UpdateHafalanRequest struct {
	Status HafalanStatus `json:"status" validate:"required,oneof=not_started in_progress memorized"`
}
