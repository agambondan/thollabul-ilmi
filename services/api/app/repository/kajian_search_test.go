package repository

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func newKajianTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
		Logger:         logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Kajian{}, &model.KajianTranscript{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func TestKajianSearchTranscriptsExactAndSemantic(t *testing.T) {
	db := newKajianTestDB(t)
	repo := NewKajianRepository(db, nil)

	// Seed dummy kajian & transcript
	kajianID := 1
	k := &model.Kajian{
		BaseID:   model.BaseID{ID: &kajianID},
		Title:    "Silsilah Tauhid",
		Speaker:  "Ust. Dr. Firanda Andirja, Lc., M.A.",
		Topic:    "Akidah, Tauhid",
		Type:     "video",
		URL:      "https://youtube.com/watch?v=firanda_01",
		Duration: 3600,
	}
	if err := db.Create(k).Error; err != nil {
		t.Fatalf("create kajian: %v", err)
	}

	chunks := []model.KajianTranscript{
		{
			KajianID:     1,
			VideoID:      "firanda_01",
			StartSeconds: 0,
			EndSeconds:   60,
			Text:         "Pentingnya mempelajari ilmu tauhid agar terhindar dari perbuatan syirik.",
			TimestampURL: "https://youtu.be/firanda_01?t=0",
		},
		{
			KajianID:     1,
			VideoID:      "firanda_01",
			StartSeconds: 61,
			EndSeconds:   120,
			Text:         "Doa dan memohon pertolongan hanya kepada Allah azza wa jalla.",
			TimestampURL: "https://youtu.be/firanda_01?t=61",
		},
	}
	for _, c := range chunks {
		if err := db.Create(&c).Error; err != nil {
			t.Fatalf("create transcript chunk: %v", err)
		}
	}

	// 1. Exact Match test
	exactResults, exactMeta, err := repo.SearchTranscripts("syirik", "", "exact", 10, 0)
	if err != nil {
		t.Fatalf("search exact error: %v", err)
	}
	if exactMeta.Total != 1 || len(exactResults) != 1 {
		t.Errorf("expected 1 exact result, got %d", exactMeta.Total)
	}
	if exactResults[0].Timestamp != "00:00" {
		t.Errorf("expected timestamp 00:00, got %s", exactResults[0].Timestamp)
	}

	// 2. Semantic Match test
	semanticResults, semanticMeta, err := repo.SearchTranscripts("ilmu tauhid perbuatan", "", "semantic", 10, 0)
	if err != nil {
		t.Fatalf("search semantic error: %v", err)
	}
	if semanticMeta.Total == 0 || len(semanticResults) == 0 {
		t.Errorf("expected semantic results, got %d", semanticMeta.Total)
	}

	// 3. Hybrid Match test
	hybridResults, hybridMeta, err := repo.SearchTranscripts("doa pertolongan", "", "hybrid", 10, 0)
	if err != nil {
		t.Fatalf("search hybrid error: %v", err)
	}
	if hybridMeta.Total == 0 || len(hybridResults) == 0 {
		t.Errorf("expected hybrid results, got %d", hybridMeta.Total)
	}

	// 4. Filter by Speaker
	speakerResults, _, err := repo.SearchTranscripts("tauhid", "Firanda", "hybrid", 10, 0)
	if err != nil {
		t.Fatalf("search with speaker filter error: %v", err)
	}
	if len(speakerResults) == 0 {
		t.Errorf("expected results for speaker Firanda")
	}

	// 4b. Filter by multiple speakers (OR match via "||" delimiter)
	secondKajianID := 2
	k2 := &model.Kajian{
		BaseID:   model.BaseID{ID: &secondKajianID},
		Title:    "Kitab Tauhid",
		Speaker:  "Ust. Khalid Basalamah",
		Topic:    "Akidah",
		Type:     "video",
		URL:      "https://youtube.com/watch?v=khalid_01",
		Duration: 1800,
	}
	if err := db.Create(k2).Error; err != nil {
		t.Fatalf("create second kajian: %v", err)
	}
	if err := db.Create(&model.KajianTranscript{
		KajianID:     2,
		VideoID:      "khalid_01",
		StartSeconds: 0,
		EndSeconds:   60,
		Text:         "Penjelasan kitab tauhid karya Syaikh Muhammad bin Abdul Wahhab.",
		TimestampURL: "https://youtu.be/khalid_01?t=0",
	}).Error; err != nil {
		t.Fatalf("create second kajian transcript: %v", err)
	}

	multiSpeakerResults, multiMeta, err := repo.SearchTranscripts("tauhid", "Firanda||Khalid", "hybrid", 10, 0)
	if err != nil {
		t.Fatalf("search with multi-speaker filter error: %v", err)
	}
	if multiMeta.Total < 2 || len(multiSpeakerResults) < 2 {
		t.Errorf("expected results from both speakers, got %d", multiMeta.Total)
	}
	speakersSeen := map[string]bool{}
	for _, r := range multiSpeakerResults {
		speakersSeen[r.Speaker] = true
	}
	if !speakersSeen[k.Speaker] || !speakersSeen[k2.Speaker] {
		t.Errorf("expected results from both %q and %q, got speakers %v", k.Speaker, k2.Speaker, speakersSeen)
	}

	// 4c. Spelling variant: "sholat" is never in the captions ("salat" is),
	// so exact mode misses while semantic/hybrid hit through the variant group.
	if err := db.Create(&model.KajianTranscript{
		KajianID:     1,
		VideoID:      "firanda_01",
		StartSeconds: 121,
		EndSeconds:   180,
		Text:         "Kewajiban salat lima waktu bagi setiap muslim yang sudah baligh.",
		TimestampURL: "https://youtu.be/firanda_01?t=121",
	}).Error; err != nil {
		t.Fatalf("create salat chunk: %v", err)
	}
	exactMiss, exactMissMeta, err := repo.SearchTranscripts("sholat", "", "exact", 10, 0)
	if err != nil {
		t.Fatalf("exact sholat: %v", err)
	}
	if len(exactMiss) != 0 || exactMissMeta.Total != 0 {
		t.Errorf("exact mode must not expand spelling variants, got %d", len(exactMiss))
	}
	variantHits, variantMeta, err := repo.SearchTranscripts("sholat", "", "semantic", 10, 0)
	if err != nil {
		t.Fatalf("semantic sholat: %v", err)
	}
	if len(variantHits) != 1 || variantHits[0].StartSeconds != 121 {
		t.Fatalf("expected the salat chunk via variant expansion, got %+v", variantHits)
	}
	if variantMeta.KajianCount != 1 || variantMeta.HasMore {
		t.Errorf("meta = %+v", variantMeta)
	}
	if len(variantMeta.ExpandedTerms) == 0 {
		t.Errorf("expanded_terms should list the variants, got %v", variantMeta.ExpandedTerms)
	}

	// 4d. Pagination reports has_more and pages are disjoint.
	page1, meta1, err := repo.SearchTranscripts("tauhid", "", "hybrid", 1, 0)
	if err != nil {
		t.Fatalf("page1: %v", err)
	}
	page2, _, err := repo.SearchTranscripts("tauhid", "", "hybrid", 1, 1)
	if err != nil {
		t.Fatalf("page2: %v", err)
	}
	if len(page1) != 1 || !meta1.HasMore || len(page2) != 1 || page1[0].ID == page2[0].ID {
		t.Errorf("pagination broken: page1=%+v meta1=%+v page2=%+v", page1, meta1, page2)
	}

	// 5. GetSpeakers
	speakers, err := repo.GetSpeakers()
	if err != nil {
		t.Fatalf("get speakers error: %v", err)
	}
	if len(speakers) == 0 || speakers[0] != k.Speaker {
		t.Errorf("expected speaker %s, got %v", k.Speaker, speakers)
	}

	// 6. GetTranscriptsByKajianID
	allTranscripts, err := repo.GetTranscriptsByKajianID(*k.ID)
	if err != nil {
		t.Fatalf("get transcripts by kajian id error: %v", err)
	}
	if len(allTranscripts) != 3 {
		t.Errorf("expected 3 transcripts for kajian %d (2 seeded + 1 salat chunk), got %d", *k.ID, len(allTranscripts))
	}
}
