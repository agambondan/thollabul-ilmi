package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type ManasikController interface {
	FindAll(ctx *fiber.Ctx) error
	FindAllAdmin(ctx *fiber.Ctx) error
	FindByType(ctx *fiber.Ctx) error
	FindByStep(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type manasikController struct{ svc service.ManasikService }

type manasikAdminRequest struct {
	Type            string `json:"type" validate:"required"`
	Step            int    `json:"step"`
	StepOrder       int    `json:"step_order"`
	Title           string `json:"title" validate:"required"`
	Arabic          string `json:"arabic"`
	Latin           string `json:"latin"`
	Transliteration string `json:"transliteration"`
	Translation     string `json:"translation" validate:"required"`
	Description     string `json:"description"`
	Notes           string `json:"notes"`
	Source          string `json:"source"`
	IsWajib         bool   `json:"is_wajib"`
}

type manasikAdminResponse struct {
	ID              *int   `json:"id,omitempty"`
	Type            string `json:"type"`
	Step            int    `json:"step"`
	StepOrder       int    `json:"step_order"`
	Title           string `json:"title"`
	Arabic          string `json:"arabic"`
	Latin           string `json:"latin"`
	Transliteration string `json:"transliteration"`
	Translation     string `json:"translation"`
	Description     string `json:"description"`
	Notes           string `json:"notes"`
	Source          string `json:"source"`
	IsWajib         bool   `json:"is_wajib"`
}

func NewManasikController(services *service.Services) ManasikController {
	return &manasikController{services.Manasik}
}

// FindAll get all manasik steps
// @Summary Get all manasik steps
// @Tags Ibadah, Manasik
// @Accept json
// @Produce json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /manasik [get]
func (c *manasikController) FindAll(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}
	steps, err := c.svc.FindAll(lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	steps, hasMore := lib.TrimPaginationItems(steps, limit)
	lang := lib.GetPreferredLang(ctx)
	for i := range steps {
		if steps[i].Translation != nil {
			steps[i].Translation.FilterByLang(lang)
		}
	}
	return lib.OKPaginated(ctx, steps, limit, offset, hasMore)
}

// FindItems get all manasik items (admin)
// @Summary Get all manasik items (admin)
// @Tags Ibadah, Manasik
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /manasik/items [get]
func (c *manasikController) FindAllAdmin(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 500 {
		limit = 500
	}
	steps, err := c.svc.FindAll(limit, offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	result := make([]manasikAdminResponse, 0, len(steps))
	for i := range steps {
		result = append(result, manasikToAdminResponse(&steps[i]))
	}
	return lib.OK(ctx, fiber.Map{"items": result})
}

// FindByType get manasik steps by type
// @Summary Get manasik steps by type (haji/umrah)
// @Tags Ibadah, Manasik
// @Accept json
// @Produce json
// @Param type path string true "Manasik type (haji/umrah)"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /manasik/{type} [get]
func (c *manasikController) FindByType(ctx *fiber.Ctx) error {
	t := model.ManasikType(ctx.Params("type"))
	if t != model.ManasikTypeHaji && t != model.ManasikTypeUmrah {
		return lib.ErrorBadRequest(ctx, "type harus 'haji' atau 'umrah'")
	}
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}
	steps, err := c.svc.FindByType(t, lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	steps, hasMore := lib.TrimPaginationItems(steps, limit)
	lang := lib.GetPreferredLang(ctx)
	for i := range steps {
		if steps[i].Translation != nil {
			steps[i].Translation.FilterByLang(lang)
		}
	}
	return lib.OKPaginated(ctx, steps, limit, offset, hasMore)
}

// FindByTypeStep get manasik step by type and step number
// @Summary Get manasik step by type and step
// @Tags Ibadah, Manasik
// @Accept json
// @Produce json
// @Param type path string true "Manasik type (haji/umrah)"
// @Param step path int true "Step number"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /manasik/{type}/{step} [get]
func (c *manasikController) FindByStep(ctx *fiber.Ctx) error {
	t := model.ManasikType(ctx.Params("type"))
	if t != model.ManasikTypeHaji && t != model.ManasikTypeUmrah {
		return lib.ErrorBadRequest(ctx, "type harus 'haji' atau 'umrah'")
	}
	step, err := strconv.Atoi(ctx.Params("step"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "step harus berupa angka")
	}
	s, err := c.svc.FindByTypeAndStep(t, step)
	if err != nil {
		return lib.ErrorNotFound(ctx, "langkah tidak ditemukan")
	}
	if s.Translation != nil {
		s.Translation.FilterByLang(lib.GetPreferredLang(ctx))
	}
	return lib.OK(ctx, s)
}

// Create a manasik step
// @Summary Create a manasik step (admin)
// @Tags Ibadah, Manasik
// @Accept json
// @Produce json
// @Param request body manasikAdminRequest true "Manasik step request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /manasik [post]
func (c *manasikController) Create(ctx *fiber.Ctx) error {
	req := new(manasikAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	step, err := c.svc.Create(manasikFromAdminRequest(req))
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, manasikToAdminResponse(step))
}

// UpdateById update a manasik step
// @Summary Update a manasik step by ID (admin)
// @Tags Ibadah, Manasik
// @Accept json
// @Produce json
// @Param id path int true "Manasik step ID"
// @Param request body manasikAdminRequest true "Manasik step request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /manasik/{id} [put]
func (c *manasikController) Update(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(manasikAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	step, err := c.svc.Update(id, manasikFromAdminRequest(req))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, manasikToAdminResponse(step))
}

// DeleteById delete a manasik step
// @Summary Delete a manasik step by ID (admin)
// @Tags Ibadah, Manasik
// @Accept json
// @Produce json
// @Param id path int true "Manasik step ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /manasik/{id} [delete]
func (c *manasikController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

func manasikFromAdminRequest(req *manasikAdminRequest) *model.ManasikStep {
	stepOrder := req.StepOrder
	if stepOrder == 0 {
		stepOrder = req.Step
	}
	latin := req.Transliteration
	if latin == "" {
		latin = req.Latin
	}
	t := model.ManasikType(req.Type)
	if t != model.ManasikTypeHaji && t != model.ManasikTypeUmrah {
		t = model.ManasikTypeHaji
	}
	return &model.ManasikStep{
		Type:            t,
		StepOrder:       stepOrder,
		Title:           req.Title,
		Description:     req.Description,
		Arabic:          req.Arabic,
		Transliteration: latin,
		TranslationText: req.Translation,
		Notes:           req.Notes,
		Source:          req.Source,
		IsWajib:         req.IsWajib,
	}
}

func manasikToAdminResponse(step *model.ManasikStep) manasikAdminResponse {
	return manasikAdminResponse{
		ID:              step.ID,
		Type:            string(step.Type),
		Step:            step.StepOrder,
		StepOrder:       step.StepOrder,
		Title:           step.Title,
		Arabic:          step.Arabic,
		Latin:           step.Transliteration,
		Transliteration: step.Transliteration,
		Translation:     step.TranslationText,
		Description:     step.Description,
		Notes:           step.Notes,
		Source:          step.Source,
		IsWajib:         step.IsWajib,
	}
}
