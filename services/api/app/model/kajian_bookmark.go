package model

import "github.com/google/uuid"

// KajianUserBookmark is a per-user bookmark on a specific transcript chunk.
// One row per (user, chunk) pair so the same chunk can be re-bookmarked
// across multiple devices and survive local cache clears.
type KajianUserBookmark struct {
	BaseID
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_kajian_user_bookmark_u_c,priority:1;index"`
	ChunkID   int       `json:"chunk_id" gorm:"not null;uniqueIndex:idx_kajian_user_bookmark_u_c,priority:2;index"`
	KajianID  int       `json:"kajian_id" gorm:"not null;index"`
	Note      string    `json:"note" gorm:"type:text"`
	CreatedAt *int64    `json:"created_at,omitempty" gorm:"autoCreateTime"`
	// Join — loaded on demand
	Chunk *KajianTranscript `json:"chunk,omitempty" gorm:"foreignKey:ChunkID;-:migration"`
	Kajian *Kajian         `json:"kajian,omitempty" gorm:"foreignKey:KajianID;-:migration"`
}

// CreateKajianBookmarkRequest is the body of POST /kajian/bookmarks.
type CreateKajianBookmarkRequest struct {
	ChunkID  int    `json:"chunk_id" validate:"required"`
	KajianID int    `json:"kajian_id"`
	Note     string `json:"note"`
}

