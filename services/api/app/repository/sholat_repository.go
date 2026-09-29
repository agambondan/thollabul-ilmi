package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SholatRepository interface {
	Upsert(log *model.SholatLog) (*model.SholatLog, error)
	FindByUserIDAndDate(userID uuid.UUID, date string) ([]model.SholatLog, error)
	FindByUserIDDateRange(userID uuid.UUID, from, to string) ([]model.SholatLog, error)
	FindAllGuides() ([]model.SholatGuide, error)
	FindGuideByStep(step int) (*model.SholatGuide, error)
	FindGuideByID(id int) (*model.SholatGuide, error)
	CreateGuide(guide *model.SholatGuide) (*model.SholatGuide, error)
	UpdateGuide(id int, guide *model.SholatGuide) (*model.SholatGuide, error)
	DeleteGuide(id int) error
}

type sholatRepository struct {
	db *gorm.DB
}

func NewSholatRepository(db *gorm.DB) SholatRepository {
	return &sholatRepository{db}
}

func (r *sholatRepository) Upsert(log *model.SholatLog) (*model.SholatLog, error) {
	err := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "date"}, {Name: "prayer"}},
		DoUpdates: clause.AssignmentColumns([]string{"status"}),
	}).Create(log).Error
	if err != nil {
		return nil, err
	}
	var result model.SholatLog
	r.db.Where("user_id = ? AND date = ? AND prayer = ?", log.UserID, log.Date, log.Prayer).First(&result)
	return &result, nil
}

func (r *sholatRepository) FindByUserIDAndDate(userID uuid.UUID, date string) ([]model.SholatLog, error) {
	var list []model.SholatLog
	err := r.db.Where("user_id = ? AND date = ?", userID, date).Find(&list).Error
	return list, err
}

func (r *sholatRepository) FindByUserIDDateRange(userID uuid.UUID, from, to string) ([]model.SholatLog, error) {
	var list []model.SholatLog
	q := r.db.Where("user_id = ?", userID)
	if from != "" {
		q = q.Where("date >= ?", from)
	}
	if to != "" {
		q = q.Where("date <= ?", to)
	}
	err := q.Order("date DESC, prayer").Limit(400).Find(&list).Error
	return list, err
}

const sholatGuideSelectSQL = `
SELECT
    sg.id, sg.created_at, sg.updated_at, sg.step,
    sg.title, sg.arabic, sg.transliteration, sg.translation as translation_text,
    sg.description, sg.source, sg.notes, sg.translation_id,
    t.id as t_id, t.idn as t_idn, t.en as t_en, t.ar as t_ar
FROM sholat_guide sg
LEFT JOIN translation t ON t.id = sg.translation_id
ORDER BY sg.step
`

func (r *sholatRepository) FindAllGuides() ([]model.SholatGuide, error) {
	var results []model.SholatGuide
	rows, err := r.db.Raw(sholatGuideSelectSQL).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var g model.SholatGuide
		var tID *int
		var tIdn, tEn, tAr *string
		if err := rows.Scan(
			&g.ID, &g.CreatedAt, &g.UpdatedAt, &g.Step,
			&g.Title, &g.Arabic, &g.Transliteration, &g.TranslationText,
			&g.Description, &g.Source, &g.Notes, &g.TranslationID,
			&tID, &tIdn, &tEn, &tAr,
		); err != nil {
			return nil, err
		}
		if tID != nil {
			g.Translation = &model.Translation{
				BaseID: model.BaseID{ID: tID},
				Idn:    tIdn,
				En:     tEn,
				Ar:     tAr,
			}
		}
		results = append(results, g)
	}
	return results, rows.Err()
}

const sholatGuideByStepSQL = `
SELECT
    sg.id, sg.created_at, sg.updated_at, sg.step,
    sg.title, sg.arabic, sg.transliteration, sg.translation as translation_text,
    sg.description, sg.source, sg.notes, sg.translation_id,
    t.id as t_id, t.idn as t_idn, t.en as t_en, t.ar as t_ar
FROM sholat_guide sg
LEFT JOIN translation t ON t.id = sg.translation_id
WHERE sg.step = ?
`

func (r *sholatRepository) FindGuideByStep(step int) (*model.SholatGuide, error) {
	rows, err := r.db.Raw(sholatGuideByStepSQL, step).Rows()
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
	var g model.SholatGuide
	var tID *int
	var tIdn, tEn, tAr *string
	if err := rows.Scan(
		&g.ID, &g.CreatedAt, &g.UpdatedAt, &g.Step,
		&g.Title, &g.Arabic, &g.Transliteration, &g.TranslationText,
		&g.Description, &g.Source, &g.Notes, &g.TranslationID,
		&tID, &tIdn, &tEn, &tAr,
	); err != nil {
		return nil, err
	}
	if tID != nil {
		g.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}
	return &g, nil
}

const sholatGuideByIDSQL = `
SELECT
    sg.id, sg.created_at, sg.updated_at, sg.step,
    sg.title, sg.arabic, sg.transliteration, sg.translation as translation_text,
    sg.description, sg.source, sg.notes, sg.translation_id,
    t.id as t_id, t.idn as t_idn, t.en as t_en, t.ar as t_ar
FROM sholat_guide sg
LEFT JOIN translation t ON t.id = sg.translation_id
WHERE sg.id = ?
`

func (r *sholatRepository) FindGuideByID(id int) (*model.SholatGuide, error) {
	rows, err := r.db.Raw(sholatGuideByIDSQL, id).Rows()
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
	var g model.SholatGuide
	var tID *int
	var tIdn, tEn, tAr *string
	if err := rows.Scan(
		&g.ID, &g.CreatedAt, &g.UpdatedAt, &g.Step,
		&g.Title, &g.Arabic, &g.Transliteration, &g.TranslationText,
		&g.Description, &g.Source, &g.Notes, &g.TranslationID,
		&tID, &tIdn, &tEn, &tAr,
	); err != nil {
		return nil, err
	}
	if tID != nil {
		g.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}
	return &g, nil
}

func (r *sholatRepository) CreateGuide(guide *model.SholatGuide) (*model.SholatGuide, error) {
	trID, err := upsertContentTranslation(r.db, nil, guide.Title, guide.Arabic, guide.Transliteration, guide.TranslationText)
	if err != nil {
		return nil, err
	}
	guide.TranslationID = trID
	if err := r.db.Create(guide).Error; err != nil {
		return nil, err
	}
	return r.FindGuideByID(*guide.ID)
}

func (r *sholatRepository) UpdateGuide(id int, guide *model.SholatGuide) (*model.SholatGuide, error) {
	var existing model.SholatGuide
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	trID, err := upsertContentTranslation(r.db, existing.TranslationID, guide.Title, guide.Arabic, guide.Transliteration, guide.TranslationText)
	if err != nil {
		return nil, err
	}
	updates := map[string]interface{}{
		"step":            guide.Step,
		"title":           guide.Title,
		"description":     guide.Description,
		"arabic":          guide.Arabic,
		"transliteration": guide.Transliteration,
		"translation":     guide.TranslationText,
		"notes":           guide.Notes,
		"source":          guide.Source,
		"translation_id":  trID,
	}
	if err := r.db.Model(&existing).Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.FindGuideByID(id)
}

func (r *sholatRepository) DeleteGuide(id int) error {
	return r.db.Delete(&model.SholatGuide{}, id).Error
}