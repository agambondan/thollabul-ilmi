package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type JarhTadilRepository interface {
	Save(*model.JarhTadil) (*model.JarhTadil, error)
	FindAll(limit, offset int) ([]model.JarhTadil, error)
	FindByID(*int) (*model.JarhTadil, error)
	FindByPerawiID(*int) ([]model.JarhTadil, error)
	UpdateByID(*int, *model.JarhTadil) (*model.JarhTadil, error)
	DeleteByID(*int) error
}

type jarhTadilRepo struct {
	db *gorm.DB
}

func NewJarhTadilRepository(db *gorm.DB) JarhTadilRepository {
	return &jarhTadilRepo{db}
}

func (r *jarhTadilRepo) withRelations(db *gorm.DB) *gorm.DB {
	return db.Preload("Perawi").Preload("Penilai").Preload("Translation")
}

func (r *jarhTadilRepo) Save(j *model.JarhTadil) (*model.JarhTadil, error) {
	if err := r.db.Create(j).Error; err != nil {
		return nil, err
	}
	return j, nil
}

func (r *jarhTadilRepo) FindAll(limit, offset int) ([]model.JarhTadil, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.JarhTadil
	err := r.withRelations(r.db).Order("id").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *jarhTadilRepo) FindByID(id *int) (*model.JarhTadil, error) {
	var j model.JarhTadil
	if err := r.withRelations(r.db).First(&j, id).Error; err != nil {
		return nil, err
	}
	return &j, nil
}

func (r *jarhTadilRepo) FindByPerawiID(perawiID *int) ([]model.JarhTadil, error) {
	var list []model.JarhTadil
	err := r.withRelations(r.db).Where("perawi_id = ?", perawiID).Order("id").Find(&list).Error
	return list, err
}

func (r *jarhTadilRepo) UpdateByID(id *int, j *model.JarhTadil) (*model.JarhTadil, error) {
	if _, err := r.FindByID(id); err != nil {
		return nil, err
	}
	j.ID = id
	if err := r.db.Updates(j).Error; err != nil {
		return nil, err
	}
	return j, nil
}

func (r *jarhTadilRepo) DeleteByID(id *int) error {
	if _, err := r.FindByID(id); err != nil {
		return err
	}
	return r.db.Delete(&model.JarhTadil{}, id).Error
}
