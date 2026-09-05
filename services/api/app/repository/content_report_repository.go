package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ContentReportRepository interface {
	Create(report *model.ContentReport) (*model.ContentReport, error)
	FindByID(id string) (*model.ContentReport, error)
	FindAll(status model.ContentReportStatus, targetType model.ContentReportTargetType, page, limit int) ([]model.ContentReport, int64, error)
	UpdateStatus(id string, status model.ContentReportStatus, adminNote string, reviewerID uuid.UUID) (*model.ContentReport, error)
	FindByUser(userID uuid.UUID, page, limit int) ([]model.ContentReport, int64, error)
}

type contentReportRepository struct {
	db *gorm.DB
}

func NewContentReportRepository(db *gorm.DB) ContentReportRepository {
	return &contentReportRepository{db: db}
}

func (r *contentReportRepository) Create(report *model.ContentReport) (*model.ContentReport, error) {
	if report.ID == uuid.Nil {
		report.ID = uuid.New()
	}
	if report.Status == "" {
		report.Status = model.ContentReportStatusPending
	}
	err := r.db.Create(report).Error
	if err != nil {
		return nil, err
	}
	return r.FindByID(report.ID.String())
}

func (r *contentReportRepository) FindByID(id string) (*model.ContentReport, error) {
	var item model.ContentReport
	err := r.db.Preload("User").Where("id = ?", id).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *contentReportRepository) FindAll(status model.ContentReportStatus, targetType model.ContentReportTargetType, page, limit int) ([]model.ContentReport, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := r.db.Model(&model.ContentReport{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if targetType != "" {
		query = query.Where("target_type = ?", targetType)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.ContentReport
	err := query.Preload("User").Order("created_at DESC").Offset(offset).Limit(limit).Find(&items).Error
	return items, total, err
}

func (r *contentReportRepository) UpdateStatus(id string, status model.ContentReportStatus, adminNote string, reviewerID uuid.UUID) (*model.ContentReport, error) {
	now := time.Now()
	updates := map[string]interface{}{
		"status":      status,
		"admin_note":  adminNote,
		"reviewed_by": reviewerID,
		"reviewed_at": &now,
	}
	err := r.db.Model(&model.ContentReport{}).Where("id = ?", id).Updates(updates).Error
	if err != nil {
		return nil, err
	}
	return r.FindByID(id)
}

func (r *contentReportRepository) FindByUser(userID uuid.UUID, page, limit int) ([]model.ContentReport, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := r.db.Model(&model.ContentReport{}).Where("user_id = ?", userID)
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.ContentReport
	err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&items).Error
	return items, total, err
}
