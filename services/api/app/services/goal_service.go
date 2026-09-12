package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type GoalService interface {
	Create(userID uuid.UUID, req *model.CreateGoalRequest) (*model.StudyGoal, error)
	FindAll(userID uuid.UUID) ([]model.StudyGoal, error)
	Update(id int, userID uuid.UUID, req *model.UpdateGoalRequest) (*model.StudyGoal, error)
	Delete(id int, userID uuid.UUID) error
}

type goalService struct {
	repo repository.GoalRepository
}

func NewGoalService(repo repository.GoalRepository) GoalService {
	return &goalService{repo}
}

func (s *goalService) Create(userID uuid.UUID, req *model.CreateGoalRequest) (*model.StudyGoal, error) {
	g := &model.StudyGoal{
		UserID:      userID,
		Type:        req.Type,
		Title:       req.Title,
		Description: req.Description,
		Target:      req.Target,
		StartDate:   req.StartDate,
		EndDate:     nonEmptyDate(req.EndDate),
	}
	return s.repo.Create(g)
}

func nonEmptyDate(date string) *string {
	if date == "" {
		return nil
	}
	return &date
}

func (s *goalService) FindAll(userID uuid.UUID) ([]model.StudyGoal, error) {
	return s.repo.FindByUserID(userID)
}

func (s *goalService) Update(id int, userID uuid.UUID, req *model.UpdateGoalRequest) (*model.StudyGoal, error) {
	g := &model.StudyGoal{
		Title:       req.Title,
		Description: req.Description,
		Target:      req.Target,
		Progress:    req.Progress,
		EndDate:     nonEmptyDate(req.EndDate),
	}
	if req.IsCompleted != nil {
		g.IsCompleted = *req.IsCompleted
	}
	return s.repo.Update(id, userID, g)
}

func (s *goalService) Delete(id int, userID uuid.UUID) error {
	return s.repo.Delete(id, userID)
}
