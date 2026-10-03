package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type NoteController interface {
	FindAll(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type noteController struct{ svc service.NoteService }

func NewNoteController(services *service.Services) NoteController {
	return &noteController{services.Note}
}

// @Summary Get all notes
// @Tags Belajar
// @Produce json
// @Param ref_type query string false "Filter by reference type"
// @Param ref_id query int false "Filter by reference ID"
// @Param ref_slug query string false "Filter by reference slug (article)"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /notes [get]
func (c *noteController) FindAll(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	refType := model.NoteRefType(ctx.Query("ref_type"))
	refID, _ := strconv.Atoi(ctx.Query("ref_id"))
	refSlug := ctx.Query("ref_slug")
	items, err := c.svc.FindByUser(userID, refType, refID, refSlug)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, items)
}

// @Summary Create note
// @Tags Belajar
// @Accept json
// @Produce json
// @Param body body model.CreateNoteRequest true "Note data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /notes [post]
func (c *noteController) Create(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.CreateNoteRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if req.RefType == model.NoteRefTypeArticle {
		if req.RefSlug == nil || *req.RefSlug == "" {
			return lib.ErrorBadRequest(ctx, "ref_slug is required for article notes")
		}
	} else if req.RefID <= 0 {
		return lib.ErrorBadRequest(ctx, "ref_id is required")
	}
	item, err := c.svc.Create(userID, req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, item)
}

// @Summary Update note
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Note ID"
// @Param body body model.UpdateNoteRequest true "Update data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Router /notes/{id} [put]
func (c *noteController) Update(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "id tidak valid")
	}
	req := new(model.UpdateNoteRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.Update(id, userID, req)
	if err != nil {
		return lib.ErrorForbidden(ctx, "akses ditolak atau catatan tidak ditemukan")
	}
	return lib.OK(ctx, item)
}

// @Summary Delete note
// @Tags Belajar
// @Produce json
// @Param id path int true "Note ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /notes/{id} [delete]
func (c *noteController) Delete(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "id tidak valid")
	}
	if err := c.svc.Delete(id, userID); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, nil)
}
