package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type KajianNoteRepository interface {
	Create(note *model.KajianUserNote) error
	GetByID(userID uuid.UUID, id int) (*model.KajianUserNote, error)
	List(userID uuid.UUID, query model.KajianNoteListQuery) ([]model.KajianUserNote, error)
	Update(note *model.KajianUserNote) error
	Delete(userID uuid.UUID, id int) error
}

type kajianNoteRepository struct {
	db *gorm.DB
}

func NewKajianNoteRepository(db *gorm.DB) KajianNoteRepository {
	return &kajianNoteRepository{db: db}
}

func (r *kajianNoteRepository) Create(note *model.KajianUserNote) error {
	return r.db.Create(note).Error
}

func (r *kajianNoteRepository) GetByID(userID uuid.UUID, id int) (*model.KajianUserNote, error) {
	var note model.KajianUserNote
	err := r.db.Where("user_id = ? AND id = ?", userID, id).First(&note).Error
	if err != nil {
		return nil, err
	}
	return &note, nil
}

type kajianNoteRow struct {
	ID        *int
	UserID    uuid.UUID
	KajianID  int
	StartSec  int
	EndSec    *int
	Content   string
	CreatedAt *int64
	UpdatedAt *int64

	KajianRowID      *int
	KajianTitle      *string
	KajianSpeaker    *string
	KajianTopic      *string
	KajianThumbnail  *string
	KajianURL        *string
}

func (r *kajianNoteRepository) List(userID uuid.UUID, query model.KajianNoteListQuery) ([]model.KajianUserNote, error) {
	sql := `
		SELECT
			kn.id, kn.user_id, kn.kajian_id, kn.start_sec, kn.end_sec, kn.content,
			kn.created_at, kn.updated_at,
			k.id AS kajian_row_id, k.title AS kajian_title, k.speaker AS kajian_speaker,
			k.topic AS kajian_topic, k.thumbnail_url AS kajian_thumbnail, k.url AS kajian_url
		FROM kajian_user_note kn
		LEFT JOIN kajian k ON k.id = kn.kajian_id AND k.deleted_at IS NULL
		WHERE kn.user_id = ? AND kn.deleted_at IS NULL
	`
	var args []interface{}
	args = append(args, userID)

	if query.KajianID != nil && *query.KajianID > 0 {
		sql += " AND kn.kajian_id = ?"
		args = append(args, *query.KajianID)
	}

	sql += " ORDER BY kn.created_at DESC, kn.start_sec ASC"

	if query.Limit > 0 {
		sql += " LIMIT ?"
		args = append(args, query.Limit)
	}
	if query.Offset > 0 {
		sql += " OFFSET ?"
		args = append(args, query.Offset)
	}

	var rows []kajianNoteRow
	if err := r.db.Raw(sql, args...).Scan(&rows).Error; err != nil {
		return nil, err
	}

	notes := make([]model.KajianUserNote, 0, len(rows))
	for _, row := range rows {
		n := model.KajianUserNote{
			UserID:    row.UserID,
			KajianID:  row.KajianID,
			StartSec:  row.StartSec,
			EndSec:    row.EndSec,
			Content:   row.Content,
			CreatedAt: row.CreatedAt,
			UpdatedAt: row.UpdatedAt,
		}
		n.ID = row.ID

		if row.KajianRowID != nil {
			var title, speaker, topic, thumb, url string
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
			k := &model.Kajian{
				Title:        title,
				Speaker:      speaker,
				Topic:        topic,
				ThumbnailURL: thumb,
				URL:          url,
			}
			k.ID = row.KajianRowID
			n.Kajian = k
		}
		notes = append(notes, n)
	}

	return notes, nil
}

func (r *kajianNoteRepository) Update(note *model.KajianUserNote) error {
	return r.db.Save(note).Error
}

func (r *kajianNoteRepository) Delete(userID uuid.UUID, id int) error {
	return r.db.Where("user_id = ? AND id = ?", userID, id).Delete(&model.KajianUserNote{}).Error
}
