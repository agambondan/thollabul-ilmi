package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TilawahRepository interface {
	Create(userID uuid.UUID, req *model.CreateTilawahRequest) (*model.TilawahLog, error)
	FindByUserID(userID uuid.UUID) ([]model.TilawahLog, error)
	FindByUserIDAndDateRange(userID uuid.UUID, from, to string) ([]model.TilawahLog, error)
	Summary(userID uuid.UUID) (*model.TilawahSummary, error)
	DeleteByID(id int, userID uuid.UUID) error
}

type tilawahRepository struct {
	db *gorm.DB
}

func NewTilawahRepository(db *gorm.DB) TilawahRepository {
	return &tilawahRepository{db}
}

func (r *tilawahRepository) Create(userID uuid.UUID, req *model.CreateTilawahRequest) (*model.TilawahLog, error) {
	log := &model.TilawahLog{
		UserID:    userID,
		Date:      req.Date,
		PagesRead: req.PagesRead,
		JuzRead:   req.JuzRead,
		Note:      req.Note,
	}
	return log, r.db.Create(log).Error
}

func (r *tilawahRepository) FindByUserID(userID uuid.UUID) ([]model.TilawahLog, error) {
	var logs []model.TilawahLog
	err := r.db.Where("user_id = ?", userID).Order("date DESC").Limit(100).Find(&logs).Error
	return logs, err
}

func (r *tilawahRepository) FindByUserIDAndDateRange(userID uuid.UUID, from, to string) ([]model.TilawahLog, error) {
	var logs []model.TilawahLog
	err := r.db.Where("user_id = ? AND date BETWEEN ? AND ?", userID, from, to).Order("date DESC").Find(&logs).Error
	return logs, err
}

func (r *tilawahRepository) Summary(userID uuid.UUID) (*model.TilawahSummary, error) {
	var result struct {
		TotalPages int
		TotalJuz   float64
		LogCount   int
	}
	err := r.db.Model(&model.TilawahLog{}).
		Select("COALESCE(SUM(pages_read), 0) as total_pages, COALESCE(SUM(juz_read), 0) as total_juz, COUNT(*) as log_count").
		Where("user_id = ?", userID).
		Scan(&result).Error
	if err != nil {
		return nil, err
	}
	summary := &model.TilawahSummary{
		TotalPages: result.TotalPages,
		TotalJuz:   result.TotalJuz,
		LogCount:   result.LogCount,
	}
	if result.LogCount > 0 {
		summary.DailyAvgPages = float64(result.TotalPages) / float64(result.LogCount)
	}
	// Al-Quran 604 pages, estimate days to khatam
	if summary.DailyAvgPages > 0 {
		remaining := 604 - result.TotalPages%604
		summary.EstKhatamDays = int(float64(remaining) / summary.DailyAvgPages)
	}
	return summary, nil
}

func (r *tilawahRepository) DeleteByID(id int, userID uuid.UUID) error {
	return deleteResultError(r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&model.TilawahLog{}))
}
