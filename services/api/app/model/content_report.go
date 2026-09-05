package model

import (
	"time"

	"github.com/google/uuid"
)

type ContentReportTargetType string

const (
	ContentReportTargetQuran   ContentReportTargetType = "quran"
	ContentReportTargetHadith  ContentReportTargetType = "hadith"
	ContentReportTargetFiqh    ContentReportTargetType = "fiqh"
	ContentReportTargetDoa     ContentReportTargetType = "doa"
	ContentReportTargetSiroh   ContentReportTargetType = "siroh"
	ContentReportTargetDzikir  ContentReportTargetType = "dzikir"
	ContentReportTargetGeneral ContentReportTargetType = "general"
)

type ContentReportCategory string

const (
	ContentReportCategoryTranslation ContentReportCategory = "translation_error"
	ContentReportCategoryArabicText  ContentReportCategory = "arabic_text_error"
	ContentReportCategoryTafsir      ContentReportCategory = "tafsir_error"
	ContentReportCategorySanadGrading ContentReportCategory = "sanad_grading_error"
	ContentReportCategoryTypo        ContentReportCategory = "typo"
	ContentReportCategoryOther       ContentReportCategory = "other"
)

type ContentReportStatus string

const (
	ContentReportStatusPending  ContentReportStatus = "pending"
	ContentReportStatusReviewed ContentReportStatus = "reviewed"
	ContentReportStatusResolved ContentReportStatus = "resolved"
	ContentReportStatusRejected ContentReportStatus = "rejected"
)

type ContentReport struct {
	BaseUUID
	UserID      uuid.UUID               `json:"user_id" gorm:"type:uuid;not null;index"`
	User        *User                   `json:"user,omitempty" gorm:"foreignKey:UserID"`
	TargetType  ContentReportTargetType `json:"target_type" gorm:"type:varchar(32);not null;index"`
	TargetID    string                  `json:"target_id" gorm:"type:varchar(128);not null;index"`
	TargetTitle string                  `json:"target_title,omitempty" gorm:"type:varchar(255)"`
	Category    ContentReportCategory   `json:"category" gorm:"type:varchar(32);not null;default:'translation_error'"`
	Description string                  `json:"description" gorm:"type:text;not null"`
	Correction  string                  `json:"correction,omitempty" gorm:"type:text"`
	Status      ContentReportStatus     `json:"status" gorm:"type:varchar(20);not null;default:'pending';index"`
	AdminNote   string                  `json:"admin_note,omitempty" gorm:"type:text"`
	ReviewedBy  *uuid.UUID              `json:"reviewed_by,omitempty" gorm:"type:uuid"`
	ReviewedAt  *time.Time              `json:"reviewed_at,omitempty"`
}

type CreateContentReportRequest struct {
	TargetType  ContentReportTargetType `json:"target_type" validate:"required"`
	TargetID    string                  `json:"target_id" validate:"required"`
	TargetTitle string                  `json:"target_title"`
	Category    ContentReportCategory   `json:"category" validate:"required"`
	Description string                  `json:"description" validate:"required"`
	Correction  string                  `json:"correction"`
}

type UpdateContentReportStatusRequest struct {
	Status    ContentReportStatus `json:"status" validate:"required"`
	AdminNote string              `json:"admin_note"`
}

type ApplyContentReportRequest struct {
	CorrectionText string `json:"correction_text"`
	Field          string `json:"field"`
	AdminNote      string `json:"admin_note"`
}
