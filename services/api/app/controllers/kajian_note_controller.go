package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type KajianNoteController interface {
	Create(ctx *fiber.Ctx) error
	ListMine(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type kajianNoteController struct{ svc service.KajianNoteService }

func NewKajianNoteController(services *service.Services) KajianNoteController {
	return &kajianNoteController{services.KajianNote}
}

func (c *kajianNoteController) Create(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.CreateKajianNoteRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if req.KajianID <= 0 || req.StartSec < 0 || req.Content == "" {
		return lib.ErrorBadRequest(ctx, "kajian_id, start_sec, dan content wajib diisi")
	}
	if req.EndSec != nil && *req.EndSec <= req.StartSec {
		return lib.ErrorBadRequest(ctx, "end_sec harus lebih besar dari start_sec")
	}
	note, err := c.svc.Create(userID, *req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, note)
}

func (c *kajianNoteController) ListMine(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	query := model.KajianNoteListQuery{}
	if v := ctx.Query("kajian_id"); v != "" {
		id, err := strconv.Atoi(v)
		if err != nil {
			return lib.ErrorBadRequest(ctx, "invalid kajian_id")
		}
		query.KajianID = &id
	}
	query.Limit, _ = strconv.Atoi(ctx.Query("limit", "100"))
	query.Offset, _ = strconv.Atoi(ctx.Query("offset", "0"))
	items, err := c.svc.List(userID, query)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{
		"items": items,
		"meta": fiber.Map{
			"total": len(items),
		},
	})
}

func (c *kajianNoteController) Update(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(model.UpdateKajianNoteRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if req.Content == "" {
		return lib.ErrorBadRequest(ctx, "content wajib diisi")
	}
	if req.StartSec != nil && *req.StartSec < 0 {
		return lib.ErrorBadRequest(ctx, "start_sec tidak valid")
	}
	if req.StartSec != nil && req.EndSec != nil && *req.EndSec <= *req.StartSec {
		return lib.ErrorBadRequest(ctx, "end_sec harus lebih besar dari start_sec")
	}
	note, err := c.svc.Update(userID, id, *req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, note)
}

func (c *kajianNoteController) Delete(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(userID, id); err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx)
}
