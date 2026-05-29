package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SimpanFaraidhRepository interface {
	Save(*model.SimpanFaraidh) (*model.SimpanFaraidh, error)
	FindByUserID(uuid.UUID) ([]model.SimpanFaraidh, error)
	FindByID(uuid.UUID, uuid.UUID) (*model.SimpanFaraidh, error)
	Delete(uuid.UUID, uuid.UUID) error
}

type simpanFaraidhRepo struct {
	db *gorm.DB
}

func NewSimpanFaraidhRepository(db *gorm.DB) SimpanFaraidhRepository {
	return &simpanFaraidhRepo{db}
}

func (r *simpanFaraidhRepo) Save(s *model.SimpanFaraidh) (*model.SimpanFaraidh, error) {
	if err := r.db.Create(s).Error; err != nil {
		return nil, err
	}
	return s, nil
}

func (r *simpanFaraidhRepo) FindByUserID(userID uuid.UUID) ([]model.SimpanFaraidh, error) {
	var items []model.SimpanFaraidh
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&items).Error
	return items, err
}

func (r *simpanFaraidhRepo) FindByID(id, userID uuid.UUID) (*model.SimpanFaraidh, error) {
	var s model.SimpanFaraidh
	err := r.db.First(&s, "id = ? AND user_id = ?", id, userID).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *simpanFaraidhRepo) Delete(id, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.SimpanFaraidh{}))
}
