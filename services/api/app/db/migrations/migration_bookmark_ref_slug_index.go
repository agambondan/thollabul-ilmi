package migrations

import (
	"fmt"

	"gorm.io/gorm"
)

func PreMigrateBookmarkRefSlugIndex(db *gorm.DB) {
	if err := db.Exec(`DROP INDEX IF EXISTS idx_bookmark_user_ref`).Error; err != nil {
		fmt.Printf("[bookmark] drop legacy unique index failed (non-fatal): %v\n", err)
	}
}
