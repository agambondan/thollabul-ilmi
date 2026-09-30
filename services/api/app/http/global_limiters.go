package http

import (
	"net"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/spf13/viper"
)

func IsInternalCall(c *fiber.Ctx) bool {
	return c.IsProxyTrusted() && net.ParseIP(strings.TrimSpace(c.Get(clientIPHeader))) == nil
}

func isUnmetered(c *fiber.Ctx) bool {
	return c.Path() == "/metrics" || c.Path() == "/health"
}

func globalLimiters() (public fiber.Handler, internal fiber.Handler) {
	publicMax := viper.GetInt("RATE_LIMIT_GLOBAL")
	if publicMax <= 0 {
		publicMax = 300
	}
	internalMax := viper.GetInt("RATE_LIMIT_INTERNAL")
	if internalMax <= 0 {
		internalMax = 3000
	}

	public = limiter.New(limiter.Config{
		Max:               publicMax,
		Expiration:        1 * time.Minute,
		LimiterMiddleware: limiter.SlidingWindow{},
		KeyGenerator: func(c *fiber.Ctx) string {
			if uid := c.Locals("userId"); uid != nil {
				return "auth:" + uid.(string)
			}
			return "ip:" + c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error":       "too many requests",
				"retry_after": 60,
			})
		},
		Next: func(c *fiber.Ctx) bool {
			return isUnmetered(c) || IsInternalCall(c)
		},
	})

	internal = limiter.New(limiter.Config{
		Max:               internalMax,
		Expiration:        1 * time.Minute,
		LimiterMiddleware: limiter.SlidingWindow{},
		KeyGenerator: func(c *fiber.Ctx) string {
			return "internal:" + c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error":       "too many internal requests",
				"retry_after": 60,
			})
		},
		Next: func(c *fiber.Ctx) bool {
			return isUnmetered(c) || !IsInternalCall(c)
		},
	})
	return public, internal
}
