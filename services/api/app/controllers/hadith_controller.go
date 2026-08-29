package controllers

import (
	"net/url"
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type HadithController interface {
	Create(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	FindAllKeyset(ctx *fiber.Ctx) error
	FindDaily(ctx *fiber.Ctx) error
	FindById(ctx *fiber.Ctx) error
	FindByBookSlug(ctx *fiber.Ctx) error
	FindByBookSlugNumber(ctx *fiber.Ctx) error
	FindByThemeId(ctx *fiber.Ctx) error
	FindByThemeName(ctx *fiber.Ctx) error
	FindByBookSlugThemeId(ctx *fiber.Ctx) error
	FindByChapterId(ctx *fiber.Ctx) error
	FindByBookSlugChapterId(ctx *fiber.Ctx) error
	FindByThemeIdChapterId(ctx *fiber.Ctx) error
	FindByBookSlugThemeIdChapterId(ctx *fiber.Ctx) error
	UpdateById(ctx *fiber.Ctx) error
	DeleteById(ctx *fiber.Ctx) error
}

type hadithController struct {
	hadith service.HadithService
}

// NewHadithController implements the HadithController Interface
func NewHadithController(services *service.Services) HadithController {
	return &hadithController{services.Hadith}
}

// @Summary Create a new hadith
// @Tags Hadith
// @Accept json
// @Produce json
// @Param body body model.Hadith true "Hadith data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /hadiths [post]
func (c *hadithController) Create(ctx *fiber.Ctx) error {
	data := new(model.Hadith)
	if err := lib.BodyParser(ctx, data); nil != err {
		return lib.ErrorBadRequest(ctx, err)
	}
	if _, err := c.hadith.Create(data); err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, data)
}

// @Summary Find all hadiths with keyset pagination
// @Tags Hadith
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /hadiths/keyset [get]
func (c *hadithController) FindAllKeyset(ctx *fiber.Ctx) error {
	page, err := c.hadith.FindAllKeyset(ctx)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, page)
}

// @Summary Find daily hadith
// @Tags Hadith
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /hadiths/daily [get]
func (c *hadithController) FindDaily(ctx *fiber.Ctx) error {
	hadith, err := c.hadith.FindDaily()
	if err != nil || hadith == nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, hadith)
}

// @Summary Find all hadiths
// @Tags Hadith
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Router /hadiths [get]
func (c *hadithController) FindAll(ctx *fiber.Ctx) error {
	page := c.hadith.FindAll(ctx)
	return lib.OK(ctx, page)
}

// @Summary Find hadith by ID
// @Tags Hadith
// @Accept json
// @Produce json
// @Param id path int true "Hadith ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /hadiths/{id} [get]
func (c *hadithController) FindById(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data, err := c.hadith.FindById(&id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

// @Summary Find hadiths by book slug
// @Tags Hadith
// @Accept json
// @Produce json
// @Param slug path string true "Book slug"
// @Success 200 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /hadiths/book/{slug} [get]
func (c *hadithController) FindByBookSlug(ctx *fiber.Ctx) error {
	bookSlug := ctx.Params("slug")
	var data interface{}
	var err error
	if ctx.Query("slim") == "1" {
		data, err = c.hadith.FindByBookSlugSlim(ctx, &bookSlug)
	} else {
		data, err = c.hadith.FindByBookSlug(ctx, &bookSlug)
	}
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

// @Summary Find hadith by book slug and number
// @Tags Hadith
// @Accept json
// @Produce json
// @Param slug path string true "Book slug"
// @Param number path int true "Hadith number in book"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /hadiths/book/{slug}/number/{number} [get]
func (c *hadithController) FindByBookSlugNumber(ctx *fiber.Ctx) error {
	bookSlug := ctx.Params("slug")
	number, err := strconv.Atoi(ctx.Params("number"))
	if err != nil || number < 1 {
		return lib.ErrorBadRequest(ctx, "invalid hadith number")
	}
	data, err := c.hadith.FindByBookSlugNumber(&bookSlug, &number)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

// @Summary Find hadiths by theme ID
// @Tags Hadith
// @Accept json
// @Produce json
// @Param themeId path int true "Theme ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /hadiths/theme/{themeId} [get]
func (c *hadithController) FindByThemeId(ctx *fiber.Ctx) error {
	themeId, err := strconv.Atoi(ctx.Params("themeId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data, err := c.hadith.FindByThemeId(ctx, &themeId)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

// @Summary Find hadiths by theme slug
// @Tags Hadith
// @Accept json
// @Produce json
// @Param slug path string true "Theme slug"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /hadiths/theme/slug/{slug} [get]
func (c *hadithController) FindByThemeName(ctx *fiber.Ctx) error {
	name, err := url.QueryUnescape(ctx.Params("slug"))
	if err != nil {
		return lib.ErrorBadRequest(ctx)
	}
	data, err := c.hadith.FindByThemeName(ctx, &name)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

func (c *hadithController) FindByBookSlugThemeId(ctx *fiber.Ctx) error {
	bookSlug := ctx.Params("slug")
	themeId, err := strconv.Atoi(ctx.Params("themeId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data, err := c.hadith.FindByBookSlugThemeId(ctx, &bookSlug, &themeId)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

func (c *hadithController) FindByChapterId(ctx *fiber.Ctx) error {
	chapterId, err := strconv.Atoi(ctx.Params("chapterId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data, err := c.hadith.FindByChapterId(ctx, &chapterId)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

func (c *hadithController) FindByBookSlugChapterId(ctx *fiber.Ctx) error {
	bookSlug := ctx.Params("slug")
	chapterId, err := strconv.Atoi(ctx.Params("chapterId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data, err := c.hadith.FindByBookSlugChapterId(ctx, &bookSlug, &chapterId)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

func (c *hadithController) FindByThemeIdChapterId(ctx *fiber.Ctx) error {
	chapterId, err := strconv.Atoi(ctx.Params("chapterId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	themeId, err := strconv.Atoi(ctx.Params("themeId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data, err := c.hadith.FindByThemeIdChapterId(ctx, &themeId, &chapterId)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

func (c *hadithController) FindByBookSlugThemeIdChapterId(ctx *fiber.Ctx) error {
	bookSlug := ctx.Params("slug")
	chapterId, err := strconv.Atoi(ctx.Params("chapterId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	themeId, err := strconv.Atoi(ctx.Params("themeId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data, err := c.hadith.FindByBookSlugThemeIdChapterId(ctx, &bookSlug, &themeId, &chapterId)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, data)
}

func (c *hadithController) UpdateById(ctx *fiber.Ctx) error {
	data := new(model.Hadith)
	if err := lib.BodyParser(ctx, data); nil != err {
		return lib.ErrorBadRequest(ctx, err)
	}
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if _, err = c.hadith.UpdateById(&id, data); err != nil {
		return lib.ErrorNotFound(ctx, err.Error())
	}
	return lib.OK(ctx, data)
}

func (c *hadithController) DeleteById(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	scoped := ctx.Params("scoped")
	err = c.hadith.DeleteById(&id, &scoped)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
