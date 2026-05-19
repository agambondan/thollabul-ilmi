package service

import (
	"log/slog"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type APIKeyService interface {
	ListByUser(userID uuid.UUID) ([]model.APIKeyPublic, error)
	Create(userID uuid.UUID, req *model.CreateAPIKeyRequest) (*model.APIKey, error)
	Revoke(id int, userID uuid.UUID) error
	Validate(key string) (*model.APIKey, error)
}

type apiKeyService struct{ repo repository.APIKeyRepository }

func NewAPIKeyService(repo repository.APIKeyRepository) APIKeyService {
	return &apiKeyService{repo}
}

func (s *apiKeyService) ListByUser(userID uuid.UUID) ([]model.APIKeyPublic, error) {
	keys, err := s.repo.FindByUserID(userID)
	if err != nil {
		return nil, err
	}
	var result []model.APIKeyPublic
	for _, k := range keys {
		prefix := k.Key
		if len(prefix) > 8 {
			prefix = prefix[:8] + "..."
		}
		result = append(result, model.APIKeyPublic{
			ID:           k.ID,
			Name:         k.Name,
			KeyPrefix:    prefix,
			IsActive:     k.IsActive,
			LastUsedAt:   k.LastUsedAt,
			RequestCount: k.RequestCount,
		})
	}
	return result, nil
}

func (s *apiKeyService) Create(userID uuid.UUID, req *model.CreateAPIKeyRequest) (*model.APIKey, error) {
	return s.repo.Create(userID, req.Name)
}

func (s *apiKeyService) Revoke(id int, userID uuid.UUID) error {
	return s.repo.Revoke(id, userID)
}

func (s *apiKeyService) Validate(key string) (*model.APIKey, error) {
	k, err := s.repo.FindByKey(key)
	if err != nil {
		return nil, err
	}
	go func() {
		defer func() { if r := recover(); r != nil { slog.Error("panic in api_key_service", "recover", r) } }()
		_ = s.repo.IncrementUsage(key)
	}()
	return k, nil
}
