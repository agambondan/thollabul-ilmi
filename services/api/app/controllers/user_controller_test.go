package controllers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/morkid/paginate"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestUserControllerSessionsReturnsCurrentUserSessions(t *testing.T) {
	app, db, userID := newUserControllerTestApp(t)
	now := time.Now()
	seedUserControllerRefreshToken(t, db, userID.String(), "current-refresh", now.Add(-2*time.Hour), now.Add(24*time.Hour))
	seedUserControllerRefreshToken(t, db, userID.String(), "other-refresh", now.Add(-time.Hour), now.Add(24*time.Hour))
	seedUserControllerRefreshToken(t, db, uuid.New().String(), "other-user-refresh", now.Add(-30*time.Minute), now.Add(24*time.Hour))

	req := newAuthRequest(t, fiber.MethodGet, "/auth/sessions", userID)
	req.Header.Set("X-Refresh-Token", "current-refresh")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request sessions: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}

	var sessions []model.AuthSession
	if err := json.NewDecoder(res.Body).Decode(&sessions); err != nil {
		t.Fatalf("decode sessions: %v", err)
	}
	if len(sessions) != 2 {
		t.Fatalf("expected two sessions for current user, got %d: %#v", len(sessions), sessions)
	}
	current := 0
	for _, session := range sessions {
		if session.Current {
			current++
		}
	}
	if current != 1 {
		t.Fatalf("expected exactly one current session, got %d: %#v", current, sessions)
	}
}

func TestUserControllerDeleteMeRevokesTokensAndClearsCookies(t *testing.T) {
	app, db, userID := newUserControllerTestApp(t)
	now := time.Now()
	seedUserControllerRefreshToken(t, db, userID.String(), "refresh-a", now.Add(-time.Hour), now.Add(24*time.Hour))
	seedUserControllerRefreshToken(t, db, userID.String(), "refresh-b", now.Add(-time.Minute), now.Add(24*time.Hour))

	res, err := app.Test(newAuthRequest(t, fiber.MethodDelete, "/auth/me", userID))
	if err != nil {
		t.Fatalf("request delete me: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}

	var tokens int64
	if err := db.Model(&model.RefreshToken{}).Where("user_id = ?", userID.String()).Count(&tokens).Error; err != nil {
		t.Fatalf("count refresh tokens: %v", err)
	}
	if tokens != 0 {
		t.Fatalf("expected revoked refresh tokens, got %d", tokens)
	}
	var users int64
	if err := db.Model(&model.User{}).Where("id = ?", userID).Count(&users).Error; err != nil {
		t.Fatalf("count users: %v", err)
	}
	if users != 0 {
		t.Fatalf("expected self-deleted user to be hidden, got %d active rows", users)
	}

	cleared := map[string]bool{}
	for _, cookie := range res.Cookies() {
		if (cookie.Name == "token" || cookie.Name == "refresh_token") && cookie.Value == "" {
			cleared[cookie.Name] = true
		}
	}
	if !cleared["token"] || !cleared["refresh_token"] {
		t.Fatalf("expected token cookies to be cleared, got %#v", res.Cookies())
	}
}

func TestUserControllerDeleteSessionRevokesOnlyRequestedSession(t *testing.T) {
	app, db, userID := newUserControllerTestApp(t)
	now := time.Now()
	seedUserControllerRefreshToken(t, db, userID.String(), "current-refresh", now.Add(-2*time.Hour), now.Add(24*time.Hour))
	otherID := seedUserControllerRefreshToken(t, db, userID.String(), "other-refresh", now.Add(-time.Hour), now.Add(24*time.Hour))

	req := newAuthRequest(t, fiber.MethodDelete, "/auth/sessions/"+strconv.FormatUint(uint64(otherID), 10), userID)
	req.Header.Set("X-Refresh-Token", "current-refresh")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request delete session: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}

	var tokens []model.RefreshToken
	if err := db.Order("token asc").Find(&tokens).Error; err != nil {
		t.Fatalf("find refresh tokens: %v", err)
	}
	got := map[string]bool{}
	for _, token := range tokens {
		got[token.Token] = true
	}
	if got["other-refresh"] {
		t.Fatal("expected requested refresh token to be revoked")
	}
	if !got["current-refresh"] {
		t.Fatalf("expected current refresh token to remain, got %#v", got)
	}
}

func TestUserControllerDeleteSessionRejectsCurrentSession(t *testing.T) {
	app, db, userID := newUserControllerTestApp(t)
	now := time.Now()
	currentID := seedUserControllerRefreshToken(t, db, userID.String(), "current-refresh", now.Add(-2*time.Hour), now.Add(24*time.Hour))

	req := newAuthRequest(t, fiber.MethodDelete, "/auth/sessions/"+strconv.FormatUint(uint64(currentID), 10), userID)
	req.Header.Set("X-Refresh-Token", "current-refresh")
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request delete current session: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("expected 400, got %d", res.StatusCode)
	}

	var tokens int64
	if err := db.Model(&model.RefreshToken{}).Where("token = ?", "current-refresh").Count(&tokens).Error; err != nil {
		t.Fatalf("count current token: %v", err)
	}
	if tokens != 1 {
		t.Fatalf("expected current token to remain, got %d", tokens)
	}
}

func TestUserControllerDeleteSessionRequiresCurrentRefreshToken(t *testing.T) {
	app, db, userID := newUserControllerTestApp(t)
	now := time.Now()
	otherID := seedUserControllerRefreshToken(t, db, userID.String(), "other-refresh", now.Add(-time.Hour), now.Add(24*time.Hour))

	res, err := app.Test(newAuthRequest(t, fiber.MethodDelete, "/auth/sessions/"+strconv.FormatUint(uint64(otherID), 10), userID))
	if err != nil {
		t.Fatalf("request delete session without refresh token: %v", err)
	}
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("expected 400, got %d", res.StatusCode)
	}

	var tokens int64
	if err := db.Model(&model.RefreshToken{}).Where("token = ?", "other-refresh").Count(&tokens).Error; err != nil {
		t.Fatalf("count other token: %v", err)
	}
	if tokens != 1 {
		t.Fatalf("expected session token to remain, got %d", tokens)
	}
}

func newUserControllerTestApp(t *testing.T) (*fiber.App, *gorm.DB, uuid.UUID) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.RefreshToken{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	userID := uuid.New()
	name := "Controller User"
	email := "controller@example.com"
	password := lib.PasswordEncrypt("password-123")
	if err := db.Create(&model.User{
		BaseUUID: model.BaseUUID{ID: userID},
		Name:     &name,
		Email:    &email,
		Password: &password,
		Role:     model.RoleUser,
	}).Error; err != nil {
		t.Fatalf("seed user: %v", err)
	}

	controller := NewUserController(&service.Services{
		User: service.NewUserService(repository.NewUserRepository(db, paginate.New())),
	})
	app := fiber.New()
	app.Get("/auth/sessions", controller.Sessions)
	app.Delete("/auth/sessions/:id", controller.DeleteSession)
	app.Delete("/auth/me", controller.DeleteMe)
	return app, db, userID
}

func newAuthRequest(t *testing.T, method, path string, userID uuid.UUID) *http.Request {
	t.Helper()

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID.String(),
		"email":   "controller@example.com",
		"role":    string(model.RoleUser),
		"exp":     time.Now().Add(time.Hour).Unix(),
	})
	signed, err := token.SignedString([]byte("tholabul-ilmi-secret"))
	if err != nil {
		t.Fatalf("sign token: %v", err)
	}
	req := httptest.NewRequest(method, path, nil)
	req.AddCookie(&http.Cookie{Name: "token", Value: signed})
	return req
}

func seedUserControllerRefreshToken(t *testing.T, db *gorm.DB, userID, token string, createdAt, expiresAt time.Time) uint {
	t.Helper()

	refreshToken := &model.RefreshToken{
		UserID:    userID,
		Token:     token,
		CreatedAt: createdAt,
		ExpiresAt: expiresAt,
	}
	if err := db.Create(refreshToken).Error; err != nil {
		t.Fatalf("seed refresh token %q: %v", token, err)
	}
	return refreshToken.ID
}
