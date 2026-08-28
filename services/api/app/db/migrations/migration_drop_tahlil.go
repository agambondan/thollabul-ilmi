package migrations

import (
	"fmt"

	"gorm.io/gorm"
)

// DropTahlilTables removes the legacy `tahlil_collection` / `tahlil_item`
// tables left behind by the Tahlil & Yasin feature, which has been dropped
// from the product.
//
// Translation rows that were owned exclusively by `tahlil_item` are deleted
// first so AutoMigrate does not keep orphaned i18n records around.
//
// Idempotent: skips whatever is already gone.
func DropTahlilTables(db *gorm.DB) {
	m := db.Migrator()

	if m.HasTable("tahlil_item") {
		var translationIDs []int
		if err := db.Raw(`SELECT translation_id FROM tahlil_item WHERE translation_id IS NOT NULL`).
			Scan(&translationIDs).Error; err != nil {
			fmt.Printf("[tahlil] collect translation ids failed (non-fatal): %v\n", err)
		}

		fmt.Println("[tahlil] dropping legacy tahlil_item table")
		if err := m.DropTable("tahlil_item"); err != nil {
			fmt.Printf("[tahlil] drop tahlil_item failed (non-fatal): %v\n", err)
		} else if len(translationIDs) > 0 {
			if err := db.Exec(`DELETE FROM translation WHERE id IN ?`, translationIDs).Error; err != nil {
				fmt.Printf("[tahlil] delete orphan translations failed (non-fatal): %v\n", err)
			}
		}
	}

	if m.HasTable("tahlil_collection") {
		fmt.Println("[tahlil] dropping legacy tahlil_collection table")
		if err := m.DropTable("tahlil_collection"); err != nil {
			fmt.Printf("[tahlil] drop tahlil_collection failed (non-fatal): %v\n", err)
		}
	}
}
