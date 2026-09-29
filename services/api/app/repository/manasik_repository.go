package repository

import (
	"time"

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

type manasikRow struct {
	ID                int
	Type              model.ManasikType
	StepOrder         int
	Title             string
	Description       string
	Arabic            string
	Transliteration   string
	TranslationText   string
	Notes             string
	Source            string
	IsWajib           bool
	TranslationID     *int
	CreatedAt         *time.Time
	UpdatedAt         *time.Time
	DeletedAt         gorm.DeletedAt

	TrID        *int
	TrAr        *string
	TrEn        *string
	TrIdn       *string
	TrCreatedAt *time.Time
	TrUpdatedAt *time.Time
	TrDeletedAt gorm.DeletedAt
}

const manasikSelectSQL = `
	SELECT
		ms.id, ms.type, ms.step_order, ms.title, ms.description,
		ms.arabic, ms.transliteration, ms.translation AS translation_text,
		ms.notes, ms.source, ms.is_wajib, ms.translation_id,
		ms.created_at, ms.updated_at, ms.deleted_at,
		t.id AS tr_id, t.ar AS tr_ar, t.en AS tr_en, t.idn AS tr_idn,
		t.created_at AS tr_created_at, t.updated_at AS tr_updated_at, t.deleted_at AS tr_deleted_at
	FROM manasik_step ms
	LEFT JOIN translation t ON t.id = ms.translation_id
`

func (r *manasikRow) toModel() model.ManasikStep {
	m := model.ManasikStep{
		Type:            r.Type,
		StepOrder:       r.StepOrder,
		Title:           r.Title,
		Description:     r.Description,
		Arabic:          r.Arabic,
		Transliteration: r.Transliteration,
		TranslationText: r.TranslationText,
		Notes:           r.Notes,
		Source:          r.Source,
		IsWajib:         r.IsWajib,
		TranslationID:   r.TranslationID,
	}
	m.ID = &r.ID
	m.CreatedAt = r.CreatedAt
	m.UpdatedAt = r.UpdatedAt
	m.DeletedAt = r.DeletedAt

	if r.TrID != nil {
		m.Translation = &model.Translation{
			Ar:  r.TrAr,
			En:  r.TrEn,
			Idn: r.TrIdn,
		}
		m.Translation.ID = r.TrID
		m.Translation.CreatedAt = r.TrCreatedAt
		m.Translation.UpdatedAt = r.TrUpdatedAt
		m.Translation.DeletedAt = r.TrDeletedAt
	}
	return m
}

func (r *manasikRepository) FindAll(limit, offset int) ([]model.ManasikStep, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var rows []manasikRow
	err := r.db.Raw(manasikSelectSQL+`
		ORDER BY ms.type ASC, ms.step_order ASC
		LIMIT ? OFFSET ?
	`, limit, offset).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	res := make([]model.ManasikStep, len(rows))
	for i := range rows {
		res[i] = rows[i].toModel()
	}
	return res, nil
}

func (r *manasikRepository) FindByType(t model.ManasikType, limit, offset int) ([]model.ManasikStep, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var rows []manasikRow
	err := r.db.Raw(manasikSelectSQL+`
		WHERE ms.type = ?
		ORDER BY ms.step_order ASC
		LIMIT ? OFFSET ?
	`, t, limit, offset).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	res := make([]model.ManasikStep, len(rows))
	for i := range rows {
		res[i] = rows[i].toModel()
	}
	return res, nil
}

func (r *manasikRepository) FindByTypeAndStep(t model.ManasikType, step int) (*model.ManasikStep, error) {
	var row manasikRow
	err := r.db.Raw(manasikSelectSQL+`
		WHERE ms.type = ? AND ms.step_order = ?
		LIMIT 1
	`, t, step).Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.ID == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	m := row.toModel()
	return &m, nil
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
	var row manasikRow
	err := r.db.Raw(manasikSelectSQL+`
		WHERE ms.id = ?
		LIMIT 1
	`, id).Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.ID == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	m := row.toModel()
	return &m, nil
}