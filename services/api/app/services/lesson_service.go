package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type LessonService interface {
	Modules() ([]model.LessonModule, error)
	ModuleBySlug(slug string) (*model.LessonModule, error)
	GetProgress(userID uuid.UUID) ([]model.UserLessonProgress, error)
	SaveProgress(userID uuid.UUID, req *model.SaveLessonProgressRequest) (*model.UserLessonProgress, error)
}

type lessonService struct {
	repo repository.LessonRepository
}

func NewLessonService(repo repository.LessonRepository) LessonService {
	return &lessonService{repo}
}

func (s *lessonService) Modules() ([]model.LessonModule, error) {
	return s.repo.FindAll()
}

func (s *lessonService) ModuleBySlug(slug string) (*model.LessonModule, error) {
	return s.repo.FindBySlug(slug)
}

func (s *lessonService) GetProgress(userID uuid.UUID) ([]model.UserLessonProgress, error) {
	return s.repo.FindProgress(userID)
}

func (s *lessonService) SaveProgress(userID uuid.UUID, req *model.SaveLessonProgressRequest) (*model.UserLessonProgress, error) {
	p := &model.UserLessonProgress{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   userID,
		ModuleID: req.ModuleID,
		Step:     req.Step,
		Done:     req.Done,
	}
	return s.repo.UpsertProgress(p)
}
