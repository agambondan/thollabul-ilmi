package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
	"github.com/spf13/viper"
)

type PageViewService interface {
	Record(req *model.CreatePageViewRequest, ip, userAgent string, userID *uuid.UUID) error
	AdminSummary(days int) (*model.PageViewAdminSummary, error)
}

type pageViewService struct {
	repo repository.PageViewRepository
}

func NewPageViewService(repo repository.PageViewRepository) PageViewService {
	return &pageViewService{repo}
}

func (s *pageViewService) Record(req *model.CreatePageViewRequest, ip, userAgent string, userID *uuid.UUID) error {
	path := clampString(req.Path, 512)
	if path == "" || strings.HasPrefix(path, "/_next") || strings.HasPrefix(path, "/api/") {
		return nil
	}

	source := normalizePageViewSource(req.Source, path)
	visitorID := clampString(req.VisitorID, 128)
	ipHash := hashIP(ip)
	if visitorID == "" {
		visitorID = ipHash
	}

	view := &model.PageView{
		BaseUUID:  model.BaseUUID{ID: uuid.New()},
		VisitorID: visitorID,
		UserID:    userID,
		Path:      path,
		Source:    source,
		Referrer:  clampString(req.Referrer, 512),
		UserAgent: clampString(userAgent, 512),
		IPHash:    ipHash,
	}
	return s.repo.Record(view)
}

func (s *pageViewService) AdminSummary(days int) (*model.PageViewAdminSummary, error) {
	if days <= 0 || days > 90 {
		days = 14
	}
	since := time.Now().AddDate(0, 0, -days+1).Truncate(24 * time.Hour)
	today := time.Now().Truncate(24 * time.Hour)
	previousSince := since.AddDate(0, 0, -days)

	totalViews, err := s.repo.TotalViews(since)
	if err != nil {
		return nil, err
	}
	uniqueVisitors, err := s.repo.UniqueVisitors(since)
	if err != nil {
		return nil, err
	}
	todayViews, err := s.repo.TotalViews(today)
	if err != nil {
		return nil, err
	}
	todayVisitors, err := s.repo.UniqueVisitors(today)
	if err != nil {
		return nil, err
	}
	previousViews, err := s.repo.TotalViewsBetween(previousSince, since)
	if err != nil {
		return nil, err
	}
	previousVisitors, err := s.repo.UniqueVisitorsBetween(previousSince, since)
	if err != nil {
		return nil, err
	}
	daily, err := s.repo.DailyStats(since)
	if err != nil {
		return nil, err
	}
	topPages, err := s.repo.TopPages(since, 8)
	if err != nil {
		return nil, err
	}
	sourceBreakdown, err := s.repo.SourceStats(since)
	if err != nil {
		return nil, err
	}
	activeUsers, err := s.repo.ActiveUsers(since, 10)
	if err != nil {
		return nil, err
	}
	topPagesBySource, err := s.repo.TopPagesBySource(since, 4)
	if err != nil {
		return nil, err
	}
	recentActivity, err := s.repo.RecentActivity(since, 20)
	if err != nil {
		return nil, err
	}

	return &model.PageViewAdminSummary{
		TotalViews:        totalViews,
		UniqueVisitors:    uniqueVisitors,
		TodayViews:        todayViews,
		TodayVisitors:     todayVisitors,
		PreviousViews:     previousViews,
		PreviousVisitors:  previousVisitors,
		ViewsChangePct:    percentChange(totalViews, previousViews),
		VisitorsChangePct: percentChange(uniqueVisitors, previousVisitors),
		Daily:             fillDailyPageViews(since, days, daily),
		TopPages:          topPages,
		SourceBreakdown:   sourceBreakdown,
		ActiveUsers:       activeUsers,
		TopPagesBySource:  topPagesBySource,
		RecentActivity:    recentActivity,
		TrackingEnabled:   true,
	}, nil
}

func normalizePageViewSource(source, path string) string {
	switch strings.ToLower(strings.TrimSpace(source)) {
	case "public", "dashboard", "admin", "mobile":
		return strings.ToLower(strings.TrimSpace(source))
	}
	if strings.HasPrefix(path, "/admin") {
		return "admin"
	}
	if strings.HasPrefix(path, "/dashboard") {
		return "dashboard"
	}
	return "public"
}

func clampString(value string, max int) string {
	value = strings.TrimSpace(value)
	if len(value) <= max {
		return value
	}
	return value[:max]
}

func ipHashKey() []byte {
	if key := viper.GetString("IP_HASH_SECRET"); key != "" {
		return []byte(key)
	}
	derive := hmac.New(sha256.New, []byte(viper.GetString("ACCESS_SECRET")))
	derive.Write([]byte("page-view-ip-hash-v1"))
	return derive.Sum(nil)
}

func hashIP(ip string) string {
	mac := hmac.New(sha256.New, ipHashKey())
	mac.Write([]byte(ip))
	return hex.EncodeToString(mac.Sum(nil))
}

func fillDailyPageViews(since time.Time, days int, rows []model.PageViewDailyStat) []model.PageViewDailyStat {
	byDate := make(map[string]model.PageViewDailyStat, len(rows))
	for _, row := range rows {
		byDate[row.Date] = row
	}

	out := make([]model.PageViewDailyStat, 0, days)
	for i := 0; i < days; i++ {
		date := since.AddDate(0, 0, i).Format("2006-01-02")
		if row, ok := byDate[date]; ok {
			out = append(out, row)
			continue
		}
		out = append(out, model.PageViewDailyStat{Date: date})
	}
	return out
}

func percentChange(current, previous int64) float64 {
	if previous == 0 {
		if current == 0 {
			return 0
		}
		return 100
	}
	return (float64(current-previous) / float64(previous)) * 100
}
