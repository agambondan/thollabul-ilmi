package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type PerawiController interface {
	Create(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	FindByTabaqah(ctx *fiber.Ctx) error
	Search(ctx *fiber.Ctx) error
	FindGuru(ctx *fiber.Ctx) error
	FindMurid(ctx *fiber.Ctx) error
	UpdateByID(ctx *fiber.Ctx) error
	DeleteByID(ctx *fiber.Ctx) error
}

type perawiController struct {
	svc service.PerawiService
}

func NewPerawiController(services *service.Services) PerawiController {
	return &perawiController{services.Perawi}
}

// Create perawi
// @Summary Create perawi
// @Description Create a new perawi entry
// @Accept json
// @Produce json
// @Param body body model.Perawi true "Perawi data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /perawi [post]
// @Tags Perawi
func (c *perawiController) Create(ctx *fiber.Ctx) error {
	data := new(model.Perawi)
	if err := lib.BodyParser(ctx, data); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.Create(data)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, result)
}

// FindAll perawi
// @Summary List all perawi
// @Description Get paginated list of all perawi
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /perawi [get]
// @Tags Perawi
func (c *perawiController) FindAll(ctx *fiber.Ctx) error {
	page := c.svc.FindAll(ctx)
	return lib.OK(ctx, page)
}

// FindByID perawi
// @Summary Get perawi by ID
// @Description Get a single perawi by its ID
// @Accept json
// @Produce json
// @Param id path int true "Perawi ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /perawi/{id} [get]
// @Tags Perawi
func (c *perawiController) FindByID(ctx *fiber.Ctx) error {
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

// FindByTabaqah perawi
// @Summary Get perawi by tabaqah
// @Description Get perawi filtered by tabaqah
// @Accept json
// @Produce json
// @Param tabaqah path string true "Tabaqah"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /perawi/tabaqah/{tabaqah} [get]
// @Tags Perawi
func (c *perawiController) FindByTabaqah(ctx *fiber.Ctx) error {
	tabaqah := ctx.Params("tabaqah")
	page := c.svc.FindByTabaqah(ctx, tabaqah)
	return lib.OK(ctx, page)
}

// Search perawi
// @Summary Search perawi
// @Description Search perawi by query
// @Accept json
// @Produce json
// @Param q query string true "Search query"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /perawi/search [get]
// @Tags Perawi
func (c *perawiController) Search(ctx *fiber.Ctx) error {
	q := ctx.Query("q")
	if q == "" {
		return lib.ErrorBadRequest(ctx, "query param 'q' is required")
	}
	page := c.svc.Search(ctx, q)
	return lib.OK(ctx, page)
}

// FindGuru perawi
// @Summary Get guru (teachers) of a perawi
// @Description Get list of teachers for a given perawi
// @Accept json
// @Produce json
// @Param id path int true "Perawi ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /perawi/{id}/guru [get]
// @Tags Perawi
func (c *perawiController) FindGuru(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	list, err := c.svc.FindGuru(&id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, list)
}

// FindMurid perawi
// @Summary Get murid (students) of a perawi
// @Description Get list of students for a given perawi
// @Accept json
// @Produce json
// @Param id path int true "Perawi ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /perawi/{id}/murid [get]
// @Tags Perawi
func (c *perawiController) FindMurid(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	list, err := c.svc.FindMurid(&id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, list)
}

// UpdateByID perawi
// @Summary Update perawi
// @Description Update perawi by ID
// @Accept json
// @Produce json
// @Param id path int true "Perawi ID"
// @Param body body model.Perawi true "Perawi data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /perawi/{id} [put]
// @Tags Perawi
func (c *perawiController) UpdateByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	data := new(model.Perawi)
	if err := lib.BodyParser(ctx, data); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.UpdateByID(&id, data)
	if err != nil {
		return lib.ErrorNotFound(ctx, err.Error())
	}
	return lib.OK(ctx, result)
}

// DeleteByID perawi
// @Summary Delete perawi
// @Description Delete perawi by ID
// @Accept json
// @Produce json
// @Param id path int true "Perawi ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /perawi/{id} [delete]
// @Tags Perawi
func (c *perawiController) DeleteByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteByID(&id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
