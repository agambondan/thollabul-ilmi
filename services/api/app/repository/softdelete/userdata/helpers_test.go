package userdata

import (
	"sort"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func create(t *testing.T, db *gorm.DB, value interface{}) {
	t.Helper()
	if err := db.Create(value).Error; err != nil {
		t.Fatalf("seed %T: %v", value, err)
	}
}

func seedUser(t *testing.T, db *gorm.DB, name string) *model.User {
	t.Helper()
	user := &model.User{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		Name:     testdb.Str(name),
		Email:    testdb.Str(name + "@example.test"),
		Password: testdb.Str("secret"),
	}
	create(t, db, user)
	return user
}

func seedKajian(t *testing.T, db *gorm.DB, title string) *model.Kajian {
	t.Helper()
	kajian := &model.Kajian{
		Title:        title,
		Speaker:      "Ustadz " + title,
		Topic:        "topic " + title,
		URL:          "https://example.test/" + title,
		VideoID:      "vid-" + title,
		ThumbnailURL: "https://example.test/thumb/" + title,
	}
	create(t, db, kajian)
	return kajian
}

func seedChunk(t *testing.T, db *gorm.DB, kajianID int, start int) *model.KajianTranscript {
	t.Helper()
	chunk := &model.KajianTranscript{
		KajianID:     kajianID,
		VideoID:      "chunk-video",
		StartSeconds: start,
		EndSeconds:   start + 30,
		Text:         "transcript text",
		TimestampURL: "https://example.test/t",
	}
	create(t, db, chunk)
	return chunk
}

func sortedInts(values []int) []int {
	out := append([]int(nil), values...)
	sort.Ints(out)
	return out
}

func equalInts(got, want []int) bool {
	got = sortedInts(got)
	want = sortedInts(want)
	if len(got) != len(want) {
		return false
	}
	for i := range got {
		if got[i] != want[i] {
			return false
		}
	}
	return true
}

func sortedStrings(values []string) []string {
	out := append([]string(nil), values...)
	sort.Strings(out)
	return out
}

func equalStrings(got, want []string) bool {
	got = sortedStrings(got)
	want = sortedStrings(want)
	if len(got) != len(want) {
		return false
	}
	for i := range got {
		if got[i] != want[i] {
			return false
		}
	}
	return true
}
