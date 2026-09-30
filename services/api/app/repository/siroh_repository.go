package repository

import (
	"database/sql"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type SirohRepository interface {
	FindAllCategories() ([]model.SirohCategory, error)
	FindCategoryBySlug(string) (*model.SirohCategory, error)
	FindContentBySlug(string) (*model.SirohContent, error)
	FindContentsByCategoryID(int) ([]model.SirohContent, error)
	FindAllContents(*fiber.Ctx) *paginate.Page
	SaveCategory(*model.SirohCategory) (*model.SirohCategory, error)
	SaveContent(*model.SirohContent) (*model.SirohContent, error)
	UpdateCategory(int, *model.SirohCategory) (*model.SirohCategory, error)
	UpdateContent(int, *model.SirohContent) (*model.SirohContent, error)
	DeleteCategory(int) error
	DeleteContent(int) error
}

type sirohRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewSirohRepository(db *gorm.DB, pg *paginate.Pagination) SirohRepository {
	return &sirohRepo{db, pg}
}

const sirohCategorySelectSQL = `
	SELECT
		sc.id, sc.title, sc.slug, sc."order", sc.translation_id,
		t.id, t.idn, t.en, t.ar
	FROM siroh_category sc
	LEFT JOIN translation t ON t.id = sc.translation_id AND t.deleted_at IS NULL
`

const sirohContentSelectSQL = `
	SELECT
		sco.id, sco.category_id, sco.title, sco.slug, sco.content, sco.source, sco."order", sco.translation_id,
		t.id, t.idn, t.en, t.ar
	FROM siroh_content sco
	LEFT JOIN translation t ON t.id = sco.translation_id AND t.deleted_at IS NULL
`

const sirohContentWithCategorySelectSQL = `
	SELECT
		sco.id, sco.category_id, sco.title, sco.slug, sco.content, sco.source, sco."order", sco.translation_id,
		scot.id, scot.idn, scot.en, scot.ar,
		sc.id, sc.title, sc.slug, sc."order", sc.translation_id,
		sct.id, sct.idn, sct.en, sct.ar
	FROM siroh_content sco
	LEFT JOIN translation scot ON scot.id = sco.translation_id AND scot.deleted_at IS NULL
	LEFT JOIN siroh_category sc ON sc.id = sco.category_id AND sc.deleted_at IS NULL
	LEFT JOIN translation sct ON sct.id = sc.translation_id AND sct.deleted_at IS NULL
`

func scanSirohCategoryRow(rows *sql.Rows) (*model.SirohCategory, error) {
	var (
		sc              model.SirohCategory
		scID, scTransID *int
		scTitle, scSlug *string
		scOrder         *int
		tID             *int
		tIdn, tEn, tAr  *string
	)

	err := rows.Scan(
		&scID, &scTitle, &scSlug, &scOrder, &scTransID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return nil, err
	}

	sc.BaseID = model.BaseID{ID: scID}
	if scTitle != nil {
		sc.Title = *scTitle
	}
	if scSlug != nil {
		sc.Slug = *scSlug
	}
	if scOrder != nil {
		sc.Order = *scOrder
	}
	sc.TranslationID = scTransID

	if tID != nil {
		sc.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}

	return &sc, nil
}

func scanSirohContentRow(rows *sql.Rows, includeCategory bool) (*model.SirohContent, error) {
	var (
		sco                                model.SirohContent
		scoID, scoCatID, scoTransID        *int
		scoTitle, scoSlug, scoText, scoSrc *string
		scoOrder                           *int
		scotID                             *int
		scotIdn, scotEn, scotAr            *string
		scID, scTransID                    *int
		scTitle, scSlug                    *string
		scOrder                            *int
		sctID                              *int
		sctIdn, sctEn, sctAr               *string
	)

	var targets []interface{}
	targets = append(targets,
		&scoID, &scoCatID, &scoTitle, &scoSlug, &scoText, &scoSrc, &scoOrder, &scoTransID,
		&scotID, &scotIdn, &scotEn, &scotAr,
	)
	if includeCategory {
		targets = append(targets,
			&scID, &scTitle, &scSlug, &scOrder, &scTransID,
			&sctID, &sctIdn, &sctEn, &sctAr,
		)
	}

	err := rows.Scan(targets...)
	if err != nil {
		return nil, err
	}

	sco.BaseID = model.BaseID{ID: scoID}
	sco.CategoryID = scoCatID
	if scoTitle != nil {
		sco.Title = *scoTitle
	}
	if scoSlug != nil {
		sco.Slug = *scoSlug
	}
	if scoText != nil {
		sco.Content = *scoText
	}
	if scoSrc != nil {
		sco.Source = *scoSrc
	}
	if scoOrder != nil {
		sco.Order = *scoOrder
	}
	sco.TranslationID = scoTransID

	if scotID != nil {
		sco.Translation = &model.Translation{
			BaseID: model.BaseID{ID: scotID},
			Idn:    scotIdn,
			En:     scotEn,
			Ar:     scotAr,
		}
	}

	if includeCategory && scID != nil {
		sco.Category = &model.SirohCategory{
			BaseID:        model.BaseID{ID: scID},
			TranslationID: scTransID,
		}
		if scTitle != nil {
			sco.Category.Title = *scTitle
		}
		if scSlug != nil {
			sco.Category.Slug = *scSlug
		}
		if scOrder != nil {
			sco.Category.Order = *scOrder
		}
		if sctID != nil {
			sco.Category.Translation = &model.Translation{
				BaseID: model.BaseID{ID: sctID},
				Idn:    sctIdn,
				En:     sctEn,
				Ar:     sctAr,
			}
		}
	}

	return &sco, nil
}

func (r *sirohRepo) FindAllCategories() ([]model.SirohCategory, error) {
	rows, err := r.db.Raw(sirohCategorySelectSQL + ` WHERE sc.deleted_at IS NULL ORDER BY sc."order" ASC, sc.id ASC`).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.SirohCategory
	for rows.Next() {
		cat, err := scanSirohCategoryRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *cat)
	}
	return list, rows.Err()
}

func (r *sirohRepo) FindCategoryBySlug(slug string) (*model.SirohCategory, error) {
	rows, err := r.db.Raw(sirohCategorySelectSQL+" WHERE sc.slug = ? AND sc.deleted_at IS NULL", slug).Rows()
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

	cat, err := scanSirohCategoryRow(rows)
	if err != nil {
		return nil, err
	}
	rows.Close()

	itemRows, err := r.db.Raw(sirohContentSelectSQL+` WHERE sco.category_id = ? AND sco.deleted_at IS NULL ORDER BY sco."order" ASC, sco.id ASC`, cat.ID).Rows()
	if err != nil {
		return nil, err
	}
	defer itemRows.Close()

	for itemRows.Next() {
		item, err := scanSirohContentRow(itemRows, false)
		if err != nil {
			return nil, err
		}
		cat.Contents = append(cat.Contents, *item)
	}

	return cat, itemRows.Err()
}

func (r *sirohRepo) FindContentBySlug(slug string) (*model.SirohContent, error) {
	rows, err := r.db.Raw(sirohContentWithCategorySelectSQL+" WHERE sco.slug = ? AND sco.deleted_at IS NULL", slug).Rows()
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
	return scanSirohContentRow(rows, true)
}

func (r *sirohRepo) FindContentsByCategoryID(categoryID int) ([]model.SirohContent, error) {
	rows, err := r.db.Raw(sirohContentSelectSQL+` WHERE sco.category_id = ? AND sco.deleted_at IS NULL ORDER BY sco."order" ASC, sco.id ASC LIMIT 200`, categoryID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []model.SirohContent
	for rows.Next() {
		item, err := scanSirohContentRow(rows, false)
		if err != nil {
			return nil, err
		}
		list = append(list, *item)
	}
	return list, rows.Err()
}

func (r *sirohRepo) FindAllContents(ctx *fiber.Ctx) *paginate.Page {
	var list []model.SirohContent
	mod := r.db.Model(&model.SirohContent{}).
		Joins("Translation").
		Joins("Category").
		Joins("Category.Translation").
		Order("category_id, \"order\" asc")
	page := r.pg.With(mod).Request(ctx.Request()).Response(&list)
	return &page
}

func (r *sirohRepo) SaveCategory(c *model.SirohCategory) (*model.SirohCategory, error) {
	if err := r.db.Create(c).Error; err != nil {
		return nil, err
	}
	return c, nil
}

func (r *sirohRepo) SaveContent(c *model.SirohContent) (*model.SirohContent, error) {
	if err := r.db.Create(c).Error; err != nil {
		return nil, err
	}
	return c, nil
}

func (r *sirohRepo) UpdateCategory(id int, c *model.SirohCategory) (*model.SirohCategory, error) {
	if err := r.db.Model(&model.SirohCategory{}).Where("id = ?", id).Updates(c).Error; err != nil {
		return nil, err
	}
	rows, err := r.db.Raw(sirohCategorySelectSQL+" WHERE sc.id = ? AND sc.deleted_at IS NULL", id).Rows()
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
	return scanSirohCategoryRow(rows)
}

func (r *sirohRepo) UpdateContent(id int, c *model.SirohContent) (*model.SirohContent, error) {
	if err := r.db.Model(&model.SirohContent{}).Where("id = ?", id).Updates(c).Error; err != nil {
		return nil, err
	}
	rows, err := r.db.Raw(sirohContentWithCategorySelectSQL+" WHERE sco.id = ? AND sco.deleted_at IS NULL", id).Rows()
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
	return scanSirohContentRow(rows, true)
}

func (r *sirohRepo) DeleteCategory(id int) error {
	return r.db.Delete(&model.SirohCategory{}, id).Error
}

func (r *sirohRepo) DeleteContent(id int) error {
	return r.db.Delete(&model.SirohContent{}, id).Error
}
