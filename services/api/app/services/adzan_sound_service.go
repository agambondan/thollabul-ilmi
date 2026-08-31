package service

import (
	"errors"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

var ErrAdzanSoundLimit = errors.New("adzan sound limit reached")

type AdzanSoundService interface {
	FindByUserID(userID uuid.UUID) ([]model.AdzanSound, error)
	Create(sound *model.AdzanSound) error
	Delete(id int, userID uuid.UUID) (*model.AdzanSound, error)
}

type adzanSoundService struct {
	repo repository.AdzanSoundRepository
}

func NewAdzanSoundService(repo repository.AdzanSoundRepository) AdzanSoundService {
	return &adzanSoundService{repo: repo}
}

func (s *adzanSoundService) FindByUserID(userID uuid.UUID) ([]model.AdzanSound, error) {
	return s.repo.FindByUserID(userID)
}

func (s *adzanSoundService) Create(sound *model.AdzanSound) error {
	count, err := s.repo.CountByUserID(sound.UserID)
	if err != nil {
		return err
	}
	if count >= 3 {
		return ErrAdzanSoundLimit
	}
	return s.repo.Create(sound)
}

func (s *adzanSoundService) Delete(id int, userID uuid.UUID) (*model.AdzanSound, error) {
	sound, err := s.repo.FindByIDAndUserID(id, userID)
	if err != nil {
		return nil, err
	}
	return sound, s.repo.Delete(sound)
}
