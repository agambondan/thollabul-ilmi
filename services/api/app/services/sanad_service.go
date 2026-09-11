package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type SanadService interface {
	Create(*model.Sanad) (*model.Sanad, error)
	FindAll() ([]model.Sanad, error)
	FindByID(*int) (*model.Sanad, error)
	FindByHadithID(*int) ([]model.Sanad, error)
	UpdateByID(*int, *model.Sanad) (*model.Sanad, error)
	DeleteByID(*int) error

	AddMataSanad(*model.MataSanad) (*model.MataSanad, error)
	FindMataSanadByID(*int) (*model.MataSanad, error)
	UpdateMataSanad(*int, *model.MataSanad) (*model.MataSanad, error)
	DeleteMataSanad(*int) error
}

type sanadService struct {
	repo repository.SanadRepository
}

func NewSanadService(repo repository.SanadRepository) SanadService {
	return &sanadService{repo}
}

func (s *sanadService) Create(sanad *model.Sanad) (*model.Sanad, error) {
	return s.repo.Save(sanad)
}

func (s *sanadService) FindAll() ([]model.Sanad, error) {
	return s.repo.FindAll()
}

func (s *sanadService) FindByID(id *int) (*model.Sanad, error) {
	return s.repo.FindByID(id)
}

func (s *sanadService) FindByHadithID(hadithID *int) ([]model.Sanad, error) {
	return s.repo.FindByHadithID(hadithID)
}

func (s *sanadService) UpdateByID(id *int, sanad *model.Sanad) (*model.Sanad, error) {
	return s.repo.UpdateByID(id, sanad)
}

func (s *sanadService) DeleteByID(id *int) error {
	return s.repo.DeleteByID(id)
}

func (s *sanadService) AddMataSanad(m *model.MataSanad) (*model.MataSanad, error) {
	return s.repo.SaveMataSanad(m)
}

func (s *sanadService) FindMataSanadByID(id *int) (*model.MataSanad, error) {
	return s.repo.FindMataSanadByID(id)
}

func (s *sanadService) UpdateMataSanad(id *int, m *model.MataSanad) (*model.MataSanad, error) {
	return s.repo.UpdateMataSanad(id, m)
}

func (s *sanadService) DeleteMataSanad(id *int) error {
	return s.repo.DeleteMataSanad(id)
}
