package controllers

import (
	"errors"
	"strconv"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/gofiber/fiber/v2"
)

type ContentAuditLogController interface {
	FindAll(ctx *fiber.Ctx) error
	Export(ctx *fiber.Ctx) error
}

type contentAuditLogController struct {
	repo repository.ContentAuditLogRepository
}

func NewContentAuditLogController(repos *repository.Repositories) ContentAuditLogController {
	if repos == nil || repos.ContentAuditLog == nil {
		return &contentAuditLogController{}
	}
	return &contentAuditLogController{repo: repos.ContentAuditLog}
}

// @Summary List content audit logs (admin)
// @Tags Admin
// @Produce json
// @Param target_type query string false "Filter by target_type"
// @Param page query int false "Page"
// @Param limit query int false "Limit"
// @Success 200 {object} lib.Response
// @Router /admin/audit-logs [get]
func (c *contentAuditLogController) FindAll(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil || claims["role"] != string(model.RoleAdmin) {
		return lib.ErrorForbidden(ctx)
	}
	if c.repo == nil {
		return lib.OK(ctx, fiber.Map{"items": []model.ContentAuditLog{}, "total": 0, "page": 1, "limit": 20})
	}
	targetType := ctx.Query("target_type")
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	limit, _ := strconv.Atoi(ctx.Query("limit", "20"))
	items, total, err := c.repo.FindAll(targetType, page, limit)
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

// @Summary Export content audit logs as CSV (admin)
// @Tags Admin
// @Produce text/csv
// @Param target_type query string false "Filter by target_type"
// @Success 200 {string} string "CSV"
// @Router /admin/audit-logs/export [get]
func (c *contentAuditLogController) Export(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil || claims["role"] != string(model.RoleAdmin) {
		return lib.ErrorForbidden(ctx)
	}
	if c.repo == nil {
		return lib.ErrorBadRequest(ctx, errors.New("audit log repository unavailable"))
	}
	targetType := ctx.Query("target_type")
	items, _, err := c.repo.FindAll(targetType, 1, 1000)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	csv := "id,target_type,target_id,target_title,field,old_value,new_value,modified_by,modifier_name,reason,created_at\n"
	for _, it := range items {
		modifierName := ""
		if it.Modifier != nil && it.Modifier.Name != nil {
			modifierName = *it.Modifier.Name
		}
		csv += escapeCSV(it.ID.String()) + "," +
			escapeCSV(string(it.TargetType)) + "," +
			escapeCSV(it.TargetID) + "," +
			escapeCSV(it.TargetTitle) + "," +
			escapeCSV(it.Field) + "," +
			escapeCSV(it.OldValue) + "," +
			escapeCSV(it.NewValue) + "," +
			escapeCSV(it.ModifiedBy.String()) + "," +
			escapeCSV(modifierName) + "," +
			escapeCSV(it.Reason) + "," +
			escapeCSV(it.CreatedAt.Format("2006-01-02 15:04:05")) + "\n"
	}
	ctx.Set("Content-Type", "text/csv")
	ctx.Set("Content-Disposition", "attachment; filename=content-audit-logs.csv")
	return ctx.SendString(csv)
}

func escapeCSV(s string) string {
	if s == "" {
		return ""
	}
	if strings.ContainsAny(s, ",\"\n\r") {
		s = "\"" + strings.ReplaceAll(s, "\"", "\"\"") + "\""
	}
	return s
}
