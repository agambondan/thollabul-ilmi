package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MuhasabahRepository interface {
	Create(m *model.Muhasabah) (*model.Muhasabah, error)
	FindByUserID(userID uuid.UUID, limit, offset int) ([]model.Muhasabah, error)
	FindByID(id int, userID uuid.UUID) (*model.Muhasabah, error)
	Update(id int, userID uuid.UUID, m *model.Muhasabah) (*model.Muhasabah, error)
	Delete(id int, userID uuid.UUID) error
}

type muhasabahRepository struct {
	db *gorm.DB
}

func NewMuhasabahRepository(db *gorm.DB) MuhasabahRepository {
	return &muhasabahRepository{db}
}

func (r *muhasabahRepository) Create(m *model.Muhasabah) (*model.Muhasabah, error) {
	err := r.db.Create(m).Error
	return m, err
}

func (r *muhasabahRepository) FindByUserID(userID uuid.UUID, limit, offset int) ([]model.Muhasabah, error) {
	var list []model.Muhasabah
	q := r.db.Where("user_id = ?", userID).Order("date DESC, id DESC")
	if limit > 0 {
		q = q.Limit(limit).Offset(offset)
	}
	err := q.Find(&list).Error
	return list, err
}

func (r *muhasabahRepository) FindByID(id int, userID uuid.UUID) (*model.Muhasabah, error) {
	var m model.Muhasabah
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&m).Error
	return &m, err
}

func (r *muhasabahRepository) Update(id int, userID uuid.UUID, m *model.Muhasabah) (*model.Muhasabah, error) {
	var existing model.Muhasabah
	if err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&existing).Error; err != nil {
		return nil, err
	}
	err := r.db.Model(&existing).Updates(m).Error
	return &existing, err
}

func (r *muhasabahRepository) Delete(id int, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Muhasabah{}))
}
