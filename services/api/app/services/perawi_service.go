package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

type PerawiService interface {
	Create(*model.Perawi) (*model.Perawi, error)
	FindAll(*fiber.Ctx) *paginate.Page
	FindByID(*int) (*model.Perawi, error)
	FindByTabaqah(*fiber.Ctx, string) *paginate.Page
	Search(*fiber.Ctx, string) *paginate.Page
	FindGuru(*int) ([]model.Perawi, error)
	FindMurid(*int) ([]model.Perawi, error)
	FindHadiths(*fiber.Ctx, *int) *paginate.Page
	UpdateByID(*int, *model.Perawi) (*model.Perawi, error)
	DeleteByID(*int) error
	Count() (*int64, error)
}

type perawiService struct {
	repo  repository.PerawiRepository
	cache *lib.CacheService
}

func NewPerawiService(repo repository.PerawiRepository) PerawiService {
	return &perawiService{repo: repo}
}

func NewPerawiServiceWithCache(repo repository.PerawiRepository, cache *lib.CacheService) PerawiService {
	return &perawiService{repo: repo, cache: cache}
}

func (s *perawiService) Create(p *model.Perawi) (*model.Perawi, error) {
	result, err := s.repo.Save(p)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("perawi:*")
	}
	return result, err
}

func (s *perawiService) FindAll(ctx *fiber.Ctx) *paginate.Page {
	if s.cache == nil {
		return s.repo.FindAll(ctx)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("perawi:all", ctx)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindAll(ctx), nil
	})
	if err != nil {
		return s.repo.FindAll(ctx)
	}
	return result
}

func (s *perawiService) FindByID(id *int) (*model.Perawi, error) {
	return s.repo.FindByID(id)
}

func (s *perawiService) FindByTabaqah(ctx *fiber.Ctx, tabaqah string) *paginate.Page {
	if s.cache == nil {
		return s.repo.FindByTabaqah(ctx, tabaqah)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("perawi:tabaqah", ctx, tabaqah)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindByTabaqah(ctx, tabaqah), nil
	})
	if err != nil {
		return s.repo.FindByTabaqah(ctx, tabaqah)
	}
	return result
}

func (s *perawiService) Search(ctx *fiber.Ctx, q string) *paginate.Page {
	if s.cache == nil {
		return s.repo.Search(ctx, q)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("perawi:search", ctx, q)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.Search(ctx, q), nil
	})
	if err != nil {
		return s.repo.Search(ctx, q)
	}
	return result
}

func (s *perawiService) FindGuru(id *int) ([]model.Perawi, error) {
	if s.cache == nil {
		return s.repo.FindGuru(id)
	}
	var result []model.Perawi
	key := lib.CacheKey("perawi:guru", *id)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindGuru(id)
	})
	return result, err
}

func (s *perawiService) FindMurid(id *int) ([]model.Perawi, error) {
	if s.cache == nil {
		return s.repo.FindMurid(id)
	}
	var result []model.Perawi
	key := lib.CacheKey("perawi:murid", *id)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindMurid(id)
	})
	return result, err
}

func (s *perawiService) FindHadiths(ctx *fiber.Ctx, id *int) *paginate.Page {
	if s.cache == nil {
		return s.repo.FindHadiths(ctx, id)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("perawi:hadiths", ctx, *id)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindHadiths(ctx, id), nil
	})
	if err != nil {
		return s.repo.FindHadiths(ctx, id)
	}
	return result
}

func (s *perawiService) UpdateByID(id *int, p *model.Perawi) (*model.Perawi, error) {
	result, err := s.repo.UpdateByID(id, p)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("perawi:*")
	}
	return result, err
}

func (s *perawiService) DeleteByID(id *int) error {
	err := s.repo.DeleteByID(id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("perawi:*")
	}
	return err
}

func (s *perawiService) Count() (*int64, error) {
	return s.repo.Count()
}
