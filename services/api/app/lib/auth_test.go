package lib

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func TestVerifyTokenRejectsMalformedAuthorizationHeader(t *testing.T) {
	app := fiber.New()
	app.Get("/protected", func(c *fiber.Ctx) error {
		if _, err := VerifyToken(c); err == nil {
			return c.SendStatus(fiber.StatusOK)
		}
		return c.SendStatus(fiber.StatusUnauthorized)
	})

	for _, header := range []string{"", "Bearer", "Token abc", "abc"} {
		req := httptest.NewRequest(fiber.MethodGet, "/protected", nil)
		if header != "" {
			req.Header.Set(fiber.HeaderAuthorization, header)
		}
		res, err := app.Test(req)
		if err != nil {
			t.Fatalf("request with %q: %v", header, err)
		}
		if res.StatusCode != fiber.StatusUnauthorized {
			t.Fatalf("expected 401 for %q, got %d", header, res.StatusCode)
		}
	}
}

func TestVerifyTokenAcceptsBearerCaseInsensitively(t *testing.T) {
	app := fiber.New()
	app.Get("/protected", func(c *fiber.Ctx) error {
		if _, err := VerifyToken(c); err != nil {
			return c.SendStatus(fiber.StatusUnauthorized)
		}
		return c.SendStatus(fiber.StatusOK)
	})

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": "user-1",
		"email":   "user@example.com",
		"role":    "user",
		"exp":     time.Now().Add(time.Hour).Unix(),
	})
	signed, err := token.SignedString([]byte("tholabul-ilmi-secret"))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}

	req := httptest.NewRequest(fiber.MethodGet, "/protected", nil)
	req.Header.Set(fiber.HeaderAuthorization, "bearer "+signed)
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request valid token: %v", err)
	}
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}
}
