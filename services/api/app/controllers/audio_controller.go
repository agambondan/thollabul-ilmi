package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type AudioController interface {
	GetManifest(ctx *fiber.Ctx) error
	FindSurahAudio(ctx *fiber.Ctx) error
	FindAyahAudio(ctx *fiber.Ctx) error
	AddSurahAudio(ctx *fiber.Ctx) error
	AddAyahAudio(ctx *fiber.Ctx) error
	DeleteSurahAudio(ctx *fiber.Ctx) error
	DeleteAyahAudio(ctx *fiber.Ctx) error
}

type audioController struct {
	svc service.AudioService
}

func NewAudioController(services *service.Services) AudioController {
	return &audioController{services.Audio}
}

// GetManifest
// @Summary Get audio manifest
// @Description Get list of qaris and surah audio mappings with URLs
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /audio/manifest [get]
// @Tags Audio
func (c *audioController) GetManifest(ctx *fiber.Ctx) error {
	manifest, err := c.svc.GetManifest()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, manifest)
}

// FindSurahAudio
// @Summary Get surah audio
// @Description Get all audio recordings for a surah
// @Accept json
// @Produce json
// @Param surahId path int true "Surah ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /audio/surah/{surahId} [get]
// @Tags Audio
func (c *audioController) FindSurahAudio(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("surahId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid surah id")
	}
	list, err := c.svc.FindSurahAudio(id)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, list)
}

// FindAyahAudio
// @Summary Get ayah audio
// @Description Get all audio recordings for a specific ayah
// @Accept json
// @Produce json
// @Param ayahId path int true "Ayah ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /audio/ayah/{ayahId} [get]
// @Tags Audio
func (c *audioController) FindAyahAudio(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("ayahId"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid ayah id")
	}
	list, err := c.svc.FindAyahAudio(id)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, list)
}

// AddSurahAudio
// @Summary Add surah audio
// @Description Add audio recording for a surah
// @Accept json
// @Produce json
// @Param body body model.SurahAudio true "Surah audio data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /audio/surah [post]
// @Tags Audio
func (c *audioController) AddSurahAudio(ctx *fiber.Ctx) error {
	a := new(model.SurahAudio)
	if err := lib.BodyParser(ctx, a); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.AddSurahAudio(a)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, result)
}

// AddAyahAudio
// @Summary Add ayah audio
// @Description Add audio recording for a specific ayah
// @Accept json
// @Produce json
// @Param body body model.AyahAudio true "Ayah audio data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /audio/ayah [post]
// @Tags Audio
func (c *audioController) AddAyahAudio(ctx *fiber.Ctx) error {
	a := new(model.AyahAudio)
	if err := lib.BodyParser(ctx, a); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.AddAyahAudio(a)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, result)
}

// DeleteSurahAudio
// @Summary Delete surah audio
// @Description Delete audio recording for a surah
// @Accept json
// @Produce json
// @Param id path int true "Surah audio ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /audio/surah/{id} [delete]
// @Tags Audio
func (c *audioController) DeleteSurahAudio(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteSurahAudio(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

// DeleteAyahAudio
// @Summary Delete ayah audio
// @Description Delete audio recording for a specific ayah
// @Accept json
// @Produce json
// @Param id path int true "Ayah audio ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /audio/ayah/{id} [delete]
// @Tags Audio
func (c *audioController) DeleteAyahAudio(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteAyahAudio(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
