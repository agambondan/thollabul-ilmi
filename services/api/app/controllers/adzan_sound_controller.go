package controllers

import (
	"fmt"
	"mime"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

type AdzanSoundController interface {
	FindMine(ctx *fiber.Ctx) error
	Upload(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type adzanSoundController struct {
	svc service.AdzanSoundService
}

func NewAdzanSoundController(services *service.Services) AdzanSoundController {
	return &adzanSoundController{svc: services.AdzanSound}
}

func (c *adzanSoundController) FindMine(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	sounds, err := c.svc.FindByUserID(userID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, sounds)
}

func (c *adzanSoundController) Upload(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	header, err := ctx.FormFile("file")
	if err != nil {
		return lib.ErrorBadRequest(ctx, "file is required")
	}
	maxBytes := viper.GetInt64("ADZAN_UPLOAD_MAX_BYTES")
	if maxBytes <= 0 {
		maxBytes = 5 * 1024 * 1024
	}
	if header.Size > maxBytes {
		return lib.ErrorBadRequest(ctx, fmt.Sprintf("file max size is %d bytes", maxBytes))
	}
	contentType, err := inferAdzanAudio(header.Filename, header.Header.Get("Content-Type"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err.Error())
	}
	file, err := header.Open()
	if err != nil {
		return lib.ErrorBadRequest(ctx, "file cannot be opened")
	}
	defer file.Close()
	objectKey := fmt.Sprintf("adzan/%s/%d-%s", userID.String(), time.Now().Unix(), safeAdzanFilename(header.Filename))
	url, err := lib.UploadPublicObject(ctx.UserContext(), objectKey, file, header.Size, contentType)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	name := strings.TrimSpace(ctx.FormValue("name"))
	if name == "" {
		name = strings.TrimSuffix(filepath.Base(header.Filename), filepath.Ext(header.Filename))
	}
	sound := &model.AdzanSound{
		UserID:    userID,
		Name:      name,
		URL:       url,
		FileName:  header.Filename,
		ObjectKey: objectKey,
	}
	if err := c.svc.Create(sound); err != nil {
		_ = lib.DeletePublicObject(ctx.UserContext(), objectKey)
		if err == service.ErrAdzanSoundLimit {
			return lib.ErrorBadRequest(ctx, "maximum 3 adzan sounds per user")
		}
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, sound)
}

func (c *adzanSoundController) Delete(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	sound, err := c.svc.Delete(id, userID)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	_ = lib.DeletePublicObject(ctx.UserContext(), sound.ObjectKey)
	return lib.OK(ctx)
}

func inferAdzanAudio(filename string, contentType string) (string, error) {
	ext := strings.ToLower(filepath.Ext(filename))
	if contentType == "" || contentType == "application/octet-stream" {
		contentType = mime.TypeByExtension(ext)
	}
	if ext != ".mp3" && ext != ".m4a" && ext != ".ogg" && ext != ".wav" {
		return "", fmt.Errorf("unsupported audio file type")
	}
	if !strings.HasPrefix(contentType, "audio/") {
		return "", fmt.Errorf("unsupported audio file type")
	}
	return contentType, nil
}

var adzanFilenameCleaner = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

func safeAdzanFilename(filename string) string {
	base := filepath.Base(filename)
	base = strings.Trim(base, ". ")
	base = adzanFilenameCleaner.ReplaceAllString(base, "-")
	if base == "" || base == "." {
		return "adzan.mp3"
	}
	return base
}
