package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type KajianNoteRepository interface {
	Create(note *model.KajianUserNote) error
	GetByID(userID uuid.UUID, id int) (*model.KajianUserNote, error)
	List(userID uuid.UUID, query model.KajianNoteListQuery) ([]model.KajianUserNote, error)
	Update(note *model.KajianUserNote) error
	Delete(userID uuid.UUID, id int) error
}

type kajianNoteRepository struct {
	db *gorm.DB
}

func NewKajianNoteRepository(db *gorm.DB) KajianNoteRepository {
	return &kajianNoteRepository{db: db}
}

func (r *kajianNoteRepository) Create(note *model.KajianUserNote) error {
	return r.db.Create(note).Error
}

func (r *kajianNoteRepository) GetByID(userID uuid.UUID, id int) (*model.KajianUserNote, error) {
	var note model.KajianUserNote
	err := r.db.Where("user_id = ? AND id = ?", userID, id).First(&note).Error
	if err != nil {
		return nil, err
	}
	return &note, nil
}

func (r *kajianNoteRepository) List(userID uuid.UUID, query model.KajianNoteListQuery) ([]model.KajianUserNote, error) {
	var notes []model.KajianUserNote
	q := r.db.Preload("Kajian", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, title, speaker, topic, thumbnail_url, url")
	}).Where("user_id = ?", userID)

	if query.KajianID != nil && *query.KajianID > 0 {
		q = q.Where("kajian_id = ?", *query.KajianID)
	}

	err := q.Order("created_at DESC, start_sec ASC").
		Limit(query.Limit).
		Offset(query.Offset).
		Find(&notes).Error

	return notes, err
}

func (r *kajianNoteRepository) Update(note *model.KajianUserNote) error {
	return r.db.Save(note).Error
}

func (r *kajianNoteRepository) Delete(userID uuid.UUID, id int) error {
	return r.db.Where("user_id = ? AND id = ?", userID, id).Delete(&model.KajianUserNote{}).Error
}