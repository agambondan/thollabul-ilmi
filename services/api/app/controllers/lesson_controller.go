package controllers

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type LessonController interface {
	List(ctx *fiber.Ctx) error
	Get(ctx *fiber.Ctx) error
	MyProgress(ctx *fiber.Ctx) error
	SaveProgress(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type lessonController struct {
	svc service.LessonService
}

func NewLessonController(services *service.Services) LessonController {
	return &lessonController{services.Lesson}
}

// @Summary List all lesson modules
// @Tags Belajar
// @Produce json
// @Success 200 {object} lib.Response
// @Router /lessons [get]
func (c *lessonController) List(ctx *fiber.Ctx) error {
	items, err := c.svc.Modules()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"items": items})
}

// @Summary Get lesson module by slug
// @Tags Belajar
// @Produce json
// @Param slug path string true "Module slug"
// @Success 200 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /lessons/{slug} [get]
func (c *lessonController) Get(ctx *fiber.Ctx) error {
	m, err := c.svc.ModuleBySlug(ctx.Params("slug"))
	if err != nil {
		return lib.ErrorNotFound(ctx, "modul tidak ditemukan")
	}
	return lib.OK(ctx, m)
}

// @Summary Get current user's progress
// @Tags Belajar
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /lessons/progress [get]
func (c *lessonController) MyProgress(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	items, err := c.svc.GetProgress(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"items": items})
}

// @Summary Save user's lesson progress
// @Tags Belajar
// @Accept json
// @Produce json
// @Param body body model.SaveLessonProgressRequest true "Progress payload"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /lessons/progress [put]
func (c *lessonController) SaveProgress(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.SaveLessonProgressRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	p, err := c.svc.SaveProgress(userID, req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, p)
}

// @Summary Create lesson module
// @Tags Belajar, Admin
// @Accept json
// @Produce json
// @Param body body model.LessonModule true "Module payload"
// @Success 200 {object} lib.Response
// @Router /lessons [post]
func (c *lessonController) Create(ctx *fiber.Ctx) error {
	req := new(model.LessonModule)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	m, err := c.svc.CreateModule(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, m)
}

// @Summary Update lesson module
// @Tags Belajar, Admin
// @Accept json
// @Produce json
// @Param id path int true "Module ID"
// @Param body body model.LessonModule true "Module payload"
// @Success 200 {object} lib.Response
// @Router /lessons/{id} [put]
func (c *lessonController) Update(ctx *fiber.Ctx) error {
	id, _ := ctx.ParamsInt("id")
	req := new(model.LessonModule)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	m, err := c.svc.UpdateModule(id, req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, m)
}

// @Summary Delete lesson module
// @Tags Belajar, Admin
// @Produce json
// @Param id path int true "Module ID"
// @Success 200 {object} lib.Response
// @Router /lessons/{id} [delete]
func (c *lessonController) Delete(ctx *fiber.Ctx) error {
	id, _ := ctx.ParamsInt("id")
	if err := c.svc.DeleteModule(id); err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"ok": true})
}
