package middlewares

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ctxKey string

const RequestIDKey ctxKey = "request_id"

func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := c.Get("X-Request-ID")
		if id == "" {
			id = uuid.New().String()
		}
		c.Locals(string(RequestIDKey), id)
		c.Response().Header.Set("X-Request-ID", id)
		return c.Next()
	}
}

func GetRequestID(c *fiber.Ctx) string {
	if id, ok := c.Locals(string(RequestIDKey)).(string); ok {
		return id
	}
	return ""
}

func StructuredLog() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		status := c.Response().StatusCode()
		reqID := GetRequestID(c)
		slog.Info("request",
			"method", c.Method(),
			"path", c.Path(),
			"status", status,
			"latency_ms", time.Since(start).Milliseconds(),
			"request_id", reqID,
		)
		return err
	}
}
