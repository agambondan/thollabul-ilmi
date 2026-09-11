package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type HadithAyahService interface {
	Create(req *model.CreateHadithAyahRequest) (*model.HadithAyah, error)
	FindAll() ([]model.HadithAyah, error)
	FindByID(int) (*model.HadithAyah, error)
	FindByHadithID(int) ([]model.HadithAyah, error)
	FindByAyahID(int) ([]model.HadithAyah, error)
	Update(int, *model.HadithAyah) (*model.HadithAyah, error)
	Delete(int) error
}

type hadithAyahService struct {
	repo repository.HadithAyahRepository
}

func NewHadithAyahService(repo repository.HadithAyahRepository) HadithAyahService {
	return &hadithAyahService{repo}
}

func (s *hadithAyahService) Create(req *model.CreateHadithAyahRequest) (*model.HadithAyah, error) {
	ha := &model.HadithAyah{
		HadithID: &req.HadithID,
		AyahID:   &req.AyahID,
		Catatan:  req.Catatan,
	}
	return s.repo.Save(ha)
}

func (s *hadithAyahService) FindAll() ([]model.HadithAyah, error) {
	return s.repo.FindAll()
}

func (s *hadithAyahService) FindByID(id int) (*model.HadithAyah, error) {
	return s.repo.FindByID(id)
}

func (s *hadithAyahService) Update(id int, ha *model.HadithAyah) (*model.HadithAyah, error) {
	return s.repo.Update(id, ha)
}

func (s *hadithAyahService) FindByHadithID(hadithID int) ([]model.HadithAyah, error) {
	return s.repo.FindByHadithID(hadithID)
}

func (s *hadithAyahService) FindByAyahID(ayahID int) ([]model.HadithAyah, error) {
	return s.repo.FindByAyahID(ayahID)
}

func (s *hadithAyahService) Delete(id int) error {
	return s.repo.Delete(id)
}
