package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type KajianController interface {
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
	SearchTranscripts(ctx *fiber.Ctx) error
	GetSpeakers(ctx *fiber.Ctx) error
}

type kajianController struct {
	svc service.KajianService
}

func NewKajianController(services *service.Services) KajianController {
	return &kajianController{services.Kajian}
}

// @Summary Get all kajian with pagination
// @Tags Belajar
// @Accept json
// @Produce json
// @Param topic query string false "Filter by topic"
// @Param type query string false "Filter by type"
// @Param page query int false "Page number"
// @Param size query int false "Page size"
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /kajian [get]
func (c *kajianController) FindAll(ctx *fiber.Ctx) error {
	topic := ctx.Query("topic")
	kajianType := ctx.Query("type")
	page := c.svc.FindAll(ctx, topic, kajianType)
	lang := lib.GetPreferredLang(ctx)
	lib.ApplyToPageItems(page, func(k *model.Kajian) {
		k.Translation.FilterByLang(lang)
	})
	return lib.OK(ctx, page)
}

// @Summary Get kajian by ID
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Kajian ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /kajian/{id} [get]
func (c *kajianController) FindByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	k, err := c.svc.FindByID(id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	k.Translation.FilterByLang(lib.GetPreferredLang(ctx))
	go c.svc.IncrementView(id)
	return lib.OK(ctx, k)
}

// @Summary Create a kajian
// @Tags Belajar
// @Accept json
// @Produce json
// @Param kajian body model.CreateKajianRequest true "Kajian data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /kajian [post]
func (c *kajianController) Create(ctx *fiber.Ctx) error {
	req := new(model.CreateKajianRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	k, err := c.svc.Create(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, k)
}

// @Summary Update a kajian
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Kajian ID"
// @Param kajian body model.CreateKajianRequest true "Kajian data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /kajian/{id} [put]
func (c *kajianController) Update(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(model.CreateKajianRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	k, err := c.svc.Update(id, req)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, k)
}

// @Summary Delete a kajian
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Kajian ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /kajian/{id} [delete]
func (c *kajianController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

// @Summary Search kajian transcripts (Exact, Semantic, Hybrid)
// @Tags Belajar
// @Accept json
// @Produce json
// @Param q query string false "Search query text"
// @Param speaker query string false "Filter by ustadz/speaker name"
// @Param mode query string false "Search mode: exact | semantic | hybrid (default: hybrid)"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 20)"
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /kajian/search [get]
func (c *kajianController) SearchTranscripts(ctx *fiber.Ctx) error {
	q := ctx.Query("q")
	speaker := ctx.Query("speaker")
	mode := ctx.Query("mode", "hybrid")
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	limit, _ := strconv.Atoi(ctx.Query("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	results, total, err := c.svc.SearchTranscripts(q, speaker, mode, limit, offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}

	return lib.OK(ctx, fiber.Map{
		"items": results,
		"meta": fiber.Map{
			"page":  page,
			"limit": limit,
			"total": total,
			"mode":  mode,
			"query": q,
		},
	})
}

// @Summary Get distinct kajian speakers/ustadz list
// @Tags Belajar
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /kajian/speakers [get]
func (c *kajianController) GetSpeakers(ctx *fiber.Ctx) error {
	speakers, err := c.svc.GetSpeakers()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, speakers)
}
