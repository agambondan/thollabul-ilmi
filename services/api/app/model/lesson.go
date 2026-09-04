package model

import "github.com/google/uuid"

type LessonModule struct {
	BaseID
	Slug             string       `json:"slug" gorm:"type:varchar(100);uniqueIndex;not null"`
	Title            string       `json:"title" gorm:"type:varchar(256);not null"`
	Description      string       `json:"description" gorm:"type:text"`
	Category         string       `json:"category" gorm:"type:varchar(50);index"`
	Level            string       `json:"level" gorm:"type:varchar(20);index"`
	EstimatedMinutes int          `json:"estimated_minutes" gorm:"default:0"`
	Icon             string       `json:"icon" gorm:"type:varchar(50)"`
	Order            int          `json:"order" gorm:"default:0"`
	Steps            []LessonStep `json:"steps" gorm:"foreignKey:ModuleID"`
}

type LessonStep struct {
	BaseID
	ModuleID   int    `json:"module_id" gorm:"not null;index"`
	StepOrder  int    `json:"step_order" gorm:"not null"`
	Kind       string `json:"kind" gorm:"type:varchar(20);default:'theory'"`
	Title      string `json:"title" gorm:"type:varchar(256);not null"`
	Body       string `json:"body" gorm:"type:text;not null"`
	Arabic     string `json:"arabic" gorm:"type:text"`
	Latin      string `json:"latin" gorm:"type:text"`
	Translation string `json:"translation" gorm:"type:text"`
	Dalil      string `json:"dalil" gorm:"type:text"`
	Tip        string `json:"tip" gorm:"type:text"`
}

type UserLessonProgress struct {
	BaseUUID
	UserID   uuid.UUID `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_user_lesson_step"`
	ModuleID int       `json:"module_id" gorm:"not null;uniqueIndex:idx_user_lesson_step"`
	StepNum  int       `json:"step" gorm:"column:step_num;default:1;uniqueIndex:idx_user_lesson_step"`
	Done     bool      `json:"done" gorm:"default:false"`
}

type SaveLessonProgressRequest struct {
	ModuleID int  `json:"module_id" validate:"required"`
	Step     int  `json:"step" validate:"required,min=1"`
	Done     bool `json:"done"`
}
