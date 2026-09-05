package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type ContentReportController interface {
	Create(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	UpdateStatus(ctx *fiber.Ctx) error
	FindMine(ctx *fiber.Ctx) error
	ApplyCorrection(ctx *fiber.Ctx) error
}

type contentReportController struct {
	svc service.ContentReportService
}

func NewContentReportController(services *service.Services) ContentReportController {
	return &contentReportController{services.ContentReport}
}

// @Summary Submit a content correction report
// @Tags Konten
// @Accept json
// @Produce json
// @Param body body model.CreateContentReportRequest true "Report data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /reports [post]
func (c *contentReportController) Create(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.CreateContentReportRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	report, err := c.svc.Create(userID, req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, report)
}

// @Summary List content correction reports (admin)
// @Tags Admin
// @Produce json
// @Param status query string false "Filter by status"
// @Param target_type query string false "Filter by target_type"
// @Param page query int false "Page"
// @Param limit query int false "Limit"
// @Success 200 {object} lib.Response
// @Router /admin/reports [get]
func (c *contentReportController) FindAll(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil || claims["role"] != string(model.RoleAdmin) {
		return lib.ErrorForbidden(ctx)
	}
	status := model.ContentReportStatus(ctx.Query("status"))
	targetType := model.ContentReportTargetType(ctx.Query("target_type"))
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	limit, _ := strconv.Atoi(ctx.Query("limit", "20"))
	items, total, err := c.svc.FindAll(status, targetType, page, limit)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, fiber.Map{
		"items": items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// @Summary Get content report by ID (admin)
// @Tags Admin
// @Produce json
// @Param id path string true "Report ID"
// @Success 200 {object} lib.Response
// @Router /admin/reports/{id} [get]
func (c *contentReportController) FindByID(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil || claims["role"] != string(model.RoleAdmin) {
		return lib.ErrorForbidden(ctx)
	}
	report, err := c.svc.FindByID(ctx.Params("id"))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, report)
}

// @Summary Update content report status (admin)
// @Tags Admin
// @Accept json
// @Produce json
// @Param id path string true "Report ID"
// @Param body body model.UpdateContentReportStatusRequest true "Update payload"
// @Success 200 {object} lib.Response
// @Router /admin/reports/{id}/status [patch]
func (c *contentReportController) UpdateStatus(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil || claims["role"] != string(model.RoleAdmin) {
		return lib.ErrorForbidden(ctx)
	}
	reviewerID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.UpdateContentReportStatusRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	report, err := c.svc.UpdateStatus(ctx.Params("id"), reviewerID, req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, report)
}

// @Summary Apply a content correction report (admin one-click apply)
// @Tags Admin
// @Accept json
// @Produce json
// @Param id path string true "Report ID"
// @Param body body model.ApplyContentReportRequest true "Apply payload"
// @Success 200 {object} lib.Response
// @Router /admin/reports/{id}/apply [post]
func (c *contentReportController) ApplyCorrection(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil || claims["role"] != string(model.RoleAdmin) {
		return lib.ErrorForbidden(ctx)
	}
	reviewerID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.ApplyContentReportRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	report, err := c.svc.ApplyCorrection(ctx.Params("id"), reviewerID, req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, report)
}

// @Summary List my content reports
// @Tags Konten
// @Produce json
// @Param page query int false "Page"
// @Param limit query int false "Limit"
// @Success 200 {object} lib.Response
// @Router /reports/mine [get]
func (c *contentReportController) FindMine(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	limit, _ := strconv.Atoi(ctx.Query("limit", "20"))
	items, total, err := c.svc.FindMine(userID, page, limit)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, fiber.Map{
		"items": items,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
