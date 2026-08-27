package model

import "github.com/google/uuid"

type ForumQuestion struct {
	BaseUUID
	UserID       uuid.UUID     `json:"user_id" gorm:"type:uuid;not null;index"`
	Title        string        `json:"title" gorm:"type:varchar(256);not null"`
	Body         string        `json:"body" gorm:"type:text;not null"`
	Slug         string        `json:"slug" gorm:"type:varchar(300);uniqueIndex;not null"`
	Tags         string        `json:"tags,omitempty" gorm:"type:varchar(500)"`
	ViewCount    int           `json:"view_count" gorm:"default:0"`
	AnswerCount  int           `json:"answer_count" gorm:"default:0"`
	VoteCount    int           `json:"vote_count" gorm:"default:0"`
	IsAnswered   bool          `json:"is_answered" gorm:"default:false"`
	BestAnswerID *uuid.UUID    `json:"best_answer_id,omitempty" gorm:"type:uuid"`
	User         *User         `json:"user,omitempty" gorm:"-"`
	Answers      []ForumAnswer `json:"answers,omitempty" gorm:"-"`
}

type ForumAnswer struct {
	BaseUUID
	QuestionID uuid.UUID      `json:"question_id" gorm:"type:uuid;not null;index"`
	UserID     uuid.UUID      `json:"user_id" gorm:"type:uuid;not null"`
	Body       string         `json:"body" gorm:"type:text;not null"`
	VoteCount  int            `json:"vote_count" gorm:"default:0"`
	IsAccepted bool           `json:"is_accepted" gorm:"default:false"`
	User       *User          `json:"user,omitempty" gorm:"-"`
	Question   *ForumQuestion `json:"question,omitempty" gorm:"-"`
}

type ForumVote struct {
	BaseUUID
	UserID     uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	TargetType string    `json:"target_type" gorm:"type:varchar(10);not null;index"` // question/answer
	TargetID   uuid.UUID `json:"target_id" gorm:"type:uuid;not null;index"`
	Value      int       `json:"value" gorm:"not null"` // 1 or -1
}

type CreateQuestionRequest struct {
	Title string `json:"title" validate:"required,min=10"`
	Body  string `json:"body" validate:"required,min=20"`
	Tags  string `json:"tags"`
}

type CreateAnswerRequest struct {
	Body string `json:"body" validate:"required,min=10"`
}

type VoteRequest struct {
	TargetType string    `json:"target_type" validate:"required"` // question/answer
	TargetID   uuid.UUID `json:"target_id" validate:"required"`
	Value      int       `json:"value" validate:"required"` // 1 or -1
}
