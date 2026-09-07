package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type TokohTarikhService interface {
	Create(req *model.CreateTokohTarikhRequest) (*model.TokohTarikh, error)
	Update(id int, req *model.CreateTokohTarikhRequest) (*model.TokohTarikh, error)
	FindAll(search, era, kategori string, limit, offset int) ([]model.TokohTarikh, int64, error)
	FindByID(int) (*model.TokohTarikh, error)
	Delete(int) error
}

type tokohTarikhService struct {
	repo  repository.TokohTarikhRepository
	cache *lib.CacheService
}

func NewTokohTarikhService(repo repository.TokohTarikhRepository) TokohTarikhService {
	return &tokohTarikhService{repo: repo}
}

func NewTokohTarikhServiceWithCache(repo repository.TokohTarikhRepository, cache *lib.CacheService) TokohTarikhService {
	return &tokohTarikhService{repo: repo, cache: cache}
}

func (s *tokohTarikhService) Create(req *model.CreateTokohTarikhRequest) (*model.TokohTarikh, error) {
	t := &model.TokohTarikh{
		Nama:       req.Nama,
		Era:        req.Era,
		TahunLahir: req.TahunLahir,
		TahunWafat: req.TahunWafat,
		Biografi:   req.Biografi,
		Kontribusi: req.Kontribusi,
		Kategori:   req.Kategori,
		ImageURL:   req.ImageURL,
	}
	result, err := s.repo.Save(t)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("tokoh-tarikh:*")
	}
	return result, err
}

func (s *tokohTarikhService) FindAll(search, era, kategori string, limit, offset int) ([]model.TokohTarikh, int64, error) {
	if s.cache == nil {
		return s.repo.FindAll(search, era, kategori, limit, offset)
	}
	type cachedTokohList struct {
		Items []model.TokohTarikh `json:"items"`
		Total int64               `json:"total"`
	}
	var result cachedTokohList
	key := lib.CacheKey("tokoh-tarikh:all", "search", search, "era", era, "kategori", kategori, "limit", limit, "offset", offset)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		items, total, err := s.repo.FindAll(search, era, kategori, limit, offset)
		return cachedTokohList{Items: items, Total: total}, err
	})
	return result.Items, result.Total, err
}

func (s *tokohTarikhService) FindByID(id int) (*model.TokohTarikh, error) {
	if s.cache == nil {
		return s.repo.FindByID(id)
	}
	var result *model.TokohTarikh
	key := lib.CacheKey("tokoh-tarikh:id", id)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindByID(id)
	})
	return result, err
}

func (s *tokohTarikhService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("tokoh-tarikh:*")
	}
	return err
}

func (s *tokohTarikhService) Update(id int, req *model.CreateTokohTarikhRequest) (*model.TokohTarikh, error) {
	t := &model.TokohTarikh{
		Nama:       req.Nama,
		Era:        req.Era,
		TahunLahir: req.TahunLahir,
		TahunWafat: req.TahunWafat,
		Biografi:   req.Biografi,
		Kontribusi: req.Kontribusi,
		Kategori:   req.Kategori,
		ImageURL:   req.ImageURL,
	}
	result, err := s.repo.Update(id, t)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("tokoh-tarikh:*")
	}
	return result, err
}
