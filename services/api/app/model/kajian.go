package model

import "github.com/pgvector/pgvector-go"

type KajianType string

const (
	KajianTypeVideo KajianType = "video"
	KajianTypeAudio KajianType = "audio"
	KajianTypeText  KajianType = "text"
)

type Kajian struct {
	BaseID
	Title         string             `json:"title" gorm:"type:varchar(512);not null;uniqueIndex:idx_kajian_title_speaker_published"`
	Description   string             `json:"description" gorm:"type:text"`
	Speaker       string             `json:"speaker" gorm:"type:varchar(256);index;uniqueIndex:idx_kajian_title_speaker_published"`
	Topic         string             `json:"topic" gorm:"type:varchar(256);index"`
	Type          KajianType         `json:"type" gorm:"type:varchar(20);not null;default:'video'"`
	URL           string             `json:"url" gorm:"type:varchar(1024)"`
	Duration      int                `json:"duration_seconds" gorm:"default:0"`
	ThumbnailURL  string             `json:"thumbnail_url" gorm:"type:varchar(1024)"`
	ViewCount     int                `json:"view_count" gorm:"default:0"`
	PublishedAt   string             `json:"published_at" gorm:"type:date;uniqueIndex:idx_kajian_title_speaker_published"`
	TranslationID *int               `json:"translation_id,omitempty" gorm:"index"`
	Translation   *Translation       `json:"translation,omitempty" gorm:"foreignKey:TranslationID;-:migration"`
	Transcripts   []KajianTranscript `json:"transcripts,omitempty" gorm:"foreignKey:KajianID;constraint:OnDelete:CASCADE"`
}

type KajianTranscript struct {
	BaseID
	// The three fields share uniqueIndex:idx_kajian_transcript_chunk so the
	// seeder can upsert a chunk by its (video, window) identity instead of
	// deleting and recreating every row on each run — bookmarks and notes
	// reference a chunk's id directly, and churning ids silently orphans them.
	KajianID     int    `json:"kajian_id" gorm:"index;not null;uniqueIndex:idx_kajian_transcript_chunk"`
	VideoID      string `json:"video_id" gorm:"type:varchar(64);index"`
	StartSeconds int    `json:"start_seconds" gorm:"not null;index;uniqueIndex:idx_kajian_transcript_chunk"`
	EndSeconds   int    `json:"end_seconds" gorm:"not null;uniqueIndex:idx_kajian_transcript_chunk"`
	Text         string `json:"text" gorm:"type:text;not null"`
	TimestampURL string `json:"timestamp_url" gorm:"type:varchar(1024)"`
	// default:null makes GORM skip the column on insert when the value is the
	// zero Vector; otherwise it serialises as '[]', which Postgres rejects
	// ("vector must have at least 1 dimension") and every seeded chunk fails.
	Embedding pgvector.Vector `json:"embedding,omitempty" gorm:"type:vector(256);default:null"`
	Kajian    *Kajian         `json:"kajian,omitempty" gorm:"foreignKey:KajianID;-:migration"`
}

type SearchTranscriptResult struct {
	ID           int     `json:"id"`
	KajianID     int     `json:"kajian_id"`
	VideoID      string  `json:"video_id"`
	Title        string  `json:"title"`
	Speaker      string  `json:"speaker"`
	Topic        string  `json:"topic"`
	StartSeconds int     `json:"start_seconds"`
	EndSeconds   int     `json:"end_seconds"`
	Timestamp    string  `json:"timestamp"`
	Snippet      string  `json:"snippet"`
	TimestampURL string  `json:"timestamp_url"`
	ThumbnailURL string  `json:"thumbnail_url"`
	Score        float64 `json:"score,omitempty"`
	MatchMode    string  `json:"match_mode"`
	// MatchReason explains why the row matched: phrase | all_terms |
	// some_terms | fuzzy | title. Prefer it over MatchMode for badges.
	MatchReason string `json:"match_reason"`
	// MatchCount (semantic mode) is how many chunks of this kajian matched;
	// the row itself is the best one.
	MatchCount int `json:"match_count,omitempty"`
	// MatchedTerms are surface words in this chunk that matched but are not
	// in the query or its variants (fuzzy hits), so clients can highlight them.
	MatchedTerms []string `json:"matched_terms,omitempty"`
	// Description is the kajian description; shown as the snippet when only
	// the title/topic/description matched.
	Description string `json:"description,omitempty"`
}

// SearchTranscriptMeta describes the result set of a transcript search beyond
// the page that was returned.
type SearchTranscriptMeta struct {
	// Mode is the normalised search mode that was actually applied
	// (exact | semantic | hybrid), whatever the client sent.
	Mode string `json:"mode"`
	// Total is the size of the ranked result set (exact mode: the real match
	// count, which may exceed what is pageable).
	Total int64 `json:"total"`
	// KajianCount is the number of distinct kajian (videos) in the result set.
	KajianCount int `json:"kajian_count"`
	// HasMore reports whether another page exists after the returned one.
	HasMore bool `json:"has_more"`
	// Truncated is true when at least one candidate list hit its cap, so
	// Total is a lower bound ("300+").
	Truncated bool `json:"truncated"`
	// ExpandedTerms are the spelling variants the search also matched on, so a
	// client can highlight "salat" when the user typed "sholat".
	ExpandedTerms []string `json:"expanded_terms"`
}

type CreateKajianRequest struct {
	Title        string     `json:"title" validate:"required"`
	Description  string     `json:"description"`
	Speaker      string     `json:"speaker"`
	Topic        string     `json:"topic"`
	Type         KajianType `json:"type" validate:"required,oneof=video audio text"`
	URL          string     `json:"url"`
	Duration     int        `json:"duration_seconds"`
	ThumbnailURL string     `json:"thumbnail_url"`
	PublishedAt  string     `json:"published_at"`
}
