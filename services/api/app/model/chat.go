package model

import "github.com/google/uuid"

type ChatMessage struct {
	BaseUUID
	Text      string     `json:"text" gorm:"type:text;not null"`
	Author    string     `json:"author" gorm:"type:varchar(256);not null"`
	AuthorID  *uuid.UUID `json:"authorId" gorm:"type:uuid;index"`
	Timestamp int64      `json:"timestamp" gorm:"not null;index"`
}

type CreateChatMessageRequest struct {
	Text   string `json:"text" validate:"required"`
	Author string `json:"author"`
}
