package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type TilawahController interface {
	Add(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	Summary(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type tilawahController struct {
	svc service.TilawahService
}

func NewTilawahController(services *service.Services) TilawahController {
	return &tilawahController{services.Tilawah}
}

// @Summary Add tilawah (recitation) log
// @Tags Belajar
// @Accept json
// @Produce json
// @Param body body model.CreateTilawahRequest true "Tilawah data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /tilawah [post]
func (c *tilawahController) Add(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.CreateTilawahRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	log, err := c.svc.Add(userID, req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, log)
}

// @Summary Get tilawah logs
// @Tags Belajar
// @Produce json
// @Param from query string false "Start date (YYYY-MM-DD)"
// @Param to query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /tilawah [get]
func (c *tilawahController) FindAll(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	from := ctx.Query("from")
	to := ctx.Query("to")
	logs, err := c.svc.FindAll(userID, from, to)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, logs)
}

// @Summary Get tilawah summary
// @Tags Belajar
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /tilawah/summary [get]
func (c *tilawahController) Summary(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	summary, err := c.svc.Summary(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, summary)
}

// @Summary Delete tilawah log
// @Tags Belajar
// @Produce json
// @Param id path int true "Tilawah log ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /tilawah/{id} [delete]
func (c *tilawahController) Delete(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if err := c.svc.Delete(id, userID); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
