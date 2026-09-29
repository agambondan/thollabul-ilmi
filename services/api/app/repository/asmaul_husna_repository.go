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

const asmaUlHusnaSelectCols = `
SELECT
    a.id, a.created_at, a.updated_at, a.number,
    a.arabic, a.transliteration, a.indonesian, a.english,
    a.meaning, a.source, a.audio_url, a.translation_id,
    t.id as t_id, t.idn as t_idn, t.en as t_en, t.ar as t_ar
FROM asma_ul_husna a
LEFT JOIN translation t ON t.id = a.translation_id
`

func scanAsmaUlHusnaRow(scanner interface{ Scan(...interface{}) error }) (model.AsmaUlHusna, error) {
	var a model.AsmaUlHusna
	var tID *int
	var tIdn, tEn, tAr *string
	err := scanner.Scan(
		&a.ID, &a.CreatedAt, &a.UpdatedAt, &a.Number,
		&a.Arabic, &a.Transliteration, &a.Indonesian, &a.English,
		&a.Meaning, &a.Source, &a.AudioURL, &a.TranslationID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return a, err
	}
	if tID != nil {
		a.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}
	return a, nil
}

func (r *asmaUlHusnaRepo) FindAll(limit, offset int) ([]model.AsmaUlHusna, error) {
	if limit <= 0 {
		limit = 99
	}
	if offset < 0 {
		offset = 0
	}
	query := asmaUlHusnaSelectCols + " ORDER BY a.number ASC LIMIT ? OFFSET ?"
	rows, err := r.db.Raw(query, limit, offset).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.AsmaUlHusna
	for rows.Next() {
		item, err := scanAsmaUlHusnaRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}

func (r *asmaUlHusnaRepo) FindByNumber(number int) (*model.AsmaUlHusna, error) {
	query := asmaUlHusnaSelectCols + " WHERE a.number = ? LIMIT 1"
	rows, err := r.db.Raw(query, number).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, gorm.ErrRecordNotFound
	}
	a, err := scanAsmaUlHusnaRow(rows)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *asmaUlHusnaRepo) FindByID(id int) (*model.AsmaUlHusna, error) {
	query := asmaUlHusnaSelectCols + " WHERE a.id = ? LIMIT 1"
	rows, err := r.db.Raw(query, id).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, gorm.ErrRecordNotFound
	}
	a, err := scanAsmaUlHusnaRow(rows)
	if err != nil {
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
