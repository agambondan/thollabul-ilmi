package migrations

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func derefInt(p *int) int {
	if p == nil {
		return 0
	}
	return *p
}

type rawKajianSeed struct {
	Title           string               `json:"title"`
	Speaker         string               `json:"speaker"`
	Topic           string               `json:"topic"`
	Type            string               `json:"type"`
	URL             string               `json:"url"`
	VideoID         string               `json:"video_id"`
	DurationSeconds int                  `json:"duration_seconds"`
	ThumbnailURL    string               `json:"thumbnail_url"`
	PublishedAt     string               `json:"published_at"`
	Transcripts     []rawTranscriptChunk `json:"transcripts"`
}

type rawTranscriptChunk struct {
	StartSeconds int    `json:"start_seconds"`
	EndSeconds   int    `json:"end_seconds"`
	Text         string `json:"text"`
}

// SeedKajianTranscriptsFromFile loads seed transcripts from data/static/kajian_transcripts/*.json
func SeedKajianTranscriptsFromFile(db *gorm.DB) {
	paths := []string{
		"data/static/kajian_transcripts/scraped_kajian.json",
	}

	for _, path := range paths {
		f, err := os.Open(path)
		if err != nil {
			continue
		}

		var items []rawKajianSeed
		if err := json.NewDecoder(f).Decode(&items); err != nil {
			f.Close()
			continue
		}
		f.Close()

		if len(items) == 0 {
			continue
		}

		log.Printf("[seeder] Seeding %d kajian with transcripts from %s", len(items), path)

		for _, item := range items {
			published := item.PublishedAt
			if published == "" {
				published = "2024-01-01"
			}

			k := model.Kajian{
				Title:        item.Title,
				Speaker:      item.Speaker,
				Topic:        item.Topic,
				Type:         model.KajianType(item.Type),
				URL:          item.URL,
				Duration:     item.DurationSeconds,
				ThumbnailURL: item.ThumbnailURL,
				PublishedAt:  published,
			}

			// Upsert Kajian
			err := db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "title"}, {Name: "speaker"}, {Name: "published_at"}},
				DoUpdates: clause.AssignmentColumns([]string{"topic", "url", "duration", "thumbnail_url"}),
			}).Create(&k).Error
			if err != nil {
				continue
			}

			// Find actual ID
			var dbKajian model.Kajian
			if err := db.Where("title = ? AND speaker = ?", item.Title, item.Speaker).First(&dbKajian).Error; err != nil {
				continue
			}

			// Seed transcript chunks
			for _, chunk := range item.Transcripts {
				tsURL := fmt.Sprintf("https://youtu.be/%s?t=%d", item.VideoID, chunk.StartSeconds)
				if item.VideoID == "" {
					tsURL = k.URL
				}

				if dbKajian.ID == nil {
					continue
				}
				kajianID := *dbKajian.ID

				t := model.KajianTranscript{
					KajianID:     kajianID,
					VideoID:      item.VideoID,
					StartSeconds: chunk.StartSeconds,
					EndSeconds:   chunk.EndSeconds,
					Text:         chunk.Text,
					TimestampURL: tsURL,
				}

				var count int64
				db.Model(&model.KajianTranscript{}).
					Where("kajian_id = ? AND start_seconds = ?", kajianID, chunk.StartSeconds).
					Count(&count)
				if count == 0 {
					_ = db.Create(&t).Error
				}
			}
		}
	}
}
