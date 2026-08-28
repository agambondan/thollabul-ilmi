package middlewares

import (
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func CacheControl(maxAge int) fiber.Handler {
	return func(c *fiber.Ctx) error {
		if err := c.Next(); err != nil {
			return err
		}

		if c.Method() != "GET" {
			return nil
		}

		if c.Response().StatusCode() >= 400 {
			return nil
		}

		c.Response().Header.Set("Cache-Control", "public, max-age="+strconv.Itoa(maxAge))
		c.Response().Header.Set("Vary", "Accept-Language, Accept-Encoding")
		return nil
	}
}

func NoCache() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if err := c.Next(); err != nil {
			return err
		}
		c.Response().Header.Set("Cache-Control", "no-store, no-cache, must-revalidate")
		return nil
	}
}

func CacheByType(staticMaxAge, dynamicMaxAge int) fiber.Handler {
	staticPrefixes := []string{
		"/api/v1/surah", "/api/v1/juz", "/api/v1/asmaul-husna",
		"/api/v1/doa", "/api/v1/dzikir", "/api/v1/fiqh",
		"/api/v1/manasik", "/api/v1/books", "/api/v1/themes", "/api/v1/chapters",
		"/api/v1/hijri", "/api/v1/dictionary", "/api/v1/perawi", "/api/v1/tafsir",
		"/api/v1/siroh", "/api/v1/kajian", "/api/v1/asbabun-nuzul", "/api/v1/history",
		"/api/v1/tokoh-tarikh", "/api/v1/jarh-tadil",
	}
	privatePrefixes := []string{
		"/api/v1/auth", "/api/v1/users", "/api/v1/dashboard",
		"/api/v1/bookmarks", "/api/v1/progress", "/api/v1/hafalan", "/api/v1/streak",
		"/api/v1/notifications", "/api/v1/feed", "/api/v1/stats", "/api/v1/tilawah",
		"/api/v1/dzikir/log", "/api/v1/achievements/mine", "/api/v1/achievements/points",
		"/api/v1/zakat/kalkulasi", "/api/v1/faraidh/simpan", "/api/v1/sholat",
		"/api/v1/murojaah", "/api/v1/user-wird", "/api/v1/muhasabah", "/api/v1/goals",
		"/api/v1/quiz/stats", "/api/v1/notes", "/api/v1/developer", "/api/v1/leaderboard/me",
	}

	return func(c *fiber.Ctx) error {
		if err := c.Next(); err != nil {
			return err
		}

		path := c.Path()
		status := c.Response().StatusCode()
		if c.Method() != fiber.MethodGet || status < 200 || status >= 400 {
			return nil
		}
		if c.Get(fiber.HeaderAuthorization) != "" || c.Get(fiber.HeaderCookie) != "" {
			return nil
		}
		if c.Response().Header.Peek(fiber.HeaderCacheControl) != nil {
			return nil
		}
		for _, prefix := range privatePrefixes {
			if strings.HasPrefix(path, prefix) {
				return nil
			}
		}

		maxAge := dynamicMaxAge
		for _, prefix := range staticPrefixes {
			if strings.HasPrefix(path, prefix) {
				maxAge = staticMaxAge
				break
			}
		}
		c.Response().Header.Set("Cache-Control", "public, max-age="+strconv.Itoa(maxAge))
		c.Response().Header.Set("Vary", "Accept-Language, Accept-Encoding")
		c.Response().Header.Set("X-Cache-TTL", strconv.Itoa(maxAge))
		return nil
	}
}

func init() {
	_ = time.Now
}
