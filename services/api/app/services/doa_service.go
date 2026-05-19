package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type DoaService interface {
	FindAll(limit, offset int) ([]model.Doa, error)
	FindByID(int) (*model.Doa, error)
	FindByCategory(model.DoaCategory, int, int) ([]model.Doa, error)
	Create(*model.Doa) (*model.Doa, error)
	Update(int, *model.Doa) (*model.Doa, error)
	Delete(int) error
}

type doaService struct {
	repo  repository.DoaRepository
	cache *lib.CacheService
}

func NewDoaService(repo repository.DoaRepository) DoaService {
	return &doaService{repo: repo}
}

func NewDoaServiceWithCache(repo repository.DoaRepository, cache *lib.CacheService) DoaService {
	return &doaService{repo: repo, cache: cache}
}

func (s *doaService) FindAll(limit, offset int) ([]model.Doa, error) {
	if s.cache == nil {
		return s.repo.FindAll(limit, offset)
	}
	var result []model.Doa
	key := lib.CacheKey("doa:all", "limit", limit, "offset", offset)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindAll(limit, offset)
	})
	return result, err
}

func (s *doaService) FindByID(id int) (*model.Doa, error) {
	return s.repo.FindByID(id)
}

func (s *doaService) FindByCategory(category model.DoaCategory, limit, offset int) ([]model.Doa, error) {
	if s.cache == nil {
		return s.repo.FindByCategory(category, limit, offset)
	}
	var result []model.Doa
	key := lib.CacheKey("doa:category", category, "limit", limit, "offset", offset)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindByCategory(category, limit, offset)
	})
	return result, err
}

func (s *doaService) Create(d *model.Doa) (*model.Doa, error) {
	result, err := s.repo.Create(d)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("doa:*")
	}
	return result, err
}

func (s *doaService) Update(id int, d *model.Doa) (*model.Doa, error) {
	result, err := s.repo.Update(id, d)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("doa:*")
	}
	return result, err
}

func (s *doaService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("doa:*")
	}
	return err
}
