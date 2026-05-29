package controllers

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type DzikirLogController interface {
	Log(ctx *fiber.Ctx) error
	GetToday(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type dzikirLogController struct {
	svc service.DzikirLogService
}

func NewDzikirLogController(services *service.Services) DzikirLogController {
	return &dzikirLogController{services.DzikirLog}
}

// LogDzikir log a dzikir completion
// @Summary Log dzikir completion
// @Tags Ibadah, Dzikir Log
// @Accept json
// @Produce json
// @Param request body model.LogDzikirRequest true "Dzikir log request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /dzikir/log [post]
func (c *dzikirLogController) Log(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	var req model.LogDzikirRequest
	if err := ctx.BodyParser(&req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if req.DzikirID == 0 {
		return lib.ErrorBadRequest(ctx, fiber.NewError(400, "dzikir_id required"))
	}
	log, err := c.svc.Log(userID, req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, log)
}

// GetToday get today's dzikir log
// @Summary Get today's dzikir log
// @Tags Ibadah, Dzikir Log
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /dzikir/log/today [get]
func (c *dzikirLogController) GetToday(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	logs, err := c.svc.GetToday(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, logs)
}

// DeleteById delete a dzikir log entry
// @Summary Delete dzikir log by ID
// @Tags Ibadah, Dzikir Log
// @Accept json
// @Produce json
// @Param id path string true "Dzikir log ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /dzikir/log/{id} [delete]
func (c *dzikirLogController) Delete(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	logID, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if err := c.svc.Delete(logID, userID); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, fiber.Map{"deleted": true})
}
