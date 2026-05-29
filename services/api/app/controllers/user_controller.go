package controllers

import (
	"errors"
	"strconv"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/spf13/viper"
)

type UserController interface {
	Register(ctx *fiber.Ctx) error
	Login(ctx *fiber.Ctx) error
	Refresh(ctx *fiber.Ctx) error
	Sessions(ctx *fiber.Ctx) error
	DeleteSession(ctx *fiber.Ctx) error
	Logout(ctx *fiber.Ctx) error
	ForgotPassword(ctx *fiber.Ctx) error
	ResetPassword(ctx *fiber.Ctx) error
	Me(ctx *fiber.Ctx) error
	FindAll(ctx *fiber.Ctx) error
	FindById(ctx *fiber.Ctx) error
	UpdateProfile(ctx *fiber.Ctx) error
	UpdateById(ctx *fiber.Ctx) error
	UpdatePassword(ctx *fiber.Ctx) error
	DeleteMe(ctx *fiber.Ctx) error
	UpdateRole(ctx *fiber.Ctx) error
	DeleteById(ctx *fiber.Ctx) error
}

type userController struct {
	user service.UserService
}

func NewUserController(services *service.Services) UserController {
	return &userController{services.User}
}

func setAuthCookies(ctx *fiber.Ctx, accessToken, refreshToken string) {
	secure := viper.GetString("ENVIRONMENT") == "production"
	ctx.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    accessToken,
		Path:     "/",
		HTTPOnly: true,
		Secure:   secure,
		SameSite: "Lax",
		Expires:  time.Now().Add(24 * time.Hour),
	})
	if refreshToken != "" {
		ctx.Cookie(&fiber.Cookie{
			Name:     "refresh_token",
			Value:    refreshToken,
			Path:     "/",
			HTTPOnly: true,
			Secure:   secure,
			SameSite: "Lax",
			Expires:  time.Now().Add(7 * 24 * time.Hour),
		})
	}
}

func clearAuthCookies(ctx *fiber.Ctx) {
	ctx.Cookie(&fiber.Cookie{Name: "token", Value: "", Path: "/", Expires: time.Unix(0, 0)})
	ctx.Cookie(&fiber.Cookie{Name: "refresh_token", Value: "", Path: "/", Expires: time.Unix(0, 0)})
}

// Register User
// @Summary Register a new user
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body model.RegisterRequest true "Register request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /auth/register [post]
func (c *userController) Register(ctx *fiber.Ctx) error {
	req := new(model.RegisterRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	user, err := c.user.Register(req)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	user.Password = nil
	return lib.OK(ctx, user)
}

// Login User
// @Summary Login user
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body model.LoginRequest true "Login request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /auth/login [post]
func (c *userController) Login(ctx *fiber.Ctx) error {
	req := new(model.LoginRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	resp, err := c.user.Login(req)
	if err != nil {
		return lib.ErrorUnauthorized(ctx, err.Error())
	}
	setAuthCookies(ctx, resp.Token, resp.RefreshToken)
	return lib.OK(ctx, resp)
}

// Me Get current user profile
// @Summary Get current user profile
// @Tags Auth
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /auth/me [get]
func (c *userController) Me(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	userID, ok := claims["user_id"].(string)
	if !ok {
		return lib.ErrorUnauthorized(ctx)
	}
	user, err := c.user.FindById(userID)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	user.Password = nil
	return lib.OK(ctx, user)
}

// FindAll Users
// @Summary List all users (admin only)
// @Tags Admin
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Router /users [get]
func (c *userController) FindAll(ctx *fiber.Ctx) error {
	page := c.user.FindAll(ctx)
	return lib.OK(ctx, page)
}

// FindById User
// @Summary Get user by ID
// @Tags Users
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /users/{id} [get]
func (c *userController) FindById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	claims, err := lib.ExtractToken(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	if claims["role"] != "admin" && claims["user_id"] != id {
		return lib.ErrorForbidden(ctx)
	}
	user, err := c.user.FindById(id)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	user.Password = nil
	return lib.OK(ctx, user)
}

// UpdateProfile lets the authenticated user update their own name/avatar.
// @Summary Update current user profile
// @Tags Auth
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param body body model.UpdateProfileRequest true "Update profile request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /auth/me [put]
func (c *userController) UpdateProfile(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	userID, ok := claims["user_id"].(string)
	if !ok {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.UpdateProfileRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data := &model.User{Name: req.Name, Avatar: req.Avatar, PreferredLang: req.PreferredLang}
	user, err := c.user.UpdateById(userID, data)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	user.Password = nil
	return lib.OK(ctx, user)
}

// UpdateById is admin-only: can update any user's fields except password.
// @Summary Update user by ID (admin only)
// @Tags Admin
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Param body body model.User true "Update user request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /users/{id} [put]
func (c *userController) UpdateById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	data := new(model.User)
	if err := lib.BodyParser(ctx, data); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	data.Role = "" // role changes must go through UpdateRole
	user, err := c.user.UpdateById(id, data)
	if err != nil {
		return lib.ErrorNotFound(ctx, err.Error())
	}
	user.Password = nil
	return lib.OK(ctx, user)
}

// UpdateRole is admin-only: change a user's role.
// @Summary Update user role (admin only)
// @Tags Admin
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Param body body model.UpdateRoleRequest true "Update role request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /users/{id}/role [put]
func (c *userController) UpdateRole(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	req := new(model.UpdateRoleRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	user, err := c.user.UpdateRole(id, req)
	if err != nil {
		return lib.ErrorNotFound(ctx, err.Error())
	}
	user.Password = nil
	return lib.OK(ctx, user)
}

// UpdatePassword Change current user password
// @Summary Change current user password
// @Tags Auth
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param body body model.UpdatePasswordRequest true "Update password request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /auth/password [put]
func (c *userController) UpdatePassword(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	userID, ok := claims["user_id"].(string)
	if !ok {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.UpdatePasswordRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if err := c.user.UpdatePassword(userID, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx)
}

// Refresh Access Token
// @Summary Refresh access token
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body object{refresh_token=string} false "Refresh token in body (optional, falls back to cookie)"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /auth/refresh [post]
func (c *userController) Refresh(ctx *fiber.Ctx) error {
	refreshToken := ctx.Cookies("refresh_token")
	if refreshToken == "" {
		var req struct {
			RefreshToken string `json:"refresh_token" validate:"required"`
		}
		if err := lib.BodyParser(ctx, &req); err != nil {
			return lib.ErrorBadRequest(ctx, err)
		}
		refreshToken = req.RefreshToken
	}
	if refreshToken == "" {
		return lib.ErrorUnauthorized(ctx, "refresh token required")
	}
	resp, err := c.user.RefreshAccessToken(refreshToken)
	if err != nil {
		return lib.ErrorUnauthorized(ctx, err.Error())
	}
	setAuthCookies(ctx, resp.Token, "")
	return lib.OK(ctx, resp)
}

// Sessions lists active refresh-token sessions for the current user.
// @Summary List current user sessions
// @Tags Auth
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /auth/sessions [get]
func (c *userController) Sessions(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	userID, ok := claims["user_id"].(string)
	if !ok {
		return lib.ErrorUnauthorized(ctx)
	}
	currentRefreshToken := ctx.Get("X-Refresh-Token")
	if currentRefreshToken == "" {
		currentRefreshToken = ctx.Cookies("refresh_token")
	}
	sessions, err := c.user.FindSessions(userID, currentRefreshToken)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, sessions)
}

// DeleteSession revokes one active refresh-token session for the current user.
// @Summary Revoke current user session by ID
// @Tags Auth
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path int true "Session ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /auth/sessions/{id} [delete]
func (c *userController) DeleteSession(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	userID, ok := claims["user_id"].(string)
	if !ok {
		return lib.ErrorUnauthorized(ctx)
	}
	sessionID, err := strconv.ParseUint(ctx.Params("id"), 10, 0)
	if err != nil || sessionID == 0 {
		return lib.ErrorBadRequest(ctx, "invalid session id")
	}
	currentRefreshToken := ctx.Get("X-Refresh-Token")
	if currentRefreshToken == "" {
		currentRefreshToken = ctx.Cookies("refresh_token")
	}
	if err := c.user.RevokeSession(userID, uint(sessionID), currentRefreshToken); err != nil {
		if errors.Is(err, service.ErrCannotRevokeCurrentSession) {
			return lib.ErrorBadRequest(ctx, err.Error())
		}
		if errors.Is(err, service.ErrSessionNotFound) {
			return lib.ErrorNotFound(ctx, err.Error())
		}
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx)
}

// Logout User
// @Summary Logout user
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body object{refresh_token=string} false "Refresh token in body"
// @Success 200 {object} lib.Response
// @Router /auth/logout [post]
func (c *userController) Logout(ctx *fiber.Ctx) error {
	refreshToken := ctx.Cookies("refresh_token")
	if refreshToken == "" {
		var req struct {
			RefreshToken string `json:"refresh_token"`
		}
		_ = lib.BodyParser(ctx, &req)
		refreshToken = req.RefreshToken
	}
	if refreshToken != "" {
		_ = c.user.Logout(refreshToken)
	}
	clearAuthCookies(ctx)
	return lib.OK(ctx)
}

// ForgotPassword Send forgot password email
// @Summary Send forgot password email
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body model.ForgotPasswordRequest true "Forgot password request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /auth/forgot-password [post]
func (c *userController) ForgotPassword(ctx *fiber.Ctx) error {
	req := new(model.ForgotPasswordRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	// Always return 200 to avoid email enumeration
	_ = c.user.ForgotPassword(req.Email)
	return lib.OK(ctx, "If that email is registered, a reset link has been sent.")
}

// ResetPassword Reset user password
// @Summary Reset user password
// @Tags Auth
// @Accept json
// @Produce json
// @Param body body model.ResetPasswordRequest true "Reset password request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Router /auth/reset-password [post]
func (c *userController) ResetPassword(ctx *fiber.Ctx) error {
	req := new(model.ResetPasswordRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if err := c.user.ResetPassword(req.Token, req.NewPassword); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	return lib.OK(ctx, "Password has been reset successfully.")
}

// DeleteMe deletes the authenticated user's own account.
// @Summary Delete current user account
// @Tags Auth
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Router /auth/me [delete]
func (c *userController) DeleteMe(ctx *fiber.Ctx) error {
	claims, err := lib.ExtractToken(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	userID, ok := claims["user_id"].(string)
	if !ok {
		return lib.ErrorUnauthorized(ctx)
	}
	if err := c.user.DeleteSelf(userID); err != nil {
		return lib.ErrorInternal(ctx)
	}
	clearAuthCookies(ctx)
	return lib.OK(ctx)
}

// DeleteById Delete user by ID (admin only)
// @Summary Delete user by ID (admin only)
// @Tags Admin
// @Accept json
// @Produce json
// @Security ApiKeyAuth
// @Param id path string true "User ID"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /users/{id} [delete]
func (c *userController) DeleteById(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if err := c.user.DeleteById(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
