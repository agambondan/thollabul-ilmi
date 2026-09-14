package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type AdService interface {
	GetActiveBySlot(slot string) (*model.Ad, error)
	List() ([]model.Ad, error)
	FindByID(id uuid.UUID) (*model.Ad, error)
	Create(req *model.CreateAdRequest) (*model.Ad, error)
	Update(id uuid.UUID, req *model.UpdateAdRequest) (*model.Ad, error)
	Delete(id uuid.UUID) error
}

type adService struct {
	repo repository.AdRepository
}

func NewAdService(repo repository.AdRepository) AdService {
	return &adService{repo: repo}
}

func (s *adService) GetActiveBySlot(slot string) (*model.Ad, error) {
	return s.repo.GetActiveBySlot(slot)
}

func (s *adService) List() ([]model.Ad, error) {
	return s.repo.List()
}

func (s *adService) FindByID(id uuid.UUID) (*model.Ad, error) {
	return s.repo.FindByID(id)
}

func (s *adService) Create(req *model.CreateAdRequest) (*model.Ad, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	ad := &model.Ad{
		Title:    req.Title,
		ImageURL: req.ImageURL,
		ClickURL: req.ClickURL,
		SlotType: req.SlotType,
		Priority: req.Priority,
		IsActive: isActive,
		StartAt:  req.StartAt,
		EndAt:    req.EndAt,
	}
	if err := s.repo.Create(ad); err != nil {
		return nil, err
	}
	return ad, nil
}

func (s *adService) Update(id uuid.UUID, req *model.UpdateAdRequest) (*model.Ad, error) {
	ad, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if req.Title != nil {
		ad.Title = *req.Title
	}
	if req.ImageURL != nil {
		ad.ImageURL = *req.ImageURL
	}
	if req.ClickURL != nil {
		ad.ClickURL = *req.ClickURL
	}
	if req.SlotType != nil {
		ad.SlotType = *req.SlotType
	}
	if req.Priority != nil {
		ad.Priority = *req.Priority
	}
	if req.IsActive != nil {
		ad.IsActive = *req.IsActive
	}
	if req.StartAt != nil {
		ad.StartAt = req.StartAt
	}
	if req.EndAt != nil {
		ad.EndAt = req.EndAt
	}
	if err := s.repo.Update(ad); err != nil {
		return nil, err
	}
	return ad, nil
}

func (s *adService) Delete(id uuid.UUID) error {
	return s.repo.Delete(id)
}
