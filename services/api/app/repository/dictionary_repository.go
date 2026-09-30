package repository

import (
	"database/sql"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DictionaryRepository interface {
	FindAll(category string, search string) ([]model.IslamicTerm, error)
	FindByTerm(term string) (*model.IslamicTerm, error)
	FindByCategory(category model.TermCategory) ([]model.IslamicTerm, error)
	FindByID(id int) (*model.IslamicTerm, error)
	Create(t *model.IslamicTerm) (*model.IslamicTerm, error)
	Update(id int, t *model.IslamicTerm) (*model.IslamicTerm, error)
	Delete(id int) error
}

type dictionaryRepository struct{ db *gorm.DB }

func NewDictionaryRepository(db *gorm.DB) DictionaryRepository {
	return &dictionaryRepository{db}
}

const islamicTermSelectCols = `
SELECT
    it.id, it.created_at, it.updated_at, it.term, it.category,
    it.definition, it.example, it.source, it.origin,
    it.arabic, it.latin, it.root, it.translation_id,
    t.id as t_id, t.idn as t_idn, t.en as t_en, t.ar as t_ar
FROM islamic_term it
LEFT JOIN translation t ON t.id = it.translation_id AND t.deleted_at IS NULL
`

func scanIslamicTermRow(scanner interface{ Scan(...interface{}) error }) (model.IslamicTerm, error) {
	var item model.IslamicTerm
	var tID *int
	var tIdn, tEn, tAr *string
	err := scanner.Scan(
		&item.ID, &item.CreatedAt, &item.UpdatedAt, &item.Term, &item.Category,
		&item.Definition, &item.Example, &item.Source, &item.Origin,
		&item.Arabic, &item.Latin, &item.Root, &item.TranslationID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return item, err
	}
	if tID != nil {
		item.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}
	return item, nil
}

func scanIslamicTermRows(rows *sql.Rows) ([]model.IslamicTerm, error) {
	var items []model.IslamicTerm
	for rows.Next() {
		item, err := scanIslamicTermRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r *dictionaryRepository) FindAll(category string, search string) ([]model.IslamicTerm, error) {
	query := islamicTermSelectCols + " WHERE it.deleted_at IS NULL"
	var args []interface{}

	if category != "" {
		query += " AND it.category = ?"
		args = append(args, category)
	}
	if search != "" {
		pattern := "%" + search + "%"
		query += " AND (it.term LIKE ? OR it.definition LIKE ?)"
		args = append(args, pattern, pattern)
	}
	query += " ORDER BY it.term ASC LIMIT 500"

	rows, err := r.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanIslamicTermRows(rows)
}

func (r *dictionaryRepository) FindByTerm(term string) (*model.IslamicTerm, error) {
	query := islamicTermSelectCols + " WHERE it.term LIKE ? AND it.deleted_at IS NULL ORDER BY it.id ASC LIMIT 1"
	rows, err := r.db.Raw(query, term).Rows()
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
	item, err := scanIslamicTermRow(rows)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *dictionaryRepository) FindByCategory(category model.TermCategory) ([]model.IslamicTerm, error) {
	query := islamicTermSelectCols + " WHERE it.category = ? AND it.deleted_at IS NULL ORDER BY it.term ASC LIMIT 200"
	rows, err := r.db.Raw(query, category).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanIslamicTermRows(rows)
}

func (r *dictionaryRepository) FindByID(id int) (*model.IslamicTerm, error) {
	query := islamicTermSelectCols + " WHERE it.id = ? AND it.deleted_at IS NULL"
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
	item, err := scanIslamicTermRow(rows)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *dictionaryRepository) Create(t *model.IslamicTerm) (*model.IslamicTerm, error) {
	return t, r.db.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "term"}}, DoUpdates: clause.AssignmentColumns([]string{"category", "definition", "example", "source", "origin"})}).Create(t).Error
}

func (r *dictionaryRepository) Update(id int, t *model.IslamicTerm) (*model.IslamicTerm, error) {
	return t, r.db.Model(&model.IslamicTerm{}).Where("id = ?", id).Updates(t).Error
}

func (r *dictionaryRepository) Delete(id int) error {
	return r.db.Delete(&model.IslamicTerm{}, id).Error
}
