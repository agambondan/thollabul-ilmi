package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type AsmaUlHusnaRepository interface {
	FindAll(limit, offset int) ([]model.AsmaUlHusna, error)
	FindByNumber(int) (*model.AsmaUlHusna, error)
	FindByID(int) (*model.AsmaUlHusna, error)
	Create(*model.AsmaUlHusna) (*model.AsmaUlHusna, error)
	Update(int, *model.AsmaUlHusna) (*model.AsmaUlHusna, error)
	Delete(int) error
}

type asmaUlHusnaRepo struct {
	db *gorm.DB
}

func NewAsmaUlHusnaRepository(db *gorm.DB) AsmaUlHusnaRepository {
	return &asmaUlHusnaRepo{db}
}

func (r *asmaUlHusnaRepo) FindAll(limit, offset int) ([]model.AsmaUlHusna, error) {
	if limit <= 0 {
		limit = 99
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.AsmaUlHusna
	err := r.db.Preload("Translation").Order("number asc").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *asmaUlHusnaRepo) FindByNumber(number int) (*model.AsmaUlHusna, error) {
	var a model.AsmaUlHusna
	if err := r.db.Preload("Translation").Where("number = ?", number).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *asmaUlHusnaRepo) FindByID(id int) (*model.AsmaUlHusna, error) {
	var a model.AsmaUlHusna
	if err := r.db.Preload("Translation").First(&a, id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *asmaUlHusnaRepo) Create(a *model.AsmaUlHusna) (*model.AsmaUlHusna, error) {
	trID, err := upsertContentTranslation(r.db, nil, a.Indonesian, a.Arabic, a.Transliteration, a.Meaning)
	if err != nil {
		return nil, err
	}
	a.TranslationID = trID
	if err := r.db.Create(a).Error; err != nil {
		return nil, err
	}
	return r.FindByID(*a.ID)
}

func (r *asmaUlHusnaRepo) Update(id int, a *model.AsmaUlHusna) (*model.AsmaUlHusna, error) {
	var existing model.AsmaUlHusna
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	trID, err := upsertContentTranslation(r.db, existing.TranslationID, a.Indonesian, a.Arabic, a.Transliteration, a.Meaning)
	if err != nil {
		return nil, err
	}
	if err := r.db.Model(&existing).Updates(map[string]interface{}{
		"number":          a.Number,
		"arabic":          a.Arabic,
		"transliteration": a.Transliteration,
		"indonesian":      a.Indonesian,
		"english":         a.English,
		"meaning":         a.Meaning,
		"source":          a.Source,
		"audio_url":       a.AudioURL,
		"translation_id":  trID,
	}).Error; err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *asmaUlHusnaRepo) Delete(id int) error {
	return r.db.Delete(&model.AsmaUlHusna{}, id).Error
}
