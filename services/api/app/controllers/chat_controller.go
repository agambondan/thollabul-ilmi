package controllers

import (
	"bufio"
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatController interface {
	List(ctx *fiber.Ctx) error
	Post(ctx *fiber.Ctx) error
	Stream(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type chatController struct {
	svc service.ChatService
}

func NewChatController(services *service.Services) ChatController {
	return &chatController{services.Chat}
}

// @Summary List latest chat messages
// @Tags Komunitas
// @Produce json
// @Param limit query int false "Limit (max 100, default 50)"
// @Success 200 {object} lib.Response
// @Router /komunitas/chat [get]
func (c *chatController) List(ctx *fiber.Ctx) error {
	limit, _ := strconv.Atoi(ctx.Query("limit", "50"))
	items, err := c.svc.Latest(limit)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"items": items})
}

// @Summary Post a chat message
// @Tags Komunitas
// @Accept json
// @Produce json
// @Param body body model.CreateChatMessageRequest true "Chat message"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /komunitas/chat [post]
func (c *chatController) Post(ctx *fiber.Ctx) error {
	req := new(model.CreateChatMessageRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	text := req.Text
	if len(text) == 0 || len(text) > 1000 {
		return lib.ErrorBadRequest(ctx, "text must be 1-1000 chars")
	}

	var userIDPtr *uuid.UUID
	author := req.Author
	if author == "" {
		author = "Anonim"
	}
	if claims, err := lib.ExtractToken(ctx); err == nil {
		if id, ok := claims["user_id"].(string); ok {
			if uid, perr := uuid.Parse(id); perr == nil {
				userIDPtr = &uid
				if name, ok := claims["name"].(string); ok && name != "" {
					author = name
				}
			}
		}
	}

	msg, err := c.svc.Post(userIDPtr, author, text)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, msg)
}

// @Summary Delete a chat message (admin only or own message)
// @Tags Komunitas
// @Param id path string true "Chat message ID"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Router /komunitas/chat/{id} [delete]
func (c *chatController) Delete(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	role, _ := claims["role"].(string)
	id := ctx.Params("id")

	// Admins moderate any message; everyone else may only delete their own, so
	// the owner id is pushed into the query rather than trusted from the client.
	var ownerID *uuid.UUID
	if role != string(model.RoleAdmin) {
		rawID, _ := claims["user_id"].(string)
		parsed, parseErr := uuid.Parse(rawID)
		if parseErr != nil {
			return lib.ErrorUnauthorized(ctx)
		}
		ownerID = &parsed
	}

	if err := c.svc.Delete(id, ownerID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return lib.ErrorForbidden(ctx)
		}
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, fiber.Map{"ok": true})
}

// @Summary SSE stream of new chat messages
// @Tags Komunitas
// @Produce text/event-stream
// @Router /komunitas/chat/stream [get]
func (c *chatController) Stream(ctx *fiber.Ctx) error {
	ctx.Set("Content-Type", "text/event-stream")
	ctx.Set("Cache-Control", "no-cache")
	ctx.Set("Connection", "keep-alive")
	ctx.Set("X-Accel-Buffering", "no")

	sub, unsub := c.svc.Subscribe()
	defer unsub()

	ctx.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		_, _ = w.WriteString(": connected\n\n")
		_ = w.Flush()

		heartbeat := time.NewTicker(15 * time.Second)
		defer heartbeat.Stop()

		for {
			select {
			case <-heartbeat.C:
				if _, err := w.WriteString(": keep-alive\n\n"); err != nil {
					return
				}
				if err := w.Flush(); err != nil {
					return
				}
			case msg, ok := <-sub:
				if !ok {
					return
				}
				payload, _ := json.Marshal(msg)
				if _, err := w.WriteString("event: message\n"); err != nil {
					return
				}
				if _, err := w.WriteString("data: " + string(payload) + "\n\n"); err != nil {
					return
				}
				if err := w.Flush(); err != nil {
					return
				}
			}
		}
	})
	return nil
}
