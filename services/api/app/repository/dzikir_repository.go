package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type DzikirRepository interface {
	FindAll(limit, offset int) ([]model.Dzikir, error)
	FindByID(id int) (*model.Dzikir, error)
	FindByCategory(category model.DzikirCategory, limit, offset int) ([]model.Dzikir, error)
	FindByOccasion(occasion string, limit, offset int) ([]model.Dzikir, error)
	Create(d *model.Dzikir) (*model.Dzikir, error)
	Update(id int, d *model.Dzikir) (*model.Dzikir, error)
	Delete(id int) error
}

type dzikirRepository struct {
	db *gorm.DB
}

func NewDzikirRepository(db *gorm.DB) DzikirRepository {
	return &dzikirRepository{db}
}

func (r *dzikirRepository) FindAll(limit, offset int) ([]model.Dzikir, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.Dzikir
	err := r.db.Joins("Translation").Order("category, id").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *dzikirRepository) FindByID(id int) (*model.Dzikir, error) {
	var d model.Dzikir
	err := r.db.Joins("Translation").First(&d, id).Error
	return &d, err
}

func (r *dzikirRepository) FindByCategory(category model.DzikirCategory, limit, offset int) ([]model.Dzikir, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.Dzikir
	err := r.db.Joins("Translation").Where("category = ?", category).Order("id").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *dzikirRepository) FindByOccasion(occasion string, limit, offset int) ([]model.Dzikir, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.Dzikir
	err := r.db.Joins("Translation").Where("dzikir.occasion = ?", occasion).Order("dzikir.id").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *dzikirRepository) Create(d *model.Dzikir) (*model.Dzikir, error) {
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

func (r *dzikirRepository) Update(id int, d *model.Dzikir) (*model.Dzikir, error) {
	var existing model.Dzikir
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	trID, err := upsertContentTranslation(r.db, existing.TranslationID, d.Title, d.Arabic, d.Transliteration, d.TranslationText)
	if err != nil {
		return nil, err
	}
	updates := map[string]interface{}{
		"category":        d.Category,
		"occasion":        d.Occasion,
		"title":           d.Title,
		"arabic":          d.Arabic,
		"transliteration": d.Transliteration,
		"translation":     d.TranslationText,
		"count":           d.Count,
		"fadhilah":        d.Fadhilah,
		"fadhilah_idn":    d.FadhilahIdn,
		"fadhilah_en":     d.FadhilahEn,
		"source":          d.Source,
		"audio_url":       d.AudioURL,
		"translation_id":  trID,
	}
	if err := r.db.Model(&existing).Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *dzikirRepository) Delete(id int) error {
	return r.db.Delete(&model.Dzikir{}, id).Error
}
