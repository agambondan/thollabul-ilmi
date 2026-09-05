package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type LeaderboardService interface {
	TopStreak(limit int) ([]model.LeaderboardEntry, error)
	TopHafalan(limit int) ([]model.LeaderboardEntry, error)
	TopMushahhih(limit int) ([]model.LeaderboardEntry, error)
	MyRank(userID uuid.UUID) (map[string]*model.LeaderboardMyRank, error)
}

type leaderboardService struct {
	repo repository.LeaderboardRepository
}

func NewLeaderboardService(repo repository.LeaderboardRepository) LeaderboardService {
	return &leaderboardService{repo}
}

func (s *leaderboardService) TopStreak(limit int) ([]model.LeaderboardEntry, error) {
	return s.repo.TopStreak(limit)
}

func (s *leaderboardService) TopHafalan(limit int) ([]model.LeaderboardEntry, error) {
	return s.repo.TopHafalan(limit)
}

func (s *leaderboardService) TopMushahhih(limit int) ([]model.LeaderboardEntry, error) {
	return s.repo.TopMushahhih(limit)
}

func (s *leaderboardService) MyRank(userID uuid.UUID) (map[string]*model.LeaderboardMyRank, error) {
	streak, err := s.repo.MyStreakRank(userID)
	if err != nil {
		return nil, err
	}
	hafalan, err := s.repo.MyHafalanRank(userID)
	if err != nil {
		return nil, err
	}
	mushahhih, err := s.repo.MyMushahhihRank(userID)
	if err != nil {
		return nil, err
	}
	return map[string]*model.LeaderboardMyRank{
		"streak":    streak,
		"hafalan":   hafalan,
		"mushahhih": mushahhih,
	}, nil
}
