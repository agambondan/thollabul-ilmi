package repository

import (
	"database/sql"
	"strings"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type HistoryRepository interface {
	FindAll(category string, yearFrom, yearTo, limit, offset int) ([]model.HistoryEvent, error)
	FindByID(id int) (*model.HistoryEvent, error)
	FindBySlug(slug string) (*model.HistoryEvent, error)
	Create(e *model.HistoryEvent) (*model.HistoryEvent, error)
	Update(id int, e *model.HistoryEvent) (*model.HistoryEvent, error)
	Delete(id int) error
}

type historyRepository struct{ db *gorm.DB }

func NewHistoryRepository(db *gorm.DB) HistoryRepository {
	return &historyRepository{db}
}

const historySelectSQL = `
	SELECT
		h.id, h.year_hijri, h.year_miladi, h.title, h.slug, h.description, h.category, h.is_significant, h.source, h.translation_id,
		t.id, t.idn, t.en, t.ar
	FROM history_event h
	LEFT JOIN translation t ON t.id = h.translation_id AND t.deleted_at IS NULL
`

func scanHistoryEventRow(rows *sql.Rows) (*model.HistoryEvent, error) {
	var (
		h                            model.HistoryEvent
		hID, hYearHijri, hYearMiladi *int
		hTitle, hSlug, hDesc, hCat   *string
		hIsSig                       *bool
		hSource                      *string
		hTransID                     *int
		tID                          *int
		tIdn, tEn, tAr               *string
	)

	err := rows.Scan(
		&hID, &hYearHijri, &hYearMiladi, &hTitle, &hSlug, &hDesc, &hCat, &hIsSig, &hSource, &hTransID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return nil, err
	}

	h.BaseID = model.BaseID{ID: hID}
	if hYearHijri != nil {
		h.YearHijri = *hYearHijri
	}
	if hYearMiladi != nil {
		h.YearMiladi = *hYearMiladi
	}
	if hTitle != nil {
		h.Title = *hTitle
	}
	if hSlug != nil {
		h.Slug = *hSlug
	}
	if hDesc != nil {
		h.Description = *hDesc
	}
	if hCat != nil {
		h.Category = model.HistoryCategory(*hCat)
	}
	if hIsSig != nil {
		h.IsSignificant = *hIsSig
	}
	if hSource != nil {
		h.Source = *hSource
	}
	h.TranslationID = hTransID

	if tID != nil {
		h.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}

	return &h, nil
}

func (r *historyRepository) FindAll(category string, yearFrom, yearTo, limit, offset int) ([]model.HistoryEvent, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	query := historySelectSQL
	conditions := []string{"h.deleted_at IS NULL"}
	var args []interface{}

	if category != "" {
		conditions = append(conditions, "h.category = ?")
		args = append(args, category)
	}
	if yearFrom > 0 {
		conditions = append(conditions, "h.year_miladi >= ?")
		args = append(args, yearFrom)
	}
	if yearTo > 0 {
		conditions = append(conditions, "h.year_miladi <= ?")
		args = append(args, yearTo)
	}

	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY h.year_miladi ASC LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.HistoryEvent
	for rows.Next() {
		item, err := scanHistoryEventRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *item)
	}
	return items, rows.Err()
}

func (r *historyRepository) FindByID(id int) (*model.HistoryEvent, error) {
	rows, err := r.db.Raw(historySelectSQL+" WHERE h.deleted_at IS NULL AND h.id = ?", id).Rows()
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
	return scanHistoryEventRow(rows)
}

func (r *historyRepository) FindBySlug(slug string) (*model.HistoryEvent, error) {
	rows, err := r.db.Raw(historySelectSQL+" WHERE h.deleted_at IS NULL AND h.slug = ?", slug).Rows()
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
	return scanHistoryEventRow(rows)
}

func (r *historyRepository) Create(e *model.HistoryEvent) (*model.HistoryEvent, error) {
	var saved *model.HistoryEvent
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var existing model.HistoryEvent
		err := tx.Where("slug = ?", e.Slug).First(&existing).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			return err
		}

		var existingTranslationID *int
		if err == nil {
			existingTranslationID = existing.TranslationID
			e.ID = existing.ID
		}

		trID, err := upsertContentTranslation(tx, existingTranslationID, e.Title, "", "", e.Description)
		if err != nil {
			return err
		}
		e.TranslationID = trID

		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "description", "year_hijri", "year_miladi", "category", "is_significant", "translation_id"}),
		}).Create(e).Error; err != nil {
			return err
		}
		savedItem, err := r.FindBySlug(e.Slug)
		if err != nil {
			return err
		}
		saved = savedItem
		return nil
	})
	return saved, err
}

func (r *historyRepository) Update(id int, e *model.HistoryEvent) (*model.HistoryEvent, error) {
	var saved *model.HistoryEvent
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var existing model.HistoryEvent
		if err := tx.First(&existing, id).Error; err != nil {
			return err
		}

		trID, err := upsertContentTranslation(tx, existing.TranslationID, e.Title, "", "", e.Description)
		if err != nil {
			return err
		}

		if err := tx.Model(&existing).Updates(map[string]interface{}{
			"year_hijri":     e.YearHijri,
			"year_miladi":    e.YearMiladi,
			"title":          e.Title,
			"slug":           e.Slug,
			"description":    e.Description,
			"category":       e.Category,
			"is_significant": e.IsSignificant,
			"translation_id": trID,
		}).Error; err != nil {
			return err
		}
		savedItem, err := r.FindByID(id)
		if err != nil {
			return err
		}
		saved = savedItem
		return nil
	})
	return saved, err
}

func (r *historyRepository) Delete(id int) error {
	return r.db.Delete(&model.HistoryEvent{}, id).Error
}
