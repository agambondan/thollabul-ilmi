package embeddings

import (
	"context"
	"fmt"
	"log/slog"
	"strconv"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

// BackfillOptions configures a single backfill pass.
type BackfillOptions struct {
	// BatchSize controls how many rows we SELECT/UPDATE per pass. Default 250.
	BatchSize int
	// Limit caps the number of rows processed (0 = no limit). Useful for smoke tests.
	Limit int
	// SleepBetweenBatches keeps the database breathing room between updates.
	SleepBetweenBatches time.Duration
}

// BackfillKajianEmbeddings walks every row in kajian_transcript that has an
// empty embedding column, generates a 256-dim LocalHash vector, and writes it
// back. The pass is idempotent: rows with a non-null embedding are skipped so
// subsequent runs are cheap.
//
// Returns the number of rows scanned, backfilled, and skipped. The function
// does not abort on a single bad row — it logs and continues.
func BackfillKajianEmbeddings(db *gorm.DB, opts BackfillOptions) (scanned, backfilled, skipped int, err error) {
	if opts.BatchSize <= 0 {
		opts.BatchSize = 250
	}
	if opts.SleepBetweenBatches <= 0 {
		opts.SleepBetweenBatches = 50 * time.Millisecond
	}

	provider := NewLocalHashProvider()
	ctx := context.Background()
	start := time.Now()
	tables := []string{"kajian_transcript", "kajian_transcripts"}
	table := tables[0]
	for _, t := range tables {
		if db.Migrator().HasTable(t) {
			table = t
			break
		}
	}

	for {
		var batch []model.KajianTranscript
		q := db.Table(table).
			Select(table + ".id, " + table + ".kajian_id, " + table + ".text, kajian.title, kajian.topic").
			Joins("LEFT JOIN kajian ON kajian.id = " + table + ".kajian_id").
			Where(table + ".embedding IS NULL").
			Order(table + ".id ASC").
			Limit(opts.BatchSize)
		if err = q.Scan(&batch).Error; err != nil {
			return scanned, backfilled, skipped, fmt.Errorf("scan batch: %w", err)
		}
		if len(batch) == 0 {
			break
		}
		for _, row := range batch {
			scanned++
			if opts.Limit > 0 && scanned > opts.Limit {
				printBackfillSummary(start, scanned, backfilled, skipped)
				return scanned, backfilled, skipped, nil
			}
			title, topic := "", ""
			if row.Kajian != nil {
				title = row.Kajian.Title
				topic = row.Kajian.Topic
			}
			input := ComposeChunkInput(title, topic, row.Text)
			vec, err := provider.EmbedText(ctx, input)
			if err != nil {
				skipped++
				slog.Warn("embed failed", "id", row.ID, "err", err)
				continue
			}
			if err := ValidateVector(vec, provider.Dimensions()); err != nil {
				skipped++
				slog.Warn("vector validation failed", "id", row.ID, "err", err)
				continue
			}
			raw := db.Exec(
				`UPDATE `+table+` SET embedding = $1::vector WHERE id = $2`,
				FormatVector(vec), row.ID,
			)
			if raw.Error != nil {
				skipped++
				slog.Warn("update failed", "id", row.ID, "err", raw.Error)
				continue
			}
			backfilled++
		}
		if scanned%(opts.BatchSize*4) == 0 {
			printBackfillSummary(start, scanned, backfilled, skipped)
		}
		if opts.SleepBetweenBatches > 0 {
			time.Sleep(opts.SleepBetweenBatches)
		}
		if len(batch) < opts.BatchSize {
			break
		}
	}
	printBackfillSummary(start, scanned, backfilled, skipped)
	return scanned, backfilled, skipped, nil
}

func printBackfillSummary(start time.Time, scanned, backfilled, skipped int) {
	elapsed := time.Since(start).Round(time.Second)
	slog.Info("backfill progress",
		"scanned", strconv.Itoa(scanned),
		"backfilled", strconv.Itoa(backfilled),
		"skipped", strconv.Itoa(skipped),
		"elapsed", elapsed.String(),
	)
}
