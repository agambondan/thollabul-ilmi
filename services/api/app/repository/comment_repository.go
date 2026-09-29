package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommentRepository interface {
	FindByRef(refType model.CommentRefType, refID int, hiddenIDs []string) ([]model.Comment, error)
	FindByID(id int) (*model.Comment, error)
	Create(c *model.Comment) (*model.Comment, error)
	Delete(id int, userID *uuid.UUID) error
}

type commentRepository struct{ db *gorm.DB }

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db}
}

func (r *commentRepository) FindByRef(refType model.CommentRefType, refID int, hiddenIDs []string) ([]model.Comment, error) {
	var allComments []model.Comment
	q := r.db.
		Where("ref_type = ? AND ref_id = ?", refType, refID).
		Order("created_at ASC")
	if len(hiddenIDs) > 0 {
		q = q.Where("CAST(id AS TEXT) NOT IN ?", hiddenIDs)
	}
	if err := q.Find(&allComments).Error; err != nil {
		return nil, err
	}

	topLevel := make([]model.Comment, 0, len(allComments))
	topLevelIndex := make(map[int]int)

	for _, c := range allComments {
		if c.ParentID == nil {
			if c.ID != nil {
				topLevelIndex[*c.ID] = len(topLevel)
			}
			topLevel = append(topLevel, c)
		}
	}

	for _, c := range allComments {
		if c.ParentID != nil {
			if idx, ok := topLevelIndex[*c.ParentID]; ok {
				topLevel[idx].Replies = append(topLevel[idx].Replies, c)
			}
		}
	}

	return topLevel, nil
}

func (r *commentRepository) FindByID(id int) (*model.Comment, error) {
	var item model.Comment
	return &item, r.db.First(&item, id).Error
}

func (r *commentRepository) Create(c *model.Comment) (*model.Comment, error) {
	return c, r.db.Create(c).Error
}

func (r *commentRepository) Delete(id int, userID *uuid.UUID) error {
	q := r.db.Where("id = ?", id)
	if userID != nil {
		q = q.Where("user_id = ?", *userID)
	}
	return deleteResultError(q.Delete(&model.Comment{}))
}
