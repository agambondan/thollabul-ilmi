package repository

import (
	"fmt"
	"regexp"
	"sort"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib/embeddings"
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
	SearchTranscripts(query, speaker, mode string, queryVector []float32, limit, offset int) ([]model.SearchTranscriptResult, int64, error)
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

type searchTranscriptRow struct {
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
	Score        float64
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

func (r *kajianRepository) SearchTranscripts(query, speaker, mode string, queryVector []float32, limit, offset int) ([]model.SearchTranscriptResult, int64, error) {
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
	likeOp := "ILIKE"
	isSQLite := r.db.Dialector.Name() == "sqlite"
	if isSQLite {
		likeOp = "LIKE"
	}
	matchExpr := func(field string) string {
		if isSQLite {
			return field + " LIKE ?"
		}
		return field + " ~* ?"
	}
	matchValue := func(term string) string {
		if isSQLite {
			return "%" + term + "%"
		}
		return "\\m" + regexp.QuoteMeta(term) + "\\M"
	}

	transcriptTable := "kajian_transcript"
	kajianTable := "kajian"
	if r.db.Migrator().HasTable("kajian_transcripts") {
		transcriptTable = "kajian_transcripts"
		kajianTable = "kajians"
	}

	selectCols := fmt.Sprintf("%[1]s.id, %[1]s.kajian_id, %[1]s.video_id, %[1]s.start_seconds, %[1]s.end_seconds, %[1]s.text, %[1]s.timestamp_url, %[2]s.title, %[2]s.speaker, %[2]s.topic, %[2]s.thumbnail_url", transcriptTable, kajianTable)
	joinClause := fmt.Sprintf("JOIN %[2]s ON %[2]s.id = %[1]s.kajian_id", transcriptTable, kajianTable)
	base := r.db.Table(transcriptTable).Select(selectCols).Joins(joinClause)
	if speaker != "" {
		base = base.Where(fmt.Sprintf("%s.speaker %s ?", kajianTable, likeOp), "%"+speaker+"%")
	}

	// Count total
	var total int64
	if err := base.Session(&gorm.Session{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// No query => return chronological chunks (no scoring)
	if query == "" {
		var rows []searchTranscriptRow
		err := base.Order(fmt.Sprintf("%s.kajian_id ASC, %s.start_seconds ASC", transcriptTable, transcriptTable)).
			Limit(limit).Offset(offset).Scan(&rows).Error
		if err != nil {
			return nil, 0, err
		}
		return toResults(rows, "", 1.0, "lexical"), total, nil
	}

	// Pure lexical (exact or semantic fallback) - both use whole-word LIKE
	if mode == "exact" || mode == "semantic" {
		words := strings.Fields(query)
		if mode == "exact" {
			words = []string{query}
		}
		dbQuery := base
		if len(words) > 0 {
			conds := make([]string, 0, len(words))
			args := make([]interface{}, 0, len(words)*3)
			for _, w := range words {
				v := matchValue(w)
				conds = append(conds, fmt.Sprintf("(%s OR %s OR %s)", matchExpr(transcriptTable+".text"), matchExpr(kajianTable+".title"), matchExpr(kajianTable+".topic")))
				args = append(args, v, v, v)
			}
			dbQuery = dbQuery.Where(strings.Join(conds, " AND "), args...)
		}
		var rows []searchTranscriptRow
		if err := dbQuery.
			Order(fmt.Sprintf("%s.kajian_id ASC, %s.start_seconds ASC", transcriptTable, transcriptTable)).
			Limit(limit).Offset(offset).
			Scan(&rows).Error; err != nil {
			return nil, 0, err
		}
		results := toResults(rows, query, 1.0, mode)
		return results, int64(len(results)), nil
	}

	// Hybrid: lexical whole-word UNION vector cosine, ranked by RRF
	sideFetch := limit * 5
	if sideFetch < 50 {
		sideFetch = 50
	}
	if sideFetch > 200 {
		sideFetch = 200
	}

	words := strings.Fields(query)
	conds := make([]string, 0, len(words)+1)
	args := make([]interface{}, 0, len(words)*2+2)
	conds = append(conds, fmt.Sprintf("(%s OR %s)", matchExpr(transcriptTable+".text"), matchExpr(kajianTable+".title")))
	phraseVal := matchValue(query)
	args = append(args, phraseVal, phraseVal)
	for _, w := range words {
		v := matchValue(w)
		conds = append(conds, fmt.Sprintf("(%s OR %s)", matchExpr(transcriptTable+".text"), matchExpr(kajianTable+".topic")))
		args = append(args, v, v)
	}
	lexExpr := strings.Join(conds, " OR ")

	var lexRows []searchTranscriptRow
	if err := base.Session(&gorm.Session{}).
		Where(lexExpr, args...).
		Order(fmt.Sprintf("%s.kajian_id ASC, %s.start_seconds ASC", transcriptTable, transcriptTable)).
		Limit(sideFetch).
		Scan(&lexRows).Error; err != nil {
		return nil, 0, err
	}

	if len(queryVector) == 0 || r.db.Dialector.Name() == "sqlite" {
		// No vector available or sqlite test fallback
		results := toResults(lexRows[:min(len(lexRows), limit)], query, 1.0, "lexical")
		return results, int64(len(results)), nil
	}

	// Vector search via raw SQL on postgres
	vectorLiteral := embeddings.FormatVector(queryVector)
	vecSQL := fmt.Sprintf(`
SELECT %[1]s.id, %[1]s.kajian_id, %[1]s.video_id, %[1]s.start_seconds, %[1]s.end_seconds,
       %[1]s.text, %[1]s.timestamp_url, %[2]s.title, %[2]s.speaker, %[2]s.topic, %[2]s.thumbnail_url,
       (1 - (%[1]s.embedding <=> $1::vector)) AS score
FROM %[1]s
JOIN %[2]s ON %[2]s.id = %[1]s.kajian_id
WHERE %[1]s.embedding IS NOT NULL
`, transcriptTable, kajianTable)
	if speaker != "" {
		vecSQL += fmt.Sprintf(" AND %s.speaker %s $2", kajianTable, likeOp)
	}
	vecSQL += " ORDER BY %[1]s.embedding <=> $1::vector ASC LIMIT %[3]d"

	vecSQL = fmt.Sprintf(vecSQL, transcriptTable, kajianTable, sideFetch)
	vecArgs := []interface{}{vectorLiteral}
	if speaker != "" {
		vecArgs = append(vecArgs, "%"+speaker+"%")
	}
	var vecRows []searchTranscriptRow
	if err := r.db.Raw(vecSQL, vecArgs...).Scan(&vecRows).Error; err != nil {
		return nil, 0, err
	}

	type fused struct {
		row   searchTranscriptRow
		score float64
	}
	scores := make(map[int]*fused)
	const rrfK = 60.0
	rank := func(rows []searchTranscriptRow) {
		for i, row := range rows {
			f, ok := scores[row.ID]
			if !ok {
				cp := row
				f = &fused{row: cp}
				scores[row.ID] = f
			}
			f.score += 1.0 / (rrfK + float64(i+1))
		}
	}
	rank(lexRows)
	rank(vecRows)

	merged := make([]fused, 0, len(scores))
	for _, f := range scores {
		merged = append(merged, *f)
	}
	sort.Slice(merged, func(i, j int) bool {
		if merged[i].score != merged[j].score {
			return merged[i].score > merged[j].score
		}
		return merged[i].row.KajianID < merged[j].row.KajianID
	})

	if offset >= len(merged) {
		return []model.SearchTranscriptResult{}, int64(len(merged)), nil
	}
	end := offset + limit
	if end > len(merged) {
		end = len(merged)
	}
	page := merged[offset:end]
	results := make([]model.SearchTranscriptResult, 0, len(page))
	for _, p := range page {
		row := p.row
		row.Score = p.score
		results = append(results, model.SearchTranscriptResult{
			ID:           row.ID,
			KajianID:     row.KajianID,
			VideoID:      row.VideoID,
			Title:        row.Title,
			Speaker:      row.Speaker,
			Topic:        row.Topic,
			StartSeconds: row.StartSeconds,
			EndSeconds:   row.EndSeconds,
			Timestamp:    formatTimestamp(row.StartSeconds),
			Snippet:      row.Text,
			TimestampURL: row.TimestampURL,
			ThumbnailURL: row.ThumbnailURL,
			Score:        p.score,
			MatchMode:    "hybrid",
		})
	}
	return results, int64(len(merged)), nil
}

func toResults(rows []searchTranscriptRow, query string, score float64, mode string) []model.SearchTranscriptResult {
	out := make([]model.SearchTranscriptResult, 0, len(rows))
	for _, r := range rows {
		s := score
		if query != "" && strings.Contains(strings.ToLower(r.Text), strings.ToLower(query)) {
			s = score * 2
		}
		out = append(out, model.SearchTranscriptResult{
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
			Score:        s,
			MatchMode:    mode,
		})
	}
	return out
}

func (r *kajianRepository) GetTranscriptsByKajianID(kajianID int) ([]model.KajianTranscript, error) {
	tables := []string{"kajian_transcript", "kajian_transcripts"}
	
	// Cari video_id dari kajian jika ada
	var k model.Kajian
	_ = r.db.Select("id, url").Where("id = ?", kajianID).First(&k).Error
	
	var videoID string
	if k.URL != "" {
		parts := strings.Split(k.URL, "v=")
		if len(parts) > 1 {
			videoID = strings.Split(parts[1], "&")[0]
		} else if strings.Contains(k.URL, "youtu.be/") {
			parts = strings.Split(k.URL, "youtu.be/")
			if len(parts) > 1 {
				videoID = strings.Split(parts[1], "?")[0]
			}
		}
	}

	for _, tbl := range tables {
		var items []model.KajianTranscript
		q := r.db.Table(tbl).Order("start_seconds ASC")
		if videoID != "" {
			q = q.Where("kajian_id = ? OR video_id = ?", kajianID, videoID)
		} else {
			q = q.Where("kajian_id = ?", kajianID)
		}

		if err := q.Scan(&items).Error; err == nil && len(items) > 0 {
			return items, nil
		}
	}

	return []model.KajianTranscript{}, nil
}

