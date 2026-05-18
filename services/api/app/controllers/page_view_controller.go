package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PageViewController interface {
	Record(ctx *fiber.Ctx) error
	AdminSummary(ctx *fiber.Ctx) error
}

type pageViewController struct {
	svc service.PageViewService
}

func NewPageViewController(services *service.Services) PageViewController {
	return &pageViewController{services.PageView}
}

// @Summary Record page view
// @Tags Analytics
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Router /analytics/page-view [post]
func (c *pageViewController) Record(ctx *fiber.Ctx) error {
	req := new(model.CreatePageViewRequest)
	if err := ctx.BodyParser(req); err != nil {
		return lib.ErrorBadRequest(ctx)
	}

	var userID *uuid.UUID
	if parsed, err := extractUserID(ctx); err == nil {
		userID = &parsed
	}

	if err := c.svc.Record(req, ctx.IP(), ctx.Get("User-Agent"), userID); err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"tracked": true})
}

// @Summary Get admin page-view analytics summary
// @Tags Analytics
// @Produce json
// @Param days query int false "Window in days (default 14, max 90)"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Router /analytics/admin/summary [get]
func (c *pageViewController) AdminSummary(ctx *fiber.Ctx) error {
	days, _ := strconv.Atoi(ctx.Query("days", "14"))
	summary, err := c.svc.AdminSummary(days)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, summary)
}
