package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type RadioIslamicService interface {
	Create(req *model.CreateRadioIslamicRequest) (*model.RadioIslamic, error)
	Update(id int, req *model.UpdateRadioIslamicRequest) (*model.RadioIslamic, error)
	FindAll(search, city, province string, limit, offset int) ([]model.RadioIslamic, int64, error)
	FindByID(int) (*model.RadioIslamic, error)
	Delete(int) error
}

type radioIslamicService struct {
	repo  repository.RadioIslamicRepository
	cache *lib.CacheService
}

func NewRadioIslamicService(repo repository.RadioIslamicRepository) RadioIslamicService {
	return &radioIslamicService{repo: repo}
}

func NewRadioIslamicServiceWithCache(repo repository.RadioIslamicRepository, cache *lib.CacheService) RadioIslamicService {
	return &radioIslamicService{repo: repo, cache: cache}
}

func (s *radioIslamicService) Create(req *model.CreateRadioIslamicRequest) (*model.RadioIslamic, error) {
	rad := &model.RadioIslamic{
		Name:        req.Name,
		Frequency:   req.Frequency,
		City:        req.City,
		Province:    req.Province,
		StreamURL:   req.StreamURL,
		Description: req.Description,
		LogoURL:     req.LogoURL,
		Website:     req.Website,
		IsActive:    req.IsActive,
		Tags:        req.Tags,
	}
	result, err := s.repo.Save(rad)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("radio:*")
	}
	return result, err
}

func (s *radioIslamicService) FindAll(search, city, province string, limit, offset int) ([]model.RadioIslamic, int64, error) {
	if s.cache == nil {
		return s.repo.FindAll(search, city, province, limit, offset)
	}
	type cachedRadioList struct {
		Items []model.RadioIslamic `json:"items"`
		Total int64                `json:"total"`
	}
	var result cachedRadioList
	key := lib.CacheKey("radio:all", "search", search, "city", city, "province", province, "limit", limit, "offset", offset)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		items, total, err := s.repo.FindAll(search, city, province, limit, offset)
		return cachedRadioList{Items: items, Total: total}, err
	})
	return result.Items, result.Total, err
}

func (s *radioIslamicService) FindByID(id int) (*model.RadioIslamic, error) {
	if s.cache == nil {
		return s.repo.FindByID(id)
	}
	var result *model.RadioIslamic
	key := lib.CacheKey("radio:id", id)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindByID(id)
	})
	return result, err
}

func (s *radioIslamicService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("radio:*")
	}
	return err
}

func (s *radioIslamicService) Update(id int, req *model.UpdateRadioIslamicRequest) (*model.RadioIslamic, error) {
	fields := map[string]interface{}{}
	if req.Name != nil {
		fields["name"] = *req.Name
	}
	if req.Frequency != nil {
		fields["frequency"] = *req.Frequency
	}
	if req.City != nil {
		fields["city"] = *req.City
	}
	if req.Province != nil {
		fields["province"] = *req.Province
	}
	if req.StreamURL != nil {
		fields["stream_url"] = *req.StreamURL
	}
	if req.Description != nil {
		fields["description"] = *req.Description
	}
	if req.LogoURL != nil {
		fields["logo_url"] = *req.LogoURL
	}
	if req.Website != nil {
		fields["website"] = *req.Website
	}
	if req.IsActive != nil {
		fields["is_active"] = *req.IsActive
	}
	if req.Tags != nil {
		fields["tags"] = *req.Tags
	}
	result, err := s.repo.Update(id, fields)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("radio:*")
	}
	return result, err
}
