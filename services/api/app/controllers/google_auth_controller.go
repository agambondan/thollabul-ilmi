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
	"github.com/spf13/viper"
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
		redirect = "https://api.thollabulilmi.site/api/v1/auth/google/callback"
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
		Secure:   viper.GetString("ENVIRONMENT") == "production",
		SameSite: "Lax",
	})
	source := ctx.Query("source")
	if source == "mobile" {
		ctx.Cookie(&fiber.Cookie{
			Name:     "google_oauth_source",
			Value:    "mobile",
			Path:     "/",
			Expires:  time.Now().Add(10 * time.Minute),
			HTTPOnly: true,
			Secure:   viper.GetString("ENVIRONMENT") == "production",
			SameSite: "Lax",
		})
	}
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
		Secure:   viper.GetString("ENVIRONMENT") == "production",
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
	if !profile.VerifiedEmail {
		// An unverified email is not proof of ownership — trusting it here
		// would let anyone claim a victim's address and take over (or create)
		// the matching local account.
		return c.renderErrorPage(ctx, "google account email is not verified")
	}

	loginResp, err := c.user.FindOrCreateOAuthUser(profile.Email, profile.Name, profile.Picture, "google", profile.ID)
	if err != nil {
		return c.renderErrorPage(ctx, fmt.Sprintf("user provisioning failed: %v", err))
	}

	setAuthCookies(ctx, loginResp.Token, loginResp.RefreshToken)

	source := ctx.Cookies("google_oauth_source")
	if source == "mobile" {
		ctx.Cookie(&fiber.Cookie{
			Name:     "google_oauth_source",
			Value:    "",
			Path:     "/",
			Expires:  time.Now().Add(-1 * time.Hour),
			HTTPOnly: true,
			Secure:   viper.GetString("ENVIRONMENT") == "production",
			SameSite: "Lax",
		})
		mobileRedirect := "thullaabulilmi://auth/google/callback"
		u, _ := url.Parse(mobileRedirect)
		q := u.Query()
		q.Set("token", loginResp.Token)
		q.Set("refresh_token", loginResp.RefreshToken)
		if loginResp.User != nil {
			if loginResp.User.Name != nil {
				q.Set("name", *loginResp.User.Name)
			}
			if loginResp.User.Email != nil {
				q.Set("email", *loginResp.User.Email)
			}
		}
		u.RawQuery = q.Encode()
		return ctx.Redirect(u.String(), fiber.StatusTemporaryRedirect)
	}

	frontend := os.Getenv("FRONTEND_URL")
	if frontend == "" {
		frontend = "https://thollabulilmi.site"
	}
	return ctx.Redirect(frontend+"/auth/google/callback", fiber.StatusTemporaryRedirect)
}

func (c *googleAuthController) renderErrorPage(ctx *fiber.Ctx, msg string) error {
	frontend := os.Getenv("FRONTEND_URL")
	if frontend == "" {
		frontend = "https://thollabulilmi.site"
	}
	u, _ := url.Parse(frontend + "/auth/google/callback")
	q := u.Query()
	q.Set("error", msg)
	u.RawQuery = q.Encode()
	return ctx.Redirect(u.String(), fiber.StatusTemporaryRedirect)
}

// VerifyToken handles native Google Sign-in ID token or Access token verification
// POST /auth/google/token
func (c *googleAuthController) VerifyToken(ctx *fiber.Ctx) error {
	var req struct {
		IDToken     string `json:"id_token"`
		AccessToken string `json:"access_token"`
	}
	if err := ctx.BodyParser(&req); err != nil || (req.IDToken == "" && req.AccessToken == "") {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "id_token or access_token is required",
		})
	}

	var profile struct {
		Sub           string `json:"sub"`
		Email         string `json:"email"`
		EmailVerified any    `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
	}

	var verifyURL string
	if req.IDToken != "" {
		verifyURL = "https://oauth2.googleapis.com/tokeninfo?id_token=" + url.QueryEscape(req.IDToken)
	} else {
		verifyURL = "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + url.QueryEscape(req.AccessToken)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(verifyURL)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": fmt.Sprintf("google token verification request failed: %v", err),
		})
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid google token",
		})
	}

	if err := json.Unmarshal(body, &profile); err != nil || profile.Email == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "failed to extract google profile",
		})
	}

	isVerified := false
	switch v := profile.EmailVerified.(type) {
	case bool:
		isVerified = v
	case string:
		isVerified = v == "true"
	default:
		isVerified = true
	}

	if !isVerified {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "google account email is not verified",
		})
	}

	loginResp, err := c.user.FindOrCreateOAuthUser(profile.Email, profile.Name, profile.Picture, "google", profile.Sub)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("user provisioning failed: %v", err),
		})
	}

	setAuthCookies(ctx, loginResp.Token, loginResp.RefreshToken)

	return ctx.JSON(fiber.Map{
		"token":         loginResp.Token,
		"refresh_token": loginResp.RefreshToken,
		"user":          loginResp.User,
	})
}
