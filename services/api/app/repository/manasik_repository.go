package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type ManasikRepository interface {
	FindAll(limit, offset int) ([]model.ManasikStep, error)
	FindByType(t model.ManasikType, limit, offset int) ([]model.ManasikStep, error)
	FindByTypeAndStep(t model.ManasikType, step int) (*model.ManasikStep, error)
	Create(step *model.ManasikStep) (*model.ManasikStep, error)
	Update(id int, step *model.ManasikStep) (*model.ManasikStep, error)
	Delete(id int) error
}

type manasikRepository struct{ db *gorm.DB }

func NewManasikRepository(db *gorm.DB) ManasikRepository {
	return &manasikRepository{db}
}

func (r *manasikRepository) FindAll(limit, offset int) ([]model.ManasikStep, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var steps []model.ManasikStep
	return steps, r.db.Preload("Translation").Order("type ASC, step_order ASC").Limit(limit).Offset(offset).Find(&steps).Error
}

func (r *manasikRepository) FindByType(t model.ManasikType, limit, offset int) ([]model.ManasikStep, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var steps []model.ManasikStep
	return steps, r.db.Preload("Translation").Where("type = ?", t).Order("step_order ASC").Limit(limit).Offset(offset).Find(&steps).Error
}

func (r *manasikRepository) FindByTypeAndStep(t model.ManasikType, step int) (*model.ManasikStep, error) {
	var s model.ManasikStep
	return &s, r.db.Preload("Translation").Where("type = ? AND step_order = ?", t, step).First(&s).Error
}

func (r *manasikRepository) Create(step *model.ManasikStep) (*model.ManasikStep, error) {
	trID, err := upsertContentTranslation(r.db, nil, step.Title, step.Arabic, step.Transliteration, step.TranslationText)
	if err != nil {
		return nil, err
	}
	step.TranslationID = trID
	if err := r.db.Create(step).Error; err != nil {
		return nil, err
	}
	return r.findByID(*step.ID)
}

func (r *manasikRepository) Update(id int, step *model.ManasikStep) (*model.ManasikStep, error) {
	var existing model.ManasikStep
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	trID, err := upsertContentTranslation(r.db, existing.TranslationID, step.Title, step.Arabic, step.Transliteration, step.TranslationText)
	if err != nil {
		return nil, err
	}
	updates := map[string]interface{}{
		"type":            step.Type,
		"step_order":      step.StepOrder,
		"title":           step.Title,
		"description":     step.Description,
		"arabic":          step.Arabic,
		"transliteration": step.Transliteration,
		"translation":     step.TranslationText,
		"notes":           step.Notes,
		"source":          step.Source,
		"is_wajib":        step.IsWajib,
		"translation_id":  trID,
	}
	if err := r.db.Model(&existing).Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.findByID(id)
}

func (r *manasikRepository) Delete(id int) error {
	return r.db.Delete(&model.ManasikStep{}, id).Error
}

func (r *manasikRepository) findByID(id int) (*model.ManasikStep, error) {
	var step model.ManasikStep
	return &step, r.db.Preload("Translation").First(&step, id).Error
}
