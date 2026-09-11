package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type SanadController interface {
	Create(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	FindByHadithID(ctx *fiber.Ctx) error
	UpdateByID(ctx *fiber.Ctx) error
	DeleteByID(ctx *fiber.Ctx) error

	AddMataSanad(ctx *fiber.Ctx) error
	UpdateMataSanad(ctx *fiber.Ctx) error
	DeleteMataSanad(ctx *fiber.Ctx) error
}

type sanadController struct {
	svc service.SanadService
}

func NewSanadController(services *service.Services) SanadController {
	return &sanadController{services.Sanad}
}

// Create sanad
// @Summary Create sanad
// @Description Create a new sanad entry
// @Accept json
// @Produce json
// @Param body body model.Sanad true "Sanad data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /sanad [post]
// @Tags Sanad
func (c *sanadController) Create(ctx *fiber.Ctx) error {
	data := new(model.Sanad)
	if err := lib.BodyParser(ctx, data); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.Create(data)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, result)
}

// FindAll sanad
// @Summary List all sanad
// @Description Get list of all sanad entries
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Router /sanad [get]
// @Tags Sanad
func (c *sanadController) FindAll(ctx *fiber.Ctx) error {
	list, err := c.svc.FindAll()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, list)
}

func (c *sanadController) FindByHadithID(ctx *fiber.Ctx) error {
	hadithID, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid hadith id")
	}
	list, err := c.svc.FindByHadithID(&hadithID)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, list)
}

// FindByID sanad
// @Summary Get sanad by ID
// @Description Get a single sanad by its ID
// @Accept json
// @Produce json
// @Param id path int true "Sanad ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /sanad/{id} [get]
// @Tags Sanad
func (c *sanadController) FindByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	data, err := c.svc.FindByID(&id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

// UpdateByID sanad
// @Summary Update sanad
// @Description Update sanad by ID
// @Accept json
// @Produce json
// @Param id path int true "Sanad ID"
// @Param body body model.Sanad true "Sanad data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /sanad/{id} [put]
// @Tags Sanad
func (c *sanadController) UpdateByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	data := new(model.Sanad)
	if err := lib.BodyParser(ctx, data); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.UpdateByID(&id, data)
	if err != nil {
		return lib.ErrorNotFound(ctx, err.Error())
	}
	return lib.OK(ctx, result)
}

// DeleteByID sanad
// @Summary Delete sanad
// @Description Delete sanad by ID
// @Accept json
// @Produce json
// @Param id path int true "Sanad ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /sanad/{id} [delete]
// @Tags Sanad
func (c *sanadController) DeleteByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteByID(&id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

func (c *sanadController) AddMataSanad(ctx *fiber.Ctx) error {
	sanadID, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid sanad id")
	}
	data := new(model.MataSanad)
	if err := lib.BodyParser(ctx, data); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data.SanadID = &sanadID
	result, err := c.svc.AddMataSanad(data)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, result)
}

func (c *sanadController) UpdateMataSanad(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	data := new(model.MataSanad)
	if err := lib.BodyParser(ctx, data); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.UpdateMataSanad(&id, data)
	if err != nil {
		return lib.ErrorNotFound(ctx, err.Error())
	}
	return lib.OK(ctx, result)
}

func (c *sanadController) DeleteMataSanad(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteMataSanad(&id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
