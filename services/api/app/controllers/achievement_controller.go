package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type AchievementController interface {
	GetAll(ctx *fiber.Ctx) error
	GetMine(ctx *fiber.Ctx) error
	GetMyPoints(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type achievementController struct {
	svc service.AchievementService
}

func NewAchievementController(services *service.Services) AchievementController {
	return &achievementController{services.Achievement}
}

// @Summary Get all achievements
// @Tags Personal
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /achievements [get]
func (c *achievementController) GetAll(ctx *fiber.Ctx) error {
	list, err := c.svc.GetAll()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, list)
}

// @Summary Get my earned achievements
// @Tags Personal
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /achievements/mine [get]
func (c *achievementController) GetMine(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	list, err := c.svc.GetUserAchievements(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, list)
}

// @Summary Get my achievement points
// @Tags Personal
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /achievements/points [get]
func (c *achievementController) GetMyPoints(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	pts, err := c.svc.GetUserPoints(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, pts)
}

// @Summary Create achievement (admin)
// @Tags Personal
// @Accept json
// @Produce json
// @Param body body model.Achievement true "Achievement"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /achievements [post]
func (c *achievementController) Create(ctx *fiber.Ctx) error {
	a := new(model.Achievement)
	if err := lib.BodyParser(ctx, a); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	created, err := c.svc.Create(a)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, created)
}

// @Summary Update achievement (admin)
// @Tags Personal
// @Accept json
// @Produce json
// @Param id path int true "Achievement ID"
// @Param body body model.Achievement true "Achievement"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /achievements/{id} [put]
func (c *achievementController) Update(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	a := new(model.Achievement)
	if err := lib.BodyParser(ctx, a); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	updated, err := c.svc.Update(id, a)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, updated)
}

// @Summary Delete achievement (admin)
// @Tags Personal
// @Param id path int true "Achievement ID"
// @Success 200 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /achievements/{id} [delete]
func (c *achievementController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
