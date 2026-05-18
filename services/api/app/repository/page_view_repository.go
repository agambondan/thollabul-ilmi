package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type PageViewRepository interface {
	Record(*model.PageView) error
	TotalViews(since time.Time) (int64, error)
	UniqueVisitors(since time.Time) (int64, error)
	DailyStats(since time.Time) ([]model.PageViewDailyStat, error)
	TopPages(since time.Time, limit int) ([]model.PageViewTopPage, error)
}

type pageViewRepo struct {
	db *gorm.DB
}

func NewPageViewRepository(db *gorm.DB) PageViewRepository {
	return &pageViewRepo{db}
}

func (r *pageViewRepo) Record(view *model.PageView) error {
	return r.db.Create(view).Error
}

func (r *pageViewRepo) TotalViews(since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&model.PageView{}).
		Where("created_at >= ?", since).
		Count(&count).Error
	return count, err
}

func (r *pageViewRepo) UniqueVisitors(since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&model.PageView{}).
		Where("created_at >= ?", since).
		Distinct("visitor_id").
		Count(&count).Error
	return count, err
}

func (r *pageViewRepo) DailyStats(since time.Time) ([]model.PageViewDailyStat, error) {
	var rows []model.PageViewDailyStat
	err := r.db.Model(&model.PageView{}).
		Select("DATE(created_at) AS date, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors").
		Where("created_at >= ?", since).
		Group("DATE(created_at)").
		Order("date asc").
		Scan(&rows).Error
	return rows, err
}

func (r *pageViewRepo) TopPages(since time.Time, limit int) ([]model.PageViewTopPage, error) {
	if limit <= 0 {
		limit = 8
	}
	var rows []model.PageViewTopPage
	err := r.db.Model(&model.PageView{}).
		Select("path, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors").
		Where("created_at >= ?", since).
		Group("path").
		Order("views desc").
		Limit(limit).
		Scan(&rows).Error
	return rows, err
}
