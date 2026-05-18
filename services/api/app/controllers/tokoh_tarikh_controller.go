package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type TokohTarikhController interface {
	Create(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type tokohTarikhController struct{ svc service.TokohTarikhService }

func NewTokohTarikhController(services *service.Services) TokohTarikhController {
	return &tokohTarikhController{services.TokohTarikh}
}

func (c *tokohTarikhController) Create(ctx *fiber.Ctx) error {
	req := new(model.CreateTokohTarikhRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.Create(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, result)
}

func (c *tokohTarikhController) FindAll(ctx *fiber.Ctx) error {
	search := ctx.Query("q", "")
	era := ctx.Query("era", "")
	kategori := ctx.Query("kategori", "")
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	size, _ := strconv.Atoi(ctx.Query("size", "20"))
	offset := (page - 1) * size
	items, total, err := c.svc.FindAll(search, era, kategori, size, offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range items {
		if items[i].Translation != nil {
			items[i].Translation.FilterByLang(lang)
		}
	}
	return lib.OK(ctx, fiber.Map{"items": items, "total": total, "page": page, "size": size})
}

func (c *tokohTarikhController) FindByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	item, err := c.svc.FindByID(id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	if item.Translation != nil {
		item.Translation.FilterByLang(lib.GetPreferredLang(ctx))
	}
	return lib.OK(ctx, item)
}

func (c *tokohTarikhController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, fiber.Map{"message": "deleted"})
}
