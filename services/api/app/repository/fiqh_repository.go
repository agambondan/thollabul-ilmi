package repository

import (
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

func (r *fiqhRepository) FindAllCategories(limit, offset int) ([]model.FiqhCategory, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.FiqhCategory
	err := r.db.Preload("Translation").Order("id").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *fiqhRepository) FindAllItems(limit, offset int) ([]model.FiqhItem, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var list []model.FiqhItem
	err := r.db.Preload("Translation").Preload("Category").Order("category_id, sort_order, id").Limit(limit).Offset(offset).Find(&list).Error
	return list, err
}

func (r *fiqhRepository) FindCategoryBySlug(slug string, limit, offset int) (*model.FiqhCategory, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	var cat model.FiqhCategory
	err := r.db.Preload("Translation").Preload("Items.Translation").Preload("Items", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order, id").Limit(limit).Offset(offset)
	}).Where("slug = ?", slug).First(&cat).Error
	return &cat, err
}

func (r *fiqhRepository) FindItemBySlug(slug string) (*model.FiqhItem, error) {
	var item model.FiqhItem
	err := r.db.Preload("Translation").Where("slug = ?", slug).First(&item).Error
	return &item, err
}

func (r *fiqhRepository) FindItemByCategoryAndID(slug string, id int) (*model.FiqhItem, error) {
	var item model.FiqhItem
	err := r.db.
		Preload("Translation").
		Joins("JOIN fiqh_category ON fiqh_category.id = fiqh_item.category_id").
		Where("fiqh_category.slug = ? AND fiqh_item.id = ?", slug, id).
		First(&item).Error
	return &item, err
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
