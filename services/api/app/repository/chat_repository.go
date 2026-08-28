package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type ChatRepository interface {
	Create(*model.ChatMessage) (*model.ChatMessage, error)
	Latest(limit int) ([]model.ChatMessage, error)
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
