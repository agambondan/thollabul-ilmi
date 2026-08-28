package controllers

import (
	"errors"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type SettingsController interface {
	Get(ctx *fiber.Ctx) error
	Upsert(ctx *fiber.Ctx) error
}

type settingsController struct {
	svc service.SettingsService
}

func NewSettingsController(services *service.Services) SettingsController {
	return &settingsController{services.Settings}
}

// @Summary Get the authenticated user's synced settings
// @Tags Settings
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /settings [get]
func (c *settingsController) Get(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	item, err := c.svc.Get(userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return lib.OK(ctx, fiber.Map{"settings": ""})
	}
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, item)
}

// @Summary Create or update the authenticated user's synced settings
// @Tags Settings
// @Accept json
// @Produce json
// @Param body body model.UpdateSettingsRequest true "Settings payload"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /settings [put]
func (c *settingsController) Upsert(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.UpdateSettingsRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.Upsert(userID, req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, item)
}
