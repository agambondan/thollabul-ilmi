package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type KalkulasiZakatRepository interface {
	Save(*model.KalkulasiZakat) (*model.KalkulasiZakat, error)
	FindByUserID(uuid.UUID) ([]model.KalkulasiZakat, error)
	FindByID(uuid.UUID, uuid.UUID) (*model.KalkulasiZakat, error)
	Delete(uuid.UUID, uuid.UUID) error
}

type kalkulasiZakatRepo struct {
	db *gorm.DB
}

func NewKalkulasiZakatRepository(db *gorm.DB) KalkulasiZakatRepository {
	return &kalkulasiZakatRepo{db}
}

func (r *kalkulasiZakatRepo) Save(k *model.KalkulasiZakat) (*model.KalkulasiZakat, error) {
	if err := r.db.Create(k).Error; err != nil {
		return nil, err
	}
	return k, nil
}

func (r *kalkulasiZakatRepo) FindByUserID(userID uuid.UUID) ([]model.KalkulasiZakat, error) {
	var items []model.KalkulasiZakat
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Limit(100).Find(&items).Error
	return items, err
}

func (r *kalkulasiZakatRepo) FindByID(id, userID uuid.UUID) (*model.KalkulasiZakat, error) {
	var k model.KalkulasiZakat
	err := r.db.First(&k, "id = ? AND user_id = ?", id, userID).Error
	if err != nil {
		return nil, err
	}
	return &k, nil
}

func (r *kalkulasiZakatRepo) Delete(id, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.KalkulasiZakat{}))
}
