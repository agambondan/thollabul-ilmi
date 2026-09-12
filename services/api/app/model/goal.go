package model

import "github.com/google/uuid"

type GoalType string

const (
	GoalTypeHafalan GoalType = "hafalan"
	GoalTypeKhatam  GoalType = "khatam"
	GoalTypeTilawah GoalType = "tilawah"
	GoalTypeHadith  GoalType = "hadith"
	GoalTypeCustom  GoalType = "custom"
)

type StudyGoal struct {
	BaseID
	UserID      uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	Type        GoalType  `json:"type" gorm:"type:varchar(50);not null"`
	Title       string    `json:"title" gorm:"type:varchar(512);not null"`
	Description string    `json:"description" gorm:"type:text"`
	Target      int       `json:"target" gorm:"default:0"`
	Progress    int       `json:"progress" gorm:"default:0"`
	StartDate   string    `json:"start_date" gorm:"type:date;not null"`
	EndDate     *string   `json:"end_date" gorm:"type:date"`
	IsCompleted bool      `json:"is_completed" gorm:"default:false"`
}

type CreateGoalRequest struct {
	Type        GoalType `json:"type" validate:"required,oneof=hafalan khatam tilawah hadith custom"`
	Title       string   `json:"title" validate:"required"`
	Description string   `json:"description"`
	Target      int      `json:"target" validate:"min=0"`
	StartDate   string   `json:"start_date" validate:"required"`
	EndDate     string   `json:"end_date"`
}

type UpdateGoalRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Target      int    `json:"target" validate:"min=0"`
	Progress    int    `json:"progress" validate:"min=0"`
	EndDate     string `json:"end_date"`
	IsCompleted *bool  `json:"is_completed"`
}
