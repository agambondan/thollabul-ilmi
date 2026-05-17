package controllers

import (
	"fmt"
	"mime"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

type LibraryBookController interface {
	FindAll(ctx *fiber.Ctx) error
	FindAllAdmin(ctx *fiber.Ctx) error
	FindBySlug(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	UploadResource(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type libraryBookController struct {
	svc service.LibraryBookService
}

func NewLibraryBookController(services *service.Services) LibraryBookController {
	return &libraryBookController{svc: services.LibraryBook}
}

// @Summary Get library books
// @Tags Belajar
// @Accept json
// @Produce json
// @Param category query string false "Filter by category"
// @Param level query string false "Filter by level"
// @Param search query string false "Search keyword"
// @Param page query int false "Page number"
// @Param size query int false "Page size"
// @Success 200 {object} lib.Response
// @Router /library/books [get]
func (c *libraryBookController) FindAll(ctx *fiber.Ctx) error {
	page := c.svc.FindAll(ctx, ctx.Query("category"), ctx.Query("level"), ctx.Query("search"))
	return lib.OK(ctx, page)
}

// @Summary Get all library books for admin
// @Tags Belajar
// @Accept json
// @Produce json
// @Param category query string false "Filter by category"
// @Param level query string false "Filter by level"
// @Param search query string false "Search keyword"
// @Param page query int false "Page number"
// @Param size query int false "Page size"
// @Success 200 {object} lib.Response
// @Router /library/admin/books [get]
func (c *libraryBookController) FindAllAdmin(ctx *fiber.Ctx) error {
	page := c.svc.FindAllAdmin(ctx, ctx.Query("category"), ctx.Query("level"), ctx.Query("search"))
	return lib.OK(ctx, page)
}

// @Summary Get library book by slug
// @Tags Belajar
// @Accept json
// @Produce json
// @Param slug path string true "Book slug"
// @Success 200 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /library/books/{slug} [get]
func (c *libraryBookController) FindBySlug(ctx *fiber.Ctx) error {
	book, err := c.svc.FindBySlug(ctx.Params("slug"))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, book)
}

// @Summary Create library book
// @Tags Belajar
// @Accept json
// @Produce json
// @Param body body model.CreateLibraryBookRequest true "Library book data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /library/books [post]
func (c *libraryBookController) Create(ctx *fiber.Ctx) error {
	req := new(model.CreateLibraryBookRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	book, err := c.svc.Create(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, book)
}

// @Summary Update library book
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Library book ID"
// @Param body body model.CreateLibraryBookRequest true "Library book data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /library/books/{id} [put]
func (c *libraryBookController) Update(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(model.CreateLibraryBookRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	book, err := c.svc.Update(id, req)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, book)
}

// @Summary Upload library book resource file
// @Tags Belajar
// @Accept multipart/form-data
// @Produce json
// @Param id path int true "Library book ID"
// @Param file formData file true "Resource file"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /library/books/{id}/resource [post]
func (c *libraryBookController) UploadResource(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if _, err := c.svc.FindByIDAny(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	header, err := ctx.FormFile("file")
	if err != nil {
		return lib.ErrorBadRequest(ctx, "file is required")
	}
	maxBytes := viper.GetInt64("LIBRARY_UPLOAD_MAX_BYTES")
	if maxBytes <= 0 {
		maxBytes = 25 * 1024 * 1024
	}
	if header.Size > maxBytes {
		return lib.ErrorBadRequest(ctx, fmt.Sprintf("file max size is %d bytes", maxBytes))
	}

	format, contentType, err := inferLibraryResource(header.Filename, header.Header.Get("Content-Type"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err.Error())
	}
	file, err := header.Open()
	if err != nil {
		return lib.ErrorBadRequest(ctx, "file cannot be opened")
	}
	defer file.Close()

	objectKey := fmt.Sprintf("library/books/%d/%d-%s", id, time.Now().Unix(), safeLibraryFilename(header.Filename))
	sourceURL, err := lib.UploadPublicObject(ctx.UserContext(), objectKey, file, header.Size, contentType)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	book, err := c.svc.UpdateResource(id, &model.LibraryBookResource{
		SourceURL:     sourceURL,
		FileName:      header.Filename,
		FileMimeType:  contentType,
		FileSizeBytes: header.Size,
		Format:        format,
	})
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, book)
}

// @Summary Delete library book
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Library book ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /library/books/{id} [delete]
func (c *libraryBookController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

func inferLibraryResource(filename string, contentType string) (model.LibraryBookFormat, string, error) {
	ext := strings.ToLower(filepath.Ext(filename))
	if contentType == "" || contentType == "application/octet-stream" {
		contentType = mime.TypeByExtension(ext)
	}
	switch ext {
	case ".pdf":
		if contentType == "" {
			contentType = "application/pdf"
		}
		return model.LibraryBookFormatPDF, contentType, nil
	case ".epub":
		if contentType == "" {
			contentType = "application/epub+zip"
		}
		return model.LibraryBookFormatEPUB, contentType, nil
	case ".html", ".htm":
		if contentType == "" {
			contentType = "text/html; charset=utf-8"
		}
		return model.LibraryBookFormatHTML, contentType, nil
	default:
		return "", "", fmt.Errorf("unsupported resource file type")
	}
}

var libraryFilenameCleaner = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

func safeLibraryFilename(filename string) string {
	base := filepath.Base(filename)
	base = strings.Trim(base, ". ")
	base = libraryFilenameCleaner.ReplaceAllString(base, "-")
	if base == "" || base == "." {
		return "resource"
	}
	return base
}
