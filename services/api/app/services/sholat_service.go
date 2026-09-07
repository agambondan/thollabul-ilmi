package service

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type SholatService interface {
	LogPrayer(userID uuid.UUID, req *model.LogSholatRequest) (*model.SholatLog, error)
	GetToday(userID uuid.UUID) (*model.SholatDailyStatus, error)
	GetHistory(userID uuid.UUID, from, to string) ([]model.SholatLog, error)
	GetStats(userID uuid.UUID) (*model.SholatStats, error)
	GetAllGuides() ([]model.SholatGuide, error)
	GetGuideByStep(step int) (*model.SholatGuide, error)
	CreateGuide(guide *model.SholatGuide) (*model.SholatGuide, error)
	UpdateGuide(id int, guide *model.SholatGuide) (*model.SholatGuide, error)
	DeleteGuide(id int) error
}

type sholatService struct {
	repo repository.SholatRepository
}

func NewSholatService(repo repository.SholatRepository) SholatService {
	return &sholatService{repo}
}

func (s *sholatService) LogPrayer(userID uuid.UUID, req *model.LogSholatRequest) (*model.SholatLog, error) {
	date := req.Date
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	log := &model.SholatLog{
		UserID: userID,
		Date:   date,
		Prayer: req.Prayer,
		Status: req.Status,
	}
	return s.repo.Upsert(log)
}

func (s *sholatService) GetToday(userID uuid.UUID) (*model.SholatDailyStatus, error) {
	today := time.Now().Format("2006-01-02")
	logs, err := s.repo.FindByUserIDAndDate(userID, today)
	if err != nil {
		return nil, err
	}
	status := &model.SholatDailyStatus{
		Date:    today,
		Prayers: make(map[model.PrayerName]*model.SholatLog),
	}
	for i := range logs {
		l := logs[i]
		status.Prayers[l.Prayer] = &l
	}
	return status, nil
}

func (s *sholatService) GetHistory(userID uuid.UUID, from, to string) ([]model.SholatLog, error) {
	return s.repo.FindByUserIDDateRange(userID, from, to)
}

func (s *sholatService) GetStats(userID uuid.UUID) (*model.SholatStats, error) {
	logs, err := s.repo.FindByUserIDDateRange(userID, "", "")
	if err != nil {
		return nil, err
	}
	if len(logs) == 0 {
		return &model.SholatStats{}, nil
	}

	counts := map[model.PrayerStatus]int{}
	dates := map[string]bool{}
	for _, l := range logs {
		counts[l.Status]++
		dates[l.Date] = true
	}
	total := len(logs)
	stats := &model.SholatStats{
		TotalDays:    len(dates),
		BerjamaahPct: float64(counts[model.PrayerBerjamaah]) / float64(total) * 100,
		MunfaridPct:  float64(counts[model.PrayerMunfarid]) / float64(total) * 100,
		QadhaPct:     float64(counts[model.PrayerQadha]) / float64(total) * 100,
		MissedPct:    float64(counts[model.PrayerMissed]) / float64(total) * 100,
	}
	return stats, nil
}

func (s *sholatService) GetAllGuides() ([]model.SholatGuide, error) {
	return s.repo.FindAllGuides()
}

func (s *sholatService) GetGuideByStep(step int) (*model.SholatGuide, error) {
	return s.repo.FindGuideByStep(step)
}

func (s *sholatService) CreateGuide(guide *model.SholatGuide) (*model.SholatGuide, error) {
	return s.repo.CreateGuide(guide)
}

func (s *sholatService) UpdateGuide(id int, guide *model.SholatGuide) (*model.SholatGuide, error) {
	return s.repo.UpdateGuide(id, guide)
}

func (s *sholatService) DeleteGuide(id int) error {
	return s.repo.DeleteGuide(id)
}
