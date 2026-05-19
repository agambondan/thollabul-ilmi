package controllers

import (
	"strconv"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type FiqhController interface {
	FindAllCategories(ctx *fiber.Ctx) error
	FindAllItems(ctx *fiber.Ctx) error
	FindCategoryBySlug(ctx *fiber.Ctx) error
	FindItemBySlug(ctx *fiber.Ctx) error
	FindItemByCategoryAndID(ctx *fiber.Ctx) error
	CreateCategory(ctx *fiber.Ctx) error
	UpdateCategory(ctx *fiber.Ctx) error
	DeleteCategory(ctx *fiber.Ctx) error
	CreateItem(ctx *fiber.Ctx) error
	UpdateItem(ctx *fiber.Ctx) error
	DeleteItem(ctx *fiber.Ctx) error
}

type fiqhController struct {
	svc service.FiqhService
}

type fiqhAdminItemRequest struct {
	Category   string `json:"category" validate:"required"`
	CategoryID int    `json:"category_id"`
	Title      string `json:"title" validate:"required"`
	Slug       string `json:"slug" validate:"required"`
	Content    string `json:"content" validate:"required"`
	Source     string `json:"source"`
	Dalil      string `json:"dalil"`
	SortOrder  int    `json:"sort_order"`
}

type fiqhAdminItemResponse struct {
	ID         *int   `json:"id,omitempty"`
	CategoryID *int   `json:"category_id,omitempty"`
	Category   string `json:"category"`
	Title      string `json:"title"`
	Slug       string `json:"slug"`
	Content    string `json:"content"`
	Source     string `json:"source"`
	Dalil      string `json:"dalil"`
	SortOrder  int    `json:"sort_order"`
}

func NewFiqhController(services *service.Services) FiqhController {
	return &fiqhController{services.Fiqh}
}

// FindAll get all fiqh categories
// @Summary Get all fiqh categories
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /fiqh [get]
func (c *fiqhController) FindAllCategories(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}
	list, err := c.svc.FindAllCategories(lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	list, hasMore := lib.TrimPaginationItems(list, limit)
	lang := lib.GetPreferredLang(ctx)
	for i := range list {
		if list[i].Translation != nil {
			list[i].Translation.FilterByLang(lang)
		}
	}
	return lib.OKPaginated(ctx, list, limit, offset, hasMore)
}

// FindItems get all fiqh items (admin)
// @Summary Get all fiqh items (admin)
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /fiqh/items [get]
func (c *fiqhController) FindAllItems(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 500 {
		limit = 500
	}
	list, err := c.svc.FindAllItems(limit, offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	result := make([]fiqhAdminItemResponse, 0, len(list))
	for i := range list {
		result = append(result, fiqhItemToAdminResponse(&list[i]))
	}
	return lib.OK(ctx, fiber.Map{"items": result})
}

// FindCategoryBySlug get fiqh category by slug
// @Summary Get fiqh category by slug
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param slug path string true "Category slug"
// @Param limit query int false "Limit"
// @Param offset query int false "Offset"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /fiqh/categories/{slug} [get]
func (c *fiqhController) FindCategoryBySlug(ctx *fiber.Ctx) error {
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}
	cat, err := c.svc.FindCategoryBySlug(ctx.Params("slug"), lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	items, hasMore := lib.TrimPaginationItems(cat.Items, limit)
	cat.Items = items
	lang := lib.GetPreferredLang(ctx)
	if cat.Translation != nil {
		cat.Translation.FilterByLang(lang)
	}
	for i := range cat.Items {
		if cat.Items[i].Translation != nil {
			cat.Items[i].Translation.FilterByLang(lang)
		}
	}
	if lib.WantsPaginationMeta(ctx) {
		return lib.OK(ctx, fiber.Map{
			"items": cat.Items,
			"meta": fiber.Map{
				"category":    cat,
				"limit":       limit,
				"offset":      offset,
				"has_more":    hasMore,
				"next_offset": lib.OptionalNextOffset(limit, offset, hasMore),
			},
		})
	}
	return lib.OK(ctx, cat)
}

// FindItemBySlug get fiqh item by slug
// @Summary Get fiqh item by slug
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param slug path string true "Item slug"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /fiqh/item/{slug} [get]
func (c *fiqhController) FindItemBySlug(ctx *fiber.Ctx) error {
	item, err := c.svc.FindItemBySlug(ctx.Params("slug"))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	if item.Translation != nil {
		item.Translation.FilterByLang(lib.GetPreferredLang(ctx))
	}
	return lib.OK(ctx, item)
}

// FindBySlugId get fiqh item by category slug and ID
// @Summary Get fiqh item by category slug and ID
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param slug path string true "Category slug"
// @Param id path int true "Item ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /fiqh/{slug}/{id} [get]
func (c *fiqhController) FindItemByCategoryAndID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	item, err := c.svc.FindItemByCategoryAndID(ctx.Params("slug"), id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	if item.Translation != nil {
		item.Translation.FilterByLang(lib.GetPreferredLang(ctx))
	}
	return lib.OK(ctx, item)
}

// CreateCategory create fiqh category
// @Summary Create a fiqh category (admin)
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param request body model.CreateFiqhCategoryRequest true "Category request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /fiqh/categories [post]
func (c *fiqhController) CreateCategory(ctx *fiber.Ctx) error {
	req := new(model.CreateFiqhCategoryRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	cat, err := c.svc.CreateCategory(req)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, cat)
}

// UpdateCategory update fiqh category
// @Summary Update a fiqh category (admin)
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Param request body model.CreateFiqhCategoryRequest true "Category request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /fiqh/categories/{id} [put]
func (c *fiqhController) UpdateCategory(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(model.CreateFiqhCategoryRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	cat, err := c.svc.UpdateCategory(id, req)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, cat)
}

// DeleteCategory delete fiqh category
// @Summary Delete a fiqh category (admin)
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /fiqh/categories/{id} [delete]
func (c *fiqhController) DeleteCategory(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteCategory(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

// CreateItem create fiqh item
// @Summary Create a fiqh item (admin)
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param request body fiqhAdminItemRequest true "Fiqh item request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /fiqh/items [post]
func (c *fiqhController) CreateItem(ctx *fiber.Ctx) error {
	req := new(fiqhAdminItemRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	itemReq, err := c.fiqhAdminRequestToCreateItem(req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err.Error())
	}
	item, err := c.svc.CreateItem(itemReq)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, fiqhItemToAdminResponse(item))
}

// UpdateItem update fiqh item
// @Summary Update a fiqh item (admin)
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param id path int true "Item ID"
// @Param request body fiqhAdminItemRequest true "Fiqh item request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /fiqh/items/{id} [put]
func (c *fiqhController) UpdateItem(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(fiqhAdminItemRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	itemReq, err := c.fiqhAdminRequestToCreateItem(req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err.Error())
	}
	item, err := c.svc.UpdateItem(id, itemReq)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, fiqhItemToAdminResponse(item))
}

// DeleteItem delete fiqh item
// @Summary Delete a fiqh item (admin)
// @Tags Ibadah, Fiqh
// @Accept json
// @Produce json
// @Param id path int true "Item ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /fiqh/items/{id} [delete]
func (c *fiqhController) DeleteItem(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteItem(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

func (c *fiqhController) fiqhAdminRequestToCreateItem(req *fiqhAdminItemRequest) (*model.CreateFiqhItemRequest, error) {
	categoryID := req.CategoryID
	if categoryID == 0 && req.Category != "" {
		cat, err := c.svc.FindCategoryBySlug(req.Category, 0, 0)
		if err != nil {
			return nil, err
		}
		if cat.ID != nil {
			categoryID = *cat.ID
		}
	}
	if categoryID == 0 {
		return nil, fiber.NewError(fiber.StatusBadRequest, "category is required")
	}
	slug := strings.TrimSpace(req.Slug)
	if slug == "" {
		slug = strings.ToLower(strings.ReplaceAll(strings.TrimSpace(req.Title), " ", "-"))
	}
	return &model.CreateFiqhItemRequest{
		CategoryID: categoryID,
		Title:      req.Title,
		Slug:       slug,
		Content:    req.Content,
		Source:     req.Source,
		Dalil:      req.Dalil,
		SortOrder:  req.SortOrder,
	}, nil
}

func fiqhItemToAdminResponse(item *model.FiqhItem) fiqhAdminItemResponse {
	category := ""
	if item.Category != nil {
		category = item.Category.Slug
	}
	return fiqhAdminItemResponse{
		ID:         item.ID,
		CategoryID: item.CategoryID,
		Category:   category,
		Title:      item.Title,
		Slug:       item.Slug,
		Content:    item.Content,
		Source:     item.Source,
		Dalil:      item.Dalil,
		SortOrder:  item.SortOrder,
	}
}
