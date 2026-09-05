package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ContentAuditLogRepository interface {
	Create(log *model.ContentAuditLog) error
	FindAll(targetType string, page, limit int) ([]model.ContentAuditLog, int64, error)
}

type contentAuditLogRepository struct {
	db *gorm.DB
}

func NewContentAuditLogRepository(db *gorm.DB) ContentAuditLogRepository {
	return &contentAuditLogRepository{db: db}
}

func (r *contentAuditLogRepository) Create(log *model.ContentAuditLog) error {
	if log.ID == uuid.Nil {
		log.ID = uuid.New()
	}
	return r.db.Create(log).Error
}

func (r *contentAuditLogRepository) FindAll(targetType string, page, limit int) ([]model.ContentAuditLog, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := r.db.Model(&model.ContentAuditLog{})
	if targetType != "" {
		query = query.Where("target_type = ?", targetType)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.ContentAuditLog
	err := query.Preload("Modifier").Order("created_at DESC").Offset(offset).Limit(limit).Find(&items).Error
	return items, total, err
}
