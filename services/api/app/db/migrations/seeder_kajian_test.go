package migrations

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func TestSeedKajianFromFileIntegration(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
		Logger:         logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&model.Kajian{}, &model.KajianTranscript{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	seedKajianFromFile(db)

	var count int64
	db.Model(&model.Kajian{}).Count(&count)
	t.Logf("Total seeded kajian: %d", count)
	if count == 0 {
		t.Errorf("expected kajian to be seeded, got 0")
	}

	var transcriptCount int64
	db.Model(&model.KajianTranscript{}).Count(&transcriptCount)
	t.Logf("Total seeded transcripts: %d", transcriptCount)
	if transcriptCount == 0 {
		t.Errorf("expected transcripts to be seeded, got 0")
	}
}
