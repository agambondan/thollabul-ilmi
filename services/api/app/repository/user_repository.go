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
	DeleteRefreshTokenByID(id uint) error
	DeleteUserRefreshTokens(userID string) error
	SavePasswordResetToken(userID, token string, expiresAt time.Time) error
	FindPasswordResetToken(token string) (*model.PasswordResetToken, error)
	MarkPasswordResetTokenUsed(token string) error
	SaveVerificationToken(userID, channel, tokenHash string, expiresAt time.Time) error
	FindVerificationTokenByHash(tokenHash string) (*model.VerificationToken, error)
	FindActiveVerificationToken(userID, channel string) (*model.VerificationToken, error)
	MarkVerificationTokenVerified(id uint) error
	IncrementVerificationTokenAttempts(id uint) error
	DeleteVerificationTokensByUserChannel(userID, channel string) error
	MarkEmailVerified(userID string) error
	MarkPhoneVerified(userID string) error
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

func (r *userRepo) DeleteRefreshTokenByID(id uint) error {
	return r.db.Delete(&model.RefreshToken{}, "id = ?", id).Error
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

func (r *userRepo) SaveVerificationToken(userID, channel, tokenHash string, expiresAt time.Time) error {
	vt := &model.VerificationToken{UserID: userID, Channel: channel, TokenHash: tokenHash, ExpiresAt: expiresAt}
	return r.db.Create(vt).Error
}

func (r *userRepo) FindVerificationTokenByHash(tokenHash string) (*model.VerificationToken, error) {
	var vt model.VerificationToken
	if err := r.db.First(&vt, "token_hash = ? AND verified_at IS NULL", tokenHash).Error; err != nil {
		return nil, err
	}
	return &vt, nil
}

func (r *userRepo) FindActiveVerificationToken(userID, channel string) (*model.VerificationToken, error) {
	var vt model.VerificationToken
	err := r.db.Order("created_at desc").
		First(&vt, "user_id = ? AND channel = ? AND verified_at IS NULL", userID, channel).Error
	if err != nil {
		return nil, err
	}
	return &vt, nil
}

func (r *userRepo) MarkVerificationTokenVerified(id uint) error {
	now := time.Now()
	return r.db.Model(&model.VerificationToken{}).Where("id = ?", id).Update("verified_at", now).Error
}

func (r *userRepo) IncrementVerificationTokenAttempts(id uint) error {
	return r.db.Model(&model.VerificationToken{}).Where("id = ?", id).
		Update("attempts", gorm.Expr("attempts + 1")).Error
}

func (r *userRepo) DeleteVerificationTokensByUserChannel(userID, channel string) error {
	return r.db.Delete(&model.VerificationToken{}, "user_id = ? AND channel = ?", userID, channel).Error
}

func (r *userRepo) MarkEmailVerified(userID string) error {
	now := time.Now()
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("email_verified_at", now).Error
}

func (r *userRepo) MarkPhoneVerified(userID string) error {
	now := time.Now()
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("phone_verified_at", now).Error
}
