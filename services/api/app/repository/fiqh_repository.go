package repository

import (
	"database/sql"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type FiqhRepository interface {
	FindAllCategories(limit, offset int) ([]model.FiqhCategory, error)
	FindAllItems(limit, offset int) ([]model.FiqhItem, error)
	FindCategoryBySlug(slug string, limit, offset int) (*model.FiqhCategory, error)
	FindItemBySlug(slug string) (*model.FiqhItem, error)
	FindItemByCategoryAndID(slug string, id int) (*model.FiqhItem, error)
	CreateCategory(cat *model.FiqhCategory) (*model.FiqhCategory, error)
	UpdateCategory(id int, cat *model.FiqhCategory) (*model.FiqhCategory, error)
	DeleteCategory(id int) error
	CreateItem(item *model.FiqhItem) (*model.FiqhItem, error)
	UpdateItem(id int, item *model.FiqhItem) (*model.FiqhItem, error)
	DeleteItem(id int) error
}

type fiqhRepository struct {
	db *gorm.DB
}

func NewFiqhRepository(db *gorm.DB) FiqhRepository {
	return &fiqhRepository{db}
}

const fiqhCategorySelectSQL = `
	SELECT
		fc.id, fc.name, fc.slug, fc.description, fc.translation_id,
		t.id, t.idn, t.en, t.ar
	FROM fiqh_category fc
	LEFT JOIN translation t ON t.id = fc.translation_id AND t.deleted_at IS NULL
`

const fiqhItemWithCategorySelectSQL = `
	SELECT
		fi.id, fi.category_id, fi.title, fi.slug, fi.content, fi.source, fi.dalil, fi.sort_order, fi.translation_id,
		fit.id, fit.idn, fit.en, fit.ar,
		fc.id, fc.name, fc.slug, fc.description, fc.translation_id
	FROM fiqh_item fi
	LEFT JOIN translation fit ON fit.id = fi.translation_id AND fit.deleted_at IS NULL
	LEFT JOIN fiqh_category fc ON fc.id = fi.category_id AND fc.deleted_at IS NULL
`

const fiqhItemSelectSQL = `
	SELECT
		fi.id, fi.category_id, fi.title, fi.slug, fi.content, fi.source, fi.dalil, fi.sort_order, fi.translation_id,
		fit.id, fit.idn, fit.en, fit.ar
	FROM fiqh_item fi
	LEFT JOIN translation fit ON fit.id = fi.translation_id AND fit.deleted_at IS NULL
`

func scanFiqhCategoryRow(rows *sql.Rows) (*model.FiqhCategory, error) {
	var (
		fc                     model.FiqhCategory
		fcID, fcTransID        *int
		fcName, fcSlug, fcDesc *string
		tID                    *int
		tIdn, tEn, tAr         *string
	)

	err := rows.Scan(
		&fcID, &fcName, &fcSlug, &fcDesc, &fcTransID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return nil, err
	}

	fc.BaseID = model.BaseID{ID: fcID}
	if fcName != nil {
		fc.Name = *fcName
	}
	if fcSlug != nil {
		fc.Slug = *fcSlug
	}
	if fcDesc != nil {
		fc.Description = *fcDesc
	}
	fc.TranslationID = fcTransID

	if tID != nil {
		fc.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}

	return &fc, nil
}

func scanFiqhItemRow(rows *sql.Rows, includeCategory bool) (*model.FiqhItem, error) {
	var (
		fi                                            model.FiqhItem
		fiID, fiCatID, fiTransID                      *int
		fiTitle, fiSlug, fiContent, fiSource, fiDalil *string
		fiSortOrder                                   *int
		tID                                           *int
		tIdn, tEn, tAr                                *string
		fcID, fcTransID                               *int
		fcName, fcSlug, fcDesc                        *string
	)

	var scanTargets []interface{}
	scanTargets = append(scanTargets,
		&fiID, &fiCatID, &fiTitle, &fiSlug, &fiContent, &fiSource, &fiDalil, &fiSortOrder, &fiTransID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if includeCategory {
		scanTargets = append(scanTargets, &fcID, &fcName, &fcSlug, &fcDesc, &fcTransID)
	}

	err := rows.Scan(scanTargets...)
	if err != nil {
		return nil, err
	}

	fi.BaseID = model.BaseID{ID: fiID}
	fi.CategoryID = fiCatID
	if fiTitle != nil {
		fi.Title = *fiTitle
	}
	if fiSlug != nil {
		fi.Slug = *fiSlug
	}
	if fiContent != nil {
		fi.Content = *fiContent
	}
	if fiSource != nil {
		fi.Source = *fiSource
	}
	if fiDalil != nil {
		fi.Dalil = *fiDalil
	}
	if fiSortOrder != nil {
		fi.SortOrder = *fiSortOrder
	}
	fi.TranslationID = fiTransID

	if fi.Dalil == "" {
		fi.Dalil = fi.Source
	}
	if fi.Source == "" {
		fi.Source = fi.Dalil
	}

	if tID != nil {
		fi.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}

	if includeCategory && fcID != nil {
		fi.Category = &model.FiqhCategory{
			BaseID:        model.BaseID{ID: fcID},
			TranslationID: fcTransID,
		}
		if fcName != nil {
			fi.Category.Name = *fcName
		}
		if fcSlug != nil {
			fi.Category.Slug = *fcSlug
		}
		if fcDesc != nil {
			fi.Category.Description = *fcDesc
		}
	}

	return &fi, nil
}

func (r *fiqhRepository) FindAllCategories(limit, offset int) ([]model.FiqhCategory, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	rows, err := r.db.Raw(fiqhCategorySelectSQL+" WHERE fc.deleted_at IS NULL ORDER BY fc.id ASC LIMIT ? OFFSET ?", limit, offset).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.FiqhCategory
	for rows.Next() {
		fc, err := scanFiqhCategoryRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *fc)
	}
	return list, rows.Err()
}

func (r *fiqhRepository) FindAllItems(limit, offset int) ([]model.FiqhItem, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	rows, err := r.db.Raw(fiqhItemWithCategorySelectSQL+" WHERE fi.deleted_at IS NULL ORDER BY fi.category_id ASC, fi.sort_order ASC, fi.id ASC LIMIT ? OFFSET ?", limit, offset).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.FiqhItem
	for rows.Next() {
		fi, err := scanFiqhItemRow(rows, true)
		if err != nil {
			return nil, err
		}
		list = append(list, *fi)
	}
	return list, rows.Err()
}

func (r *fiqhRepository) FindCategoryBySlug(slug string, limit, offset int) (*model.FiqhCategory, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	rows, err := r.db.Raw(fiqhCategorySelectSQL+" WHERE fc.deleted_at IS NULL AND fc.slug = ?", slug).Rows()
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

	cat, err := scanFiqhCategoryRow(rows)
	if err != nil {
		return nil, err
	}
	rows.Close()

	itemRows, err := r.db.Raw(fiqhItemSelectSQL+" WHERE fi.deleted_at IS NULL AND fi.category_id = ? ORDER BY fi.sort_order ASC, fi.id ASC LIMIT ? OFFSET ?", cat.ID, limit, offset).Rows()
	if err != nil {
		return nil, err
	}
	defer itemRows.Close()

	for itemRows.Next() {
		item, err := scanFiqhItemRow(itemRows, false)
		if err != nil {
			return nil, err
		}
		cat.Items = append(cat.Items, *item)
	}

	return cat, itemRows.Err()
}

func (r *fiqhRepository) FindItemBySlug(slug string) (*model.FiqhItem, error) {
	rows, err := r.db.Raw(fiqhItemWithCategorySelectSQL+" WHERE fi.deleted_at IS NULL AND fi.slug = ?", slug).Rows()
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
	return scanFiqhItemRow(rows, true)
}

func (r *fiqhRepository) FindItemByCategoryAndID(slug string, id int) (*model.FiqhItem, error) {
	query := fiqhItemWithCategorySelectSQL + " WHERE fi.deleted_at IS NULL AND fc.slug = ? AND fi.id = ?"
	rows, err := r.db.Raw(query, slug, id).Rows()
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
	return scanFiqhItemRow(rows, true)
}

func (r *fiqhRepository) CreateCategory(cat *model.FiqhCategory) (*model.FiqhCategory, error) {
	err := r.db.Create(cat).Error
	return cat, err
}

func (r *fiqhRepository) UpdateCategory(id int, cat *model.FiqhCategory) (*model.FiqhCategory, error) {
	var existing model.FiqhCategory
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	err := r.db.Model(&existing).Updates(map[string]interface{}{
		"name":        cat.Name,
		"slug":        cat.Slug,
		"description": cat.Description,
	}).Error
	return &existing, err
}

func (r *fiqhRepository) DeleteCategory(id int) error {
	return r.db.Delete(&model.FiqhCategory{}, id).Error
}

func (r *fiqhRepository) CreateItem(item *model.FiqhItem) (*model.FiqhItem, error) {
	err := r.db.Create(item).Error
	return item, err
}

func (r *fiqhRepository) UpdateItem(id int, item *model.FiqhItem) (*model.FiqhItem, error) {
	var existing model.FiqhItem
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	err := r.db.Model(&existing).Updates(map[string]interface{}{
		"category_id": item.CategoryID,
		"title":       item.Title,
		"slug":        item.Slug,
		"content":     item.Content,
		"source":      item.Source,
		"dalil":       item.Dalil,
		"sort_order":  item.SortOrder,
	}).Error
	return &existing, err
}

func (r *fiqhRepository) DeleteItem(id int) error {
	return r.db.Delete(&model.FiqhItem{}, id).Error
}
