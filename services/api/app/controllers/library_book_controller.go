package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type LibraryBookController interface {
	FindAll(ctx *fiber.Ctx) error
	FindAllAdmin(ctx *fiber.Ctx) error
	FindBySlug(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
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
