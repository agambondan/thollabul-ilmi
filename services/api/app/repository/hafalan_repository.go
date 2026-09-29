package repository

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type HafalanRepository interface {
	Upsert(*model.HafalanProgress) (*model.HafalanProgress, error)
	FindByUserID(uuid.UUID) ([]model.HafalanProgress, error)
	FindByUserIDAndSurahID(uuid.UUID, int) (*model.HafalanProgress, error)
	FindMemorizedSurahIDs(uuid.UUID) ([]int, error)
	Summary(uuid.UUID) (*model.HafalanSummary, error)
}

type hafalanRepo struct {
	db *gorm.DB
}

func NewHafalanRepository(db *gorm.DB) HafalanRepository {
	return &hafalanRepo{db}
}

type hafalanRow struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	SurahID     int
	Status      model.HafalanStatus
	StartedAt   *time.Time
	CompletedAt *time.Time
	CreatedAt   *time.Time
	UpdatedAt   *time.Time
	DeletedAt   gorm.DeletedAt

	SurahRowID           *int
	SurahSlug            *string
	SurahIdentifier      *string
	SurahNumber          *int
	SurahNumberOfAyahs   *int
	SurahRevelationType  *string
	SurahDefaultLanguage *string
	SurahTranslationID   *int
	SurahCreatedAt       *time.Time
	SurahUpdatedAt       *time.Time
	SurahDeletedAt       gorm.DeletedAt

	TrID        *int
	TrAr        *string
	TrEn        *string
	TrIdn       *string
	TrCreatedAt *time.Time
	TrUpdatedAt *time.Time
	TrDeletedAt gorm.DeletedAt
}

const hafalanSelectSQL = `
	SELECT
		hp.id, hp.user_id, hp.surah_id, hp.status, hp.started_at, hp.completed_at,
		hp.created_at, hp.updated_at, hp.deleted_at,
		s.id AS surah_row_id, s.slug AS surah_slug, s.identifier AS surah_identifier,
		s.number AS surah_number, s.number_of_ayahs AS surah_number_of_ayahs,
		s.revelation_type AS surah_revelation_type, s.default_language AS surah_default_language,
		s.translation_id AS surah_translation_id,
		s.created_at AS surah_created_at, s.updated_at AS surah_updated_at, s.deleted_at AS surah_deleted_at,
		t.id AS tr_id, t.ar AS tr_ar, t.en AS tr_en, t.idn AS tr_idn,
		t.created_at AS tr_created_at, t.updated_at AS tr_updated_at, t.deleted_at AS tr_deleted_at
	FROM hafalan_progress hp
	LEFT JOIN surah s ON s.id = hp.surah_id
	LEFT JOIN translation t ON t.id = s.translation_id
`

func (r *hafalanRow) toModel() model.HafalanProgress {
	h := model.HafalanProgress{
		UserID:      r.UserID,
		SurahID:     r.SurahID,
		Status:      r.Status,
		StartedAt:   r.StartedAt,
		CompletedAt: r.CompletedAt,
	}
	h.ID = r.ID
	h.CreatedAt = r.CreatedAt
	h.UpdatedAt = r.UpdatedAt
	h.DeletedAt = r.DeletedAt

	if r.SurahRowID != nil {
		s := &model.Surah{
			Slug:            r.SurahSlug,
			Identifier:      r.SurahIdentifier,
			Number:          r.SurahNumber,
			NumberOfAyahs:   r.SurahNumberOfAyahs,
			RevelationType:  r.SurahRevelationType,
			DefaultLanguage: r.SurahDefaultLanguage,
			TranslationID:   r.SurahTranslationID,
		}
		s.ID = r.SurahRowID
		s.CreatedAt = r.SurahCreatedAt
		s.UpdatedAt = r.SurahUpdatedAt
		s.DeletedAt = r.SurahDeletedAt

		if r.TrID != nil {
			s.Translation = &model.Translation{
				Ar:  r.TrAr,
				En:  r.TrEn,
				Idn: r.TrIdn,
			}
			s.Translation.ID = r.TrID
			s.Translation.CreatedAt = r.TrCreatedAt
			s.Translation.UpdatedAt = r.TrUpdatedAt
			s.Translation.DeletedAt = r.TrDeletedAt
		}
		h.Surah = s
	}
	return h
}

func (r *hafalanRepo) Upsert(h *model.HafalanProgress) (*model.HafalanProgress, error) {
	err := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "surah_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"status", "started_at", "completed_at", "updated_at"}),
	}).Create(h).Error
	return h, err
}

func (r *hafalanRepo) FindByUserID(userID uuid.UUID) ([]model.HafalanProgress, error) {
	var rows []hafalanRow
	err := r.db.Raw(hafalanSelectSQL+`
		WHERE hp.user_id = ?
		ORDER BY hp.surah_id ASC
	`, userID).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	res := make([]model.HafalanProgress, len(rows))
	for i := range rows {
		res[i] = rows[i].toModel()
	}
	return res, nil
}

func (r *hafalanRepo) FindMemorizedSurahIDs(userID uuid.UUID) ([]int, error) {
	var ids []int
	err := r.db.Model(&model.HafalanProgress{}).
		Where("user_id = ? AND status = ?", userID, model.HafalanMemorized).
		Pluck("surah_id", &ids).Error
	return ids, err
}

func (r *hafalanRepo) FindByUserIDAndSurahID(userID uuid.UUID, surahID int) (*model.HafalanProgress, error) {
	var row hafalanRow
	err := r.db.Raw(hafalanSelectSQL+`
		WHERE hp.user_id = ? AND hp.surah_id = ?
		LIMIT 1
	`, userID, surahID).Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.ID == uuid.Nil {
		return nil, gorm.ErrRecordNotFound
	}
	h := row.toModel()
	return &h, nil
}

func (r *hafalanRepo) Summary(userID uuid.UUID) (*model.HafalanSummary, error) {
	var summary model.HafalanSummary

	type row struct {
		Status model.HafalanStatus
		Count  int
	}
	var rows []row
	err := r.db.Model(&model.HafalanProgress{}).
		Select("status, count(*) as count").
		Where("user_id = ?", userID).
		Group("status").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	summary.Total = 114
	for _, r := range rows {
		switch r.Status {
		case model.HafalanNotStarted:
			summary.NotStarted = r.Count
		case model.HafalanInProgress:
			summary.InProgress = r.Count
		case model.HafalanMemorized:
			summary.Memorized = r.Count
		}
	}
	return &summary, nil
}