// Command backfill-kajian-embeddings walks all rows in kajian_transcript,
// generates a 256-dim LocalHash embedding (title + topic + text) and stores it
// in kajian_transcript.embedding. Safe to re-run: it overwrites prior vectors.
//
//	go run ./cmd/backfill-kajian-embeddings/main.go            # full backfill
//	go run ./cmd/backfill-kajian-embeddings/main.go -batch 500 # batch size
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/agambondan/islamic-explorer/app/config"
	"github.com/agambondan/islamic-explorer/app/db"
	"github.com/agambondan/islamic-explorer/app/lib/embeddings"
	"github.com/agambondan/islamic-explorer/app/repository"
)

func main() {
	batchSize := flag.Int("batch", 250, "rows per SELECT batch")
	limit := flag.Int("limit", 0, "max rows to process (0 = no limit); useful for smoke tests")
	flag.Parse()

	env := (&config.Environment{}).Init()
	dbConn := db.NewPostgresql(env)
	repos, err := repository.NewRepositories(dbConn, nil)
	if err != nil {
		log.Fatalf("init repos: %v", err)
	}
	gdb := repos.GetDB()

	provider := embeddings.NewLocalHashProvider()
	ctx := context.Background()

	start := time.Now()
	scanned, backfilled, skipped := 0, 0, 0
	lastID := 0

	type rowItem struct {
		ID       int
		KajianID int
		Text     string
		Title    string
		Topic    string
	}

	for {
		var batch []rowItem
		q := gdb.Table("kajian_transcript").
			Select("kajian_transcript.id, kajian_transcript.kajian_id, kajian_transcript.text, kajian.title, kajian.topic").
			Joins("LEFT JOIN kajian ON kajian.id = kajian_transcript.kajian_id").
			Where("kajian_transcript.id > ?", lastID).
			Order("kajian_transcript.id ASC").
			Limit(*batchSize)
		if err := q.Scan(&batch).Error; err != nil {
			log.Fatalf("scan batch: %v", err)
		}
		if len(batch) == 0 {
			break
		}
		for _, row := range batch {
			lastID = row.ID
			scanned++
			if *limit > 0 && scanned > *limit {
				printSummary(start, scanned, backfilled, skipped)
				os.Exit(0)
			}
			input := embeddings.ComposeChunkInput(row.Title, row.Topic, row.Text)
			vec, err := provider.EmbedText(ctx, input)
			if err != nil {
				skipped++
				continue
			}
			if err := embeddings.ValidateVector(vec, provider.Dimensions()); err != nil {
				skipped++
				continue
			}
			raw := gdb.Exec(
				`UPDATE kajian_transcript SET embedding = $1::vector WHERE id = $2`,
				embeddings.FormatVector(vec), row.ID,
			)
			if raw.Error != nil {
				log.Printf("update id=%d: %v", row.ID, raw.Error)
				skipped++
				continue
			}
			backfilled++
		}
		if scanned%(*batchSize*4) == 0 {
			printSummary(start, scanned, backfilled, skipped)
		}
		if len(batch) < *batchSize {
			break
		}
	}
	printSummary(start, scanned, backfilled, skipped)
}

func printSummary(start time.Time, scanned, backfilled, skipped int) {
	fmt.Printf("[%s] scanned=%d backfilled=%d skipped=%d elapsed=%s\n",
		time.Since(start).Round(time.Second), scanned, backfilled, skipped, time.Since(start))
}