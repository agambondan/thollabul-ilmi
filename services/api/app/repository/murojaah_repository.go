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

const randomAyahSelectSQL = `
SELECT
    a.id, a.created_at, a.updated_at, a.number, a.default_language, a.surah_id, a.translation_id,
    a.juz_number, a.manzil, a.page, a.ruku, a.hizb_quarter, a.sajda, a.juz_id,
    t.id as t_id, t.idn as t_idn, t.en as t_en, t.ar as t_ar
FROM ayah a
JOIN surah s ON s.id = a.surah_id
LEFT JOIN translation t ON t.id = a.translation_id
WHERE s.number IN ?
ORDER BY RANDOM()
LIMIT ?
`

func (r *murojaahRepository) FindRandomAyahFromSurah(surahIDs []int, count int) ([]model.Ayah, error) {
	if len(surahIDs) == 0 {
		return nil, nil
	}
	rows, err := r.db.Raw(randomAyahSelectSQL, surahIDs, count).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ayahs []model.Ayah
	for rows.Next() {
		var a model.Ayah
		var tID *int
		var tIdn, tEn, tAr *string
		if err := rows.Scan(
			&a.ID, &a.CreatedAt, &a.UpdatedAt, &a.Number, &a.DefaultLanguage, &a.SurahID, &a.TranslationID,
			&a.JuzNumber, &a.Manzil, &a.Page, &a.Ruku, &a.HizbQuarter, &a.Sajda, &a.JuzID,
			&tID, &tIdn, &tEn, &tAr,
		); err != nil {
			return nil, err
		}
		if tID != nil {
			a.Translation = &model.Translation{
				BaseID: model.BaseID{ID: tID},
				Idn:    tIdn,
				En:     tEn,
				Ar:     tAr,
			}
		}
		ayahs = append(ayahs, a)
	}
	return ayahs, rows.Err()
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
