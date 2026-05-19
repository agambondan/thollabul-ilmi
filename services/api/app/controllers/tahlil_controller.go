package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type TahlilController interface {
	FindAll(ctx *fiber.Ctx) error
	FindByID(ctx *fiber.Ctx) error
	FindAllItems(ctx *fiber.Ctx) error
	CreateItem(ctx *fiber.Ctx) error
	UpdateItem(ctx *fiber.Ctx) error
	DeleteItem(ctx *fiber.Ctx) error
}

type tahlilController struct {
	svc service.TahlilService
}

type tahlilAdminRequest struct {
	Step            int    `json:"step"`
	Title           string `json:"title" validate:"required"`
	Arabic          string `json:"arabic" validate:"required"`
	Transliteration string `json:"transliteration"`
	Translation     string `json:"translation" validate:"required"`
	Repeat          int    `json:"repeat"`
	CollectionID    *int   `json:"collection_id" validate:"gt=0"`
	CollectionType  string `json:"collection_type" validate:"required"`
}

type tahlilAdminResponse struct {
	ID              *int   `json:"id,omitempty"`
	CollectionID    *int   `json:"collection_id,omitempty"`
	CollectionType  string `json:"collection_type,omitempty"`
	Step            int    `json:"step"`
	SortOrder       int    `json:"sort_order"`
	Title           string `json:"title"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	Translation     string `json:"translation"`
	Repeat          int    `json:"repeat"`
}

func NewTahlilController(services *service.Services) TahlilController {
	return &tahlilController{services.Tahlil}
}

// FindAll Tahlil collections
// @Summary Get all tahlil collections
// @Tags Ibadah, Tahlil
// @Accept json
// @Produce json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /tahlil [get]
func (c *tahlilController) FindAll(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}
	list, err := c.svc.FindAll(lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	list, hasMore := lib.TrimPaginationItems(list, limit)
	return lib.OKPaginated(ctx, list, limit, offset, hasMore)
}

// FindById get tahlil collection by ID
// @Summary Get tahlil collection by ID
// @Tags Ibadah, Tahlil
// @Accept json
// @Produce json
// @Param id path int true "Tahlil collection ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /tahlil/{id} [get]
func (c *tahlilController) FindByID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	col, err := c.svc.FindByID(id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, col)
}

// FindItems get all tahlil items
// @Summary Get all tahlil items (admin)
// @Tags Ibadah, Tahlil
// @Accept json
// @Produce json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /tahlil/items [get]
func (c *tahlilController) FindAllItems(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 500 {
		limit = 500
	}
	items, err := c.svc.FindAllItems(limit, offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	result := make([]tahlilAdminResponse, 0, len(items))
	for i := range items {
		result = append(result, tahlilItemToAdminResponse(&items[i]))
	}
	return lib.OK(ctx, fiber.Map{"items": result})
}

// CreateItem create a tahlil item
// @Summary Create a tahlil item (admin)
// @Tags Ibadah, Tahlil
// @Accept json
// @Produce json
// @Param request body tahlilAdminRequest true "Tahlil item request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /tahlil/items [post]
func (c *tahlilController) CreateItem(ctx *fiber.Ctx) error {
	req := new(tahlilAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.tahlilItemFromAdminRequest(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	saved, err := c.svc.CreateItem(item)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, tahlilItemToAdminResponse(saved))
}

// UpdateItem update a tahlil item
// @Summary Update a tahlil item (admin)
// @Tags Ibadah, Tahlil
// @Accept json
// @Produce json
// @Param id path int true "Tahlil item ID"
// @Param request body tahlilAdminRequest true "Tahlil item request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /tahlil/items/{id} [put]
func (c *tahlilController) UpdateItem(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(tahlilAdminRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, err := c.tahlilItemFromAdminRequest(req)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	saved, err := c.svc.UpdateItem(id, item)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, tahlilItemToAdminResponse(saved))
}

// DeleteItem delete a tahlil item
// @Summary Delete a tahlil item (admin)
// @Tags Ibadah, Tahlil
// @Accept json
// @Produce json
// @Param id path int true "Tahlil item ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /tahlil/items/{id} [delete]
func (c *tahlilController) DeleteItem(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteItem(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

func (c *tahlilController) tahlilItemFromAdminRequest(req *tahlilAdminRequest) (*model.TahlilItem, error) {
	collectionID := req.CollectionID
	if collectionID == nil {
		t := model.TahlilTypeTahlil
		if req.CollectionType != "" {
			t = model.TahlilType(req.CollectionType)
		}
		col, err := c.svc.EnsureCollection(t)
		if err != nil {
			return nil, err
		}
		collectionID = col.ID
	}
	repeat := req.Repeat
	if repeat <= 0 {
		repeat = 1
	}
	return &model.TahlilItem{
		CollectionID:    collectionID,
		SortOrder:       req.Step,
		Label:           req.Title,
		Arabic:          req.Arabic,
		Transliteration: req.Transliteration,
		TranslationText: req.Translation,
		Repeat:          repeat,
	}, nil
}

func tahlilItemToAdminResponse(item *model.TahlilItem) tahlilAdminResponse {
	return tahlilAdminResponse{
		ID:              item.ID,
		CollectionID:    item.CollectionID,
		Step:            item.SortOrder,
		SortOrder:       item.SortOrder,
		Title:           item.Label,
		Arabic:          item.Arabic,
		Transliteration: item.Transliteration,
		Translation:     item.TranslationText,
		Repeat:          item.Repeat,
	}
}
