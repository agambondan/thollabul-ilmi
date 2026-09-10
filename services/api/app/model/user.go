package model

import (
	"time"
)

type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RoleAuthor UserRole = "author"
	RoleEditor UserRole = "editor"
	RoleUser   UserRole = "user"
)

type User struct {
	BaseUUID
	Name          *string  `json:"name,omitempty" gorm:"type:varchar(256);not null" validate:"required"`
	Email         *string  `json:"email,omitempty" gorm:"type:varchar(256);uniqueIndex;not null" validate:"required,email"`
	Password      *string  `json:"-" gorm:"type:varchar(256);not null"`
	Role          UserRole `json:"role,omitempty" gorm:"type:varchar(50);default:'user'"`
	Avatar        *string  `json:"avatar,omitempty" gorm:"type:varchar(512)"`
	PreferredLang *string  `json:"preferred_lang,omitempty" gorm:"type:varchar(10);default:'idn'"`
	// Phone is only set when the account registered via the WhatsApp
	// verification channel.
	Phone *string `json:"phone,omitempty" gorm:"type:varchar(20)"`
	// VerificationChannel records which channel the user must complete to
	// unlock login — "email" or "whatsapp" — set once at registration.
	VerificationChannel *string    `json:"verification_channel,omitempty" gorm:"type:varchar(20)"`
	EmailVerifiedAt     *time.Time `json:"email_verified_at,omitempty"`
	PhoneVerifiedAt     *time.Time `json:"phone_verified_at,omitempty"`
}

// IsVerified reports whether the user has completed whichever verification
// channel they registered with. Accounts created before this feature existed
// have no VerificationChannel set and are treated as already verified.
func (u *User) IsVerified() bool {
	if u == nil || u.VerificationChannel == nil {
		return true
	}
	switch *u.VerificationChannel {
	case VerificationChannelWhatsapp:
		return u.PhoneVerifiedAt != nil
	default:
		return u.EmailVerifiedAt != nil
	}
}

const (
	VerificationChannelEmail    = "email"
	VerificationChannelWhatsapp = "whatsapp"
)

type RegisterRequest struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	// VerificationChannel is the account-activation method the user picked:
	// "email" (link) or "whatsapp" (OTP code) — see IsVerified/Login.
	VerificationChannel string `json:"verification_channel" validate:"required,oneof=email whatsapp"`
	// Phone is required only when VerificationChannel is "whatsapp";
	// enforced in the service layer since validator's required_if needs the
	// literal field name and this keeps the check readable.
	Phone string `json:"phone"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	User         *User  `json:"user"`
}

type AuthSession struct {
	ID        uint      `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
	Current   bool      `json:"current"`
}

type RefreshToken struct {
	ID     uint   `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID string `json:"user_id" gorm:"type:varchar(36);not null;index"`
	// Token stores the SHA-256 hash of the raw token handed to the client,
	// never the raw value itself — see lib.ConvertToSHA256 call sites in
	// userService.
	Token     string    `json:"token" gorm:"type:varchar(64);uniqueIndex;not null"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type PasswordResetToken struct {
	ID     uint   `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID string `json:"user_id" gorm:"type:varchar(36);not null;index"`
	// Token stores the SHA-256 hash of the raw token emailed to the user,
	// never the raw value itself — see lib.ConvertToSHA256 call sites in
	// userService.
	Token     string     `json:"token" gorm:"type:varchar(64);uniqueIndex;not null"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// VerificationToken backs both account-verification channels. For "email" it
// holds the SHA-256 hash of a long link-token; for "whatsapp" it holds the
// SHA-256 hash of a short numeric OTP (hence the Attempts brute-force guard,
// which the email channel doesn't need since its token space is huge).
type VerificationToken struct {
	ID      uint   `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID  string `json:"user_id" gorm:"type:varchar(36);not null;index"`
	Channel string `json:"channel" gorm:"type:varchar(20);not null"`
	// TokenHash stores the SHA-256 hash of the raw token/code sent to the
	// user, never the raw value itself.
	TokenHash  string     `json:"-" gorm:"type:varchar(64);uniqueIndex;not null"`
	Attempts   int        `json:"attempts" gorm:"not null;default:0"`
	ExpiresAt  time.Time  `json:"expires_at"`
	VerifiedAt *time.Time `json:"verified_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

// WhatsAppChannel tracks the single paired WhatsApp sender session (this app
// is single-tenant, so one active row is enough — see app/lib/whatsapp).
type WhatsAppChannel struct {
	ID          uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	Status      string     `json:"status" gorm:"type:varchar(20);not null;default:'disconnected'"`
	Phone       *string    `json:"phone,omitempty" gorm:"type:varchar(20)"`
	SessionPath string     `json:"-" gorm:"type:varchar(255)"`
	LastSeenAt  *time.Time `json:"last_seen_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

const (
	WhatsAppStatusPending      = "pending"
	WhatsAppStatusConnected    = "connected"
	WhatsAppStatusDisconnected = "disconnected"
)

type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required"`
}

type VerifyWhatsAppRequest struct {
	Email string `json:"email" validate:"required,email"`
	Code  string `json:"code" validate:"required"`
}

type ResendVerificationRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

type UpdatePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

type UpdateRoleRequest struct {
	Role UserRole `json:"role" validate:"required,oneof=admin author editor user"`
}

type UpdateProfileRequest struct {
	Name          *string `json:"name"`
	Avatar        *string `json:"avatar"`
	PreferredLang *string `json:"preferred_lang"`
}

// ToPublic returns the shape safe to embed in something other people read — a
// byline, a forum post. The email is contact information and must not ride
// along; Password is already dropped by its json tag.
func (u *User) ToPublic() *User {
	if u == nil {
		return nil
	}
	return &User{
		BaseUUID: u.BaseUUID,
		Name:     u.Name,
		Role:     u.Role,
		Avatar:   u.Avatar,
	}
}
