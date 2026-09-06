package service

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

type KajianService interface {
	FindAll(ctx *fiber.Ctx, topic, kajianType, speaker string) *paginate.Page
	FindByID(id int) (*model.Kajian, error)
	Create(req *model.CreateKajianRequest) (*model.Kajian, error)
	Update(id int, req *model.CreateKajianRequest) (*model.Kajian, error)
	Delete(id int) error
	IncrementView(id int)
	SearchTranscripts(query, speaker, mode string, limit, offset int) ([]model.SearchTranscriptResult, int64, error)
	GetSpeakers() ([]string, error)
}

type kajianService struct {
	repo  repository.KajianRepository
	cache *lib.CacheService
}

func NewKajianService(repo repository.KajianRepository) KajianService {
	return &kajianService{repo: repo}
}

func NewKajianServiceWithCache(repo repository.KajianRepository, cache *lib.CacheService) KajianService {
	return &kajianService{repo: repo, cache: cache}
}

func (s *kajianService) FindAll(ctx *fiber.Ctx, topic, kajianType, speaker string) *paginate.Page {
	if s.cache == nil {
		return s.repo.FindAll(ctx, topic, kajianType, speaker)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("kajian:all", ctx)
	err := s.cache.Remember(key, &result, func() (interface{}, error) {
		return s.repo.FindAll(ctx, topic, kajianType, speaker), nil
	})
	if err != nil {
		return s.repo.FindAll(ctx, topic, kajianType, speaker)
	}
	return result
}

func (s *kajianService) FindByID(id int) (*model.Kajian, error) {
	return s.repo.FindByID(id)
}

func (s *kajianService) Create(req *model.CreateKajianRequest) (*model.Kajian, error) {
	k := &model.Kajian{
		Title:        req.Title,
		Description:  req.Description,
		Speaker:      req.Speaker,
		Topic:        req.Topic,
		Type:         req.Type,
		URL:          req.URL,
		Duration:     req.Duration,
		ThumbnailURL: req.ThumbnailURL,
		PublishedAt:  req.PublishedAt,
	}
	result, err := s.repo.Create(k)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("kajian:*")
	}
	return result, err
}

func (s *kajianService) Update(id int, req *model.CreateKajianRequest) (*model.Kajian, error) {
	k := &model.Kajian{
		Title:        req.Title,
		Description:  req.Description,
		Speaker:      req.Speaker,
		Topic:        req.Topic,
		Type:         req.Type,
		URL:          req.URL,
		Duration:     req.Duration,
		ThumbnailURL: req.ThumbnailURL,
		PublishedAt:  req.PublishedAt,
	}
	result, err := s.repo.Update(id, k)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("kajian:*")
	}
	return result, err
}

func (s *kajianService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == nil && s.cache != nil {
		s.cache.Invalidate("kajian:*")
	}
	return err
}

func (s *kajianService) IncrementView(id int) {
	_ = s.repo.IncrementView(id)
}

func (s *kajianService) SearchTranscripts(query, speaker, mode string, limit, offset int) ([]model.SearchTranscriptResult, int64, error) {
	return s.repo.SearchTranscripts(query, speaker, mode, limit, offset)
}

func (s *kajianService) GetSpeakers() ([]string, error) {
	return s.repo.GetSpeakers()
}
