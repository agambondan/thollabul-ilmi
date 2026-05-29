package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NoteRepository interface {
	FindByUser(userID uuid.UUID, refType model.NoteRefType, refID int) ([]model.Note, error)
	FindByID(id int) (*model.Note, error)
	Create(n *model.Note) (*model.Note, error)
	Update(id int, n *model.Note) (*model.Note, error)
	Delete(id int, userID uuid.UUID) error
}

type noteRepository struct{ db *gorm.DB }

func NewNoteRepository(db *gorm.DB) NoteRepository {
	return &noteRepository{db}
}

func (r *noteRepository) FindByUser(userID uuid.UUID, refType model.NoteRefType, refID int) ([]model.Note, error) {
	var items []model.Note
	q := r.db.Where("user_id = ?", userID)
	if refType != "" {
		q = q.Where("ref_type = ?", refType)
	}
	if refID > 0 {
		q = q.Where("ref_id = ?", refID)
	}
	return items, q.Order("created_at DESC").Limit(200).Find(&items).Error
}

func (r *noteRepository) FindByID(id int) (*model.Note, error) {
	var item model.Note
	return &item, r.db.First(&item, id).Error
}

func (r *noteRepository) Create(n *model.Note) (*model.Note, error) {
	return n, r.db.Create(n).Error
}

func (r *noteRepository) Update(id int, n *model.Note) (*model.Note, error) {
	return n, r.db.Model(&model.Note{}).Where("id = ?", id).Updates(n).Error
}

func (r *noteRepository) Delete(id int, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Note{}))
}
