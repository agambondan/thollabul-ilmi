package controllers

import (
	"bufio"
	"encoding/json"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/lib/whatsapp"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type WhatsAppController interface {
	Availability(ctx *fiber.Ctx) error
	Status(ctx *fiber.Ctx) error
	PairStream(ctx *fiber.Ctx) error
	Logout(ctx *fiber.Ctx) error
}

type whatsappController struct {
	wa *whatsapp.Manager
}

func NewWhatsAppController(services *service.Services) WhatsAppController {
	return &whatsappController{services.WhatsApp}
}

// Availability tells the (public) register form whether the WhatsApp
// verification option should be offered at all.
// @Summary Check whether WhatsApp verification is currently available
// @Tags WhatsApp
// @Produce json
// @Success 200 {object} lib.Response
// @Router /whatsapp/availability [get]
func (c *whatsappController) Availability(ctx *fiber.Ctx) error {
	available := c.wa != nil && c.wa.IsConnected()
	return lib.OK(ctx, fiber.Map{"available": available})
}

// Status returns the current pairing status for the admin panel.
// @Summary Get WhatsApp channel status
// @Tags Admin WhatsApp
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} lib.Response
// @Router /admin/whatsapp/status [get]
func (c *whatsappController) Status(ctx *fiber.Ctx) error {
	if c.wa == nil {
		return lib.OK(ctx, fiber.Map{"status": "disconnected"})
	}
	status, phone := c.wa.Status()
	resp := fiber.Map{"status": status}
	if phone != nil {
		resp["phone"] = *phone
	}
	return lib.OK(ctx, resp)
}

// PairStream starts (or resumes) QR pairing and streams status/QR updates
// over SSE until the session connects, errors, or times out.
// @Summary Stream WhatsApp QR pairing events
// @Tags Admin WhatsApp
// @Produce text/event-stream
// @Security ApiKeyAuth
// @Router /admin/whatsapp/pair-stream [get]
func (c *whatsappController) PairStream(ctx *fiber.Ctx) error {
	if c.wa == nil {
		return lib.ErrorInternal(ctx, "whatsapp manager not available")
	}

	events, err := c.wa.StartPairing(ctx.Context())
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}

	ctx.Set("Content-Type", "text/event-stream")
	ctx.Set("Cache-Control", "no-cache")
	ctx.Set("Connection", "keep-alive")
	ctx.Set("X-Accel-Buffering", "no")

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
			case evt, ok := <-events:
				if !ok {
					return
				}
				payload, _ := json.Marshal(evt)
				if _, err := w.WriteString("event: status\n"); err != nil {
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

// Logout disconnects the paired session so a different number can be paired.
// @Summary Log out the paired WhatsApp session
// @Tags Admin WhatsApp
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} lib.Response
// @Router /admin/whatsapp/logout [post]
func (c *whatsappController) Logout(ctx *fiber.Ctx) error {
	if c.wa == nil {
		return lib.ErrorInternal(ctx, "whatsapp manager not available")
	}
	if err := c.wa.Logout(ctx.Context()); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, "Logged out. You can pair a new number now.")
}
