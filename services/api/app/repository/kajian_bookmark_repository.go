package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type KajianBookmarkRepository interface {
	Add(userID uuid.UUID, chunkID int, kajianID int, note string) (bool, error)
	Remove(userID uuid.UUID, chunkID int) error
	ListByUser(userID uuid.UUID, limit int) ([]model.KajianUserBookmark, error)
	ChunkIDsByUser(userID uuid.UUID, kajianID int) ([]int, error)
}

type kajianBookmarkRepository struct{ db *gorm.DB }

func NewKajianBookmarkRepository(db *gorm.DB) KajianBookmarkRepository {
	return &kajianBookmarkRepository{db: db}
}

func (r *kajianBookmarkRepository) Add(userID uuid.UUID, chunkID int, kajianID int, note string) (bool, error) {
	row := model.KajianUserBookmark{
		UserID:    userID,
		ChunkID:   chunkID,
		KajianID:  kajianID,
		Note:      note,
		CreatedAt: unixNow(),
	}
	res := r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "chunk_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"deleted_at", "note", "kajian_id", "created_at", "updated_at"}),
		Where: clause.Where{Exprs: []clause.Expression{
			clause.Expr{
				SQL:  "? IS NOT NULL",
				Vars: []interface{}{clause.Column{Table: clause.CurrentTable, Name: "deleted_at"}},
			},
		}},
	}).Create(&row)
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

type kajianBookmarkRow struct {
	ID        *int
	UserID    uuid.UUID
	ChunkID   int
	KajianID  int
	Note      string
	CreatedAt *int64

	ChunkRowID          *int
	ChunkKajianID       *int
	ChunkVideoID        *string
	ChunkStartSeconds   *int
	ChunkEndSeconds     *int
	ChunkText           *string
	ChunkTimestampURL   *string

	KajianRowID      *int
	KajianTitle      *string
	KajianSpeaker    *string
	KajianTopic      *string
	KajianThumbnail  *string
	KajianURL        *string
	KajianVideoID    *string
}

func (r *kajianBookmarkRepository) ListByUser(userID uuid.UUID, limit int) ([]model.KajianUserBookmark, error) {
	if limit <= 0 || limit > 500 {
		limit = 200
	}

	sql := `
		SELECT
			b.id, b.user_id, b.chunk_id, b.kajian_id, b.note, b.created_at,
			kt.id AS chunk_row_id, kt.kajian_id AS chunk_kajian_id, kt.video_id AS chunk_video_id,
			kt.start_seconds AS chunk_start_seconds, kt.end_seconds AS chunk_end_seconds,
			kt.text AS chunk_text, kt.timestamp_url AS chunk_timestamp_url,
			k.id AS kajian_row_id, k.title AS kajian_title, k.speaker AS kajian_speaker,
			k.topic AS kajian_topic, k.thumbnail_url AS kajian_thumbnail, k.url AS kajian_url, k.video_id AS kajian_video_id
		FROM kajian_user_bookmark b
		LEFT JOIN kajian_transcript kt ON kt.id = b.chunk_id AND kt.deleted_at IS NULL
		LEFT JOIN kajian k ON k.id = b.kajian_id AND k.deleted_at IS NULL
		WHERE b.user_id = ? AND b.deleted_at IS NULL
		ORDER BY b.created_at DESC
		LIMIT ?
	`

	var rows []kajianBookmarkRow
	if err := r.db.Raw(sql, userID, limit).Scan(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]model.KajianUserBookmark, 0, len(rows))
	for _, row := range rows {
		b := model.KajianUserBookmark{
			UserID:    row.UserID,
			ChunkID:   row.ChunkID,
			KajianID:  row.KajianID,
			Note:      row.Note,
			CreatedAt: row.CreatedAt,
		}
		b.ID = row.ID

		var k *model.Kajian
		if row.KajianRowID != nil {
			var title, speaker, topic, thumb, url, vid string
			if row.KajianTitle != nil {
				title = *row.KajianTitle
			}
			if row.KajianSpeaker != nil {
				speaker = *row.KajianSpeaker
			}
			if row.KajianTopic != nil {
				topic = *row.KajianTopic
			}
			if row.KajianThumbnail != nil {
				thumb = *row.KajianThumbnail
			}
			if row.KajianURL != nil {
				url = *row.KajianURL
			}
			if row.KajianVideoID != nil {
				vid = *row.KajianVideoID
			}
			k = &model.Kajian{
				Title:        title,
				Speaker:      speaker,
				Topic:        topic,
				ThumbnailURL: thumb,
				URL:          url,
				VideoID:      vid,
			}
			k.ID = row.KajianRowID
			b.Kajian = k
		}

		if row.ChunkRowID != nil {
			var vid, txt, tsURL string
			var kID, startSec, endSec int
			if row.ChunkKajianID != nil {
				kID = *row.ChunkKajianID
			}
			if row.ChunkVideoID != nil {
				vid = *row.ChunkVideoID
			}
			if row.ChunkStartSeconds != nil {
				startSec = *row.ChunkStartSeconds
			}
			if row.ChunkEndSeconds != nil {
				endSec = *row.ChunkEndSeconds
			}
			if row.ChunkText != nil {
				txt = *row.ChunkText
			}
			if row.ChunkTimestampURL != nil {
				tsURL = *row.ChunkTimestampURL
			}
			chunk := &model.KajianTranscript{
				KajianID:     kID,
				VideoID:      vid,
				StartSeconds: startSec,
				EndSeconds:   endSec,
				Text:         txt,
				TimestampURL: tsURL,
				Kajian:       k,
			}
			chunk.ID = row.ChunkRowID
			b.Chunk = chunk
		}

		out = append(out, b)
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
