package migrations

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

type seedChunk struct {
	start, end int
	text       string
}

func kajianEntry(videoID, title string, chunks []seedChunk) string {
	body := ""
	for i, c := range chunks {
		if i > 0 {
			body += ","
		}
		body += fmt.Sprintf(`{"start_seconds":%d,"end_seconds":%d,"text":%q}`, c.start, c.end, c.text)
	}
	return fmt.Sprintf(
		`{"title":%q,"speaker":"Ustadz Uji","type":"video","url":"https://www.youtube.com/watch?v=%s","video_id":%q,"published_at":"2026-01-01","transcripts":[%s]}`,
		title, videoID, videoID, body,
	)
}

func writeKajianFiles(t *testing.T, dir string, files map[string]string) {
	t.Helper()
	kajianDir := filepath.Join(dir, "data", "static", "kajian")
	if err := os.MkdirAll(kajianDir, 0o755); err != nil {
		t.Fatalf("mkdir: %v", err)
	}
	for name, entries := range files {
		if err := os.WriteFile(filepath.Join(kajianDir, name), []byte("["+entries+"]"), 0o644); err != nil {
			t.Fatalf("write %s: %v", name, err)
		}
	}
}

func newKajianSeedDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
		Logger:         logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("sql db: %v", err)
	}
	sqlDB.SetMaxOpenConns(1)
	if err := db.AutoMigrate(&model.Kajian{}, &model.KajianTranscript{}, &model.SeedFileState{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func reseedKajian(db *gorm.DB) {
	db.Where("name = ?", "kajian").Delete(&model.SeedFileState{})
	seedKajianFromFile(db)
}

func chunkIDs(t *testing.T, db *gorm.DB) map[[3]int]int {
	t.Helper()
	var rows []model.KajianTranscript
	if err := db.Order("id").Find(&rows).Error; err != nil {
		t.Fatalf("read chunks: %v", err)
	}
	ids := make(map[[3]int]int, len(rows))
	for _, r := range rows {
		ids[[3]int{r.KajianID, r.StartSeconds, r.EndSeconds}] = *r.ID
	}
	return ids
}

func TestSeedKajianDuplicateVideoKeepsChunkIDsStable(t *testing.T) {
	dir := t.TempDir()
	writeKajianFiles(t, dir, map[string]string{
		"a_channel.json": kajianEntry("AAAAAAAAAAA", "Video kembar", []seedChunk{
			{0, 60, "satu"}, {61, 122, "dua"},
		}),
		"b_channel.json": kajianEntry("AAAAAAAAAAA", "Video kembar", []seedChunk{
			{0, 60, "satu"}, {65, 122, "dua versi lain"}, {130, 190, "tiga"},
		}) + "," + kajianEntry("BBBBBBBBBBB", "Video tunggal", []seedChunk{
			{0, 30, "solo"},
		}),
	})
	t.Chdir(dir)
	db := newKajianSeedDB(t)

	reseedKajian(db)
	first := chunkIDs(t, db)
	reseedKajian(db)
	reseedKajian(db)
	again := chunkIDs(t, db)

	if len(first) != 4 {
		t.Fatalf("expected the last entry's 3 chunks plus 1 solo chunk, got %d: %v", len(first), first)
	}
	for key, id := range first {
		if again[key] != id {
			t.Errorf("chunk %v changed id %d -> %d across re-seeds", key, id, again[key])
		}
	}
	if len(again) != len(first) {
		t.Errorf("chunk count drifted: %d -> %d", len(first), len(again))
	}

	var kajianCount int64
	db.Model(&model.Kajian{}).Count(&kajianCount)
	if kajianCount != 2 {
		t.Errorf("expected 2 kajian rows, got %d", kajianCount)
	}
}

func TestSeedKajianOnlyRewritesChangedChunks(t *testing.T) {
	dir := t.TempDir()
	original := []seedChunk{{0, 60, "satu"}, {61, 122, "dua"}, {123, 180, "tiga"}}
	writeKajianFiles(t, dir, map[string]string{
		"only.json": kajianEntry("CCCCCCCCCCC", "Video uji", original),
	})
	t.Chdir(dir)
	db := newKajianSeedDB(t)

	reseedKajian(db)
	if err := db.Exec(`CREATE TABLE chunk_update_log (id INTEGER PRIMARY KEY AUTOINCREMENT)`).Error; err != nil {
		t.Fatalf("create log: %v", err)
	}
	if err := db.Exec(`CREATE TRIGGER chunk_updated AFTER UPDATE ON kajian_transcript BEGIN INSERT INTO chunk_update_log (id) VALUES (NULL); END`).Error; err != nil {
		t.Fatalf("create trigger: %v", err)
	}
	updates := func() int64 {
		var n int64
		db.Raw(`SELECT count(*) FROM chunk_update_log`).Scan(&n)
		return n
	}

	reseedKajian(db)
	if got := updates(); got != 0 {
		t.Fatalf("re-seeding identical data rewrote %d chunks, want 0", got)
	}

	changed := append([]seedChunk{}, original...)
	changed[1].text = "dua yang diperbaiki"
	writeKajianFiles(t, dir, map[string]string{
		"only.json": kajianEntry("CCCCCCCCCCC", "Video uji", changed),
	})
	reseedKajian(db)
	if got := updates(); got != 1 {
		t.Fatalf("expected exactly the edited chunk to be rewritten, got %d updates", got)
	}

	var text string
	db.Raw(`SELECT text FROM kajian_transcript WHERE start_seconds = 61`).Scan(&text)
	if text != "dua yang diperbaiki" {
		t.Fatalf("edited chunk text = %q", text)
	}
}
