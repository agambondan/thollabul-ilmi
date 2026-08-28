package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SettingsRepository interface {
	FindByUserID(userID uuid.UUID) (*model.UserSettings, error)
	Upsert(userID uuid.UUID, settings string) (*model.UserSettings, error)
}

type settingsRepository struct {
	db *gorm.DB
}

func NewSettingsRepository(db *gorm.DB) SettingsRepository {
	return &settingsRepository{db}
}

func (r *settingsRepository) FindByUserID(userID uuid.UUID) (*model.UserSettings, error) {
	var item model.UserSettings
	err := r.db.Where("user_id = ?", userID).First(&item).Error
	return &item, err
}

func (r *settingsRepository) Upsert(userID uuid.UUID, settings string) (*model.UserSettings, error) {
	item := model.UserSettings{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   userID,
		Settings: settings,
	}
	err := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"settings"}),
	}).Create(&item).Error
	return &item, err
}
