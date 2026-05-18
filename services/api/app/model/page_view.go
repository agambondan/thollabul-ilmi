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

type PageViewAdminSummary struct {
	TotalViews      int64               `json:"total_views"`
	UniqueVisitors  int64               `json:"unique_visitors"`
	TodayViews      int64               `json:"today_views"`
	TodayVisitors   int64               `json:"today_visitors"`
	Daily           []PageViewDailyStat `json:"daily"`
	TopPages        []PageViewTopPage   `json:"top_pages"`
	TrackingEnabled bool                `json:"tracking_enabled"`
}
