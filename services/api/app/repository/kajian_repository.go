package repository

import (
	"fmt"
	"sort"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib/textsearch"
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
	SearchTranscripts(query, speaker, mode string, limit, offset int) ([]model.SearchTranscriptResult, model.SearchTranscriptMeta, error)
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
	ID            int
	KajianID      int
	VideoID       string
	Title         string
	Speaker       string
	Topic         string
	StartSeconds  int
	EndSeconds    int
	Text          string
	TimestampURL  string
	ThumbnailURL  string
	Description   string
	PublishedAt   string
	Score         float64
	MatchedGroups int
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
		parts := strings.Split(speaker, "||")
		var conds []string
		var args []interface{}
		for _, p := range parts {
			p = strings.TrimSpace(p)
			if p != "" {
				conds = append(conds, fmt.Sprintf("speaker %s ?", likeOp))
				args = append(args, "%"+p+"%")
			}
		}
		if len(conds) > 0 {
			q = q.Where(strings.Join(conds, " OR "), args...)
		}
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

// ── Transcript search ─────────────────────────────────────────────────────────

// Candidate-list caps. The corpus is ~5k chunks, so these bound the fused set
// (and therefore how far a client can page) rather than protect the database.
const (
	searchPhraseFetch = 500
	searchFTSFetch    = 300
	searchTitleFetch  = 50
	searchFuzzyFetch  = 100
	// searchFuzzyTrigger: the trigram-fuzzy list only runs when fewer than
	// this many chunks match every concept literally, i.e. when the query
	// looks misspelt or uses a spelling the corpus never does. It costs
	// ~150ms on 5k rows (pg_trgm rechecks word_similarity per candidate).
	searchFuzzyTrigger = 20
	// excerptRunes is the length of the snippet window around the first hit.
	excerptRunes = 240
)

// searchSQL accumulates a raw statement and its bound arguments in textual
// order so `?` placeholders and values can never drift apart.
type searchSQL struct {
	sb   strings.Builder
	args []interface{}
}

func (s *searchSQL) add(fragment string, args ...interface{}) *searchSQL {
	s.sb.WriteString(fragment)
	s.args = append(s.args, args...)
	return s
}

func (s *searchSQL) String() string { return s.sb.String() }

// transcriptTables resolves the singular/plural table-name pair.
func (r *kajianRepository) transcriptTables() (transcript, kajian string) {
	if r.db.Migrator().HasTable("kajian_transcripts") {
		return "kajian_transcripts", "kajians"
	}
	return "kajian_transcript", "kajian"
}

// anyListTruncated reports whether a candidate list hit its fetch cap, in
// which case the fused total is a lower bound.
func anyListTruncated(lists []hitList) bool {
	caps := map[hitSource]int{
		srcPhrase: searchPhraseFetch,
		srcFTS:    searchFTSFetch,
		srcFuzzy:  searchFuzzyFetch,
		srcTitle:  searchTitleFetch,
	}
	for _, l := range lists {
		if c, ok := caps[l.source]; ok && len(l.rows) >= c {
			return true
		}
	}
	return false
}

// transcriptSelectCols lists the columns every candidate query returns.
// published_at is a Postgres date; it is cast to text so it scans into the
// row struct the same way on both dialects (sqlite stores it as text already).
func transcriptSelectCols(t, k string, postgres bool) string {
	published := k + ".published_at"
	if postgres {
		published += "::text"
	}
	return fmt.Sprintf("%[1]s.id, %[1]s.kajian_id, %[1]s.video_id, %[1]s.start_seconds, %[1]s.end_seconds, %[1]s.text, %[1]s.timestamp_url, %[2]s.title, %[2]s.speaker, %[2]s.topic, %[2]s.thumbnail_url, %[2]s.description, %[3]s AS published_at", t, k, published)
}

// kajianWhere builds the WHERE clause shared by every candidate query: live
// kajian rows, optionally restricted to one or more speakers ("A||B").
func kajianWhere(k, speaker, likeOp string) (string, []interface{}) {
	conds := []string{k + ".deleted_at IS NULL"}
	var args []interface{}
	if parts := splitSpeakers(speaker); len(parts) > 0 {
		ors := make([]string, len(parts))
		for i, p := range parts {
			ors[i] = k + ".speaker " + likeOp + " ?"
			args = append(args, "%"+p+"%")
		}
		conds = append(conds, "("+strings.Join(ors, " OR ")+")")
	}
	return " WHERE " + strings.Join(conds, " AND "), args
}

// SearchTranscripts searches transcript chunks in one of three modes:
//
//   - exact:    the query appears verbatim (whole words, any case).
//   - semantic: Indonesian-stemmed full-text search with spelling-variant
//     expansion, fused with video-level title matches and, when literal
//     matches are scarce, trigram-fuzzy (typo-tolerant) matches.
//   - hybrid:   exact hits first, then chunks containing every concept, then
//     the semantic tail.
//
// Results are relevance-ranked, diversified per kajian and paginated in Go;
// see rankTranscriptHits for the fusion rules.
func (r *kajianRepository) SearchTranscripts(query, speaker, mode string, limit, offset int) ([]model.SearchTranscriptResult, model.SearchTranscriptMeta, error) {
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	mode = normalizeSearchMode(mode)
	q := textsearch.Parse(query)
	if q.IsEmpty() {
		return []model.SearchTranscriptResult{}, model.SearchTranscriptMeta{Mode: mode, ExpandedTerms: []string{}}, nil
	}

	t, k := r.transcriptTables()
	var (
		lists      []hitList
		exactTotal int64
		err        error
	)
	if r.db.Dialector.Name() == "sqlite" {
		lists, exactTotal, err = r.transcriptCandidatesSQLite(q, speaker, mode, t, k)
	} else {
		lists, exactTotal, err = r.transcriptCandidatesPostgres(q, speaker, mode, limit, t, k)
	}
	if err != nil {
		return nil, model.SearchTranscriptMeta{}, err
	}

	page, meta := rankTranscriptHits(mode, lists, len(q.GroupQueries()), limit, offset)
	meta.Mode = mode
	meta.ExpandedTerms = q.HighlightTerms()
	meta.Truncated = anyListTruncated(lists)
	snippetTerms := q.SnippetTerms()
	for i := range page {
		text := page[i].Snippet
		terms := snippetTerms
		if page[i].MatchReason == reasonFuzzy {
			// Locate the misspelt/variant word pg_trgm matched so the excerpt
			// and the highlighter can point at it.
			for _, g := range q.Groups {
				if tok := textsearch.BestFuzzyToken(text, g.Source, 0.45); tok != "" {
					page[i].MatchedTerms = append(page[i].MatchedTerms, tok)
				}
			}
			terms = append(append([]string{}, page[i].MatchedTerms...), snippetTerms...)
		}
		if page[i].MatchReason == reasonTitle {
			// Nothing in the chunk matched; show the text that did.
			text = strings.TrimSpace(strings.Join([]string{page[i].Topic, page[i].Description}, " — "))
			text = strings.Trim(text, " —")
			if text == "" {
				text = page[i].Title
			}
		}
		page[i].Snippet = textsearch.Excerpt(text, terms, excerptRunes)
		page[i].Description = "" // not needed on the wire once folded into the snippet
	}
	if mode == searchModeExact && exactTotal > meta.Total {
		// The phrase list is capped; report the real match count so the
		// client can say "20 dari 734" even though only 500 are pageable.
		meta.Total = exactTotal
	}
	return page, meta, nil
}

// transcriptCandidatesPostgres runs the per-source candidate queries. The
// second return value is the uncapped phrase-match count (exact mode only).
func (r *kajianRepository) transcriptCandidatesPostgres(q textsearch.Query, speaker, mode string, limit int, t, k string) ([]hitList, int64, error) {
	cols := transcriptSelectCols(t, k, true)
	from := fmt.Sprintf(" FROM %[1]s JOIN %[2]s ON %[2]s.id = %[1]s.kajian_id", t, k)
	where, whereArgs := kajianWhere(k, speaker, "ILIKE")
	liveChunk := fmt.Sprintf(" AND %s.deleted_at IS NULL", t)

	var lists []hitList
	var exactTotal int64

	if mode != searchModeSemantic {
		regex := q.PhraseRegex()
		s := &searchSQL{}
		s.add("SELECT " + cols + ", 0::float8 AS score, 0 AS matched_groups" + from)
		s.add(where, whereArgs...)
		s.add(liveChunk+fmt.Sprintf(" AND %s.text ~* ?", t), regex)
		s.add(fmt.Sprintf(" ORDER BY %[1]s.kajian_id ASC, %[1]s.start_seconds ASC, %[1]s.id ASC LIMIT %d", t, searchPhraseFetch))
		var rows []searchTranscriptRow
		if err := r.db.Raw(s.String(), s.args...).Scan(&rows).Error; err != nil {
			return nil, 0, err
		}
		counter := newPhraseCounter(q.Words)
		for i := range rows {
			rows[i].Score = counter.count(rows[i].Text)
		}
		sortPhraseRows(rows)
		lists = append(lists, hitList{source: srcPhrase, rows: rows})

		if mode == searchModeExact {
			c := &searchSQL{}
			c.add("SELECT count(*)" + from)
			c.add(where, whereArgs...)
			c.add(liveChunk+fmt.Sprintf(" AND %s.text ~* ?", t), regex)
			if err := r.db.Raw(c.String(), c.args...).Scan(&exactTotal).Error; err != nil {
				return nil, 0, err
			}
			return lists, exactTotal, nil
		}
	}

	if groups := q.GroupQueries(); len(groups) > 0 {
		anyQ, allQ := q.TSQueryAny(), q.TSQueryAll()
		// Prefer the stored generated column (see createCompositeIndexes);
		// fall back to computing the tsvector when it does not exist yet.
		tsvExpr := fmt.Sprintf("to_tsvector('indonesian', %s.text)", t)
		if r.db.Migrator().HasColumn(t, "text_tsv") {
			tsvExpr = t + ".text_tsv"
		}

		// Full-text list. The materialized CTE computes the tsvector once per
		// matched row; the WHERE inside it is index-assisted by
		// idx_kajian_transcript_text_fts (same expression). The df CTE counts
		// how many matched rows carry each concept so that, among rows
		// matching the same number of concepts, the rarer concept wins
		// ("riba"-only chunks before "hukum"-only chunks for "hukum riba").
		s := &searchSQL{}
		s.add(fmt.Sprintf("WITH m AS MATERIALIZED (SELECT %[1]s.id, %[1]s.kajian_id, %[1]s.video_id, %[1]s.start_seconds, %[1]s.end_seconds, %[1]s.text, %[1]s.timestamp_url, %[2]s AS tsv FROM %[1]s WHERE %[1]s.deleted_at IS NULL AND %[2]s @@ to_tsquery('indonesian', ?))", t, tsvExpr), anyQ)
		s.add(", df AS (SELECT ")
		for i, g := range groups {
			if i > 0 {
				s.add(", ")
			}
			s.add(fmt.Sprintf("greatest(count(*) FILTER (WHERE m.tsv @@ to_tsquery('indonesian', ?)), 1)::float8 AS d%d", i), g)
		}
		s.add(" FROM m)")
		s.add(" SELECT "+transcriptSelectCols("m", k, true)+", ts_rank_cd(m.tsv, to_tsquery('indonesian', ?)) AS score, (", anyQ)
		for i, g := range groups {
			if i > 0 {
				s.add(" + ")
			}
			s.add("(m.tsv @@ to_tsquery('indonesian', ?))::int", g)
		}
		s.add(") AS matched_groups, (")
		for i, g := range groups {
			if i > 0 {
				s.add(" + ")
			}
			s.add(fmt.Sprintf("(m.tsv @@ to_tsquery('indonesian', ?))::int / df.d%d", i), g)
		}
		s.add(fmt.Sprintf(") AS rarity FROM m CROSS JOIN df JOIN %[1]s ON %[1]s.id = m.kajian_id", k))
		s.add(where, whereArgs...)
		s.add(fmt.Sprintf(" ORDER BY matched_groups DESC, rarity DESC, score DESC, m.kajian_id ASC, m.start_seconds ASC, m.id ASC LIMIT %d", searchFTSFetch))
		var ftsRows []searchTranscriptRow
		if err := r.db.Raw(s.String(), s.args...).Scan(&ftsRows).Error; err != nil {
			return nil, 0, err
		}
		lists = append(lists, hitList{source: srcFTS, rows: ftsRows})
		fullMatches := 0
		for _, row := range ftsRows {
			if row.MatchedGroups >= len(groups) {
				fullMatches++
			}
		}

		// Title list: one row per kajian whose title/topic/description carries
		// every concept, represented by its earliest chunk.
		titleTSV := fmt.Sprintf("to_tsvector('indonesian', coalesce(%[1]s.title,'') || ' ' || coalesce(%[1]s.topic,'') || ' ' || coalesce(%[1]s.description,''))", k)
		ts := &searchSQL{}
		ts.add(fmt.Sprintf("SELECT * FROM (SELECT DISTINCT ON (%s.kajian_id) ", t)+cols+", ts_rank_cd("+titleTSV+", to_tsquery('indonesian', ?)) AS score, 0 AS matched_groups"+from, allQ)
		ts.add(where, whereArgs...)
		ts.add(liveChunk+" AND "+titleTSV+" @@ to_tsquery('indonesian', ?)", allQ)
		ts.add(fmt.Sprintf(" ORDER BY %[1]s.kajian_id ASC, %[1]s.start_seconds ASC, %[1]s.id ASC) x ORDER BY x.score DESC, x.kajian_id ASC LIMIT %d", t, searchTitleFetch))
		var titleRows []searchTranscriptRow
		if err := r.db.Raw(ts.String(), ts.args...).Scan(&titleRows).Error; err != nil {
			return nil, 0, err
		}
		lists = append(lists, hitList{source: srcTitle, rows: titleRows})
		// Trigram-fuzzy list (typo tolerance: "ribaa", "istikamah" vs
		// "istiqomah"). Only for single-concept queries and only when literal
		// matches are scarce — see searchFuzzyTrigger. Multi-word fuzzy
		// matching costs seconds (one word_similarity recheck per word per
		// candidate row) for very little gain.
		if len(q.Groups) == 1 && fullMatches < searchFuzzyTrigger && fullMatches < limit {
			var fuzzyWords []string
			for _, g := range q.Groups {
				if len([]rune(g.Source)) >= 4 {
					fuzzyWords = append(fuzzyWords, g.Source)
				}
			}
			if len(fuzzyWords) > 0 {
				fs := &searchSQL{}
				fs.add("SELECT " + cols + ", greatest(")
				for i, w := range fuzzyWords {
					if i > 0 {
						fs.add(", ")
					}
					fs.add(fmt.Sprintf("word_similarity(?, %s.text)", t), w)
				}
				fs.add(")::float8 AS score, 0 AS matched_groups" + from)
				fs.add(where, whereArgs...)
				fs.add(liveChunk + " AND (")
				for i, w := range fuzzyWords {
					if i > 0 {
						fs.add(" OR ")
					}
					fs.add(fmt.Sprintf("? <%% %s.text", t), w)
				}
				fs.add(fmt.Sprintf(") ORDER BY score DESC, %[1]s.kajian_id ASC, %[1]s.start_seconds ASC, %[1]s.id ASC LIMIT %d", t, searchFuzzyFetch))
				var fuzzyRows []searchTranscriptRow
				if err := r.db.Raw(fs.String(), fs.args...).Scan(&fuzzyRows).Error; err != nil {
					return nil, 0, err
				}
				lists = append(lists, hitList{source: srcFuzzy, rows: fuzzyRows})
			}
		}
	}
	return lists, exactTotal, nil
}

// transcriptCandidatesSQLite is the LIKE-based fallback used by the sqlite
// test suite: phrase list + substring "concept" list, no vectors or titles.
func (r *kajianRepository) transcriptCandidatesSQLite(q textsearch.Query, speaker, mode, t, k string) ([]hitList, int64, error) {
	where, whereArgs := kajianWhere(k, speaker, "LIKE")
	base := r.db.Table(t).
		Select(transcriptSelectCols(t, k, false)).
		Joins(fmt.Sprintf("JOIN %[2]s ON %[2]s.id = %[1]s.kajian_id", t, k)).
		Where(strings.TrimPrefix(where, " WHERE "), whereArgs...).
		Where(t + ".deleted_at IS NULL")
	order := fmt.Sprintf("%[1]s.kajian_id ASC, %[1]s.start_seconds ASC, %[1]s.id ASC", t)

	var lists []hitList
	var exactTotal int64

	if mode != searchModeSemantic {
		var rows []searchTranscriptRow
		phrase := "%" + strings.Join(q.Words, " ") + "%"
		if err := base.Session(&gorm.Session{}).
			Where(t+".text LIKE ?", phrase).
			Order(order).Limit(searchPhraseFetch).
			Scan(&rows).Error; err != nil {
			return nil, 0, err
		}
		counter := newPhraseCounter(q.Words)
		for i := range rows {
			rows[i].Score = counter.count(rows[i].Text)
		}
		sortPhraseRows(rows)
		lists = append(lists, hitList{source: srcPhrase, rows: rows})
		exactTotal = int64(len(rows))
		if mode == searchModeExact {
			return lists, exactTotal, nil
		}
	}

	if len(q.Groups) > 0 {
		var conds []string
		var args []interface{}
		for _, g := range q.Groups {
			for _, term := range g.Terms {
				conds = append(conds, t+".text LIKE ?")
				args = append(args, "%"+term+"%")
			}
		}
		var rows []searchTranscriptRow
		if err := base.Session(&gorm.Session{}).
			Where("("+strings.Join(conds, " OR ")+")", args...).
			Order(order).Limit(searchFTSFetch).
			Scan(&rows).Error; err != nil {
			return nil, 0, err
		}
		for i := range rows {
			lower := strings.ToLower(rows[i].Text)
			matched := 0
			for _, g := range q.Groups {
				for _, term := range g.Terms {
					if strings.Contains(lower, term) {
						matched++
						break
					}
				}
			}
			rows[i].MatchedGroups = matched
			rows[i].Score = float64(matched)
		}
		sort.SliceStable(rows, func(i, j int) bool {
			if rows[i].MatchedGroups != rows[j].MatchedGroups {
				return rows[i].MatchedGroups > rows[j].MatchedGroups
			}
			if rows[i].KajianID != rows[j].KajianID {
				return rows[i].KajianID < rows[j].KajianID
			}
			return rows[i].StartSeconds < rows[j].StartSeconds
		})
		lists = append(lists, hitList{source: srcFTS, rows: rows})
	}
	return lists, exactTotal, nil
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
