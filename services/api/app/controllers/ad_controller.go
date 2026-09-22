package controllers

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AdController interface {
	GetActiveAd(ctx *fiber.Ctx) error
	List(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type adController struct {
	svc service.AdService
}

func NewAdController(services *service.Services) AdController {
	return &adController{svc: services.Ad}
}

// GetActiveAd returns live ad for a slot (public)
func (c *adController) GetActiveAd(ctx *fiber.Ctx) error {
	slot := ctx.Query("slot", "banner")
	ad, err := c.svc.GetActiveBySlot(slot)
	if err != nil {
		return lib.OK(ctx, nil)
	}
	return lib.OK(ctx, ad)
}

// List returns all ads (admin)
func (c *adController) List(ctx *fiber.Ctx) error {
	ads, err := c.svc.List()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, ads)
}

// Create creates a new direct ad (admin)
func (c *adController) Create(ctx *fiber.Ctx) error {
	title := ctx.FormValue("title")
	clickURL := ctx.FormValue("click_url")
	slotType := ctx.FormValue("slot_type")
	imageURL := ctx.FormValue("image_url")

	if title == "" && clickURL == "" {
		req := new(model.CreateAdRequest)
		if err := lib.BodyParser(ctx, req); err == nil && req.Title != "" {
			ad, err := c.svc.Create(req)
			if err != nil {
				return lib.ErrorInternal(ctx)
			}
			return lib.OK(ctx, ad)
		}
	}

	req := &model.CreateAdRequest{
		Title:    title,
		ClickURL: clickURL,
		SlotType: slotType,
		ImageURL: imageURL,
	}
	if p := ctx.FormValue("priority"); p != "" {
		fmt.Sscanf(p, "%d", &req.Priority)
	}
	if v := ctx.FormValue("is_active"); v != "" {
		isActive := v != "false"
		req.IsActive = &isActive
	}
	if s := ctx.FormValue("start_at"); s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			req.StartAt = &t
		}
	}
	if e := ctx.FormValue("end_at"); e != "" {
		if t, err := time.Parse(time.RFC3339, e); err == nil {
			req.EndAt = &t
		}
	}

	if file, err := ctx.FormFile("image"); err == nil {
		const maxFileSize = 5 * 1024 * 1024
		if file.Size > maxFileSize {
			return lib.ErrorBadRequest(ctx, "image file too large (max 5MB)")
		}
		ext := strings.ToLower(filepath.Ext(file.Filename))
		allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true}
		if !allowedExts[ext] {
			return lib.ErrorBadRequest(ctx, "invalid image type (allowed: jpg, jpeg, png, webp, gif)")
		}
		src, err := file.Open()
		if err != nil {
			return lib.ErrorBadRequest(ctx, "cannot open image file")
		}
		defer src.Close()

		objectKey := fmt.Sprintf("ads/%s%s", uuid.New().String(), ext)
		uploadedURL, err := lib.UploadPublicObject(ctx.UserContext(), objectKey, src, file.Size, "image/"+strings.TrimPrefix(ext, "."))
		if err == nil && uploadedURL != "" {
			req.ImageURL = uploadedURL
		} else {
			_ = os.MkdirAll("./uploads/ads", 0755)
			localPath := fmt.Sprintf("./uploads/%s", objectKey)
			if saveErr := ctx.SaveFile(file, localPath); saveErr == nil {
				req.ImageURL = "/uploads/" + objectKey
			}
		}
	}

	if req.Title == "" || req.ClickURL == "" || req.SlotType == "" {
		return lib.ErrorBadRequest(ctx, "title, click_url, and slot_type are required")
	}

	ad, err := c.svc.Create(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, ad)
}

// Update updates an ad by ID (admin)
func (c *adController) Update(ctx *fiber.Ctx) error {
	id, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}

	req := new(model.UpdateAdRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}

	ad, err := c.svc.Update(id, req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, ad)
}

// Delete removes an ad (admin)
func (c *adController) Delete(ctx *fiber.Ctx) error {
	id, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"message": "deleted"})
}
