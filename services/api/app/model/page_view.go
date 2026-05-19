package model

import "github.com/google/uuid"

type PageView struct {
	BaseUUID
	VisitorID string     `json:"visitor_id,omitempty" gorm:"type:varchar(128);index:idx_page_view_visitor_created"`
	UserID    *uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid;index"`
	Path      string     `json:"path" gorm:"type:varchar(512);not null;index:idx_page_view_path_created"`
	Source    string     `json:"source" gorm:"type:varchar(50);not null;default:'public';index"`
	Referrer  string     `json:"referrer,omitempty" gorm:"type:varchar(512)"`
	UserAgent string     `json:"user_agent,omitempty" gorm:"type:varchar(512)"`
	IPHash    string     `json:"-" gorm:"type:varchar(64);index"`
}

type CreatePageViewRequest struct {
	VisitorID string `json:"visitor_id"`
	Path      string `json:"path" validate:"required"`
	Source    string `json:"source"`
	Referrer  string `json:"referrer"`
}

type PageViewDailyStat struct {
	Date     string `json:"date"`
	Views    int64  `json:"views"`
	Visitors int64  `json:"visitors"`
}

type PageViewTopPage struct {
	Path     string `json:"path"`
	Views    int64  `json:"views"`
	Visitors int64  `json:"visitors"`
}

type PageViewSourceStat struct {
	Source   string `json:"source"`
	Views    int64  `json:"views"`
	Visitors int64  `json:"visitors"`
}

type PageViewUserStat struct {
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	TotalViews int64  `json:"total_views"`
	LastSeen   string `json:"last_seen"`
	LastPath   string `json:"last_path"`
	Source     string `json:"source"`
}

type PageViewTopPageSource struct {
	Source   string `json:"source"`
	Path     string `json:"path"`
	Views    int64  `json:"views"`
	Visitors int64  `json:"visitors"`
}

type PageViewRecentActivity struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	VisitorID string `json:"visitor_id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Path      string `json:"path"`
	Source    string `json:"source"`
	Referrer  string `json:"referrer"`
	UserAgent string `json:"user_agent"`
	SeenAt    string `json:"seen_at"`
}

type PageViewAdminSummary struct {
	TotalViews        int64                    `json:"total_views"`
	UniqueVisitors    int64                    `json:"unique_visitors"`
	TodayViews        int64                    `json:"today_views"`
	TodayVisitors     int64                    `json:"today_visitors"`
	PreviousViews     int64                    `json:"previous_views"`
	PreviousVisitors  int64                    `json:"previous_visitors"`
	ViewsChangePct    float64                  `json:"views_change_percent"`
	VisitorsChangePct float64                  `json:"visitors_change_percent"`
	Daily             []PageViewDailyStat      `json:"daily"`
	TopPages          []PageViewTopPage        `json:"top_pages"`
	SourceBreakdown   []PageViewSourceStat     `json:"source_breakdown"`
	ActiveUsers       []PageViewUserStat       `json:"active_users"`
	TopPagesBySource  []PageViewTopPageSource  `json:"top_pages_by_source"`
	RecentActivity    []PageViewRecentActivity `json:"recent_activity"`
	TrackingEnabled   bool                     `json:"tracking_enabled"`
}
