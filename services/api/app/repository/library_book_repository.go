package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type LibraryBookRepository interface {
	FindAll(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page
	FindBySlug(slug string) (*model.LibraryBook, error)
	FindBySlugAny(slug string) (*model.LibraryBook, error)
	FindManyByIDs(ids []int) ([]model.LibraryBook, error)
	Create(book *model.LibraryBook) (*model.LibraryBook, error)
	Update(id int, book *model.LibraryBook) (*model.LibraryBook, error)
	Delete(id int) error
}

type libraryBookRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewLibraryBookRepository(db *gorm.DB, pg *paginate.Pagination) LibraryBookRepository {
	return &libraryBookRepo{db: db, pg: pg}
}

func (r *libraryBookRepo) FindAll(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page {
	var books []model.LibraryBook
	mod := r.db.Model(&model.LibraryBook{}).
		Where("status = ?", model.LibraryBookStatusPublished).
		Order("category asc, title asc")

	if category != "" {
		mod = mod.Where("category ILIKE ?", category)
	}
	if level != "" {
		mod = mod.Where("level ILIKE ?", level)
	}
	if search != "" {
		like := "%" + search + "%"
		mod = mod.Where(
			"(title ILIKE ? OR author ILIKE ? OR description ILIKE ? OR tags ILIKE ?)",
			like,
			like,
			like,
			like,
		)
	}

	page := r.pg.With(mod).Request(ctx.Request()).Response(&books)
	return &page
}

func (r *libraryBookRepo) FindBySlug(slug string) (*model.LibraryBook, error) {
	var book model.LibraryBook
	err := r.db.Where("slug = ? AND status = ?", slug, model.LibraryBookStatusPublished).First(&book).Error
	if err != nil {
		return nil, err
	}
	return &book, nil
}

func (r *libraryBookRepo) FindBySlugAny(slug string) (*model.LibraryBook, error) {
	var book model.LibraryBook
	err := r.db.Where("slug = ?", slug).First(&book).Error
	if err != nil {
		return nil, err
	}
	return &book, nil
}

func (r *libraryBookRepo) FindManyByIDs(ids []int) ([]model.LibraryBook, error) {
	var books []model.LibraryBook
	if len(ids) == 0 {
		return books, nil
	}
	err := r.db.Where("id IN ? AND status = ?", ids, model.LibraryBookStatusPublished).Find(&books).Error
	return books, err
}

func (r *libraryBookRepo) Create(book *model.LibraryBook) (*model.LibraryBook, error) {
	if err := r.db.Create(book).Error; err != nil {
		return nil, err
	}
	return book, nil
}

func (r *libraryBookRepo) Update(id int, book *model.LibraryBook) (*model.LibraryBook, error) {
	var existing model.LibraryBook
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	updates := map[string]interface{}{
		"title":              book.Title,
		"slug":               book.Slug,
		"author":             book.Author,
		"description":        book.Description,
		"category":           book.Category,
		"level":              book.Level,
		"language":           book.Language,
		"format":             book.Format,
		"source_type":        book.SourceType,
		"source_url":         book.SourceURL,
		"cover_url":          book.CoverURL,
		"license":            book.License,
		"license_status":     book.LicenseStatus,
		"source_note":        book.SourceNote,
		"is_source_verified": book.IsSourceVerified,
		"pages":              book.Pages,
		"tags":               book.Tags,
		"status":             book.Status,
	}
	if err := r.db.Model(&existing).Updates(updates).Error; err != nil {
		return nil, err
	}
	return &existing, nil
}

func (r *libraryBookRepo) Delete(id int) error {
	return r.db.Delete(&model.LibraryBook{}, id).Error
}
