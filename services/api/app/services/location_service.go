package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type LocationService interface {
	Create(req *model.CreateLocationRequest) (*model.Location, error)
	FindAll(search, category, era string, limit, offset int) ([]model.Location, int64, error)
	FindByID(int) (*model.Location, error)
	Delete(int) error
}

type locationService struct {
	repo  repository.LocationRepository
	cache *lib.CacheService
}

func NewLocationService(repo repository.LocationRepository) LocationService {
	return &locationService{repo: repo}
}

func NewLocationServiceWithCache(repo repository.LocationRepository, cache *lib.CacheService) LocationService {
	return &locationService{repo: repo, cache: cache}
}

func (s *locationService) Create(req *model.CreateLocationRequest) (*model.Location, error) {
	l := &model.Location{
		Name:        req.Name,
		Description: req.Description,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Category:    req.Category,
		Era:         req.Era,
		ImageURL:    req.ImageURL,
		TokohIDs:    req.TokohIDs,
	}
	result, err := s.repo.Save(l)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("location:*")
	}
	return result, err
}

func (s *locationService) FindAll(search, category, era string, limit, offset int) ([]model.Location, int64, error) {
	if s.cache == nil {
		return s.repo.FindAll(search, category, era, limit, offset)
	}
	type cachedLocationList struct {
		Items []model.Location `json:"items"`
		Total int64            `json:"total"`
	}
	var result cachedLocationList
	key := lib.CacheKey("location:all", "search", search, "category", category, "era", era, "limit", limit, "offset", offset)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		items, total, err := s.repo.FindAll(search, category, era, limit, offset)
		return cachedLocationList{Items: items, Total: total}, err
	})
	return result.Items, result.Total, err
}

func (s *locationService) FindByID(id int) (*model.Location, error) {
	if s.cache == nil {
		return s.repo.FindByID(id)
	}
	var result *model.Location
	key := lib.CacheKey("location:id", id)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindByID(id)
	})
	return result, err
}

func (s *locationService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("location:*")
	}
	return err
}
