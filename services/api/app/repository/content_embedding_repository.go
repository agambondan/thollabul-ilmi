package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type ContentEmbeddingRepository interface {
	SearchSimilar(queryEmbedding []float32, contentTypes []string, limit int) ([]model.ContentEmbedding, error)
	StoreEmbedding(embedding *model.ContentEmbedding) error
	DeleteByContent(contentType string, contentID uint) error
}

type contentEmbeddingRepo struct {
	db *gorm.DB
}

func NewContentEmbeddingRepository(db *gorm.DB) ContentEmbeddingRepository {
	return &contentEmbeddingRepo{db: db}
}

// SearchSimilar performs cosine similarity search via pgvector.
// Falls back to ordering by id (no embedding yet) when the column is missing.
func (r *contentEmbeddingRepo) SearchSimilar(queryEmbedding []float32, contentTypes []string, limit int) ([]model.ContentEmbedding, error) {
	var results []model.ContentEmbedding

	if !r.db.Migrator().HasColumn(&model.ContentEmbedding{}, "embedding") {
		return results, nil
	}

	q := pgvector.NewVector(queryEmbedding)
	query := r.db.Model(&model.ContentEmbedding{}).
		Select("id, content_type, content_id, chunk_text, metadata, created_at, updated_at, 1 - (embedding <=> ?) AS similarity", q)

	if len(contentTypes) > 0 {
		query = query.Where("content_type IN ?", contentTypes)
	}

	query = query.Where("embedding IS NOT NULL").
		Order("similarity DESC").
		Limit(limit)

	err := query.Find(&results).Error
	return results, err
}

func (r *contentEmbeddingRepo) StoreEmbedding(embedding *model.ContentEmbedding) error {
	return r.db.Create(embedding).Error
}

func (r *contentEmbeddingRepo) DeleteByContent(contentType string, contentID uint) error {
	return r.db.Where("content_type = ? AND content_id = ?", contentType, contentID).
		Delete(&model.ContentEmbedding{}).Error
}
