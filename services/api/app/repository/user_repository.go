package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type UserRepository interface {
	Save(*model.User) (*model.User, error)
	FindAll(*fiber.Ctx) *paginate.Page
	FindById(string) (*model.User, error)
	FindByEmail(string) (*model.User, error)
	UpdateById(string, *model.User) (*model.User, error)
	DeleteById(string) error
	Count() (*int64, error)
	SaveRefreshToken(userID, token string, expiresAt time.Time) error
	FindRefreshToken(token string) (*model.RefreshToken, error)
	FindRefreshTokensByUserID(userID string) ([]model.RefreshToken, error)
	DeleteRefreshToken(token string) error
	DeleteUserRefreshTokens(userID string) error
	SavePasswordResetToken(userID, token string, expiresAt time.Time) error
	FindPasswordResetToken(token string) (*model.PasswordResetToken, error)
	MarkPasswordResetTokenUsed(token string) error
}

type userRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewUserRepository(db *gorm.DB, pg *paginate.Pagination) UserRepository {
	return &userRepo{db, pg}
}

func (r *userRepo) Save(user *model.User) (*model.User, error) {
	if err := r.db.Create(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepo) FindAll(ctx *fiber.Ctx) *paginate.Page {
	var users []model.User
	mod := r.db.Model(&model.User{}).Order("created_at desc")
	page := r.pg.With(mod).Request(ctx.Request()).Response(&users)
	return &page
}

func (r *userRepo) FindById(id string) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) FindByEmail(email string) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, "email = ?", email).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) UpdateById(id string, user *model.User) (*model.User, error) {
	if err := r.db.Model(&model.User{}).Where("id = ?", id).Updates(user).Error; err != nil {
		return nil, err
	}
	return r.FindById(id)
}

func (r *userRepo) DeleteById(id string) error {
	return r.db.Delete(&model.User{}, "id = ?", id).Error
}

func (r *userRepo) Count() (*int64, error) {
	var count int64
	r.db.Model(&model.User{}).Count(&count)
	return &count, nil
}

func (r *userRepo) SaveRefreshToken(userID, token string, expiresAt time.Time) error {
	rt := &model.RefreshToken{UserID: userID, Token: token, ExpiresAt: expiresAt}
	return r.db.Create(rt).Error
}

func (r *userRepo) FindRefreshToken(token string) (*model.RefreshToken, error) {
	var rt model.RefreshToken
	if err := r.db.First(&rt, "token = ?", token).Error; err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *userRepo) FindRefreshTokensByUserID(userID string) ([]model.RefreshToken, error) {
	var tokens []model.RefreshToken
	err := r.db.Where("user_id = ?", userID).Order("created_at desc").Find(&tokens).Error
	return tokens, err
}

func (r *userRepo) DeleteRefreshToken(token string) error {
	return r.db.Delete(&model.RefreshToken{}, "token = ?", token).Error
}

func (r *userRepo) DeleteUserRefreshTokens(userID string) error {
	return r.db.Delete(&model.RefreshToken{}, "user_id = ?", userID).Error
}

func (r *userRepo) SavePasswordResetToken(userID, token string, expiresAt time.Time) error {
	prt := &model.PasswordResetToken{UserID: userID, Token: token, ExpiresAt: expiresAt}
	return r.db.Create(prt).Error
}

func (r *userRepo) FindPasswordResetToken(token string) (*model.PasswordResetToken, error) {
	var prt model.PasswordResetToken
	if err := r.db.First(&prt, "token = ? AND used_at IS NULL", token).Error; err != nil {
		return nil, err
	}
	return &prt, nil
}

func (r *userRepo) MarkPasswordResetTokenUsed(token string) error {
	now := time.Now()
	return r.db.Model(&model.PasswordResetToken{}).Where("token = ?", token).Update("used_at", now).Error
}
