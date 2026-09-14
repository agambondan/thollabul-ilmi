package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdRepository interface {
	GetActiveBySlot(slot string) (*model.Ad, error)
	List() ([]model.Ad, error)
	FindByID(id uuid.UUID) (*model.Ad, error)
	Create(ad *model.Ad) error
	Update(ad *model.Ad) error
	Delete(id uuid.UUID) error
}

type adRepository struct {
	db *gorm.DB
}

func NewAdRepository(db *gorm.DB) AdRepository {
	return &adRepository{db: db}
}

func (r *adRepository) GetActiveBySlot(slot string) (*model.Ad, error) {
	var ad model.Ad
	now := time.Now()
	err := r.db.
		Where("slot_type = ? AND is_active = true AND (start_at IS NULL OR start_at <= ?) AND (end_at IS NULL OR end_at >= ?)", slot, now, now).
		Order("priority DESC, created_at DESC").
		First(&ad).Error
	if err != nil {
		return nil, err
	}
	return &ad, nil
}

func (r *adRepository) List() ([]model.Ad, error) {
	var ads []model.Ad
	err := r.db.Order("created_at DESC").Find(&ads).Error
	return ads, err
}

func (r *adRepository) FindByID(id uuid.UUID) (*model.Ad, error) {
	var ad model.Ad
	err := r.db.Where("id = ?", id).First(&ad).Error
	if err != nil {
		return nil, err
	}
	return &ad, nil
}

func (r *adRepository) Create(ad *model.Ad) error {
	return r.db.Create(ad).Error
}

func (r *adRepository) Update(ad *model.Ad) error {
	return r.db.Save(ad).Error
}

func (r *adRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Ad{}, "id = ?", id).Error
}
