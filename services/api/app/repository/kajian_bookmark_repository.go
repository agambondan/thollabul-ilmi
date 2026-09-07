package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type KajianBookmarkRepository interface {
	// Add creates (or no-ops if already present) a bookmark for (user, chunk).
	// Returns true when a new row was inserted, false on conflict.
	Add(userID uuid.UUID, chunkID int, kajianID int, note string) (bool, error)
	Remove(userID uuid.UUID, chunkID int) error
	// ListByUser returns the user's bookmarks joined with chunk + kajian
	// metadata, newest first. The optional limit caps the result set.
	ListByUser(userID uuid.UUID, limit int) ([]model.KajianUserBookmark, error)
	// ChunkIDsByUser returns a fast set of chunk IDs the user has bookmarked
	// (used by clients to render a single icon without an N+1 fetch).
	ChunkIDsByUser(userID uuid.UUID, kajianID int) ([]int, error)
}

type kajianBookmarkRepository struct{ db *gorm.DB }

func NewKajianBookmarkRepository(db *gorm.DB) KajianBookmarkRepository {
	return &kajianBookmarkRepository{db: db}
}

func (r *kajianBookmarkRepository) Add(userID uuid.UUID, chunkID int, kajianID int, note string) (bool, error) {
	row := model.KajianUserBookmark{
		UserID:   userID,
		ChunkID:  chunkID,
		KajianID: kajianID,
		Note:     note,
	}
	res := r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&row)
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *kajianBookmarkRepository) Remove(userID uuid.UUID, chunkID int) error {
	return r.db.
		Where("user_id = ? AND chunk_id = ?", userID, chunkID).
		Delete(&model.KajianUserBookmark{}).Error
}

func (r *kajianBookmarkRepository) ListByUser(userID uuid.UUID, limit int) ([]model.KajianUserBookmark, error) {
	if limit <= 0 || limit > 500 {
		limit = 200
	}
	var out []model.KajianUserBookmark
	q := r.db.
		Preload("Chunk", func(db *gorm.DB) *gorm.DB {
			return db.Order("start_seconds ASC")
		}).
		Preload("Chunk.Kajian").
		Preload("Kajian", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, title, speaker, topic, thumbnail_url, url, video_id")
		}).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit)
	if err := q.Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *kajianBookmarkRepository) ChunkIDsByUser(userID uuid.UUID, kajianID int) ([]int, error) {
	var ids []int
	q := r.db.Model(&model.KajianUserBookmark{}).
		Where("user_id = ?", userID)
	if kajianID > 0 {
		q = q.Where("kajian_id = ?", kajianID)
	}
	err := q.Order("chunk_id ASC").Pluck("chunk_id", &ids).Error
	return ids, err
}
