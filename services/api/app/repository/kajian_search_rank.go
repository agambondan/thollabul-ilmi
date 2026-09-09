package repository

import (
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/agambondan/islamic-explorer/app/model"
)

// Search modes accepted by SearchTranscripts. Unknown values fall back to
// hybrid so an old client never gets an error for a typo in ?mode=.
const (
	searchModeHybrid   = "hybrid"
	searchModeExact    = "exact"
	searchModeSemantic = "semantic"
)

// Match reasons exposed per result as match_reason so clients can explain why
// a card is there instead of echoing the search mode.
const (
	reasonPhrase    = "phrase"     // whole query appears verbatim
	reasonAllTerms  = "all_terms"  // every concept present (stemmed/variants)
	reasonSomeTerms = "some_terms" // a subset of the concepts present
	reasonFuzzy     = "fuzzy"      // trigram-similar spelling only
	reasonTitle     = "title"      // only the kajian title/topic/description matched
)

func normalizeSearchMode(mode string) string {
	switch strings.ToLower(strings.TrimSpace(mode)) {
	case searchModeExact:
		return searchModeExact
	case searchModeSemantic:
		return searchModeSemantic
	default:
		return searchModeHybrid
	}
}

// hitSource identifies which candidate list a transcript row came from.
type hitSource int

const (
	// srcPhrase: the whole query appears verbatim (whole-word, case-insensitive).
	srcPhrase hitSource = iota
	// srcFTS: Postgres full-text match with Indonesian stemming + variants.
	srcFTS
	// srcFuzzy: pg_trgm word_similarity neighbours (typo tolerance).
	srcFuzzy
	// srcTitle: the kajian's title/topic/description matches every concept;
	// one row (the earliest chunk) represents the whole video.
	srcTitle
)

// hitList is one ranked candidate list. Row order is the list's own ranking
// (best first) and drives the reciprocal-rank contribution.
type hitList struct {
	source hitSource
	rows   []searchTranscriptRow
}

const (
	// rrfK is the standard reciprocal-rank-fusion damping constant.
	rrfK = 60.0
	// diversifyPerKajian caps how many chunks of one video appear before
	// every other video with hits has had a turn.
	diversifyPerKajian = 3
	// titleTopicBonus is added to a video's topical score (semantic mode)
	// when its title/topic/description matches every concept AND it has
	// matching chunks — worth about three well-ranked chunks.
	titleTopicBonus = 0.05
)

// sourceWeights scale each list's RRF contribution. Literal evidence (phrase,
// stemmed FTS) outweighs trigram-fuzzy neighbours and video-level title hits.
var sourceWeights = map[hitSource]float64{
	srcPhrase: 1.0,
	srcFTS:    1.0,
	srcFuzzy:  0.5,
	srcTitle:  0.5,
}

type fusedHit struct {
	row        searchTranscriptRow
	score      float64
	tier       int
	matched    int
	phraseHits float64
	sources    map[hitSource]bool
	reason     string
	// matchCount is filled in semantic mode: matching chunks in the video.
	matchCount int
}

func (h *fusedHit) titleOnly() bool {
	return len(h.sources) == 1 && h.sources[srcTitle]
}

// rankTranscriptHits fuses the candidate lists for one search into a single
// ranked, diversified, paginated result. It is pure Go so it can be unit
// tested without a database.
//
//   - exact: phrase hits only, most occurrences first.
//   - hybrid: tier 1 = phrase hit, tier 2 = every concept matched via FTS,
//     tier 3 = anything else (single concept, fuzzy or title only). Within a
//     tier rows are ordered by weighted RRF score.
//   - semantic ("tema"): one result per kajian, ranked by how much the video
//     is about the topic (sum of its chunk scores + a title/topic bonus),
//     represented by its best chunk.
//
// After ranking (exact/hybrid), rows are interleaved so at most
// diversifyPerKajian chunks of one kajian appear before other kajian get a
// turn (within the same tier).
func rankTranscriptHits(mode string, lists []hitList, totalGroups, limit, offset int) ([]model.SearchTranscriptResult, model.SearchTranscriptMeta) {
	mode = normalizeSearchMode(mode)
	hits := fuseHits(lists)
	hits = mergeTitleHits(hits)
	for _, h := range hits {
		h.reason = matchReason(h, totalGroups)
		h.tier = matchTier(mode, h)
		if mode == searchModeExact {
			h.score = h.phraseHits
		}
	}
	if mode == searchModeSemantic {
		return rankByKajian(hits, limit, offset)
	}

	sortHits(hits)
	slots := diversify(hits)

	perKajian := map[int]struct{}{}
	for _, h := range hits {
		perKajian[h.row.KajianID] = struct{}{}
	}
	meta := model.SearchTranscriptMeta{
		Mode:          mode,
		Total:         int64(len(slots)),
		KajianCount:   len(perKajian),
		ExpandedTerms: []string{},
	}
	start, end := pageBounds(len(slots), limit, offset)
	meta.HasMore = end < len(slots)
	page := make([]model.SearchTranscriptResult, 0, end-start)
	for _, h := range slots[start:end] {
		page = append(page, toSearchResult(h, matchLabel(mode, h.tier)))
	}
	return page, meta
}

// fuseHits merges the lists with weighted reciprocal-rank fusion, collapsing
// rows that describe the same chunk (same kajian/start/end under two IDs —
// a soft-deleted twin) into one hit.
func fuseHits(lists []hitList) []*fusedHit {
	byID := make(map[int]*fusedHit)
	byChunk := make(map[string]int)
	order := make([]*fusedHit, 0)
	for _, list := range lists {
		weight := sourceWeights[list.source]
		for i, row := range list.rows {
			id := row.ID
			if canonical, ok := byChunk[chunkIdentity(row)]; ok {
				id = canonical
			} else {
				byChunk[chunkIdentity(row)] = id
			}
			hit, ok := byID[id]
			if !ok {
				cp := row
				hit = &fusedHit{row: cp, sources: map[hitSource]bool{}}
				byID[id] = hit
				order = append(order, hit)
			}
			if hit.sources[list.source] {
				continue
			}
			hit.sources[list.source] = true
			hit.score += weight / (rrfK + float64(i+1))
			switch list.source {
			case srcPhrase:
				hit.phraseHits = row.Score
			case srcFTS:
				if row.MatchedGroups > hit.matched {
					hit.matched = row.MatchedGroups
				}
			}
		}
	}
	return order
}

// mergeTitleHits folds a title-only hit (the video's opening chunk) into the
// video's best real chunk when it has one, so a matching title boosts the
// relevant moment instead of adding an unrelated "Assalamualaikum" card.
// Videos with no other hit keep the title row (reason = title).
func mergeTitleHits(hits []*fusedHit) []*fusedHit {
	best := map[int]*fusedHit{}
	for _, h := range hits {
		if h.titleOnly() {
			continue
		}
		if cur, ok := best[h.row.KajianID]; !ok || h.score > cur.score {
			best[h.row.KajianID] = h
		}
	}
	out := make([]*fusedHit, 0, len(hits))
	for _, h := range hits {
		if h.titleOnly() {
			if target, ok := best[h.row.KajianID]; ok {
				target.score += h.score
				target.sources[srcTitle] = true
				continue
			}
		}
		out = append(out, h)
	}
	return out
}

func matchReason(h *fusedHit, totalGroups int) string {
	switch {
	case h.sources[srcPhrase]:
		return reasonPhrase
	case h.sources[srcFTS] && totalGroups > 0 && h.matched >= totalGroups:
		return reasonAllTerms
	case h.sources[srcFTS]:
		return reasonSomeTerms
	case h.sources[srcFuzzy]:
		return reasonFuzzy
	default:
		return reasonTitle
	}
}

func matchTier(mode string, h *fusedHit) int {
	switch mode {
	case searchModeExact:
		return 1
	default:
		switch h.reason {
		case reasonPhrase:
			return 1
		case reasonAllTerms:
			return 2
		default:
			return 3
		}
	}
}

// sortHits orders by tier, then score, then newest video, then position,
// then id so the order is fully deterministic between requests.
func sortHits(hits []*fusedHit) {
	sort.SliceStable(hits, func(i, j int) bool {
		a, b := hits[i], hits[j]
		if a.tier != b.tier {
			return a.tier < b.tier
		}
		if a.score != b.score {
			return a.score > b.score
		}
		if a.row.PublishedAt != b.row.PublishedAt {
			return a.row.PublishedAt > b.row.PublishedAt
		}
		if a.row.KajianID != b.row.KajianID {
			return a.row.KajianID < b.row.KajianID
		}
		if a.row.StartSeconds != b.row.StartSeconds {
			return a.row.StartSeconds < b.row.StartSeconds
		}
		return a.row.ID < b.row.ID
	})
}

// diversify interleaves already-sorted hits so the k-th chunk of a kajian
// moves to round k/diversifyPerKajian, within its tier.
func diversify(hits []*fusedHit) []*fusedHit {
	type slot struct {
		hit   *fusedHit
		round int
		idx   int
	}
	slots := make([]slot, len(hits))
	perKajian := make(map[int]int)
	for i, h := range hits {
		seen := perKajian[h.row.KajianID]
		perKajian[h.row.KajianID] = seen + 1
		slots[i] = slot{hit: h, round: seen / diversifyPerKajian, idx: i}
	}
	sort.SliceStable(slots, func(i, j int) bool {
		a, b := slots[i], slots[j]
		if a.hit.tier != b.hit.tier {
			return a.hit.tier < b.hit.tier
		}
		if a.round != b.round {
			return a.round < b.round
		}
		return a.idx < b.idx
	})
	out := make([]*fusedHit, len(slots))
	for i, s := range slots {
		out[i] = s.hit
	}
	return out
}

// rankByKajian implements semantic ("tema") mode: group hits per video, score
// the video by the sum of its chunk scores plus a title/topic bonus, and
// return its best chunk as the representative.
func rankByKajian(hits []*fusedHit, limit, offset int) ([]model.SearchTranscriptResult, model.SearchTranscriptMeta) {
	type video struct {
		score float64
		best  *fusedHit
		count int
	}
	videos := map[int]*video{}
	orderIDs := []int{}
	for _, h := range hits {
		v, ok := videos[h.row.KajianID]
		if !ok {
			v = &video{}
			videos[h.row.KajianID] = v
			orderIDs = append(orderIDs, h.row.KajianID)
		}
		v.score += h.score
		v.count++
		if h.sources[srcTitle] && !h.titleOnly() {
			// Title/topic AND content match: strong topical signal.
			v.score += titleTopicBonus
		}
		if h.reason == reasonTitle {
			// Title-only: keep just the small title RRF term so videos that
			// actually discuss the topic rank first.
			v.count--
		}
		if v.best == nil || betterRepresentative(h, v.best) {
			v.best = h
		}
	}
	ranked := make([]*fusedHit, 0, len(videos))
	for _, id := range orderIDs {
		v := videos[id]
		v.best.matchCount = v.count
		v.best.score = v.score
		ranked = append(ranked, v.best)
	}
	sort.SliceStable(ranked, func(i, j int) bool {
		a, b := ranked[i], ranked[j]
		if a.score != b.score {
			return a.score > b.score
		}
		if a.row.PublishedAt != b.row.PublishedAt {
			return a.row.PublishedAt > b.row.PublishedAt
		}
		return a.row.KajianID < b.row.KajianID
	})

	meta := model.SearchTranscriptMeta{
		Mode:          searchModeSemantic,
		Total:         int64(len(ranked)),
		KajianCount:   len(ranked),
		ExpandedTerms: []string{},
	}
	start, end := pageBounds(len(ranked), limit, offset)
	meta.HasMore = end < len(ranked)
	page := make([]model.SearchTranscriptResult, 0, end-start)
	for _, h := range ranked[start:end] {
		page = append(page, toSearchResult(h, "semantic"))
	}
	return page, meta
}

// betterRepresentative prefers a real matching moment over a title row, then
// the stronger tier/score, then the earlier moment.
func betterRepresentative(a, b *fusedHit) bool {
	if (a.reason == reasonTitle) != (b.reason == reasonTitle) {
		return b.reason == reasonTitle
	}
	if a.tier != b.tier {
		return a.tier < b.tier
	}
	if a.score != b.score {
		return a.score > b.score
	}
	return a.row.StartSeconds < b.row.StartSeconds
}

func pageBounds(n, limit, offset int) (int, int) {
	if offset >= n {
		return n, n
	}
	end := offset + limit
	if end > n {
		end = n
	}
	return offset, end
}

func chunkIdentity(row searchTranscriptRow) string {
	return strconv.Itoa(row.KajianID) + "-" + strconv.Itoa(row.StartSeconds) + "-" + strconv.Itoa(row.EndSeconds)
}

// matchLabel is the legacy match_mode badge value.
func matchLabel(mode string, tier int) string {
	switch mode {
	case searchModeExact:
		return "exact"
	case searchModeSemantic:
		return "semantic"
	default:
		switch tier {
		case 1:
			return "exact"
		case 2:
			return "hybrid"
		default:
			return "semantic"
		}
	}
}

func toSearchResult(h *fusedHit, label string) model.SearchTranscriptResult {
	row := h.row
	return model.SearchTranscriptResult{
		ID:           row.ID,
		KajianID:     row.KajianID,
		VideoID:      row.VideoID,
		Title:        row.Title,
		Speaker:      row.Speaker,
		Topic:        row.Topic,
		Description:  row.Description,
		StartSeconds: row.StartSeconds,
		EndSeconds:   row.EndSeconds,
		Timestamp:    formatTimestamp(row.StartSeconds),
		Snippet:      row.Text,
		TimestampURL: row.TimestampURL,
		ThumbnailURL: row.ThumbnailURL,
		Score:        h.score,
		MatchMode:    label,
		MatchReason:  h.reason,
		MatchCount:   h.matchCount,
	}
}

// phraseCounter counts whole-word, case-insensitive occurrences of the query
// phrase in a text. Whitespace or hyphens between words are accepted,
// matching the Postgres regex used to select the rows.
type phraseCounter struct{ re *regexp.Regexp }

func newPhraseCounter(words []string) phraseCounter {
	if len(words) == 0 {
		return phraseCounter{}
	}
	parts := make([]string, len(words))
	for i, w := range words {
		parts[i] = regexp.QuoteMeta(w)
	}
	re, err := regexp.Compile(`(?i)\b` + strings.Join(parts, `[\s-]+`) + `\b`)
	if err != nil {
		return phraseCounter{}
	}
	return phraseCounter{re: re}
}

// count returns the number of occurrences, never less than 1 for a row the
// database already selected (Go's \b and Postgres' \m can disagree on
// punctuation edges).
func (p phraseCounter) count(text string) float64 {
	if p.re == nil {
		return 1
	}
	n := len(p.re.FindAllStringIndex(text, -1))
	if n < 1 {
		n = 1
	}
	return float64(n)
}

// sortPhraseRows orders phrase hits by occurrence count, then newest video,
// then position, so the phrase list's RRF rank reflects how strongly a chunk
// is about the query.
func sortPhraseRows(rows []searchTranscriptRow) {
	sort.SliceStable(rows, func(i, j int) bool {
		if rows[i].Score != rows[j].Score {
			return rows[i].Score > rows[j].Score
		}
		if rows[i].PublishedAt != rows[j].PublishedAt {
			return rows[i].PublishedAt > rows[j].PublishedAt
		}
		if rows[i].KajianID != rows[j].KajianID {
			return rows[i].KajianID < rows[j].KajianID
		}
		if rows[i].StartSeconds != rows[j].StartSeconds {
			return rows[i].StartSeconds < rows[j].StartSeconds
		}
		return rows[i].ID < rows[j].ID
	})
}

// splitSpeakers parses the "A||B" multi-speaker filter into trimmed parts.
func splitSpeakers(speaker string) []string {
	if strings.TrimSpace(speaker) == "" {
		return nil
	}
	parts := strings.Split(speaker, "||")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
