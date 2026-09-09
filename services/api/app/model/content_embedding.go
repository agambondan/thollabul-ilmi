package model

import (
	"github.com/pgvector/pgvector-go"
	"gorm.io/gorm"
)

type ContentEmbedding struct {
	gorm.Model
	ContentType string          `gorm:"type:varchar(50);not null;index:idx_content_type_id" json:"content_type"`
	ContentID   uint            `gorm:"not null;index:idx_content_type_id" json:"content_id"`
	ChunkText   string          `gorm:"type:text;not null" json:"chunk_text"`
	Embedding   pgvector.Vector `gorm:"type:vector(256)" json:"embedding,omitempty"`
	Metadata    string          `gorm:"type:jsonb;default:'{}'" json:"metadata,omitempty"`
	Similarity  float32         `gorm:"-" json:"similarity,omitempty"`
}

func (ContentEmbedding) TableName() string {
	return "content_embeddings"
}
