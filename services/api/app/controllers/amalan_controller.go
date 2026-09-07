package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type AmalanController interface {
	FindAllItems(ctx *fiber.Ctx) error
	CreateItem(ctx *fiber.Ctx) error
	UpdateItem(ctx *fiber.Ctx) error
	DeleteItem(ctx *fiber.Ctx) error
	GetToday(ctx *fiber.Ctx) error
	Toggle(ctx *fiber.Ctx) error
	GetHistory(ctx *fiber.Ctx) error
}

type amalanController struct {
	svc service.AmalanService
}

func NewAmalanController(services *service.Services) AmalanController {
	return &amalanController{services.Amalan}
}

// @Summary List all amalan items
// @Tags Personal
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /amalan [get]
func (c *amalanController) FindAllItems(ctx *fiber.Ctx) error {
	items, err := c.svc.FindAllItems()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, items)
}

// @Summary Get today's amalan status
// @Tags Personal
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /amalan/today [get]
func (c *amalanController) GetToday(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	result, err := c.svc.GetTodayStatus(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, result)
}

// @Summary Check/uncheck amalan item
// @Tags Personal
// @Accept json
// @Produce json
// @Param id path int true "Amalan item ID"
// @Param body body object{is_done=bool} true "Check status"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /amalan/{id}/check [put]
func (c *amalanController) Toggle(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	var body struct {
		IsDone bool `json:"is_done"`
	}
	if err := lib.BodyParser(ctx, &body); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if err := c.svc.Toggle(userID, id, body.IsDone); err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx)
}

// @Summary Get amalan history
// @Tags Personal
// @Produce json
// @Param from query string false "Start date (YYYY-MM-DD)"
// @Param to query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /amalan/history [get]
func (c *amalanController) GetHistory(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	from := ctx.Query("from")
	to := ctx.Query("to")
	logs, err := c.svc.GetHistory(userID, from, to)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, logs)
}

// @Summary Create amalan item (admin)
// @Tags Personal
// @Accept json
// @Produce json
// @Param body body model.AmalanItem true "Amalan item"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /amalan/items [post]
func (c *amalanController) CreateItem(ctx *fiber.Ctx) error {
	item := new(model.AmalanItem)
	if err := lib.BodyParser(ctx, item); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	created, err := c.svc.CreateItem(item)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, created)
}

// @Summary Update amalan item (admin)
// @Tags Personal
// @Accept json
// @Produce json
// @Param id path int true "Amalan item ID"
// @Param body body model.AmalanItem true "Amalan item"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /amalan/items/{id} [put]
func (c *amalanController) UpdateItem(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	item := new(model.AmalanItem)
	if err := lib.BodyParser(ctx, item); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	updated, err := c.svc.UpdateItem(id, item)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, updated)
}

// @Summary Delete amalan item (admin)
// @Tags Personal
// @Param id path int true "Amalan item ID"
// @Success 200 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /amalan/items/{id} [delete]
func (c *amalanController) DeleteItem(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteItem(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
