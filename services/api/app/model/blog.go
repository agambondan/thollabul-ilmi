package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BlogStatus string

const (
	BlogStatusDraft     BlogStatus = "draft"
	BlogStatusPublished BlogStatus = "published"
	BlogStatusArchived  BlogStatus = "archived"
)

type BlogCategory struct {
	BaseID
	Name          string       `json:"-" gorm:"type:varchar(256);not null"`
	Slug          string       `json:"slug" gorm:"type:varchar(256);uniqueIndex;not null"`
	Description   string       `json:"-" gorm:"type:text"`
	TranslationID *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

type BlogTag struct {
	BaseID
	Name          string       `json:"-" gorm:"type:varchar(100);not null"`
	Slug          string       `json:"slug" gorm:"type:varchar(100);uniqueIndex;not null"`
	Posts         []BlogPost   `json:"posts,omitempty" gorm:"many2many:blog_post_tags"`
	TranslationID *int         `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

type BlogPost struct {
	BaseUUID
	AuthorID      uuid.UUID     `json:"author_id" gorm:"type:uuid;not null;index"`
	CategoryID    *int          `json:"category_id,omitempty" gorm:"index"`
	Title         string        `json:"-" gorm:"type:varchar(512);not null"`
	Slug          string        `json:"slug" gorm:"type:varchar(512);uniqueIndex;not null"`
	Excerpt       string        `json:"-" gorm:"type:text"`
	Content       string        `json:"-" gorm:"type:text;not null"`
	CoverImage    *string       `json:"cover_image,omitempty" gorm:"type:varchar(512)"`
	Status        BlogStatus    `json:"status" gorm:"type:varchar(50);default:'draft';index:idx_blog_status_published"`
	PublishedAt   *time.Time    `json:"published_at,omitempty" gorm:"index:idx_blog_status_published"`
	ViewCount     int           `json:"view_count" gorm:"default:0"`
	Author        *User         `json:"author,omitempty"`
	Category      *BlogCategory `json:"category,omitempty"`
	Tags          []BlogTag     `json:"tags,omitempty" gorm:"many2many:blog_post_tags"`
	TranslationID *int          `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation  `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
}

// AfterFind strips the author's contact details. Every blog read path preloads
// Author, so sanitising here rather than at each call site means a new query
// cannot accidentally publish an email address. GORM runs the preload callback
// before after_query, so Author is already populated by this point.
func (p *BlogPost) AfterFind(tx *gorm.DB) error {
	p.Author = p.Author.ToPublic()
	return nil
}

type CreateBlogPostRequest struct {
	Title      string     `json:"title" validate:"required,max=512"`
	Excerpt    string     `json:"excerpt" validate:"max=1000"`
	Content    string     `json:"content" validate:"required,max=50000"`
	CoverImage *string    `json:"cover_image"`
	CategoryID *int       `json:"category_id"`
	Tags       []int      `json:"tags"`
	Status     BlogStatus `json:"status"`
}

type UpdateBlogPostRequest struct {
	Title      *string     `json:"title"`
	Excerpt    *string     `json:"excerpt"`
	Content    *string     `json:"content"`
	CoverImage *string     `json:"cover_image"`
	CategoryID *int        `json:"category_id"`
	Tags       []int       `json:"tags"`
	Status     *BlogStatus `json:"status"`
}

type CreateBlogCategoryRequest struct {
	Name        string `json:"name" validate:"required"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
}

type CreateBlogTagRequest struct {
	Name string `json:"name" validate:"required"`
	Slug string `json:"slug"`
}
