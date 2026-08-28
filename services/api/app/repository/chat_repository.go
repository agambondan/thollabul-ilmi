package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatRepository interface {
	Create(*model.ChatMessage) (*model.ChatMessage, error)
	Latest(limit int) ([]model.ChatMessage, error)
	// Delete removes a message. A non-nil ownerID restricts the delete to that
	// author, so a non-admin caller cannot remove somebody else's message.
	Delete(id string, ownerID *uuid.UUID) error
}

type chatRepository struct{ db *gorm.DB }

func NewChatRepository(db *gorm.DB) ChatRepository {
	return &chatRepository{db}
}

func (r *chatRepository) Create(msg *model.ChatMessage) (*model.ChatMessage, error) {
	return msg, r.db.Create(msg).Error
}

func (r *chatRepository) Latest(limit int) ([]model.ChatMessage, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var items []model.ChatMessage
	err := r.db.Order("timestamp DESC").Limit(limit).Find(&items).Error
	for i, j := 0, len(items)-1; i < j; i, j = i+1, j-1 {
		items[i], items[j] = items[j], items[i]
	}
	return items, err
}

func (r *chatRepository) Delete(id string, ownerID *uuid.UUID) error {
	q := r.db.Where("id = ?", id)
	if ownerID != nil {
		q = q.Where("author_id = ?", *ownerID)
	}
	return deleteResultError(q.Delete(&model.ChatMessage{}))
}
