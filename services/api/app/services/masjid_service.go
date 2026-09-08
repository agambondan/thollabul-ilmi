package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type MasjidService interface {
	Create(req *model.CreateMasjidRequest) (*model.Masjid, error)
	Update(id int, req *model.UpdateMasjidRequest) (*model.Masjid, error)
	FindAll(search, city, province string, limit, offset int) ([]model.Masjid, int64, error)
	FindByID(int) (*model.Masjid, error)
	Delete(int) error
	FindNearby(lat, lng, radiusKm float64, limit int) ([]model.MasjidDistance, int64, error)
}

type masjidService struct {
	repo  repository.MasjidRepository
	cache *lib.CacheService
}

func NewMasjidService(repo repository.MasjidRepository) MasjidService {
	return &masjidService{repo: repo}
}

func NewMasjidServiceWithCache(repo repository.MasjidRepository, cache *lib.CacheService) MasjidService {
	return &masjidService{repo: repo, cache: cache}
}

func (s *masjidService) Create(req *model.CreateMasjidRequest) (*model.Masjid, error) {
	m := &model.Masjid{
		Name:        req.Name,
		Description: req.Description,
		Address:     req.Address,
		District:    req.District,
		City:        req.City,
		Province:    req.Province,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Phone:       req.Phone,
		Capacity:    req.Capacity,
		Facilities:  req.Facilities,
		ImageURL:    req.ImageURL,
		Website:     req.Website,
		IsActive:    req.IsActive,
	}
	result, err := s.repo.Save(m)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("masjid:*")
	}
	return result, err
}

func (s *masjidService) FindAll(search, city, province string, limit, offset int) ([]model.Masjid, int64, error) {
	if s.cache == nil {
		return s.repo.FindAll(search, city, province, limit, offset)
	}
	type cachedMasjidList struct {
		Items []model.Masjid `json:"items"`
		Total int64          `json:"total"`
	}
	var result cachedMasjidList
	key := lib.CacheKey("masjid:all", "search", search, "city", city, "province", province, "limit", limit, "offset", offset)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		items, total, err := s.repo.FindAll(search, city, province, limit, offset)
		return cachedMasjidList{Items: items, Total: total}, err
	})
	return result.Items, result.Total, err
}

func (s *masjidService) FindByID(id int) (*model.Masjid, error) {
	if s.cache == nil {
		return s.repo.FindByID(id)
	}
	var result *model.Masjid
	key := lib.CacheKey("masjid:id", id)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindByID(id)
	})
	return result, err
}

func (s *masjidService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("masjid:*")
	}
	return err
}

func (s *masjidService) Update(id int, req *model.UpdateMasjidRequest) (*model.Masjid, error) {
	fields := map[string]interface{}{}
	if req.Name != nil {
		fields["name"] = *req.Name
	}
	if req.Description != nil {
		fields["description"] = *req.Description
	}
	if req.Address != nil {
		fields["address"] = *req.Address
	}
	if req.District != nil {
		fields["district"] = *req.District
	}
	if req.City != nil {
		fields["city"] = *req.City
	}
	if req.Province != nil {
		fields["province"] = *req.Province
	}
	if req.Latitude != nil {
		fields["latitude"] = *req.Latitude
	}
	if req.Longitude != nil {
		fields["longitude"] = *req.Longitude
	}
	if req.Phone != nil {
		fields["phone"] = *req.Phone
	}
	if req.Capacity != nil {
		fields["capacity"] = *req.Capacity
	}
	if req.Facilities != nil {
		fields["facilities"] = *req.Facilities
	}
	if req.ImageURL != nil {
		fields["image_url"] = *req.ImageURL
	}
	if req.Website != nil {
		fields["website"] = *req.Website
	}
	if req.IsActive != nil {
		fields["is_active"] = *req.IsActive
	}
	result, err := s.repo.Update(id, fields)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("masjid:*")
	}
	return result, err
}

func (s *masjidService) FindNearby(lat, lng, radiusKm float64, limit int) ([]model.MasjidDistance, int64, error) {
	if s.cache == nil {
		return s.repo.FindNearby(lat, lng, radiusKm, limit)
	}
	type cachedNearbyList struct {
		Items []model.MasjidDistance `json:"items"`
		Total int64                  `json:"total"`
	}
	var result cachedNearbyList
	key := lib.CacheKey("masjid:nearby", "lat", lat, "lng", lng, "radius", radiusKm, "limit", limit)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		items, total, err := s.repo.FindNearby(lat, lng, radiusKm, limit)
		return cachedNearbyList{Items: items, Total: total}, err
	})
	return result.Items, result.Total, err
}
