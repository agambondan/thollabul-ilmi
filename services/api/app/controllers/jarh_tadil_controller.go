package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type JarhTadilController interface {
	Create(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	FindByPerawiID(ctx *fiber.Ctx) error
	UpdateByID(ctx *fiber.Ctx) error
	DeleteByID(ctx *fiber.Ctx) error
}

type jarhTadilController struct {
	svc service.JarhTadilService
}

func NewJarhTadilController(services *service.Services) JarhTadilController {
	return &jarhTadilController{services.JarhTadil}
}

// Create jarhTadil
// @Summary Create jarh-tadil
// @Description Create a new jarh-tadil entry
// @Accept json
// @Produce json
// @Param body body model.JarhTadil true "JarhTadil data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /jarh-tadil [post]
// @Tags JarhTadil
func (c *jarhTadilController) Create(ctx *fiber.Ctx) error {
	data := new(model.JarhTadil)
	if err := lib.BodyParser(ctx, data); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.Create(data)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, result)
}

func (c *jarhTadilController) FindByPerawiID(ctx *fiber.Ctx) error {
	perawiID, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid perawi id")
	}
	list, err := c.svc.FindByPerawiID(&perawiID)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, list)
}

// FindAll jarhTadil
// @Summary List all jarh-tadil
// @Description Get paginated list of all jarh-tadil
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /jarh-tadil [get]
// @Tags JarhTadil
func (c *jarhTadilController) FindAll(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}
	list, err := c.svc.FindAll(lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	list, hasMore := lib.TrimPaginationItems(list, limit)
	return lib.OKPaginated(ctx, list, limit, offset, hasMore)
}

// FindByID jarhTadil
// @Summary Get jarh-tadil by ID
// @Description Get a single jarh-tadil by its ID
// @Accept json
// @Produce json
// @Param id path int true "JarhTadil ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /jarh-tadil/{id} [get]
// @Tags JarhTadil
func (c *jarhTadilController) FindByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	data, err := c.svc.FindByID(&id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	if data.Translation != nil {
		data.Translation.FilterByLang(lib.GetPreferredLang(ctx))
	}
	return lib.OK(ctx, data)
}

// UpdateByID jarhTadil
// @Summary Update jarh-tadil
// @Description Update jarh-tadil by ID
// @Accept json
// @Produce json
// @Param id path int true "JarhTadil ID"
// @Param body body model.JarhTadil true "JarhTadil data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /jarh-tadil/{id} [put]
// @Tags JarhTadil
func (c *jarhTadilController) UpdateByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	data := new(model.JarhTadil)
	if err := lib.BodyParser(ctx, data); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.UpdateByID(&id, data)
	if err != nil {
		return lib.ErrorNotFound(ctx, err.Error())
	}
	return lib.OK(ctx, result)
}

// DeleteByID jarhTadil
// @Summary Delete jarh-tadil
// @Description Delete jarh-tadil by ID
// @Accept json
// @Produce json
// @Param id path int true "JarhTadil ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /jarh-tadil/{id} [delete]
// @Tags JarhTadil
func (c *jarhTadilController) DeleteByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteByID(&id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
