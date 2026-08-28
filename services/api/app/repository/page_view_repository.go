package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type PageViewRepository interface {
	Record(*model.PageView) error
	TotalViews(since time.Time) (int64, error)
	TotalViewsBetween(start, end time.Time) (int64, error)
	UniqueVisitors(since time.Time) (int64, error)
	UniqueVisitorsBetween(start, end time.Time) (int64, error)
	DailyStats(since time.Time) ([]model.PageViewDailyStat, error)
	TopPages(since time.Time, limit int) ([]model.PageViewTopPage, error)
	SourceStats(since time.Time) ([]model.PageViewSourceStat, error)
	ActiveUsers(since time.Time, limit int) ([]model.PageViewUserStat, error)
	TopPagesBySource(since time.Time, limitPerSource int) ([]model.PageViewTopPageSource, error)
	RecentActivity(since time.Time, limit int) ([]model.PageViewRecentActivity, error)
}

type pageViewRepo struct {
	db *gorm.DB
}

const pageViewVisitorIdentityExpr = "COALESCE(CAST(user_id AS TEXT), visitor_id)"

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

func (r *pageViewRepo) TotalViewsBetween(start, end time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&model.PageView{}).
		Where("created_at >= ? AND created_at < ?", start, end).
		Count(&count).Error
	return count, err
}

func (r *pageViewRepo) UniqueVisitors(since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&model.PageView{}).
		Where("created_at >= ?", since).
		Distinct(pageViewVisitorIdentityExpr).
		Count(&count).Error
	return count, err
}

func (r *pageViewRepo) UniqueVisitorsBetween(start, end time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&model.PageView{}).
		Where("created_at >= ? AND created_at < ?", start, end).
		Distinct(pageViewVisitorIdentityExpr).
		Count(&count).Error
	return count, err
}

func (r *pageViewRepo) DailyStats(since time.Time) ([]model.PageViewDailyStat, error) {
	var rows []model.PageViewDailyStat
	err := r.db.Model(&model.PageView{}).
		Select("DATE(created_at) AS date, COUNT(*) AS views, COUNT(DISTINCT "+pageViewVisitorIdentityExpr+") AS visitors").
		Where("created_at >= ?", since).
		Group("DATE(created_at)").
		Order("date asc").
		Scan(&rows).Error
	return rows, err
}

func (r *pageViewRepo) ActiveUsers(since time.Time, limit int) ([]model.PageViewUserStat, error) {
	if limit <= 0 {
		limit = 10
	}
	var rows []model.PageViewUserStat
	// Inner subquery limits to top N users first, then LATERAL fetches last path/source
	// for only those N rows — avoids correlated subqueries on the full result set.
	err := r.db.Raw(`
		SELECT
			u.id::text AS user_id,
			u.name,
			u.email,
			pv_stats.total_views,
			TO_CHAR(pv_stats.last_seen, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_seen,
			lp.path AS last_path,
			lp.source AS source
		FROM (
			SELECT
				pv.user_id,
				COUNT(*) AS total_views,
				MAX(pv.created_at) AS last_seen
			FROM page_view pv
			WHERE pv.user_id IS NOT NULL AND pv.created_at >= ?
			GROUP BY pv.user_id
			ORDER BY total_views DESC
			LIMIT ?
		) pv_stats
		JOIN "user" u ON u.id = pv_stats.user_id::text
		LEFT JOIN LATERAL (
			SELECT path, source
			FROM page_view
			WHERE user_id = pv_stats.user_id
			ORDER BY created_at DESC
			LIMIT 1
		) lp ON TRUE
		ORDER BY pv_stats.total_views DESC
	`, since, limit).Scan(&rows).Error
	return rows, err
}

func (r *pageViewRepo) TopPagesBySource(since time.Time, limitPerSource int) ([]model.PageViewTopPageSource, error) {
	if limitPerSource <= 0 {
		limitPerSource = 4
	}
	var rows []model.PageViewTopPageSource
	// Use a window-function approach: rank pages per source, then filter
	err := r.db.Raw(`
		SELECT source, path, views, visitors FROM (
			SELECT
				source,
				path,
				COUNT(*) AS views,
				COUNT(DISTINCT `+pageViewVisitorIdentityExpr+`) AS visitors,
				ROW_NUMBER() OVER (PARTITION BY source ORDER BY COUNT(*) DESC) AS rn
			FROM page_view
			WHERE created_at >= ?
			GROUP BY source, path
		) ranked
		WHERE rn <= ?
		ORDER BY source, views DESC
	`, since, limitPerSource).Scan(&rows).Error
	return rows, err
}

func (r *pageViewRepo) SourceStats(since time.Time) ([]model.PageViewSourceStat, error) {
	var rows []model.PageViewSourceStat
	err := r.db.Model(&model.PageView{}).
		Select("source, COUNT(*) AS views, COUNT(DISTINCT "+pageViewVisitorIdentityExpr+") AS visitors").
		Where("created_at >= ?", since).
		Group("source").
		Order("views desc").
		Scan(&rows).Error
	return rows, err
}

func (r *pageViewRepo) RecentActivity(since time.Time, limit int) ([]model.PageViewRecentActivity, error) {
	if limit <= 0 {
		limit = 20
	}
	var rows []model.PageViewRecentActivity
	err := r.db.Raw(`
		SELECT
			pv.id::text AS id,
			COALESCE(pv.user_id::text, '') AS user_id,
			CASE WHEN pv.user_id IS NULL THEN pv.visitor_id ELSE '' END AS visitor_id,
			COALESCE(u.name, '') AS name,
			COALESCE(u.email, '') AS email,
			pv.path,
			pv.source,
			COALESCE(pv.referrer, '') AS referrer,
			COALESCE(pv.user_agent, '') AS user_agent,
			TO_CHAR(pv.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS seen_at
		FROM page_view pv
		LEFT JOIN "user" u ON u.id = pv.user_id::text
		WHERE pv.created_at >= ?
		ORDER BY pv.created_at DESC
		LIMIT ?
	`, since, limit).Scan(&rows).Error
	return rows, err
}

func (r *pageViewRepo) TopPages(since time.Time, limit int) ([]model.PageViewTopPage, error) {
	if limit <= 0 {
		limit = 8
	}
	var rows []model.PageViewTopPage
	err := r.db.Model(&model.PageView{}).
		Select("path, COUNT(*) AS views, COUNT(DISTINCT "+pageViewVisitorIdentityExpr+") AS visitors").
		Where("created_at >= ?", since).
		Group("path").
		Order("views desc").
		Limit(limit).
		Scan(&rows).Error
	return rows, err
}
