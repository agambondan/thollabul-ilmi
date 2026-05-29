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
	var items []model.Comment
	q := r.db.
		Where("ref_type = ? AND ref_id = ? AND parent_id IS NULL", refType, refID).
		Order("created_at ASC")
	if len(hiddenIDs) > 0 {
		q = q.Where("CAST(comments.id AS TEXT) NOT IN ?", hiddenIDs).
			Preload("Replies", "CAST(comments.id AS TEXT) NOT IN ?", hiddenIDs)
	} else {
		q = q.Preload("Replies")
	}
	err := q.Find(&items).Error
	return items, err
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
