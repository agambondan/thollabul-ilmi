package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type SettingsService interface {
	Get(userID uuid.UUID) (*model.UserSettings, error)
	Upsert(userID uuid.UUID, req *model.UpdateSettingsRequest) (*model.UserSettings, error)
}

type settingsService struct {
	repo repository.SettingsRepository
}

func NewSettingsService(repo repository.SettingsRepository) SettingsService {
	return &settingsService{repo}
}

func (s *settingsService) Get(userID uuid.UUID) (*model.UserSettings, error) {
	return s.repo.FindByUserID(userID)
}

func (s *settingsService) Upsert(userID uuid.UUID, req *model.UpdateSettingsRequest) (*model.UserSettings, error) {
	return s.repo.Upsert(userID, req.Settings)
}
