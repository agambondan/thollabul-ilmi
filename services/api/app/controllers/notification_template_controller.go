package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type NotificationTemplateController interface {
	FindAll(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type notificationTemplateController struct {
	svc service.NotificationTemplateService
}

func NewNotificationTemplateController(services *service.Services) NotificationTemplateController {
	return &notificationTemplateController{services.NotificationTemplate}
}

func (c *notificationTemplateController) FindAll(ctx *fiber.Ctx) error {
	items, err := c.svc.FindAll()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"items": items})
}

func (c *notificationTemplateController) Create(ctx *fiber.Ctx) error {
	req := new(model.CreateNotificationTemplateRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.Create(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, result)
}

func (c *notificationTemplateController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, fiber.Map{"message": "deleted"})
}
