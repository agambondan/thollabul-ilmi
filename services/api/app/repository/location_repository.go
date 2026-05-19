package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type LocationRepository interface {
	Save(*model.Location) (*model.Location, error)
	FindAll(search, category, era string, limit, offset int) ([]model.Location, int64, error)
	FindByID(int) (*model.Location, error)
	Delete(int) error
}

type locationRepo struct{ db *gorm.DB }

func NewLocationRepository(db *gorm.DB) LocationRepository { return &locationRepo{db} }

func (r *locationRepo) Save(l *model.Location) (*model.Location, error) {
	if err := r.db.Create(l).Error; err != nil {
		return nil, err
	}
	return l, nil
}

func (r *locationRepo) FindAll(search, category, era string, limit, offset int) ([]model.Location, int64, error) {
	var list []model.Location
	var total int64
	query := r.db.Model(&model.Location{})
	if search != "" {
		q := "%" + search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?", q, q)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if era != "" {
		query = query.Where("era = ?", era)
	}
	query.Count(&total)
	err := query.Order("name asc").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *locationRepo) FindByID(id int) (*model.Location, error) {
	var l model.Location
	err := r.db.First(&l, id).Error
	if err != nil {
		return nil, err
	}
	return &l, nil
}

func (r *locationRepo) Delete(id int) error {
	return r.db.Delete(&model.Location{}, id).Error
}
