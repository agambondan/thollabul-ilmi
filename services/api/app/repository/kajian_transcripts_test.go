package repository

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
)

func TestGetTranscriptsByKajianIDSkipsSoftDeletedChunks(t *testing.T) {
	db := newKajianTestDB(t)
	repo := NewKajianRepository(db, nil)

	kajianID := 1
	kajian := &model.Kajian{
		BaseID:  model.BaseID{ID: &kajianID},
		Title:   "Kajian uji",
		Speaker: "Ustadz Uji",
		Type:    "video",
		URL:     "https://youtube.com/watch?v=uji_transkrip",
	}
	if err := db.Create(kajian).Error; err != nil {
		t.Fatalf("create kajian: %v", err)
	}

	live := []model.KajianTranscript{
		{KajianID: 1, VideoID: "uji_transkrip", StartSeconds: 61, EndSeconds: 120, Text: "kedua"},
		{KajianID: 1, VideoID: "uji_transkrip", StartSeconds: 0, EndSeconds: 60, Text: "pertama"},
	}
	for i := range live {
		if err := db.Create(&live[i]).Error; err != nil {
			t.Fatalf("create live chunk: %v", err)
		}
	}
	orphan := model.KajianTranscript{KajianID: 999, VideoID: "uji_transkrip", StartSeconds: 0, EndSeconds: 60, Text: "pertama"}
	if err := db.Create(&orphan).Error; err != nil {
		t.Fatalf("create orphan chunk: %v", err)
	}
	if err := db.Delete(&orphan).Error; err != nil {
		t.Fatalf("soft delete orphan chunk: %v", err)
	}
	sameKajianTombstone := model.KajianTranscript{KajianID: 1, VideoID: "uji_transkrip", StartSeconds: 200, EndSeconds: 260, Text: "usang"}
	if err := db.Create(&sameKajianTombstone).Error; err != nil {
		t.Fatalf("create tombstone: %v", err)
	}
	if err := db.Delete(&sameKajianTombstone).Error; err != nil {
		t.Fatalf("soft delete tombstone: %v", err)
	}

	got, err := repo.GetTranscriptsByKajianID(1)
	if err != nil {
		t.Fatalf("GetTranscriptsByKajianID: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("expected the 2 live chunks, got %d: %+v", len(got), got)
	}
	if got[0].Text != "pertama" || got[1].Text != "kedua" {
		t.Fatalf("chunks not ordered by start_seconds: %q, %q", got[0].Text, got[1].Text)
	}
	for _, chunk := range got {
		if chunk.DeletedAt.Valid {
			t.Fatalf("soft-deleted chunk leaked into the response: %+v", chunk)
		}
	}
}
