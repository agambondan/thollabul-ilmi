package repository

import (
	"fmt"
	"strings"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type KajianRepository interface {
	FindAll(ctx *fiber.Ctx, topic, kajianType, speaker string) *paginate.Page
	FindByID(id int) (*model.Kajian, error)
	Create(k *model.Kajian) (*model.Kajian, error)
	Update(id int, k *model.Kajian) (*model.Kajian, error)
	Delete(id int) error
	IncrementView(id int) error
	SearchTranscripts(query, speaker, mode string, limit, offset int) ([]model.SearchTranscriptResult, int64, error)
	GetSpeakers() ([]string, error)
	GetTranscriptsByKajianID(kajianID int) ([]model.KajianTranscript, error)
}

type kajianRepository struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewKajianRepository(db *gorm.DB, pg *paginate.Pagination) KajianRepository {
	return &kajianRepository{db, pg}
}

func formatTimestamp(seconds int) string {
	h := seconds / 3600
	m := (seconds % 3600) / 60
	s := seconds % 60
	if h > 0 {
		return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
	}
	return fmt.Sprintf("%02d:%02d", m, s)
}

func (r *kajianRepository) FindAll(ctx *fiber.Ctx, topic, kajianType, speaker string) *paginate.Page {
	var list []model.Kajian
	q := r.db.Model(&model.Kajian{}).Preload("Translation").Order("published_at DESC, id DESC")
	likeOp := "ILIKE"
	if r.db.Dialector.Name() == "sqlite" {
		likeOp = "LIKE"
	}
	if topic != "" {
		q = q.Where(fmt.Sprintf("topic %s ?", likeOp), "%"+topic+"%")
	}
	if kajianType != "" {
		q = q.Where("type = ?", kajianType)
	}
	if speaker != "" {
		q = q.Where(fmt.Sprintf("speaker %s ?", likeOp), "%"+speaker+"%")
	}
	page := r.pg.With(q).Request(ctx.Request()).Response(&list)
	return &page
}

func (r *kajianRepository) FindByID(id int) (*model.Kajian, error) {
	var k model.Kajian
	err := r.db.Preload("Translation").Preload("Transcripts", func(db *gorm.DB) *gorm.DB {
		return db.Order("start_seconds ASC")
	}).First(&k, id).Error
	return &k, err
}

func (r *kajianRepository) Create(k *model.Kajian) (*model.Kajian, error) {
	err := r.db.Create(k).Error
	return k, err
}

func (r *kajianRepository) Update(id int, k *model.Kajian) (*model.Kajian, error) {
	var existing model.Kajian
	if err := r.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	err := r.db.Model(&existing).Updates(k).Error
	return &existing, err
}

func (r *kajianRepository) Delete(id int) error {
	return r.db.Delete(&model.Kajian{}, id).Error
}

func (r *kajianRepository) IncrementView(id int) error {
	return r.db.Model(&model.Kajian{}).Where("id = ?", id).UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *kajianRepository) GetSpeakers() ([]string, error) {
	var speakers []string
	err := r.db.Model(&model.Kajian{}).
		Where("speaker IS NOT NULL AND speaker != ''").
		Distinct("speaker").
		Pluck("speaker", &speakers).Error
	return speakers, err
}

func (r *kajianRepository) SearchTranscripts(query, speaker, mode string, limit, offset int) ([]model.SearchTranscriptResult, int64, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	if mode == "" {
		mode = "hybrid"
	}

	query = strings.TrimSpace(query)
	var rawResults []struct {
		ID           int
		KajianID     int
		VideoID      string
		Title        string
		Speaker      string
		Topic        string
		StartSeconds int
		EndSeconds   int
		Text         string
		TimestampURL string
		ThumbnailURL string
	}

	likeOp := "ILIKE"
	if r.db.Dialector.Name() == "sqlite" {
		likeOp = "LIKE"
	}

	transcriptTable := "kajian_transcript"
	kajianTable := "kajian"
	// if plural table name is used by GORM configuration
	var countPlural int64
	if r.db.Migrator().HasTable("kajian_transcripts") {
		transcriptTable = "kajian_transcripts"
		kajianTable = "kajians"
	}
	_ = countPlural

	selectCols := fmt.Sprintf("%[1]s.id, %[1]s.kajian_id, %[1]s.video_id, %[1]s.start_seconds, %[1]s.end_seconds, %[1]s.text, %[1]s.timestamp_url, %[2]s.title, %[2]s.speaker, %[2]s.topic, %[2]s.thumbnail_url", transcriptTable, kajianTable)
	joinClause := fmt.Sprintf("JOIN %[2]s ON %[2]s.id = %[1]s.kajian_id", transcriptTable, kajianTable)

	dbQuery := r.db.Table(transcriptTable).
		Select(selectCols).
		Joins(joinClause)

	if speaker != "" {
		dbQuery = dbQuery.Where(fmt.Sprintf("%s.speaker %s ?", kajianTable, likeOp), "%"+speaker+"%")
	}

	if query != "" {
		switch mode {
		case "exact":
			dbQuery = dbQuery.Where(fmt.Sprintf("%s.text %s ? OR %s.title %s ?", transcriptTable, likeOp, kajianTable, likeOp), "%"+query+"%", "%"+query+"%")
		case "semantic":
			words := strings.Fields(query)
			if len(words) > 0 {
				var conditions []string
				var args []interface{}
				for _, w := range words {
					conditions = append(conditions, fmt.Sprintf("(%s.text %s ? OR %s.title %s ? OR %s.topic %s ?)", transcriptTable, likeOp, kajianTable, likeOp, kajianTable, likeOp))
					args = append(args, "%"+w+"%", "%"+w+"%", "%"+w+"%")
				}
				dbQuery = dbQuery.Where(strings.Join(conditions, " OR "), args...)
			}
		default: // hybrid
			words := strings.Fields(query)
			exactPattern := "%" + query + "%"
			var conditions []string
			var args []interface{}
			conditions = append(conditions, fmt.Sprintf("(%s.text %s ? OR %s.title %s ?)", transcriptTable, likeOp, kajianTable, likeOp))
			args = append(args, exactPattern, exactPattern)
			for _, w := range words {
				conditions = append(conditions, fmt.Sprintf("(%s.text %s ? OR %s.topic %s ?)", transcriptTable, likeOp, kajianTable, likeOp))
				args = append(args, "%"+w+"%", "%"+w+"%")
			}
			dbQuery = dbQuery.Where(strings.Join(conditions, " OR "), args...)
		}
	}

	var total int64
	if err := dbQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := dbQuery.Order(fmt.Sprintf("%s.kajian_id ASC, %s.start_seconds ASC", transcriptTable, transcriptTable)).
		Limit(limit).
		Offset(offset).
		Scan(&rawResults).Error
	if err != nil {
		return nil, 0, err
	}

	var results []model.SearchTranscriptResult
	for _, r := range rawResults {
		score := 1.0
		if query != "" && strings.Contains(strings.ToLower(r.Text), strings.ToLower(query)) {
			score = 2.0
		}

		res := model.SearchTranscriptResult{
			ID:           r.ID,
			KajianID:     r.KajianID,
			VideoID:      r.VideoID,
			Title:        r.Title,
			Speaker:      r.Speaker,
			Topic:        r.Topic,
			StartSeconds: r.StartSeconds,
			EndSeconds:   r.EndSeconds,
			Timestamp:    formatTimestamp(r.StartSeconds),
			Snippet:      r.Text,
			TimestampURL: r.TimestampURL,
			ThumbnailURL: r.ThumbnailURL,
			Score:        score,
			MatchMode:    mode,
		}
		results = append(results, res)
	}

	return results, total, nil
}

func (r *kajianRepository) GetTranscriptsByKajianID(kajianID int) ([]model.KajianTranscript, error) {
	transcriptTable := "kajian_transcript"
	if r.db.Migrator().HasTable("kajian_transcripts") {
		transcriptTable = "kajian_transcripts"
	}

	var items []model.KajianTranscript
	if err := r.db.
		Table(transcriptTable).
		Where("kajian_id = ?", kajianID).
		Order("start_seconds ASC").
		Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

