package model

import "gorm.io/gorm"

type FiqhCategory struct {
	BaseID
	Name          string       `json:"name" gorm:"type:varchar(256);not null"`
	Slug          string       `json:"slug" gorm:"type:varchar(256);uniqueIndex;not null"`
	Description   string       `json:"description" gorm:"type:text"`
	Items         []FiqhItem   `json:"items,omitempty" gorm:"foreignKey:CategoryID;-:migration"`
	TranslationID *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

type FiqhItem struct {
	BaseID
	CategoryID    *int          `json:"category_id,omitempty" gorm:"not null;index"`
	Category      *FiqhCategory `json:"category_ref,omitempty" gorm:"foreignKey:CategoryID;-:migration"`
	Title         string        `json:"title" gorm:"type:varchar(512);not null"`
	Slug          string        `json:"slug" gorm:"type:varchar(512);uniqueIndex;not null"`
	Content       string        `json:"content" gorm:"type:text;not null"`
	Source        string        `json:"source" gorm:"type:varchar(256)"`
	Dalil         string        `json:"dalil" gorm:"type:text"`
	SortOrder     int           `json:"sort_order" gorm:"default:0"`
	TranslationID *int          `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation  `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

func (i *FiqhItem) AfterFind(tx *gorm.DB) error {
	if i.Dalil == "" {
		i.Dalil = i.Source
	}
	if i.Source == "" {
		i.Source = i.Dalil
	}
	return nil
}

type CreateFiqhCategoryRequest struct {
	Name        string `json:"name" validate:"required"`
	Slug        string `json:"slug" validate:"required"`
	Description string `json:"description"`
}

type CreateFiqhItemRequest struct {
	CategoryID int    `json:"category_id" validate:"required"`
	Title      string `json:"title" validate:"required"`
	Slug       string `json:"slug" validate:"required"`
	Content    string `json:"content" validate:"required"`
	Source     string `json:"source"`
	Dalil      string `json:"dalil"`
	SortOrder  int    `json:"sort_order"`
}
