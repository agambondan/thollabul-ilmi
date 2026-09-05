package repository

import (
	"errors"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AchievementRepository interface {
	FindAll() ([]model.Achievement, error)
	FindByCode(code string) (*model.Achievement, error)
	// UserAchievement
	FindUserAchievements(userID uuid.UUID) ([]model.UserAchievement, error)
	HasEarned(userID uuid.UUID, achievementID int) bool
	Award(ua *model.UserAchievement) error
	// Points
	GetPoints(userID uuid.UUID) (*model.UserPoints, error)
	AddPoints(userID uuid.UUID, delta int) error
}

type achievementRepo struct {
	db *gorm.DB
}

func NewAchievementRepository(db *gorm.DB) AchievementRepository {
	return &achievementRepo{db}
}

func (r *achievementRepo) FindAll() ([]model.Achievement, error) {
	var list []model.Achievement
	err := r.db.Order("id asc").Find(&list).Error
	return list, err
}

func (r *achievementRepo) FindByCode(code string) (*model.Achievement, error) {
	var a model.Achievement
	if err := r.db.Where("code = ?", code).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *achievementRepo) FindUserAchievements(userID uuid.UUID) ([]model.UserAchievement, error) {
	var list []model.UserAchievement
	err := r.db.Preload("Achievement").
		Where("user_id = ?", userID).
		Order("earned_at desc").
		Find(&list).Error
	return list, err
}

func (r *achievementRepo) HasEarned(userID uuid.UUID, achievementID int) bool {
	var count int64
	r.db.Model(&model.UserAchievement{}).
		Where("user_id = ? AND achievement_id = ?", userID, achievementID).
		Count(&count)
	return count > 0
}

func (r *achievementRepo) Award(ua *model.UserAchievement) error {
	return r.db.Create(ua).Error
}

func (r *achievementRepo) GetPoints(userID uuid.UUID) (*model.UserPoints, error) {
	var p model.UserPoints
	err := r.db.Where("user_id = ?", userID).First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			p = model.UserPoints{
				BaseUUID:    model.BaseUUID{ID: uuid.New()},
				UserID:      userID,
				TotalPoints: 0,
			}
			if err := r.db.Create(&p).Error; err != nil {
				return nil, err
			}
			return &p, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *achievementRepo) AddPoints(userID uuid.UUID, delta int) error {
	if _, err := r.GetPoints(userID); err != nil {
		return err
	}
	return r.db.Model(&model.UserPoints{}).
		Where("user_id = ?", userID).
		UpdateColumn("total_points", gorm.Expr("total_points + ?", delta)).Error
}
