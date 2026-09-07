package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type KajianBookmarkController interface {
	Add(ctx *fiber.Ctx) error
	Remove(ctx *fiber.Ctx) error
	ListMine(ctx *fiber.Ctx) error
	ChunkIDs(ctx *fiber.Ctx) error
}

type kajianBookmarkController struct{ svc service.KajianBookmarkService }

func NewKajianBookmarkController(services *service.Services) KajianBookmarkController {
	return &kajianBookmarkController{services.KajianBookmark}
}

// @Summary Bookmark a kajian transcript chunk (synced across devices)
// @Tags Belajar
// @Accept json
// @Produce json
// @Param body body model.CreateKajianBookmarkRequest true "Bookmark payload"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /kajian/bookmarks [post]
func (c *kajianBookmarkController) Add(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.CreateKajianBookmarkRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if req.ChunkID == 0 {
		return lib.ErrorBadRequest(ctx, "chunk_id wajib diisi")
	}
	inserted, err := c.svc.Add(userID, req.ChunkID, req.KajianID, req.Note)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{
		"chunk_id": req.ChunkID,
		"inserted": inserted,
	})
}

// @Summary Remove bookmark for a chunk
// @Tags Belajar
// @Param chunk_id path int true "Chunk ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /kajian/bookmarks/{chunk_id} [delete]
func (c *kajianBookmarkController) Remove(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	chunkID, err := strconv.Atoi(ctx.Params("chunk_id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid chunk_id")
	}
	if err := c.svc.Remove(userID, chunkID); err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx)
}

// @Summary List my synced kajian bookmarks
// @Tags Belajar
// @Param limit query int false "Limit (default 200, max 500)"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /kajian/bookmarks/me [get]
func (c *kajianBookmarkController) ListMine(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	limit, _ := strconv.Atoi(ctx.Query("limit", "200"))
	items, err := c.svc.ListByUser(userID, limit)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{
		"items": items,
		"meta": fiber.Map{
			"total": len(items),
		},
	})
}

// @Summary Get my bookmarked chunk IDs for one kajian
// @Tags Belajar
// @Param kajian_id query int false "Filter to a single kajian (0 = all)"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /kajian/bookmarks/ids [get]
func (c *kajianBookmarkController) ChunkIDs(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	kajianID, _ := strconv.Atoi(ctx.Query("kajian_id", "0"))
	ids, err := c.svc.ChunkIDsByUser(userID, kajianID)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"chunk_ids": ids})
}
