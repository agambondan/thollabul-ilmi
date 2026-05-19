package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type DoaController interface {
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	FindByCategory(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type doaController struct {
	svc service.DoaService
}

type doaAdminRequest struct {
	Title           string `json:"title" validate:"required"`
	Arabic          string `json:"arabic" validate:"required"`
	Transliteration string `json:"transliteration"`
	Translation     string `json:"translation" validate:"required"`
	Category        string `json:"category" validate:"required"`
	Source          string `json:"source"`
	AudioURL        string `json:"audio_url"`
}

func NewDoaController(services *service.Services) DoaController {
	return &doaController{services.Doa}
}

// FindAll Doa
// @Summary Get all doa
// @Tags Doa
// @Accept json
// @Produce json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /doa [get]
func (c *doaController) FindAll(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}
	list, err := c.svc.FindAll(lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	list, hasMore := lib.TrimPaginationItems(list, limit)
	lang := lib.GetPreferredLang(ctx)
	for i := range list {
		list[i].Translation.FilterByLang(lang)
	}
	return lib.OKPaginated(ctx, list, limit, offset, hasMore)
}

// FindByID Doa
// @Summary Get doa by ID
// @Tags Doa
// @Accept json
// @Produce json
// @Param id path int true "Doa ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /doa/{id} [get]
func (c *doaController) FindByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	doa, err := c.svc.FindByID(id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	doa.Translation.FilterByLang(lib.GetPreferredLang(ctx))
	return lib.OK(ctx, doa)
}

// FindByCategory Doa
// @Summary Get doa by category
// @Tags Doa
// @Accept json
// @Produce json
// @Param category path string true "Doa category"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /doa/category/{category} [get]
func (c *doaController) FindByCategory(ctx *fiber.Ctx) error {
	category := model.DoaCategory(ctx.Params("category"))
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}
	list, err := c.svc.FindByCategory(category, lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	list, hasMore := lib.TrimPaginationItems(list, limit)
	lang := lib.GetPreferredLang(ctx)
	for i := range list {
		list[i].Translation.FilterByLang(lang)
	}
	return lib.OKPaginated(ctx, list, limit, offset, hasMore)
}

func (c *doaController) Create(ctx *fiber.Ctx) error {
	req := new(doaAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.Create(doaFromAdminRequest(req))
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, item)
}

func (c *doaController) Update(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(doaAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.Update(id, doaFromAdminRequest(req))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, item)
}

func (c *doaController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

func doaFromAdminRequest(req *doaAdminRequest) *model.Doa {
	return &model.Doa{
		Category:        model.DoaCategory(req.Category),
		Title:           req.Title,
		Arabic:          req.Arabic,
		Transliteration: req.Transliteration,
		TranslationText: req.Translation,
		Source:          req.Source,
		AudioURL:        req.AudioURL,
	}
}
