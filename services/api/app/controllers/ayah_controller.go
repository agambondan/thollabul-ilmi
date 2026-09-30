package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type AyahController interface {
	Create(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	FindAllKeyset(ctx *fiber.Ctx) error
	FindById(ctx *fiber.Ctx) error
	FindDaily(ctx *fiber.Ctx) error
	FindByNumber(ctx *fiber.Ctx) error
	FindBySurahNumber(ctx *fiber.Ctx) error
	FindByPage(ctx *fiber.Ctx) error
	FindByHizbQuarter(ctx *fiber.Ctx) error
	UpdateById(ctx *fiber.Ctx) error
	DeleteById(ctx *fiber.Ctx) error
}

type ayahController struct {
	ayah service.AyahService
}

// NewAyahController implements the AyahController Interface
func NewAyahController(services *service.Services) AyahController {
	return &ayahController{services.Ayah}
}

// Create ayah
// @Summary Create ayah
// @Description Create a new ayah entry
// @Accept json
// @Produce json
// @Param body body model.Ayah true "Ayah data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /ayah [post]
// @Tags Ayah
func (c *ayahController) Create(ctx *fiber.Ctx) error {
	data := new(model.Ayah)
	if err := lib.BodyParser(ctx, data); nil != err {
		return lib.ErrorBadRequest(ctx, err)
	}
	if data.Number == nil || data.SurahID == nil || data.TranslationID == nil {
		return lib.ErrorBadRequest(ctx, "number, surah_id, and translation_id are required")
	}
	if _, err := c.ayah.Create(data); err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, data)
}

// FindAll ayah
// @Summary List all ayah
// @Description Get paginated list of all ayah
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /ayah [get]
// @Tags Ayah
func (c *ayahController) FindAll(ctx *fiber.Ctx) error {
	page := c.ayah.FindAll(ctx)
	return lib.OK(ctx, page)
}

// FindAllKeyset ayah
// @Summary List ayah with keyset pagination
// @Description Get paginated list of ayah using keyset pagination
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /ayah/keyset [get]
// @Tags Ayah
func (c *ayahController) FindAllKeyset(ctx *fiber.Ctx) error {
	page, err := c.ayah.FindAllKeyset(ctx)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, page)
}

// FindById ayah
// @Summary Get ayah by ID
// @Description Get a single ayah by its ID
// @Accept json
// @Produce json
// @Param id path int true "Ayah ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /ayah/{id} [get]
// @Tags Ayah
func (c *ayahController) FindById(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data, err := c.ayah.FindById(&id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

// FindDaily ayah
// @Summary Get daily ayah
// @Description Get a random ayah for daily reading
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /ayah/daily [get]
// @Tags Ayah
func (c *ayahController) FindDaily(ctx *fiber.Ctx) error {
	data, err := c.ayah.FindDaily()
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

// FindByNumber ayah
// @Summary Get ayah by number
// @Description Get ayah by its number within a surah
// @Accept json
// @Produce json
// @Param number path int true "Ayah number"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /ayah/number/{number} [get]
// @Tags Ayah
func (c *ayahController) FindByNumber(ctx *fiber.Ctx) error {
	number, err := strconv.Atoi(ctx.Params("number"))
	if err != nil {
		return lib.ErrorBadRequest(ctx)
	}
	data, err := c.ayah.FindByNumber(ctx, lib.Intptr(number))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

// FindBySurahNumber ayah
// @Summary Get ayah by surah number
// @Description Get all ayah for a specific surah number
// @Accept json
// @Produce json
// @Param number path int true "Surah number"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /ayah/surah/number/{number} [get]
// @Tags Ayah
func (c *ayahController) FindBySurahNumber(ctx *fiber.Ctx) error {
	number, err := strconv.Atoi(ctx.Params("number"))
	if err != nil {
		return lib.ErrorBadRequest(ctx)
	}
	data, err := c.ayah.FindBySurahNumber(ctx, lib.Intptr(number))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

// FindByPage ayah
// @Summary Get ayah by page
// @Description Get all ayah on a specific Quran page (1-604)
// @Accept json
// @Produce json
// @Param page path int true "Page number"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /ayah/page/{page} [get]
// @Tags Ayah
func (c *ayahController) FindByPage(ctx *fiber.Ctx) error {
	page, err := strconv.Atoi(ctx.Params("page"))
	if err != nil || page < 1 || page > 604 {
		return lib.ErrorBadRequest(ctx, "page must be between 1 and 604")
	}
	data, err := c.ayah.FindByPage(page)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, fiber.Map{"items": data, "page": page})
}

// FindByHizbQuarter ayah
// @Summary Get ayah by hizb quarter
// @Description Get all ayah in a specific hizb quarter (1-240)
// @Accept json
// @Produce json
// @Param hizb path int true "Hizb quarter number"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /ayah/hizb/{hizb} [get]
// @Tags Ayah
func (c *ayahController) FindByHizbQuarter(ctx *fiber.Ctx) error {
	hizb, err := strconv.Atoi(ctx.Params("hizb"))
	if err != nil || hizb < 1 || hizb > 240 {
		return lib.ErrorBadRequest(ctx, "hizb must be between 1 and 240")
	}
	data, err := c.ayah.FindByHizbQuarter(hizb)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, fiber.Map{"items": data, "hizb_quarter": hizb})
}

// UpdateById ayah
// @Summary Update ayah
// @Description Update ayah by ID
// @Accept json
// @Produce json
// @Param id path int true "Ayah ID"
// @Param body body model.Ayah true "Ayah data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /ayah/{id} [put]
// @Tags Ayah
func (c *ayahController) UpdateById(ctx *fiber.Ctx) error {
	data := new(model.Ayah)
	if err := lib.BodyParser(ctx, data); nil != err {
		return lib.ErrorBadRequest(ctx, err)
	}
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if _, err = c.ayah.UpdateById(&id, data); err != nil {
		return lib.ErrorNotFound(ctx, err.Error())
	}
	return lib.OK(ctx, data)
}

// DeleteById ayah
// @Summary Delete ayah
// @Description Soft delete ayah by ID and scope
// @Accept json
// @Produce json
// @Param id path int true "Ayah ID"
// @Param scoped path string true "Delete scope (soft/hard)"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /ayah/{id}/{scoped} [delete]
// @Tags Ayah
func (c *ayahController) DeleteById(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	scoped := ctx.Params("scoped")
	err = c.ayah.DeleteById(&id, &scoped)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
