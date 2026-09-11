package service

import (
	"crypto/rand"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"regexp"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/lib/whatsapp"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/morkid/paginate"
	"github.com/spf13/viper"
)

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

var (
	ErrSessionNotFound            = errors.New("session not found")
	ErrCannotRevokeCurrentSession = errors.New("cannot revoke current session")

	// errLoginFailed is returned in place of raw token/DB errors so internal
	// failure details (driver messages, constraint names) never reach the
	// client; the real error is logged server-side instead.
	errLoginFailed = errors.New("unable to log in right now, please try again")

	// errAccountNotVerified is a stable, distinguishable message the frontend
	// pattern-matches to show a "resend verification" action instead of the
	// generic invalid-credentials error. Keep this exact string in sync with
	// apps/web/src/context/Auth.js and apps/web/src/app/auth/login/page.js.
	errAccountNotVerified = errors.New("account not verified")

	indonesianPhone = regexp.MustCompile(`^(?:\+62|62|0)(8[0-9]{8,11})$`)
)

// normalizePhone accepts common Indonesian mobile formats (08xx, 62xx, +62xx)
// and returns E.164 (+62xx), or an error if the input doesn't look like an
// Indonesian mobile number.
func normalizePhone(raw string) (string, error) {
	digits := strings.TrimSpace(raw)
	m := indonesianPhone.FindStringSubmatch(digits)
	if m == nil {
		return "", errors.New("invalid Indonesian phone number")
	}
	return "+62" + m[1], nil
}

// generateOTP returns a random 6-digit numeric code.
func generateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

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
	VerifyEmail(token string) error
	VerifyWhatsApp(phone, code string) error
	ResendVerification(identifier string) error
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
	wa   *whatsapp.Manager
}

func NewUserService(repo repository.UserRepository, wa *whatsapp.Manager) UserService {
	return &userService{repo, wa}
}

func (s *userService) Register(req *model.RegisterRequest) (*model.User, error) {
	email := strings.TrimSpace(req.Email)
	if req.VerificationChannel == model.VerificationChannelEmail && email == "" {
		return nil, errors.New("email is required for email verification")
	}
	if email != "" {
		if _, err := s.user.FindByEmail(email); err == nil {
			return nil, errors.New("unable to register with the provided details")
		}
	}

	var phone string
	if req.VerificationChannel == model.VerificationChannelWhatsapp {
		if s.wa == nil || !s.wa.IsConnected() {
			return nil, errors.New("whatsapp verification is currently unavailable, please use email instead")
		}
		normalized, err := normalizePhone(req.Phone)
		if err != nil {
			return nil, errors.New("nomor HP tidak valid, gunakan format 08xx atau +62xx")
		}
		phone = normalized
		if _, err := s.user.FindByPhone(phone); err == nil {
			return nil, errors.New("unable to register with the provided details")
		}
	}

	hashed := lib.PasswordEncrypt(req.Password)

	id := uuid.New()
	user := &model.User{
		BaseUUID:            model.BaseUUID{ID: id},
		Name:                lib.Strptr(req.Name),
		Password:            lib.Strptr(hashed),
		Role:                model.RoleUser,
		VerificationChannel: lib.Strptr(req.VerificationChannel),
	}
	if email != "" {
		user.Email = lib.Strptr(email)
	}
	if phone != "" {
		user.Phone = lib.Strptr(phone)
	}
	saved, err := s.user.Save(user)
	if err != nil {
		return nil, err
	}

	if err := s.dispatchVerification(saved); err != nil {
		// The account still exists — surface nothing to the caller beyond a
		// log entry; the user can always hit "resend verification" once the
		// underlying issue (SMTP creds, WA session) is fixed.
		slog.Error("register: failed to dispatch verification", "user_id", saved.ID.String(), "channel", req.VerificationChannel, "err", err)
	}
	return saved, nil
}

// dispatchVerification generates a fresh token/code for the user's chosen
// channel, persists it, and sends it asynchronously — mirrors ForgotPassword's
// goroutine + recover + log-only-on-failure style exactly.
func (s *userService) dispatchVerification(user *model.User) error {
	channel := model.VerificationChannelEmail
	if user.VerificationChannel != nil {
		channel = *user.VerificationChannel
	}

	_ = s.user.DeleteVerificationTokensByUserChannel(user.ID.String(), channel)

	var raw string
	var expiresIn time.Duration
	if channel == model.VerificationChannelWhatsapp {
		code, err := generateOTP()
		if err != nil {
			return err
		}
		raw = code
		expiresIn = 10 * time.Minute
	} else {
		raw = uuid.New().String()
		expiresIn = time.Hour
	}

	// Email links are looked up by hash alone (the request has no user
	// context yet), so the UUID itself must be the hash input. WhatsApp OTP
	// codes are only 6 digits, so VerifyWhatsApp resolves the user via email
	// first and mixes the user ID into the hash to keep it collision-free
	// under the TokenHash unique index.
	tokenHash := lib.ConvertToSHA256(raw)
	if channel == model.VerificationChannelWhatsapp {
		tokenHash = lib.ConvertToSHA256(user.ID.String() + ":" + raw)
	}
	if err := s.user.SaveVerificationToken(user.ID.String(), channel, tokenHash, time.Now().Add(expiresIn)); err != nil {
		return err
	}

	devLog := viper.GetString("ENVIRONMENT") != "production"

	go func() {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("panic in verification dispatch goroutine", "recover", r)
			}
		}()
		if channel == model.VerificationChannelWhatsapp {
			if devLog {
				slog.Info("dev: whatsapp verification code", "phone", derefStr(user.Phone), "code", raw)
			}
			if err := s.wa.SendOTP(derefStr(user.Phone), raw); err != nil {
				slog.Warn("whatsapp verification send failed", "phone", derefStr(user.Phone), "err", err)
			}
		} else {
			if devLog {
				slog.Info("dev: email verification token", "email", derefStr(user.Email), "token", raw)
			}
			if err := lib.SendVerificationEmail(derefStr(user.Email), raw); err != nil {
				slog.Warn("verification email failed", "email", derefStr(user.Email), "err", err)
			}
		}
	}()
	return nil
}

// resolveUserByIdentifier looks a user up by email or phone depending on
// which the identifier looks like. Shared by Login and ResendVerification,
// since a WhatsApp-only account (no email on file) can only be found by
// phone.
func (s *userService) resolveUserByIdentifier(identifier string) (*model.User, error) {
	identifier = strings.TrimSpace(identifier)
	if identifier == "" {
		return nil, errors.New("identifier is required")
	}
	if strings.Contains(identifier, "@") {
		return s.user.FindByEmail(identifier)
	}
	phone, err := normalizePhone(identifier)
	if err != nil {
		return nil, err
	}
	return s.user.FindByPhone(phone)
}

func (s *userService) Login(req *model.LoginRequest) (*model.LoginResponse, error) {
	user, err := s.resolveUserByIdentifier(req.Email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !lib.PasswordCompare(*user.Password, req.Password) {
		return nil, errors.New("invalid email or password")
	}

	if !user.IsVerified() {
		return nil, errAccountNotVerified
	}

	lang := ""
	if user.PreferredLang != nil {
		lang = *user.PreferredLang
	}
	token, err := createToken(user.ID.String(), derefStr(user.Email), string(user.Role), lang)
	if err != nil {
		slog.Error("login: failed to create access token", "user_id", user.ID.String(), "err", err)
		return nil, errLoginFailed
	}

	refreshToken := uuid.New().String()
	if err := s.user.SaveRefreshToken(user.ID.String(), lib.ConvertToSHA256(refreshToken), time.Now().Add(7*24*time.Hour)); err != nil {
		slog.Error("login: failed to save refresh token", "user_id", user.ID.String(), "err", err)
		return nil, errLoginFailed
	}

	user.Password = nil
	return &model.LoginResponse{Token: token, RefreshToken: refreshToken, User: user}, nil
}

func (s *userService) RefreshAccessToken(refreshToken string) (*model.LoginResponse, error) {
	rt, err := s.user.FindRefreshToken(lib.ConvertToSHA256(refreshToken))
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}
	if time.Now().After(rt.ExpiresAt) {
		_ = s.user.DeleteRefreshTokenByID(rt.ID)
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
	newToken, err := createToken(user.ID.String(), derefStr(user.Email), string(user.Role), lang)
	if err != nil {
		slog.Error("refresh token: failed to create access token", "user_id", user.ID.String(), "err", err)
		return nil, errLoginFailed
	}

	// Rotate: the presented refresh token is single-use, so replace it with a
	// fresh one instead of letting the same value be replayed until expiry.
	newRefreshToken := uuid.New().String()
	if err := s.user.SaveRefreshToken(user.ID.String(), lib.ConvertToSHA256(newRefreshToken), time.Now().Add(7*24*time.Hour)); err != nil {
		slog.Error("refresh token: failed to save refresh token", "user_id", user.ID.String(), "err", err)
		return nil, errLoginFailed
	}
	_ = s.user.DeleteRefreshTokenByID(rt.ID)

	user.Password = nil
	return &model.LoginResponse{Token: newToken, RefreshToken: newRefreshToken, User: user}, nil
}

func (s *userService) FindSessions(userID, currentRefreshToken string) ([]model.AuthSession, error) {
	tokens, err := s.user.FindRefreshTokensByUserID(userID)
	if err != nil {
		return nil, err
	}

	currentHash := ""
	if currentRefreshToken != "" {
		currentHash = lib.ConvertToSHA256(currentRefreshToken)
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
			Current:   currentHash != "" && token.Token == currentHash,
		})
	}
	return sessions, nil
}

func (s *userService) RevokeSession(userID string, sessionID uint, currentRefreshToken string) error {
	tokens, err := s.user.FindRefreshTokensByUserID(userID)
	if err != nil {
		return err
	}

	currentHash := ""
	if currentRefreshToken != "" {
		currentHash = lib.ConvertToSHA256(currentRefreshToken)
	}

	for _, token := range tokens {
		if token.ID != sessionID {
			continue
		}
		if currentHash != "" && token.Token == currentHash {
			return ErrCannotRevokeCurrentSession
		}
		return s.user.DeleteRefreshTokenByID(token.ID)
	}

	return ErrSessionNotFound
}

func (s *userService) Logout(refreshToken string) error {
	return s.user.DeleteRefreshToken(lib.ConvertToSHA256(refreshToken))
}

func (s *userService) ForgotPassword(email string) error {
	user, err := s.user.FindByEmail(email)
	if err != nil {
		// Return nil to avoid user enumeration — don't reveal whether email exists
		return nil
	}
	token := uuid.New().String()
	if err := s.user.SavePasswordResetToken(user.ID.String(), lib.ConvertToSHA256(token), time.Now().Add(time.Hour)); err != nil {
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
	tokenHash := lib.ConvertToSHA256(token)
	prt, err := s.user.FindPasswordResetToken(tokenHash)
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
	// A password reset is often triggered because the account is suspected
	// compromised — revoke every existing session so a stolen refresh token
	// doesn't keep working after the reset.
	if err := s.user.DeleteUserRefreshTokens(prt.UserID); err != nil {
		return err
	}
	return s.user.MarkPasswordResetTokenUsed(tokenHash)
}

func (s *userService) VerifyEmail(token string) error {
	tokenHash := lib.ConvertToSHA256(token)
	vt, err := s.user.FindVerificationTokenByHash(tokenHash)
	if err != nil || vt.Channel != model.VerificationChannelEmail {
		return errors.New("invalid or expired verification link")
	}
	if time.Now().After(vt.ExpiresAt) {
		return errors.New("verification link has expired, please request a new one")
	}
	if err := s.user.MarkEmailVerified(vt.UserID); err != nil {
		return err
	}
	return s.user.MarkVerificationTokenVerified(vt.ID)
}

func (s *userService) VerifyWhatsApp(phone, code string) error {
	normalized, err := normalizePhone(phone)
	if err != nil {
		return errors.New("invalid verification code")
	}
	user, err := s.user.FindByPhone(normalized)
	if err != nil {
		return errors.New("invalid verification code")
	}

	active, err := s.user.FindActiveVerificationToken(user.ID.String(), model.VerificationChannelWhatsapp)
	if err != nil {
		return errors.New("invalid verification code")
	}
	if active.Attempts >= 5 {
		return errors.New("too many failed attempts, please request a new code")
	}
	if time.Now().After(active.ExpiresAt) {
		return errors.New("verification code has expired, please request a new one")
	}

	tokenHash := lib.ConvertToSHA256(user.ID.String() + ":" + code)
	if tokenHash != active.TokenHash {
		_ = s.user.IncrementVerificationTokenAttempts(active.ID)
		return errors.New("invalid verification code")
	}

	if err := s.user.MarkPhoneVerified(user.ID.String()); err != nil {
		return err
	}
	return s.user.MarkVerificationTokenVerified(active.ID)
}

func (s *userService) ResendVerification(identifier string) error {
	user, err := s.resolveUserByIdentifier(identifier)
	if err != nil {
		// Anti-enumeration: pretend it worked either way.
		return nil
	}
	if user.IsVerified() {
		return nil
	}
	if err := s.dispatchVerification(user); err != nil {
		slog.Error("resend verification failed", "user_id", user.ID.String(), "err", err)
	}
	return nil
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
	if _, err := s.user.UpdateById(id, &model.User{Password: lib.Strptr(hashed)}); err != nil {
		return err
	}
	// Revoke every session (including the one making this request) so a
	// stolen refresh token can't survive a deliberate password change.
	return s.user.DeleteUserRefreshTokens(id)
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
	return token.SignedString(lib.JWTSecret())
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
	token, err := createToken(user.ID.String(), derefStr(user.Email), string(user.Role), lang)
	if err != nil {
		slog.Error("oauth login: failed to create access token", "user_id", user.ID.String(), "err", err)
		return nil, errLoginFailed
	}

	refreshToken := uuid.New().String()
	if err := s.user.SaveRefreshToken(user.ID.String(), lib.ConvertToSHA256(refreshToken), time.Now().Add(7*24*time.Hour)); err != nil {
		slog.Error("oauth login: failed to save refresh token", "user_id", user.ID.String(), "err", err)
		return nil, errLoginFailed
	}

	user.Password = nil
	return &model.LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}
