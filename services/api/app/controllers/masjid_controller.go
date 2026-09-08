package controllers

import (
	"fmt"
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type MasjidController interface {
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
	FindNearby(ctx *fiber.Ctx) error
}

type masjidController struct{ svc service.MasjidService }

func NewMasjidController(services *service.Services) MasjidController {
	return &masjidController{services.Masjid}
}

func (c *masjidController) Create(ctx *fiber.Ctx) error {
	req := new(model.CreateMasjidRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	result, err := c.svc.Create(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, result)
}

func (c *masjidController) FindAll(ctx *fiber.Ctx) error {
	search := ctx.Query("q", "")
	city := ctx.Query("city", "")
	province := ctx.Query("province", "")
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	size, _ := strconv.Atoi(ctx.Query("size", "50"))
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 50
	}
	offset := (page - 1) * size
	items, total, err := c.svc.FindAll(search, city, province, size, offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"items": items, "total": total, "page": page, "size": size})
}

func (c *masjidController) FindNearby(ctx *fiber.Ctx) error {
	latStr := ctx.Query("lat", "")
	lngStr := ctx.Query("lng", "")
	if latStr == "" || lngStr == "" {
		return lib.ErrorBadRequest(ctx, "lat and lng are required query parameters")
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil || lat < -90 || lat > 90 {
		return lib.ErrorBadRequest(ctx, "lat must be between -90 and 90")
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil || lng < -180 || lng > 180 {
		return lib.ErrorBadRequest(ctx, "lng must be between -180 and 180")
	}

	radiusKm, _ := strconv.ParseFloat(ctx.Query("radius", "10"), 64)
	if radiusKm <= 0 || radiusKm > 100 {
		radiusKm = 10
	}

	limit, _ := strconv.Atoi(ctx.Query("limit", "20"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	items, total, err := c.svc.FindNearby(lat, lng, radiusKm, limit)
	if err != nil {
		return lib.ErrorInternal(ctx, fmt.Sprintf("failed to find nearby masjids: %v", err))
	}

	return lib.OK(ctx, fiber.Map{
		"items":     items,
		"total":     total,
		"radius_km": radiusKm,
		"lat":       lat,
		"lng":       lng,
	})
}

func (c *masjidController) FindByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	item, err := c.svc.FindByID(id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, item)
}

func (c *masjidController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, fiber.Map{"message": "deleted"})
}

func (c *masjidController) Update(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(model.UpdateMasjidRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.svc.Update(id, req)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, item)
}
