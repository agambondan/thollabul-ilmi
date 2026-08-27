package service

import (
	"errors"
	"log/slog"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/morkid/paginate"
	"github.com/spf13/viper"
)

var (
	ErrSessionNotFound            = errors.New("session not found")
	ErrCannotRevokeCurrentSession = errors.New("cannot revoke current session")
)

type UserService interface {
	Register(*model.RegisterRequest) (*model.User, error)
	Login(*model.LoginRequest) (*model.LoginResponse, error)
	FindOrCreateOAuthUser(email, name, picture, provider, providerID string) (*model.LoginResponse, error)
	RefreshAccessToken(refreshToken string) (*model.LoginResponse, error)
	FindSessions(userID, currentRefreshToken string) ([]model.AuthSession, error)
	RevokeSession(userID string, sessionID uint, currentRefreshToken string) error
	Logout(refreshToken string) error
	ForgotPassword(email string) error
	ResetPassword(token, newPassword string) error
	FindAll(*fiber.Ctx) *paginate.Page
	FindById(string) (*model.User, error)
	UpdateById(string, *model.User) (*model.User, error)
	UpdatePassword(string, *model.UpdatePasswordRequest) error
	UpdateRole(string, *model.UpdateRoleRequest) (*model.User, error)
	DeleteSelf(string) error
	DeleteById(string) error
	Count() (*int64, error)
}

type userService struct {
	user repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo}
}

func (s *userService) Register(req *model.RegisterRequest) (*model.User, error) {
	if _, err := s.user.FindByEmail(req.Email); err == nil {
		return nil, errors.New("email already registered")
	}

	hashed := lib.PasswordEncrypt(req.Password)

	id := uuid.New()
	user := &model.User{
		BaseUUID: model.BaseUUID{ID: id},
		Name:     lib.Strptr(req.Name),
		Email:    lib.Strptr(req.Email),
		Password: lib.Strptr(hashed),
		Role:     model.RoleUser,
	}
	return s.user.Save(user)
}

func (s *userService) Login(req *model.LoginRequest) (*model.LoginResponse, error) {
	user, err := s.user.FindByEmail(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !lib.PasswordCompare(*user.Password, req.Password) {
		return nil, errors.New("invalid email or password")
	}

	lang := ""
	if user.PreferredLang != nil {
		lang = *user.PreferredLang
	}
	token, err := createToken(user.ID.String(), *user.Email, string(user.Role), lang)
	if err != nil {
		return nil, err
	}

	refreshToken := uuid.New().String()
	if err := s.user.SaveRefreshToken(user.ID.String(), refreshToken, time.Now().Add(7*24*time.Hour)); err != nil {
		return nil, err
	}

	user.Password = nil
	return &model.LoginResponse{Token: token, RefreshToken: refreshToken, User: user}, nil
}

func (s *userService) RefreshAccessToken(refreshToken string) (*model.LoginResponse, error) {
	rt, err := s.user.FindRefreshToken(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}
	if time.Now().After(rt.ExpiresAt) {
		_ = s.user.DeleteRefreshToken(refreshToken)
		return nil, errors.New("refresh token expired")
	}
	user, err := s.user.FindById(rt.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	lang := ""
	if user.PreferredLang != nil {
		lang = *user.PreferredLang
	}
	newToken, err := createToken(user.ID.String(), *user.Email, string(user.Role), lang)
	if err != nil {
		return nil, err
	}
	user.Password = nil
	return &model.LoginResponse{Token: newToken, User: user}, nil
}

func (s *userService) FindSessions(userID, currentRefreshToken string) ([]model.AuthSession, error) {
	tokens, err := s.user.FindRefreshTokensByUserID(userID)
	if err != nil {
		return nil, err
	}

	sessions := make([]model.AuthSession, 0, len(tokens))
	now := time.Now()
	for _, token := range tokens {
		if now.After(token.ExpiresAt) {
			continue
		}
		sessions = append(sessions, model.AuthSession{
			ID:        token.ID,
			CreatedAt: token.CreatedAt,
			ExpiresAt: token.ExpiresAt,
			Current:   currentRefreshToken != "" && token.Token == currentRefreshToken,
		})
	}
	return sessions, nil
}

func (s *userService) RevokeSession(userID string, sessionID uint, currentRefreshToken string) error {
	tokens, err := s.user.FindRefreshTokensByUserID(userID)
	if err != nil {
		return err
	}

	for _, token := range tokens {
		if token.ID != sessionID {
			continue
		}
		if currentRefreshToken != "" && token.Token == currentRefreshToken {
			return ErrCannotRevokeCurrentSession
		}
		return s.user.DeleteRefreshToken(token.Token)
	}

	return ErrSessionNotFound
}

func (s *userService) Logout(refreshToken string) error {
	return s.user.DeleteRefreshToken(refreshToken)
}

func (s *userService) ForgotPassword(email string) error {
	user, err := s.user.FindByEmail(email)
	if err != nil {
		// Return nil to avoid user enumeration — don't reveal whether email exists
		return nil
	}
	token := uuid.New().String()
	if err := s.user.SavePasswordResetToken(user.ID.String(), token, time.Now().Add(time.Hour)); err != nil {
		return err
	}
	go func() {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("panic in password reset email goroutine", "recover", r)
			}
		}()
		if err := lib.SendPasswordResetEmail(*user.Email, token); err != nil {
			slog.Warn("password reset email failed", "email", *user.Email, "err", err)
		}
	}()
	return nil
}

func (s *userService) ResetPassword(token, newPassword string) error {
	prt, err := s.user.FindPasswordResetToken(token)
	if err != nil {
		return errors.New("invalid or expired reset token")
	}
	if time.Now().After(prt.ExpiresAt) {
		return errors.New("reset token has expired")
	}
	hashed := lib.PasswordEncrypt(newPassword)
	if _, err := s.user.UpdateById(prt.UserID, &model.User{Password: lib.Strptr(hashed)}); err != nil {
		return err
	}
	return s.user.MarkPasswordResetTokenUsed(token)
}

func (s *userService) FindAll(ctx *fiber.Ctx) *paginate.Page {
	return s.user.FindAll(ctx)
}

func (s *userService) FindById(id string) (*model.User, error) {
	return s.user.FindById(id)
}

func (s *userService) UpdateById(id string, user *model.User) (*model.User, error) {
	user.Password = nil
	return s.user.UpdateById(id, user)
}

func (s *userService) UpdatePassword(id string, req *model.UpdatePasswordRequest) error {
	user, err := s.user.FindById(id)
	if err != nil {
		return errors.New("user not found")
	}

	if !lib.PasswordCompare(*user.Password, req.OldPassword) {
		return errors.New("old password is incorrect")
	}

	hashed := lib.PasswordEncrypt(req.NewPassword)
	_, err = s.user.UpdateById(id, &model.User{Password: lib.Strptr(hashed)})
	return err
}

func (s *userService) UpdateRole(id string, req *model.UpdateRoleRequest) (*model.User, error) {
	return s.user.UpdateById(id, &model.User{Role: req.Role})
}

func (s *userService) DeleteSelf(id string) error {
	if err := s.user.DeleteUserRefreshTokens(id); err != nil {
		return err
	}
	return s.user.DeleteById(id)
}

func (s *userService) DeleteById(id string) error {
	return s.user.DeleteById(id)
}

func (s *userService) Count() (*int64, error) {
	return s.user.Count()
}

func createToken(userID, email, role, preferredLang string) (string, error) {
	if preferredLang == "" {
		preferredLang = "idn"
	}
	claims := jwt.MapClaims{
		"user_id":        userID,
		"email":          email,
		"role":           role,
		"preferred_lang": preferredLang,
		"exp":            time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := viper.GetString("ACCESS_SECRET")
	if secret == "" {
		secret = "tholabul-ilmi-secret"
	}
	return token.SignedString([]byte(secret))
}

func (s *userService) FindOrCreateOAuthUser(email, name, picture, provider, providerID string) (*model.LoginResponse, error) {
	user, err := s.user.FindByEmail(email)
	if err != nil {
		id := uuid.New()
		hashed := lib.PasswordEncrypt(uuid.New().String())
		user = &model.User{
			BaseUUID: model.BaseUUID{ID: id},
			Name:     lib.Strptr(name),
			Email:    lib.Strptr(email),
			Password: lib.Strptr(hashed),
			Avatar:   lib.Strptr(picture),
			Role:     model.RoleUser,
		}
		saved, saveErr := s.user.Save(user)
		if saveErr != nil {
			return nil, saveErr
		}
		user = saved
	}

	lang := ""
	if user.PreferredLang != nil {
		lang = *user.PreferredLang
	}
	token, err := createToken(user.ID.String(), *user.Email, string(user.Role), lang)
	if err != nil {
		return nil, err
	}

	refreshToken := uuid.New().String()
	if err := s.user.SaveRefreshToken(user.ID.String(), refreshToken, time.Now().Add(7*24*time.Hour)); err != nil {
		return nil, err
	}

	user.Password = nil
	return &model.LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}
