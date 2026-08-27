package service

import (
	"fmt"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type StatsResponse struct {
	TotalBookmarks int                    `json:"total_bookmarks"`
	TotalAyahRead  int                    `json:"total_ayah_read"`
	HafalanSummary *model.HafalanSummary  `json:"hafalan"`
	Streak         *model.StreakResponse  `json:"streak"`
	Weekly         []model.WeeklyActivity `json:"weekly"`
}

type MonthlyRecap struct {
	Year         int     `json:"year"`
	Month        int     `json:"month"`
	ActiveDays   int     `json:"active_days"`
	TilawahPages int     `json:"tilawah_pages"`
	TilawahJuz   float64 `json:"tilawah_juz"`
	TilawahLogs  int     `json:"tilawah_logs"`
}

type YearlyRecap struct {
	Year        int            `json:"year"`
	Months      []MonthlyRecap `json:"months"`
	TotalActive int            `json:"total_active_days"`
	TotalPages  int            `json:"total_tilawah_pages"`
	TotalJuz    float64        `json:"total_juz"`
}

type StatsService interface {
	GetStats(userID uuid.UUID) (*StatsResponse, error)
	GetWeekly(userID uuid.UUID) ([]model.WeeklyActivity, error)
	GetMonthly(userID uuid.UUID, year, month int) (*MonthlyRecap, error)
	GetYearly(userID uuid.UUID, year int) (*YearlyRecap, error)
}

type statsService struct {
	bookmark  repository.BookmarkRepository
	hafalan   repository.HafalanRepository
	activity  repository.UserActivityRepository
	tilawah   repository.TilawahRepository
	streakSvc StreakService
}

func NewStatsService(
	bookmark repository.BookmarkRepository,
	hafalan repository.HafalanRepository,
	activity repository.UserActivityRepository,
	streakSvc StreakService,
) StatsService {
	return &statsService{bookmark: bookmark, hafalan: hafalan, activity: activity, streakSvc: streakSvc}
}

func NewStatsServiceWithTilawah(
	bookmark repository.BookmarkRepository,
	hafalan repository.HafalanRepository,
	activity repository.UserActivityRepository,
	tilawah repository.TilawahRepository,
	streakSvc StreakService,
) StatsService {
	return &statsService{bookmark, hafalan, activity, tilawah, streakSvc}
}

func (s *statsService) GetWeekly(userID uuid.UUID) ([]model.WeeklyActivity, error) {
	return s.streakSvc.GetWeekly(userID)
}

func (s *statsService) GetStats(userID uuid.UUID) (*StatsResponse, error) {
	bookmarks, _ := s.bookmark.FindByUserID(userID)
	hafalan, _ := s.hafalan.Summary(userID)
	streak, _ := s.streakSvc.GetStreak(userID)
	weekly, _ := s.streakSvc.GetWeekly(userID)

	return &StatsResponse{
		TotalBookmarks: len(bookmarks),
		HafalanSummary: hafalan,
		Streak:         streak,
		Weekly:         weekly,
	}, nil
}

func (s *statsService) GetMonthly(userID uuid.UUID, year, month int) (*MonthlyRecap, error) {
	from := fmt.Sprintf("%04d-%02d-01", year, month)
	lastDay := time.Date(year, time.Month(month+1), 0, 0, 0, 0, 0, time.UTC).Day()
	to := fmt.Sprintf("%04d-%02d-%02d", year, month, lastDay)

	recap := &MonthlyRecap{Year: year, Month: month}

	if s.tilawah != nil {
		logs, err := s.tilawah.FindByUserIDAndDateRange(userID, from, to)
		if err == nil {
			dates := map[string]bool{}
			for _, l := range logs {
				recap.TilawahPages += l.PagesRead
				recap.TilawahJuz += l.JuzRead
				dates[l.Date] = true
			}
			recap.TilawahLogs = len(logs)
			recap.ActiveDays = len(dates)
		}
	}
	return recap, nil
}

func (s *statsService) GetYearly(userID uuid.UUID, year int) (*YearlyRecap, error) {
	recap := &YearlyRecap{Year: year}
	for m := 1; m <= 12; m++ {
		monthly, err := s.GetMonthly(userID, year, m)
		if err != nil {
			continue
		}
		recap.Months = append(recap.Months, *monthly)
		recap.TotalActive += monthly.ActiveDays
		recap.TotalPages += monthly.TilawahPages
		recap.TotalJuz += monthly.TilawahJuz
	}
	return recap, nil
}
