package model

import (
	"time"

	"github.com/google/uuid"
)

type QuizType string

const (
	QuizTypeHafalan     QuizType = "hafalan"
	QuizTypeFiqh        QuizType = "fiqh"
	QuizTypeSirah       QuizType = "sirah"
	QuizTypeHadith      QuizType = "hadith"
	QuizTypeAsmaUlHusna QuizType = "asmaul_husna"
)

type Quiz struct {
	BaseID
	Type          QuizType     `json:"type" gorm:"type:varchar(50);not null;index"`
	QuestionText  string       `json:"question_text" gorm:"type:text;not null"`
	CorrectAnswer string       `json:"correct_answer" gorm:"type:text;not null"`
	Options       string       `json:"options" gorm:"type:jsonb"`
	Explanation   string       `json:"explanation" gorm:"type:text"`
	Difficulty    string       `json:"difficulty" gorm:"type:varchar(20);default:'medium'"`
	RefID         *int         `json:"ref_id,omitempty" gorm:"index"`
	TranslationID *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

type UserQuizResult struct {
	BaseID
	UserID     uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	QuizID     int       `json:"quiz_id" gorm:"not null;index"`
	IsCorrect  bool      `json:"is_correct"`
	AnsweredAt time.Time `json:"answered_at"`
}

type QuizSessionRequest struct {
	Type  QuizType `json:"type" query:"type"`
	Count int      `json:"count" query:"count"`
}

type SubmitQuizRequest struct {
	Results []QuizAnswer `json:"results" validate:"required"`
}

type QuizAnswer struct {
	QuizID int    `json:"quiz_id"`
	Answer string `json:"answer"`
}

type QuizStats struct {
	TotalAnswered int     `json:"total_answered"`
	TotalCorrect  int     `json:"total_correct"`
	Accuracy      float64 `json:"accuracy_percent"`
}
