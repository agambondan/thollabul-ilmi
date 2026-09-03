package model

import "github.com/google/uuid"

type AmalanCategory string

const (
	AmalanSholat  AmalanCategory = "sholat"
	AmalanPuasa   AmalanCategory = "puasa"
	AmalanDzikir  AmalanCategory = "dzikir"
	AmalanSedekah AmalanCategory = "sedekah"
	AmalanLainnya AmalanCategory = "lainnya"
)

type AmalanItem struct {
	BaseID
	Name          string         `json:"name" gorm:"type:varchar(256);not null;uniqueIndex:idx_amalan_item_category_name"`
	Description   string         `json:"description" gorm:"type:text"`
	Source        string         `json:"source,omitempty" gorm:"type:varchar(256)"`
	Category      AmalanCategory `json:"category" gorm:"type:varchar(50);not null;index;uniqueIndex:idx_amalan_item_category_name"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	TranslationID *int           `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation   `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

type AmalanLog struct {
	BaseID
	UserID       uuid.UUID   `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_amalan_log_uid_aid_date"`
	AmalanItemID int         `json:"amalan_item_id" gorm:"not null;uniqueIndex:idx_amalan_log_uid_aid_date"`
	Date         string      `json:"date" gorm:"type:date;not null;uniqueIndex:idx_amalan_log_uid_aid_date"`
	IsDone       bool        `json:"is_done" gorm:"default:false"`
	AmalanItem   *AmalanItem `json:"amalan_item,omitempty"`
}

type AmalanWithStatus struct {
	AmalanItem
	IsDone bool `json:"is_done"`
	LogID  *int `json:"log_id,omitempty"`
}
