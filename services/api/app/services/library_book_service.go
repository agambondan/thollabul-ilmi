package service

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

type LibraryBookService interface {
	FindAll(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page
	FindAllAdmin(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page
	FindBySlug(slug string) (*model.LibraryBook, error)
	Create(req *model.CreateLibraryBookRequest) (*model.LibraryBook, error)
	Update(id int, req *model.CreateLibraryBookRequest) (*model.LibraryBook, error)
	Delete(id int) error
}

type libraryBookService struct {
	repo repository.LibraryBookRepository
}

func NewLibraryBookService(repo repository.LibraryBookRepository) LibraryBookService {
	return &libraryBookService{repo: repo}
}

func (s *libraryBookService) FindAll(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page {
	return s.repo.FindAll(ctx, category, level, search)
}

func (s *libraryBookService) FindAllAdmin(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page {
	return s.repo.FindAllAdmin(ctx, category, level, search)
}

func (s *libraryBookService) FindBySlug(slug string) (*model.LibraryBook, error) {
	return s.repo.FindBySlug(slug)
}

func (s *libraryBookService) Create(req *model.CreateLibraryBookRequest) (*model.LibraryBook, error) {
	status := req.Status
	if status == "" {
		status = model.LibraryBookStatusPublished
	}
	format := req.Format
	if format == "" {
		format = model.LibraryBookFormatLink
	}
	sourceType := req.SourceType
	if sourceType == "" {
		sourceType = model.LibraryBookSourceExternal
	}
	licenseStatus := req.LicenseStatus
	if licenseStatus == "" {
		licenseStatus = model.LibraryBookLicenseUnverified
	}
	slug := req.Slug
	if slug == "" {
		slug = uniqueLibraryBookSlug(req.Title, func(candidate string) bool {
			_, err := s.repo.FindBySlugAny(candidate)
			return err == nil
		})
	}

	return s.repo.Create(&model.LibraryBook{
		Title:            req.Title,
		Slug:             slug,
		Author:           req.Author,
		Description:      req.Description,
		Category:         req.Category,
		Level:            req.Level,
		Language:         req.Language,
		Format:           format,
		SourceType:       sourceType,
		SourceURL:        req.SourceURL,
		CoverURL:         req.CoverURL,
		License:          req.License,
		LicenseStatus:    licenseStatus,
		SourceNote:       req.SourceNote,
		IsSourceVerified: req.IsSourceVerified,
		Pages:            req.Pages,
		Tags:             req.Tags,
		Status:           status,
	})
}

func (s *libraryBookService) Update(id int, req *model.CreateLibraryBookRequest) (*model.LibraryBook, error) {
	status := req.Status
	if status == "" {
		status = model.LibraryBookStatusPublished
	}
	format := req.Format
	if format == "" {
		format = model.LibraryBookFormatLink
	}
	sourceType := req.SourceType
	if sourceType == "" {
		sourceType = model.LibraryBookSourceExternal
	}
	licenseStatus := req.LicenseStatus
	if licenseStatus == "" {
		licenseStatus = model.LibraryBookLicenseUnverified
	}
	slug := req.Slug
	if slug == "" {
		slug = uniqueLibraryBookSlug(req.Title, func(candidate string) bool {
			found, err := s.repo.FindBySlugAny(candidate)
			return err == nil && found != nil && found.ID != nil && *found.ID != id
		})
	}

	return s.repo.Update(id, &model.LibraryBook{
		Title:            req.Title,
		Slug:             slug,
		Author:           req.Author,
		Description:      req.Description,
		Category:         req.Category,
		Level:            req.Level,
		Language:         req.Language,
		Format:           format,
		SourceType:       sourceType,
		SourceURL:        req.SourceURL,
		CoverURL:         req.CoverURL,
		License:          req.License,
		LicenseStatus:    licenseStatus,
		SourceNote:       req.SourceNote,
		IsSourceVerified: req.IsSourceVerified,
		Pages:            req.Pages,
		Tags:             req.Tags,
		Status:           status,
	})
}

func (s *libraryBookService) Delete(id int) error {
	return s.repo.Delete(id)
}

func uniqueLibraryBookSlug(title string, exists func(string) bool) string {
	base := slugify(title)
	if base == "" {
		base = "book"
	}
	if !exists(base) {
		return base
	}
	for i := 2; ; i++ {
		candidate := base + "-" + strconv.Itoa(i)
		if !exists(candidate) {
			return candidate
		}
	}
}
