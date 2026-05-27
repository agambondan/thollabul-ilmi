package middlewares

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

func TestCorsAllowsDefaultDockerFrontendOrigin(t *testing.T) {
	viper.Reset()
	t.Cleanup(viper.Reset)

	app := fiber.New()
	app.Use(Cors())
	app.Get("/api/v1/surah", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest(fiber.MethodOptions, "/api/v1/surah", nil)
	req.Header.Set(fiber.HeaderOrigin, "http://localhost:23000")
	req.Header.Set(fiber.HeaderAccessControlRequestMethod, fiber.MethodGet)
	req.Header.Set(fiber.HeaderAccessControlRequestHeaders, "Authorization,Content-Type")

	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("preflight request failed: %v", err)
	}
	if resp.StatusCode != fiber.StatusNoContent {
		t.Fatalf("expected status %d, got %d", fiber.StatusNoContent, resp.StatusCode)
	}
	if got := resp.Header.Get(fiber.HeaderAccessControlAllowOrigin); got != "http://localhost:23000" {
		t.Fatalf("expected allow origin http://localhost:23000, got %q", got)
	}
	if got := resp.Header.Get(fiber.HeaderAccessControlAllowCredentials); got != "true" {
		t.Fatalf("expected allow credentials true, got %q", got)
	}

	allowMethods := resp.Header.Get(fiber.HeaderAccessControlAllowMethods)
	for _, method := range []string{fiber.MethodGet, fiber.MethodOptions} {
		if !strings.Contains(allowMethods, method) {
			t.Fatalf("expected allow methods %q to contain %q", allowMethods, method)
		}
	}

	allowHeaders := resp.Header.Get(fiber.HeaderAccessControlAllowHeaders)
	for _, header := range []string{"Authorization", "Content-Type"} {
		if !strings.Contains(allowHeaders, header) {
			t.Fatalf("expected allow headers %q to contain %q", allowHeaders, header)
		}
	}
}

func TestCacheByTypeSetsStaticCacheAfterSuccess(t *testing.T) {
	app := fiber.New()
	app.Use(CacheByType(300, 30))
	app.Get("/api/v1/tafsir/search", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"ok": true})
	})

	resp, err := app.Test(httptest.NewRequest(fiber.MethodGet, "/api/v1/tafsir/search?q=sabar", nil))
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	if got := resp.Header.Get(fiber.HeaderCacheControl); got != "public, max-age=300" {
		t.Fatalf("expected static cache header, got %q", got)
	}
	if got := resp.Header.Get("X-Cache-TTL"); got != "300" {
		t.Fatalf("expected ttl 300, got %q", got)
	}
}

func TestCacheByTypeClassifiesNewPublicContentPrefixes(t *testing.T) {
	app := fiber.New()
	app.Use(CacheByType(300, 30))
	for _, path := range []string{
		"/api/v1/asbabun-nuzul",
		"/api/v1/history",
		"/api/v1/tokoh-tarikh",
		"/api/v1/jarh-tadil",
	} {
		app.Get(path, func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{"ok": true})
		})
	}
	app.Get("/api/v1/forum/questions", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"ok": true})
	})

	for _, path := range []string{
		"/api/v1/asbabun-nuzul",
		"/api/v1/history",
		"/api/v1/tokoh-tarikh",
		"/api/v1/jarh-tadil",
	} {
		resp, err := app.Test(httptest.NewRequest(fiber.MethodGet, path, nil))
		if err != nil {
			t.Fatalf("request %s failed: %v", path, err)
		}
		if got := resp.Header.Get(fiber.HeaderCacheControl); got != "public, max-age=300" {
			t.Fatalf("expected static cache header for %s, got %q", path, got)
		}
	}

	resp, err := app.Test(httptest.NewRequest(fiber.MethodGet, "/api/v1/forum/questions", nil))
	if err != nil {
		t.Fatalf("forum request failed: %v", err)
	}
	if got := resp.Header.Get(fiber.HeaderCacheControl); got != "public, max-age=30" {
		t.Fatalf("expected dynamic cache header for forum, got %q", got)
	}
}

func TestCacheByTypeSkipsPrivateAndAuthenticatedResponses(t *testing.T) {
	app := fiber.New()
	app.Use(CacheByType(300, 30))
	app.Get("/api/v1/sholat/today", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"private": true})
	})
	app.Get("/api/v1/surah", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"public": true})
	})

	privateResp, err := app.Test(httptest.NewRequest(fiber.MethodGet, "/api/v1/sholat/today", nil))
	if err != nil {
		t.Fatalf("private request failed: %v", err)
	}
	if got := privateResp.Header.Get(fiber.HeaderCacheControl); got != "" {
		t.Fatalf("expected no private cache header, got %q", got)
	}

	authReq := httptest.NewRequest(fiber.MethodGet, "/api/v1/surah", nil)
	authReq.Header.Set(fiber.HeaderAuthorization, "Bearer token")
	authResp, err := app.Test(authReq)
	if err != nil {
		t.Fatalf("authenticated request failed: %v", err)
	}
	if got := authResp.Header.Get(fiber.HeaderCacheControl); got != "" {
		t.Fatalf("expected no authenticated cache header, got %q", got)
	}
}

func TestCacheByTypeSkipsErrorsAndExistingPolicy(t *testing.T) {
	app := fiber.New()
	app.Use(CacheByType(300, 30))
	app.Get("/api/v1/surah/error", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusInternalServerError)
	})
	app.Get("/api/v1/surah/custom", func(c *fiber.Ctx) error {
		c.Response().Header.Set(fiber.HeaderCacheControl, "no-store")
		return c.SendStatus(fiber.StatusOK)
	})

	errorResp, err := app.Test(httptest.NewRequest(fiber.MethodGet, "/api/v1/surah/error", nil))
	if err != nil {
		t.Fatalf("error request failed: %v", err)
	}
	if got := errorResp.Header.Get(fiber.HeaderCacheControl); got != "" {
		t.Fatalf("expected no error cache header, got %q", got)
	}

	customResp, err := app.Test(httptest.NewRequest(fiber.MethodGet, "/api/v1/surah/custom", nil))
	if err != nil {
		t.Fatalf("custom request failed: %v", err)
	}
	if got := customResp.Header.Get(fiber.HeaderCacheControl); got != "no-store" {
		t.Fatalf("expected existing cache header to be preserved, got %q", got)
	}
}

func TestCorsAllowsDefaultExpoWebOrigin(t *testing.T) {
	viper.Reset()
	t.Cleanup(viper.Reset)

	app := fiber.New()
	app.Use(Cors())
	app.Get("/api/v1/sholat-times", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	for _, origin := range []string{"http://localhost:19006", "http://localhost:23010", "http://127.0.0.1:23010"} {
		req := httptest.NewRequest(fiber.MethodOptions, "/api/v1/sholat-times", nil)
		req.Header.Set(fiber.HeaderOrigin, origin)
		req.Header.Set(fiber.HeaderAccessControlRequestMethod, fiber.MethodGet)
		req.Header.Set(fiber.HeaderAccessControlRequestHeaders, "Authorization,Content-Type")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("preflight request failed for %s: %v", origin, err)
		}
		if resp.StatusCode != fiber.StatusNoContent {
			t.Fatalf("expected status %d for %s, got %d", fiber.StatusNoContent, origin, resp.StatusCode)
		}
		if got := resp.Header.Get(fiber.HeaderAccessControlAllowOrigin); got != origin {
			t.Fatalf("expected allow origin %s, got %q", origin, got)
		}
		if got := resp.Header.Get(fiber.HeaderAccessControlAllowCredentials); got != "true" {
			t.Fatalf("expected allow credentials true, got %q", got)
		}
	}
}

func TestCorsAllowsDefaultExpoMetroOrigin(t *testing.T) {
	viper.Reset()
	t.Cleanup(viper.Reset)

	app := fiber.New()
	app.Use(Cors())
	app.Get("/api/v1/hadiths", func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	for _, origin := range []string{"http://localhost:8081", "http://127.0.0.1:8081"} {
		req := httptest.NewRequest(fiber.MethodOptions, "/api/v1/hadiths?size=20&page=0", nil)
		req.Header.Set(fiber.HeaderOrigin, origin)
		req.Header.Set(fiber.HeaderAccessControlRequestMethod, fiber.MethodGet)
		req.Header.Set(fiber.HeaderAccessControlRequestHeaders, "Authorization,Content-Type")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("preflight request failed for %s: %v", origin, err)
		}
		if resp.StatusCode != fiber.StatusNoContent {
			t.Fatalf("expected status %d for %s, got %d", fiber.StatusNoContent, origin, resp.StatusCode)
		}
		if got := resp.Header.Get(fiber.HeaderAccessControlAllowOrigin); got != origin {
			t.Fatalf("expected allow origin %s, got %q", origin, got)
		}
	}
}
