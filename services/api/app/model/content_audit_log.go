package model

import (
	"github.com/google/uuid"
)

type ContentAuditLog struct {
	BaseUUID
	TargetType  ContentReportTargetType `json:"target_type" gorm:"type:varchar(32);not null;index"`
	TargetID    string                  `json:"target_id" gorm:"type:varchar(128);not null;index"`
	TargetTitle string                  `json:"target_title,omitempty" gorm:"type:varchar(255)"`
	Field       string                  `json:"field" gorm:"type:varchar(64);not null"`
	OldValue    string                  `json:"old_value,omitempty" gorm:"type:text"`
	NewValue    string                  `json:"new_value" gorm:"type:text;not null"`
	ReportID    *uuid.UUID              `json:"report_id,omitempty" gorm:"type:uuid;index"`
	ModifiedBy  uuid.UUID               `json:"modified_by" gorm:"type:uuid;not null;index"`
	Modifier    *User                   `json:"modifier,omitempty" gorm:"foreignKey:ModifiedBy"`
	Reason      string                  `json:"reason,omitempty" gorm:"type:text"`
}
