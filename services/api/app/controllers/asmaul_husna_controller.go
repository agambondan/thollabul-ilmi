package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type AsmaUlHusnaController interface {
	FindAll(ctx *fiber.Ctx) error
	FindByNumber(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type asmaUlHusnaController struct {
	svc service.AsmaUlHusnaService
}

type asmaulHusnaAdminRequest struct {
	Number          int    `json:"number" validate:"required,gt=0,lte=99"`
	Arabic          string `json:"arabic" validate:"required"`
	Transliteration string `json:"transliteration" validate:"required"`
	Indonesian      string `json:"indonesian" validate:"required"`
	English         string `json:"english" validate:"required"`
	Description     string `json:"description"`
	AudioURL        string `json:"audio_url"`
}

func NewAsmaUlHusnaController(services *service.Services) AsmaUlHusnaController {
	return &asmaUlHusnaController{services.AsmaUlHusna}
}

// FindAll Asmaul Husna
// @Summary Get all Asmaul Husna
// @Tags Ibadah, Asmaul Husna
// @Accept json
// @Produce json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /asmaul-husna [get]
func (c *asmaUlHusnaController) FindAll(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 99 {
		limit = 99
	}
	list, err := c.svc.FindAll(lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	list, hasMore := lib.TrimPaginationItems(list, limit)
	lang := lib.GetPreferredLang(ctx)
	for i := range list {
		list[i].Translation.FilterByLang(lang)
	}
	return lib.OKPaginated(ctx, list, limit, offset, hasMore)
}

// FindByNumber Asmaul Husna
// @Summary Get Asmaul Husna by number
// @Tags Ibadah, Asmaul Husna
// @Accept json
// @Produce json
// @Param number path int true "Asma number (1-99)"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /asmaul-husna/{number} [get]
func (c *asmaUlHusnaController) FindByNumber(ctx *fiber.Ctx) error {
	number, err := strconv.Atoi(ctx.Params("number"))
	if err != nil || number < 1 || number > 99 {
		return lib.ErrorBadRequest(ctx, "number must be between 1 and 99")
	}
	asma, err := c.svc.FindByNumber(number)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	asma.Translation.FilterByLang(lib.GetPreferredLang(ctx))
	return lib.OK(ctx, asma)
}

func (c *asmaUlHusnaController) Create(ctx *fiber.Ctx) error {
	req := new(asmaulHusnaAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.Create(asmaulFromAdminRequest(req))
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, item)
}

func (c *asmaUlHusnaController) Update(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(asmaulHusnaAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.Update(id, asmaulFromAdminRequest(req))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, item)
}

func (c *asmaUlHusnaController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

func asmaulFromAdminRequest(req *asmaulHusnaAdminRequest) *model.AsmaUlHusna {
	return &model.AsmaUlHusna{
		Number:          req.Number,
		Arabic:          req.Arabic,
		Transliteration: req.Transliteration,
		Indonesian:      req.Indonesian,
		English:         req.English,
		Meaning:         req.Description,
		AudioURL:        req.AudioURL,
	}
}
