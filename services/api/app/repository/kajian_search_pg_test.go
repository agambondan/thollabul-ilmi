package repository

import (
	"os"
	"strings"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib/textsearch"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// TestKajianSearchPostgres exercises the real Postgres path (Indonesian FTS,
// regex phrase, pg_trgm fuzzy). It is skipped unless KAJIAN_SEARCH_PG_DSN
// points at a database that already holds seeded kajian transcripts, e.g.
//
//	KAJIAN_SEARCH_PG_DSN="host=localhost port=54320 user=postgres password=postgres dbname=thullabul_ilmi sslmode=disable" \
//	  go test ./app/repository/ -run TestKajianSearchPostgres -v
func TestKajianSearchPostgres(t *testing.T) {
	dsn := os.Getenv("KAJIAN_SEARCH_PG_DSN")
	if dsn == "" {
		t.Skip("KAJIAN_SEARCH_PG_DSN not set")
	}
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
		Logger:         logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}
	var chunks int64
	db.Raw("SELECT count(*) FROM kajian_transcript WHERE deleted_at IS NULL").Scan(&chunks)
	if chunks == 0 {
		t.Skip("kajian_transcript is empty; seed it first")
	}

	// 1. Every curated variant group must stem to lexemes that also appear
	//    when the surface form is indexed, otherwise the group is dead weight.
	for _, term := range textsearch.Parse("sholat hadits ustadz dzikir wudhu aqidah taubat sunnah ramadhan riba nikah").HighlightTerms() {
		var hits bool
		db.Raw("SELECT to_tsvector('indonesian', ?) @@ to_tsquery('indonesian', ?)", "kata "+term+" kata", term).Scan(&hits)
		if !hits {
			t.Errorf("variant %q does not match itself after stemming", term)
		}
	}

	repo := NewKajianRepository(db, nil)

	// 2. Exact mode is literal: "sholat" is not how the captions spell it.
	exact, exactMeta, err := repo.SearchTranscripts("sholat", "", "exact", 20, 0)
	if err != nil {
		t.Fatalf("exact: %v", err)
	}
	variant, variantMeta, err := repo.SearchTranscripts("sholat", "", "hybrid", 20, 0)
	if err != nil {
		t.Fatalf("hybrid: %v", err)
	}
	if len(variant) == 0 || variantMeta.Total <= exactMeta.Total {
		t.Fatalf("variant expansion should find more than exact (%d vs %d)", variantMeta.Total, exactMeta.Total)
	}
	_ = exact

	// 3. Phrase hits lead in hybrid mode and the snippet shows the phrase.
	hybrid, _, err := repo.SearchTranscripts("riba", "", "hybrid", 20, 0)
	if err != nil {
		t.Fatalf("hybrid riba: %v", err)
	}
	if len(hybrid) == 0 || hybrid[0].MatchReason != reasonPhrase {
		t.Fatalf("expected phrase hits first, got %+v", hybrid[:min(len(hybrid), 1)])
	}
	if !strings.Contains(strings.ToLower(hybrid[0].Snippet), "riba") {
		t.Fatalf("snippet should be windowed around the hit: %q", hybrid[0].Snippet)
	}

	// 4. Semantic mode returns one card per kajian.
	sem, semMeta, err := repo.SearchTranscripts("riba", "", "semantic", 50, 0)
	if err != nil {
		t.Fatalf("semantic: %v", err)
	}
	seen := map[int]bool{}
	for _, r := range sem {
		if seen[r.KajianID] {
			t.Fatalf("kajian %d appears twice in semantic mode", r.KajianID)
		}
		seen[r.KajianID] = true
	}
	if int64(semMeta.KajianCount) != semMeta.Total {
		t.Fatalf("semantic meta should count kajian: %+v", semMeta)
	}

	// 5. Pagination is disjoint and deterministic.
	p1, m1, _ := repo.SearchTranscripts("tauhid", "", "hybrid", 10, 0)
	p2, _, _ := repo.SearchTranscripts("tauhid", "", "hybrid", 10, 10)
	p1again, _, _ := repo.SearchTranscripts("tauhid", "", "hybrid", 10, 0)
	if !m1.HasMore || len(p1) != 10 || len(p2) == 0 {
		t.Fatalf("pagination meta: %+v", m1)
	}
	for i := range p1 {
		if p1[i].ID != p1again[i].ID {
			t.Fatalf("page 1 is not deterministic at %d: %d vs %d", i, p1[i].ID, p1again[i].ID)
		}
		for _, r := range p2 {
			if r.ID == p1[i].ID {
				t.Fatalf("id %d on both pages", r.ID)
			}
		}
	}
}
