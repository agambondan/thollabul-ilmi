package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MurojaahRepository interface {
	Create(session *model.MurojaahSession) (*model.MurojaahSession, error)
	FindByUserID(userID uuid.UUID, limit int) ([]model.MurojaahSession, error)
	FindRandomAyahFromSurah(surahIDs []int, count int) ([]model.Ayah, error)
	Stats(userID uuid.UUID) (*model.MurojaahStats, error)
}

type murojaahRepository struct {
	db *gorm.DB
}

func NewMurojaahRepository(db *gorm.DB) MurojaahRepository {
	return &murojaahRepository{db}
}

func (r *murojaahRepository) Create(session *model.MurojaahSession) (*model.MurojaahSession, error) {
	err := r.db.Create(session).Error
	return session, err
}

func (r *murojaahRepository) FindRandomAyahFromSurah(surahIDs []int, count int) ([]model.Ayah, error) {
	if len(surahIDs) == 0 {
		return nil, nil
	}
	var ayahs []model.Ayah
	err := r.db.
		Joins("JOIN surah ON surah.id = ayah.surah_id").
		Where("surah.number IN ?", surahIDs).
		Order("RANDOM()").
		Limit(count).
		Preload("Translation").
		Find(&ayahs).Error
	return ayahs, err
}

func (r *murojaahRepository) FindByUserID(userID uuid.UUID, limit int) ([]model.MurojaahSession, error) {
	var list []model.MurojaahSession
	q := r.db.Where("user_id = ?", userID).Order("date DESC, id DESC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	err := q.Find(&list).Error
	return list, err
}

func (r *murojaahRepository) Stats(userID uuid.UUID) (*model.MurojaahStats, error) {
	var stats model.MurojaahStats
	type raw struct {
		Total    int
		AvgScore float64
		TotalDur int
		Surahs   int
	}
	var r2 raw
	r.db.Model(&model.MurojaahSession{}).
		Where("user_id = ?", userID).
		Select("COUNT(*) AS total, COALESCE(AVG(score),0) AS avg_score, COALESCE(SUM(duration),0) AS total_dur, COUNT(DISTINCT surah_id) AS surahs").
		Scan(&r2)
	stats.TotalSessions = r2.Total
	stats.AvgScore = r2.AvgScore
	stats.TotalDuration = r2.TotalDur
	stats.SurahCovered = r2.Surahs
	return &stats, nil
}
