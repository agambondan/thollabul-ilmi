package service

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type AchievementService interface {
	GetAll() ([]model.Achievement, error)
	Create(a *model.Achievement) (*model.Achievement, error)
	Update(id int, a *model.Achievement) (*model.Achievement, error)
	Delete(id int) error
	GetUserAchievements(userID uuid.UUID) ([]model.UserAchievement, error)
	GetUserPoints(userID uuid.UUID) (*model.UserPoints, error)
	// Evaluate checks a user's progress and awards any newly-earned achievements.
	// Call this after activity events (streak update, hafalan save, etc.).
	Evaluate(userID uuid.UUID, streakCurrent int, hafalanMemorized int, totalBookmarks int) ([]model.UserAchievement, error)
}

type achievementService struct {
	repo      repository.AchievementRepository
	allCached []model.Achievement
}

func NewAchievementService(repo repository.AchievementRepository) AchievementService {
	return &achievementService{repo: repo}
}

func (s *achievementService) GetAll() ([]model.Achievement, error) {
	return s.repo.FindAll()
}

func (s *achievementService) Create(a *model.Achievement) (*model.Achievement, error) {
	return s.repo.Create(a)
}

func (s *achievementService) Update(id int, a *model.Achievement) (*model.Achievement, error) {
	return s.repo.Update(id, a)
}

func (s *achievementService) Delete(id int) error {
	return s.repo.Delete(id)
}

func (s *achievementService) GetUserAchievements(userID uuid.UUID) ([]model.UserAchievement, error) {
	return s.repo.FindUserAchievements(userID)
}

func (s *achievementService) GetUserPoints(userID uuid.UUID) (*model.UserPoints, error) {
	return s.repo.GetPoints(userID)
}

func (s *achievementService) Evaluate(userID uuid.UUID, streakCurrent int, hafalanMemorized int, totalBookmarks int) ([]model.UserAchievement, error) {
	all, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}

	var awarded []model.UserAchievement
	for _, a := range all {
		if s.repo.HasEarned(userID, *a.ID) {
			continue
		}
		earned := false
		switch a.Category {
		case "streak":
			earned = streakCurrent >= a.Threshold
		case "hafalan":
			earned = hafalanMemorized >= a.Threshold
		case "bookmark":
			earned = totalBookmarks >= a.Threshold
		}
		if earned {
			ua := &model.UserAchievement{
				BaseUUID:      model.BaseUUID{ID: uuid.New()},
				UserID:        userID,
				AchievementID: *a.ID,
				EarnedAt:      time.Now(),
			}
			if err := s.repo.Award(ua); err == nil {
				ua.Achievement = a
				awarded = append(awarded, *ua)
				// Award 10 points per badge
				_ = s.repo.AddPoints(userID, 10)
			}
		}
	}
	return awarded, nil
}
