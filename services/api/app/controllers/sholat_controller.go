package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type SholatController interface {
	LogPrayer(ctx *fiber.Ctx) error
	GetToday(ctx *fiber.Ctx) error
	GetHistory(ctx *fiber.Ctx) error
	GetStats(ctx *fiber.Ctx) error
	GetAllGuides(ctx *fiber.Ctx) error
	GetGuideByStep(ctx *fiber.Ctx) error
	FindAllGuidesAdmin(ctx *fiber.Ctx) error
	CreateGuide(ctx *fiber.Ctx) error
	UpdateGuide(ctx *fiber.Ctx) error
	DeleteGuide(ctx *fiber.Ctx) error
}

type sholatGuideAdminRequest struct {
	Step            int    `json:"step"`
	Title           string `json:"title" validate:"required"`
	Arabic          string `json:"arabic"`
	Latin           string `json:"latin"`
	Transliteration string `json:"transliteration"`
	Translation     string `json:"translation"`
	Description     string `json:"description"`
	Notes           string `json:"notes"`
	Source          string `json:"source"`
}

type sholatGuideAdminResponse struct {
	ID              *int   `json:"id,omitempty"`
	Step            int    `json:"step"`
	Title           string `json:"title"`
	Arabic          string `json:"arabic"`
	Latin           string `json:"latin"`
	Transliteration string `json:"transliteration"`
	Translation     string `json:"translation"`
	Description     string `json:"description"`
	Notes           string `json:"notes"`
	Source          string `json:"source"`
}

type sholatController struct {
	svc service.SholatService
}

func NewSholatController(services *service.Services) SholatController {
	return &sholatController{services.Sholat}
}

// UpdateToday log today's prayer
// @Summary Log prayer for today
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Param request body model.LogSholatRequest true "Prayer log request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /sholat/today [put]
func (c *sholatController) LogPrayer(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.LogSholatRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	log, err := c.svc.LogPrayer(userID, req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, log)
}

// GetToday get today's prayer status
// @Summary Get today's prayer status
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /sholat/today [get]
func (c *sholatController) GetToday(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	status, err := c.svc.GetToday(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, status)
}

// GetHistory get prayer history
// @Summary Get prayer history
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Param from query string false "Start date YYYY-MM-DD"
// @Param to query string false "End date YYYY-MM-DD"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /sholat/history [get]
func (c *sholatController) GetHistory(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	from := ctx.Query("from")
	to := ctx.Query("to")
	logs, err := c.svc.GetHistory(userID, from, to)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, logs)
}

// GetStats get prayer statistics
// @Summary Get prayer statistics
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /sholat/stats [get]
func (c *sholatController) GetStats(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	stats, err := c.svc.GetStats(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, stats)
}

// GetPanduan get all prayer guides
// @Summary Get all prayer guides
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /panduan-sholat [get]
func (c *sholatController) GetAllGuides(ctx *fiber.Ctx) error {
	guides, err := c.svc.GetAllGuides()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range guides {
		guides[i].Translation.FilterByLang(lang)
	}
	return lib.OK(ctx, guides)
}

// GetPanduanStep get prayer guide by step
// @Summary Get prayer guide by step
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Param step path int true "Step number"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /panduan-sholat/{step} [get]
// GetPanduanStep get prayer guide by step
// @Summary Get prayer guide by step
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Param step path int true "Step number"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /panduan-sholat/{step} [get]
func (c *sholatController) GetGuideByStep(ctx *fiber.Ctx) error {
	step, err := strconv.Atoi(ctx.Params("step"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid step")
	}
	guide, err := c.svc.GetGuideByStep(step)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	guide.Translation.FilterByLang(lib.GetPreferredLang(ctx))
	return lib.OK(ctx, guide)
}

// FindAllGuidesAdmin get all prayer guides (admin)
// @Summary Get all prayer guides (admin)
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /panduan-sholat/admin [get]
func (c *sholatController) FindAllGuidesAdmin(ctx *fiber.Ctx) error {
	guides, err := c.svc.GetAllGuides()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	result := make([]sholatGuideAdminResponse, 0, len(guides))
	for i := range guides {
		result = append(result, sholatGuideToAdminResponse(&guides[i]))
	}
	return lib.OK(ctx, fiber.Map{"items": result})
}

// CreateGuide create a prayer guide step (admin)
// @Summary Create a prayer guide step (admin)
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Param request body sholatGuideAdminRequest true "Prayer guide step request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /panduan-sholat [post]
func (c *sholatController) CreateGuide(ctx *fiber.Ctx) error {
	req := new(sholatGuideAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	guide, err := c.svc.CreateGuide(sholatGuideFromAdminRequest(req))
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, sholatGuideToAdminResponse(guide))
}

// UpdateGuide update a prayer guide step
// @Summary Update a prayer guide step by ID (admin)
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Param id path int true "Prayer guide ID"
// @Param request body sholatGuideAdminRequest true "Prayer guide step request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /panduan-sholat/{id} [put]
func (c *sholatController) UpdateGuide(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(sholatGuideAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	guide, err := c.svc.UpdateGuide(id, sholatGuideFromAdminRequest(req))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, sholatGuideToAdminResponse(guide))
}

// DeleteGuide delete a prayer guide step
// @Summary Delete a prayer guide step by ID (admin)
// @Tags Ibadah, Sholat
// @Accept json
// @Produce json
// @Param id path int true "Prayer guide ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /panduan-sholat/{id} [delete]
func (c *sholatController) DeleteGuide(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteGuide(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

func sholatGuideFromAdminRequest(req *sholatGuideAdminRequest) *model.SholatGuide {
	latin := req.Transliteration
	if latin == "" {
		latin = req.Latin
	}
	return &model.SholatGuide{
		Step:            req.Step,
		Title:           req.Title,
		Description:     req.Description,
		Arabic:          req.Arabic,
		Transliteration: latin,
		TranslationText: req.Translation,
		Notes:           req.Notes,
		Source:          req.Source,
	}
}

func sholatGuideToAdminResponse(g *model.SholatGuide) sholatGuideAdminResponse {
	title := g.Title
	arabic := g.Arabic
	latin := g.Transliteration
	translation := g.TranslationText
	if g.Translation != nil {
		if title == "" && g.Translation.Idn != nil {
			title = *g.Translation.Idn
		}
		if arabic == "" && g.Translation.Ar != nil {
			arabic = *g.Translation.Ar
		}
		if latin == "" && g.Translation.LatinIdn != nil {
			latin = *g.Translation.LatinIdn
		}
		if translation == "" && g.Translation.DescriptionIdn != nil {
			translation = *g.Translation.DescriptionIdn
		}
	}
	return sholatGuideAdminResponse{
		ID:              g.ID,
		Step:            g.Step,
		Title:           title,
		Arabic:          arabic,
		Latin:           latin,
		Transliteration: latin,
		Translation:     translation,
		Description:     g.Description,
		Notes:           g.Notes,
		Source:          g.Source,
	}
}
