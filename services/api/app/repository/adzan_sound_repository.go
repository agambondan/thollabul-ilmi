package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdzanSoundRepository interface {
	FindByUserID(userID uuid.UUID) ([]model.AdzanSound, error)
	CountByUserID(userID uuid.UUID) (int64, error)
	Create(sound *model.AdzanSound) error
	FindByIDAndUserID(id int, userID uuid.UUID) (*model.AdzanSound, error)
	Delete(sound *model.AdzanSound) error
}

type adzanSoundRepo struct {
	db *gorm.DB
}

func NewAdzanSoundRepository(db *gorm.DB) AdzanSoundRepository {
	return &adzanSoundRepo{db: db}
}

func (r *adzanSoundRepo) FindByUserID(userID uuid.UUID) ([]model.AdzanSound, error) {
	var sounds []model.AdzanSound
	err := r.db.Where("user_id = ?", userID).Order("created_at DESC").Find(&sounds).Error
	return sounds, err
}

func (r *adzanSoundRepo) CountByUserID(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&model.AdzanSound{}).Where("user_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *adzanSoundRepo) Create(sound *model.AdzanSound) error {
	return r.db.Create(sound).Error
}

func (r *adzanSoundRepo) FindByIDAndUserID(id int, userID uuid.UUID) (*model.AdzanSound, error) {
	var sound model.AdzanSound
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&sound).Error
	return &sound, err
}

func (r *adzanSoundRepo) Delete(sound *model.AdzanSound) error {
	return r.db.Delete(sound).Error
}
