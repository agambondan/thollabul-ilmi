package model

import (
	"time"

	"github.com/google/uuid"
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
}

type RegisterRequest struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
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
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    string    `json:"user_id" gorm:"type:varchar(36);not null;index"`
	Token     string    `json:"token" gorm:"type:varchar(64);uniqueIndex;not null"`
	ExpiresAt time.Time `json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

type PasswordResetToken struct {
	ID        uint       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    string     `json:"user_id" gorm:"type:varchar(36);not null;index"`
	Token     string     `json:"token" gorm:"type:varchar(64);uniqueIndex;not null"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
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

func (u *User) ToPublic() *User {
	return &User{
		BaseUUID: BaseUUID{ID: uuid.UUID{}},
		Name:     u.Name,
		Email:    u.Email,
		Role:     u.Role,
		Avatar:   u.Avatar,
	}
}
