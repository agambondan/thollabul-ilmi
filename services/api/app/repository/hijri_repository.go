package repository

import (
	"database/sql"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IslamicEventRepository interface {
	FindAll(category string) ([]model.IslamicEvent, error)
	FindByMonth(month int) ([]model.IslamicEvent, error)
	FindByID(id int) (*model.IslamicEvent, error)
	Create(e *model.IslamicEvent) (*model.IslamicEvent, error)
	Delete(id int) error
}

type islamicEventRepository struct{ db *gorm.DB }

func NewIslamicEventRepository(db *gorm.DB) IslamicEventRepository {
	return &islamicEventRepository{db}
}

const islamicEventSelectCols = `
SELECT
    ie.id, ie.created_at, ie.updated_at, ie.name, ie.hijri_month, ie.hijri_day,
    ie.description, ie.category, ie.translation_id,
    t.id as t_id, t.idn as t_idn, t.en as t_en, t.ar as t_ar
FROM islamic_event ie
LEFT JOIN translation t ON t.id = ie.translation_id AND t.deleted_at IS NULL
`

func scanIslamicEventRow(scanner interface{ Scan(...interface{}) error }) (model.IslamicEvent, error) {
	var e model.IslamicEvent
	var tID *int
	var tIdn, tEn, tAr *string
	err := scanner.Scan(
		&e.ID, &e.CreatedAt, &e.UpdatedAt, &e.Name, &e.HijriMonth, &e.HijriDay,
		&e.Description, &e.Category, &e.TranslationID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return e, err
	}
	if tID != nil {
		e.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}
	return e, nil
}

func scanIslamicEventRows(rows *sql.Rows) ([]model.IslamicEvent, error) {
	var items []model.IslamicEvent
	for rows.Next() {
		item, err := scanIslamicEventRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *islamicEventRepository) FindAll(category string) ([]model.IslamicEvent, error) {
	query := islamicEventSelectCols + " WHERE ie.deleted_at IS NULL"
	var args []interface{}
	if category != "" {
		query += " AND ie.category = ?"
		args = append(args, category)
	}
	query += " ORDER BY ie.hijri_month ASC, ie.hijri_day ASC"

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanIslamicEventRows(rows)
}

func (r *islamicEventRepository) FindByMonth(month int) ([]model.IslamicEvent, error) {
	query := islamicEventSelectCols + " WHERE ie.hijri_month = ? AND ie.deleted_at IS NULL ORDER BY ie.hijri_day ASC"
	rows, err := r.db.Raw(query, month).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanIslamicEventRows(rows)
}

func (r *islamicEventRepository) FindByID(id int) (*model.IslamicEvent, error) {
	query := islamicEventSelectCols + " WHERE ie.id = ? AND ie.deleted_at IS NULL LIMIT 1"
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
	item, err := scanIslamicEventRow(rows)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *islamicEventRepository) Create(e *model.IslamicEvent) (*model.IslamicEvent, error) {
	return e, r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(e).Error
}

func (r *islamicEventRepository) Delete(id int) error {
	return r.db.Delete(&model.IslamicEvent{}, id).Error
}
