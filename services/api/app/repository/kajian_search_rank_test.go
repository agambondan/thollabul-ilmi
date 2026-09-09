package repository

import (
	"testing"
)

func row(id, kajian, start int) searchTranscriptRow {
	return searchTranscriptRow{ID: id, KajianID: kajian, StartSeconds: start, EndSeconds: start + 60, Text: "t"}
}

func ftsRow(id, kajian, start, matched int) searchTranscriptRow {
	r := row(id, kajian, start)
	r.MatchedGroups = matched
	return r
}

func TestRankHybridTiersReasonsAndLabels(t *testing.T) {
	phrase := []searchTranscriptRow{row(1, 10, 0)}
	phrase[0].Score = 2
	fts := []searchTranscriptRow{
		ftsRow(2, 20, 0, 2), // all concepts
		ftsRow(3, 30, 0, 1), // partial
		ftsRow(1, 10, 0, 2), // also phrase hit
	}
	fuzzy := []searchTranscriptRow{row(4, 40, 0), row(3, 30, 0)}
	title := []searchTranscriptRow{row(5, 50, 0)} // title-only video
	lists := []hitList{{srcPhrase, phrase}, {srcFTS, fts}, {srcFuzzy, fuzzy}, {srcTitle, title}}

	page, meta := rankTranscriptHits("hybrid", lists, 2, 10, 0)
	if meta.Total != 5 || meta.KajianCount != 5 || meta.HasMore || meta.Mode != "hybrid" {
		t.Fatalf("meta = %+v", meta)
	}
	wantID := []int{1, 2, 3, 4, 5}
	wantLabel := []string{"exact", "hybrid", "semantic", "semantic", "semantic"}
	wantReason := []string{reasonPhrase, reasonAllTerms, reasonSomeTerms, reasonFuzzy, reasonTitle}
	for i, r := range page {
		if r.ID != wantID[i] || r.MatchMode != wantLabel[i] || r.MatchReason != wantReason[i] {
			t.Fatalf("row %d = id %d %s/%s; want id %d %s/%s", i, r.ID, r.MatchMode, r.MatchReason, wantID[i], wantLabel[i], wantReason[i])
		}
	}
}

func TestRankMergesTitleHitIntoBestChunk(t *testing.T) {
	// Kajian 7 has a real FTS hit at chunk 70 and a title-only row at chunk 71
	// (its opening). The title row must vanish and boost chunk 70.
	fts := []searchTranscriptRow{ftsRow(70, 7, 600, 1), ftsRow(80, 8, 0, 1)}
	title := []searchTranscriptRow{row(71, 7, 0)}
	page, meta := rankTranscriptHits("hybrid", []hitList{{srcFTS, fts}, {srcTitle, title}}, 1, 10, 0)
	if meta.Total != 2 {
		t.Fatalf("title row should be merged, total = %d", meta.Total)
	}
	if page[0].ID != 70 || page[0].MatchReason != reasonAllTerms {
		t.Fatalf("boosted chunk should lead: %+v", page)
	}
	for _, r := range page {
		if r.ID == 71 {
			t.Fatalf("title-only opening chunk leaked into results: %+v", page)
		}
	}
}

func TestRankSemanticGroupsPerKajian(t *testing.T) {
	// Kajian 1: three matching chunks. Kajian 2: one strong chunk. Kajian 3: title only.
	fts := []searchTranscriptRow{
		ftsRow(21, 2, 0, 2),   // rank 1 (all concepts)
		ftsRow(11, 1, 0, 1),   // rank 2
		ftsRow(12, 1, 60, 1),  // rank 3
		ftsRow(13, 1, 120, 1), // rank 4
	}
	title := []searchTranscriptRow{row(31, 3, 0)}
	page, meta := rankTranscriptHits("semantic", []hitList{{srcFTS, fts}, {srcTitle, title}}, 2, 10, 0)
	if meta.Total != 3 || meta.KajianCount != 3 || meta.Mode != "semantic" {
		t.Fatalf("meta = %+v", meta)
	}
	if len(page) != 3 {
		t.Fatalf("one card per kajian expected, got %d", len(page))
	}
	// Kajian 1 (three chunks) outranks kajian 2 (one chunk): sum of RRF terms.
	if page[0].KajianID != 1 || page[0].MatchCount != 3 || page[0].ID != 11 {
		t.Fatalf("kajian 1 should lead with its best chunk and match_count 3: %+v", page[0])
	}
	if page[1].KajianID != 2 || page[1].MatchCount != 1 {
		t.Fatalf("kajian 2 second: %+v", page[1])
	}
	if page[2].KajianID != 3 || page[2].MatchReason != reasonTitle || page[2].MatchCount != 0 {
		t.Fatalf("title-only kajian last with reason title: %+v", page[2])
	}
	for _, r := range page {
		if r.MatchMode != "semantic" {
			t.Fatalf("semantic mode must label every row semantic: %+v", r)
		}
	}
}

func TestRankExactOrdersByOccurrences(t *testing.T) {
	rows := []searchTranscriptRow{row(1, 1, 0), row(2, 1, 60), row(3, 2, 0)}
	rows[0].Score, rows[1].Score, rows[2].Score = 1, 3, 2
	sortPhraseRows(rows)
	page, meta := rankTranscriptHits("exact", []hitList{{srcPhrase, rows}}, 0, 10, 0)
	if page[0].ID != 2 || page[1].ID != 3 || page[2].ID != 1 {
		t.Fatalf("exact order = %+v", page)
	}
	if page[0].Score != 3 || page[0].MatchMode != "exact" || page[0].MatchReason != reasonPhrase || meta.Total != 3 {
		t.Fatalf("exact score/label/meta = %+v %+v", page[0], meta)
	}
}

func TestRankDiversifiesPerKajianWithinTier(t *testing.T) {
	// Seven phrase chunks of kajian 1, one phrase chunk of kajian 2, and one
	// weaker (tier 3) chunk of kajian 3 which must stay behind every tier-1 row.
	phrase := make([]searchTranscriptRow, 0, 8)
	for i := 0; i < 7; i++ {
		phrase = append(phrase, row(i+1, 1, i*60))
	}
	phrase = append(phrase, row(8, 2, 0))
	fts := []searchTranscriptRow{ftsRow(9, 3, 0, 1)}
	page, _ := rankTranscriptHits("hybrid", []hitList{{srcPhrase, phrase}, {srcFTS, fts}}, 2, 10, 0)
	got := make([]int, len(page))
	for i, r := range page {
		got[i] = r.KajianID
	}
	want := []int{1, 1, 1, 2, 1, 1, 1, 1, 3}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("diversified kajian order = %v, want %v", got, want)
		}
	}
}

func TestRankPaginationIsStableAndDisjoint(t *testing.T) {
	rows := make([]searchTranscriptRow, 0, 25)
	for i := 0; i < 25; i++ {
		rows = append(rows, ftsRow(i+1, i%5, i*60, 1))
	}
	lists := []hitList{{srcFTS, rows}}
	seen := map[int]bool{}
	for offset := 0; offset < 25; offset += 10 {
		page, meta := rankTranscriptHits("hybrid", lists, 1, 10, offset)
		if offset+len(page) < 25 && !meta.HasMore {
			t.Fatalf("offset %d: has_more should be true", offset)
		}
		for _, r := range page {
			if seen[r.ID] {
				t.Fatalf("id %d returned twice", r.ID)
			}
			seen[r.ID] = true
		}
	}
	if len(seen) != 25 {
		t.Fatalf("pages covered %d of 25 rows", len(seen))
	}
	empty, meta := rankTranscriptHits("hybrid", lists, 1, 10, 100)
	if len(empty) != 0 || meta.HasMore || meta.Total != 25 {
		t.Fatalf("offset past end: %+v %+v", empty, meta)
	}
}

func TestRankNewestVideoWinsTies(t *testing.T) {
	a := ftsRow(1, 1, 0, 1)
	a.PublishedAt = "2024-01-01"
	b := ftsRow(2, 2, 0, 1)
	b.PublishedAt = "2026-05-01"
	// Equal RRF rank is impossible within one list, so feed two lists with
	// symmetric ranks: a is 1st in FTS, b is 1st in fuzzy but with lower weight.
	// Use a direct sortHits check instead.
	hits := []*fusedHit{{row: a, score: 1, tier: 1}, {row: b, score: 1, tier: 1}}
	sortHits(hits)
	if hits[0].row.ID != 2 {
		t.Fatalf("newer video should win ties, got %+v", hits[0].row)
	}
}

func TestRankDedupesSoftDeletedTwins(t *testing.T) {
	rows := []searchTranscriptRow{row(1, 1, 0), row(9, 1, 0), row(2, 1, 60)}
	page, meta := rankTranscriptHits("exact", []hitList{{srcPhrase, rows}}, 0, 10, 0)
	if meta.Total != 2 || len(page) != 2 {
		t.Fatalf("expected twins collapsed, got %+v %+v", meta, page)
	}
}

func TestPhraseCounter(t *testing.T) {
	c := newPhraseCounter([]string{"hukum", "riba"})
	if n := c.count("Hukum riba itu haram. hukum  riba jelas. hukum-riba juga. hukumriba bukan"); n != 3 {
		t.Fatalf("count = %v, want 3", n)
	}
	if n := c.count("tidak ada"); n != 1 {
		t.Fatalf("selected rows never score below 1, got %v", n)
	}
	if n := newPhraseCounter(nil).count("x"); n != 1 {
		t.Fatalf("empty counter = %v", n)
	}
}

func TestNormalizeSearchMode(t *testing.T) {
	cases := map[string]string{"": "hybrid", "EXACT": "exact", " semantic ": "semantic", "nonsense": "hybrid"}
	for in, want := range cases {
		if got := normalizeSearchMode(in); got != want {
			t.Errorf("normalizeSearchMode(%q) = %q, want %q", in, got, want)
		}
	}
}
