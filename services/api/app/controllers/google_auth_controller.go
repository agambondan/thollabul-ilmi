package controllers

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type googleAuthController struct {
	user service.UserService
}

func NewGoogleAuthController(user service.UserService) *googleAuthController {
	return &googleAuthController{user: user}
}

func (c *googleAuthController) googleOAuthConfig() *oauth2.Config {
	redirect := os.Getenv("GOOGLE_REDIRECT_URL")
	if redirect == "" {
		redirect = "https://api-thollabul.jangkauin.site/api/v1/auth/google/callback"
	}
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  redirect,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

func (c *googleAuthController) googleStateToken() string {
	b := make([]byte, 16)
	_, _ = io.ReadFull(rand.Reader, b)
	return fmt.Sprintf("%x", b)
}

// Login redirects the user to Google OAuth consent screen.
// GET /auth/google
func (c *googleAuthController) Login(ctx *fiber.Ctx) error {
	cfg := c.googleOAuthConfig()
	if cfg.ClientID == "" || cfg.ClientSecret == "" {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "google oauth not configured on server",
		})
	}
	state := c.googleStateToken()
	ctx.Cookie(&fiber.Cookie{
		Name:     "google_oauth_state",
		Value:    state,
		Path:     "/",
		Expires:  time.Now().Add(10 * time.Minute),
		HTTPOnly: true,
		SameSite: "Lax",
	})
	authURL := cfg.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	return ctx.Redirect(authURL, fiber.StatusTemporaryRedirect)
}

// Callback handles Google OAuth redirect, exchanges code, finds or creates user,
// and returns JWT tokens via redirect to frontend callback URL.
// GET /auth/google/callback
func (c *googleAuthController) Callback(ctx *fiber.Ctx) error {
	cfg := c.googleOAuthConfig()
	if cfg.ClientID == "" || cfg.ClientSecret == "" {
		return c.renderErrorPage(ctx, "google oauth not configured")
	}

	code := ctx.Query("code")
	if code == "" {
		return c.renderErrorPage(ctx, "missing authorization code")
	}
	state := ctx.Query("state")
	if state == "" {
		return c.renderErrorPage(ctx, "missing state parameter")
	}
	cookieState := ctx.Cookies("google_oauth_state")
	if cookieState == "" || state != cookieState {
		return c.renderErrorPage(ctx, "invalid oauth state")
	}
	ctx.Cookie(&fiber.Cookie{
		Name:     "google_oauth_state",
		Value:    "",
		Path:     "/",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		SameSite: "Lax",
	})

	tok, err := cfg.Exchange(context.Background(), code)
	if err != nil {
		return c.renderErrorPage(ctx, fmt.Sprintf("token exchange failed: %v", err))
	}

	client := cfg.Client(context.Background(), tok)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return c.renderErrorPage(ctx, fmt.Sprintf("userinfo request failed: %v", err))
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return c.renderErrorPage(ctx, fmt.Sprintf("userinfo http %d: %s", resp.StatusCode, string(body)))
	}

	var profile struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Picture       string `json:"picture"`
	}
	if err := json.Unmarshal(body, &profile); err != nil {
		return c.renderErrorPage(ctx, fmt.Sprintf("userinfo parse failed: %v", err))
	}
	if profile.Email == "" {
		return c.renderErrorPage(ctx, "google account has no email")
	}

	loginResp, err := c.user.FindOrCreateOAuthUser(profile.Email, profile.Name, profile.Picture, "google", profile.ID)
	if err != nil {
		return c.renderErrorPage(ctx, fmt.Sprintf("user provisioning failed: %v", err))
	}

	// Tokens travel via httpOnly cookies (same as the regular email/password
	// login), never via the redirect URL — a URL query string ends up in
	// browser history, server/proxy access logs, and any Referer header sent
	// from the landing page.
	setAuthCookies(ctx, loginResp.Token, loginResp.RefreshToken)

	frontend := os.Getenv("FRONTEND_URL")
	if frontend == "" {
		frontend = "https://thollabul.jangkauin.site"
	}
	return ctx.Redirect(frontend+"/auth/google/callback", fiber.StatusTemporaryRedirect)
}

func (c *googleAuthController) renderErrorPage(ctx *fiber.Ctx, msg string) error {
	frontend := os.Getenv("FRONTEND_URL")
	if frontend == "" {
		frontend = "https://thollabul.jangkauin.site"
	}
	u, _ := url.Parse(frontend + "/auth/google/callback")
	q := u.Query()
	q.Set("error", msg)
	u.RawQuery = q.Encode()
	return ctx.Redirect(u.String(), fiber.StatusTemporaryRedirect)
}
