package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserWirdRepository interface {
	Save(*model.UserWird) (*model.UserWird, error)
	FindByUserID(uuid.UUID) ([]model.UserWird, error)
	FindByID(uuid.UUID) (*model.UserWird, error)
	Update(*model.UserWird) (*model.UserWird, error)
	DeleteByID(id, userID uuid.UUID) error
}

type userWirdRepo struct {
	db *gorm.DB
}

func NewUserWirdRepository(db *gorm.DB) UserWirdRepository {
	return &userWirdRepo{db}
}

func (r *userWirdRepo) Save(w *model.UserWird) (*model.UserWird, error) {
	if err := r.db.Create(w).Error; err != nil {
		return nil, err
	}
	return w, nil
}

func (r *userWirdRepo) FindByUserID(userID uuid.UUID) ([]model.UserWird, error) {
	var list []model.UserWird
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&list).Error
	return list, err
}

func (r *userWirdRepo) FindByID(id uuid.UUID) (*model.UserWird, error) {
	var w model.UserWird
	if err := r.db.First(&w, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &w, nil
}

func (r *userWirdRepo) Update(w *model.UserWird) (*model.UserWird, error) {
	if err := r.db.Save(w).Error; err != nil {
		return nil, err
	}
	return w, nil
}

func (r *userWirdRepo) DeleteByID(id, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.UserWird{}))
}
