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
	exactResults, totalExact, err := repo.SearchTranscripts("syirik", "", "exact", 10, 0)
	if err != nil {
		t.Fatalf("search exact error: %v", err)
	}
	if totalExact != 1 || len(exactResults) != 1 {
		t.Errorf("expected 1 exact result, got %d", totalExact)
	}
	if exactResults[0].Timestamp != "00:00" {
		t.Errorf("expected timestamp 00:00, got %s", exactResults[0].Timestamp)
	}

	// 2. Semantic Match test
	semanticResults, totalSemantic, err := repo.SearchTranscripts("ilmu tauhid perbuatan", "", "semantic", 10, 0)
	if err != nil {
		t.Fatalf("search semantic error: %v", err)
	}
	if totalSemantic == 0 || len(semanticResults) == 0 {
		t.Errorf("expected semantic results, got %d", totalSemantic)
	}

	// 3. Hybrid Match test
	hybridResults, totalHybrid, err := repo.SearchTranscripts("doa pertolongan", "", "hybrid", 10, 0)
	if err != nil {
		t.Fatalf("search hybrid error: %v", err)
	}
	if totalHybrid == 0 || len(hybridResults) == 0 {
		t.Errorf("expected hybrid results, got %d", totalHybrid)
	}

	// 4. Filter by Speaker
	speakerResults, _, err := repo.SearchTranscripts("tauhid", "Firanda", "hybrid", 10, 0)
	if err != nil {
		t.Fatalf("search with speaker filter error: %v", err)
	}
	if len(speakerResults) == 0 {
		t.Errorf("expected results for speaker Firanda")
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
	if len(allTranscripts) != 2 {
		t.Errorf("expected 2 transcripts for kajian %d, got %d", *k.ID, len(allTranscripts))
	}
}
