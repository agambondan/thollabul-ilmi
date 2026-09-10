package migrations

import (
	"fmt"

	"gorm.io/gorm"
)

// PreMigrateKajianVideoID drops the legacy unique index on
// (title, speaker, published_at). Title is not a reliable identity for a
// kajian video: channels commonly reuse the exact same title across
// distinct uploads (a recurring "Khutbah Jum'at" livestream, a reposted
// clip), so the composite unique index silently blocked those later videos
// from ever being inserted and merged them into whichever row got there
// first. AutoMigrate recreates it afterwards as a plain (non-unique) index
// for query performance; the real identity is now VideoID's own partial
// unique index (see model.Kajian).
//
// Idempotent: DROP INDEX IF EXISTS is a no-op once already migrated.
func PreMigrateKajianVideoID(db *gorm.DB) {
	if err := db.Exec(`DROP INDEX IF EXISTS idx_kajian_title_speaker_published`).Error; err != nil {
		fmt.Printf("[kajian] drop legacy unique index failed (non-fatal): %v\n", err)
	}
}
