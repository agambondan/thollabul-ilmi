package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type TokohTarikhRepository interface {
	Save(*model.TokohTarikh) (*model.TokohTarikh, error)
	FindAll(search, era, kategori string, limit, offset int) ([]model.TokohTarikh, int64, error)
	FindByID(int) (*model.TokohTarikh, error)
	Delete(int) error
}

type tokohTarikhRepo struct{ db *gorm.DB }

func NewTokohTarikhRepository(db *gorm.DB) TokohTarikhRepository { return &tokohTarikhRepo{db} }

func (r *tokohTarikhRepo) Save(t *model.TokohTarikh) (*model.TokohTarikh, error) {
	if err := r.db.Create(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (r *tokohTarikhRepo) FindAll(search, era, kategori string, limit, offset int) ([]model.TokohTarikh, int64, error) {
	var list []model.TokohTarikh
	var total int64
	query := r.db.Model(&model.TokohTarikh{}).Preload("Translation")
	if search != "" {
		q := "%" + search + "%"
		query = query.Where("nama ILIKE ? OR biografi ILIKE ?", q, q)
	}
	if era != "" {
		query = query.Where("era = ?", era)
	}
	if kategori != "" {
		query = query.Where("kategori = ?", kategori)
	}
	query.Count(&total)
	err := query.Order("id asc").Offset(offset).Limit(limit).Find(&list).Error
	return list, total, err
}

func (r *tokohTarikhRepo) FindByID(id int) (*model.TokohTarikh, error) {
	var t model.TokohTarikh
	err := r.db.Preload("Translation").First(&t, id).Error
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *tokohTarikhRepo) Delete(id int) error {
	return r.db.Delete(&model.TokohTarikh{}, id).Error
}
