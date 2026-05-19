package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type AsmaUlHusnaService interface {
	FindAll(limit, offset int) ([]model.AsmaUlHusna, error)
	FindByNumber(int) (*model.AsmaUlHusna, error)
	Create(*model.AsmaUlHusna) (*model.AsmaUlHusna, error)
	Update(int, *model.AsmaUlHusna) (*model.AsmaUlHusna, error)
	Delete(int) error
}

type asmaUlHusnaService struct {
	repo  repository.AsmaUlHusnaRepository
	cache *lib.CacheService
}

func NewAsmaUlHusnaService(repo repository.AsmaUlHusnaRepository) AsmaUlHusnaService {
	return &asmaUlHusnaService{repo: repo}
}

func NewAsmaUlHusnaServiceWithCache(repo repository.AsmaUlHusnaRepository, cache *lib.CacheService) AsmaUlHusnaService {
	return &asmaUlHusnaService{repo: repo, cache: cache}
}

func (s *asmaUlHusnaService) FindAll(limit, offset int) ([]model.AsmaUlHusna, error) {
	if s.cache == nil {
		return s.repo.FindAll(limit, offset)
	}
	var result []model.AsmaUlHusna
	key := lib.CacheKey("asmaul-husna:all", "limit", limit, "offset", offset)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindAll(limit, offset)
	})
	if err != nil {
		return result, err
	}
	return result, nil
}

func (s *asmaUlHusnaService) FindByNumber(number int) (*model.AsmaUlHusna, error) {
	return s.repo.FindByNumber(number)
}

func (s *asmaUlHusnaService) Create(a *model.AsmaUlHusna) (*model.AsmaUlHusna, error) {
	result, err := s.repo.Create(a)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("asmaul-husna:*")
	}
	return result, err
}

func (s *asmaUlHusnaService) Update(id int, a *model.AsmaUlHusna) (*model.AsmaUlHusna, error) {
	result, err := s.repo.Update(id, a)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("asmaul-husna:*")
	}
	return result, err
}

func (s *asmaUlHusnaService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("asmaul-husna:*")
	}
	return err
}
