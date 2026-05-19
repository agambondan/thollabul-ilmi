package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type DoaRepository interface {
	FindAll(limit, offset int) ([]model.Doa, error)
	FindByID(int) (*model.Doa, error)
	FindByCategory(model.DoaCategory, int, int) ([]model.Doa, error)
	Create(*model.Doa) (*model.Doa, error)
	Update(int, *model.Doa) (*model.Doa, error)
	Delete(int) error
}

type doaRepo struct {
	db *gorm.DB
}

func NewDoaRepository(db *gorm.DB) DoaRepository {
	return &doaRepo{db}
}

func (r *doaRepo) FindAll(limit, offset int) ([]model.Doa, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.Doa
	err := r.db.Joins("Translation").Order("category, id").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *doaRepo) FindByID(id int) (*model.Doa, error) {
	var d model.Doa
	if err := r.db.Joins("Translation").First(&d, id).Error; err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *doaRepo) FindByCategory(category model.DoaCategory, limit, offset int) ([]model.Doa, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.Doa
	err := r.db.Joins("Translation").Where("category = ?", category).Order("id").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *doaRepo) Create(d *model.Doa) (*model.Doa, error) {
	trID, err := upsertContentTranslation(r.db, nil, d.Title, d.Arabic, d.Transliteration, d.TranslationText)
	if err != nil {
		return nil, err
	}
	d.TranslationID = trID
	if err := r.db.Create(d).Error; err != nil {
		return nil, err
	}
	return r.FindByID(*d.ID)
}

func (r *doaRepo) Update(id int, d *model.Doa) (*model.Doa, error) {
	var existing model.Doa
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	trID, err := upsertContentTranslation(r.db, existing.TranslationID, d.Title, d.Arabic, d.Transliteration, d.TranslationText)
	if err != nil {
		return nil, err
	}
	if err := r.db.Model(&existing).Updates(map[string]interface{}{
		"category":        d.Category,
		"title":           d.Title,
		"arabic":          d.Arabic,
		"transliteration": d.Transliteration,
		"translation":     d.TranslationText,
		"source":          d.Source,
		"audio_url":       d.AudioURL,
		"translation_id":  trID,
	}).Error; err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *doaRepo) Delete(id int) error {
	return r.db.Delete(&model.Doa{}, id).Error
}
