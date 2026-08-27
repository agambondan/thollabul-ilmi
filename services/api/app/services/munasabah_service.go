package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type MunasabahService interface {
	Create(req *model.CreateMunasabahRequest) (*model.Munasabah, error)
	FindByAyahID(int) ([]model.Munasabah, error)
	Delete(int) error
}

type munasabahService struct {
	repo repository.MunasabahRepository
}

func NewMunasabahService(repo repository.MunasabahRepository) MunasabahService {
	return &munasabahService{repo}
}

func (s *munasabahService) Create(req *model.CreateMunasabahRequest) (*model.Munasabah, error) {
	m := &model.Munasabah{
		AyahFromID:  &req.AyahFromID,
		AyahToID:    &req.AyahToID,
		Description: req.Description,
	}
	return s.repo.Save(m)
}

func (s *munasabahService) FindByAyahID(ayahID int) ([]model.Munasabah, error) {
	return s.repo.FindByAyahID(ayahID)
}

func (s *munasabahService) Delete(id int) error {
	return s.repo.Delete(id)
}
