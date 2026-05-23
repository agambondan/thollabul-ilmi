package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type DailyReminderController interface {
	FindAll(ctx *fiber.Ctx) error
	FindAllAdmin(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type dailyReminderController struct {
	svc service.DailyReminderService
}

func NewDailyReminderController(services *service.Services) DailyReminderController {
	return &dailyReminderController{services.DailyReminder}
}

func (c *dailyReminderController) FindAll(ctx *fiber.Ctx) error {
	return c.findAll(ctx, true)
}

func (c *dailyReminderController) FindAllAdmin(ctx *fiber.Ctx) error {
	activeQuery := ctx.Query("active")
	activeOnly := activeQuery != "all" && activeQuery != "false" && activeQuery != "0"
	return c.findAll(ctx, activeOnly)
}

func (c *dailyReminderController) findAll(ctx *fiber.Ctx, activeOnly bool) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}

	list, err := c.svc.FindAll(ctx.Query("type"), ctx.Query("lang"), activeOnly, lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	list, hasMore := lib.TrimPaginationItems(list, limit)
	return lib.OKPaginated(ctx, list, limit, offset, hasMore)
}

func (c *dailyReminderController) FindByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	item, err := c.svc.FindByID(id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, item)
}

func (c *dailyReminderController) Create(ctx *fiber.Ctx) error {
	req := new(model.DailyReminderRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.Create(req.ToModel())
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, item)
}

func (c *dailyReminderController) Update(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(model.DailyReminderRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.Update(id, req.ToModel())
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, item)
}

func (c *dailyReminderController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
