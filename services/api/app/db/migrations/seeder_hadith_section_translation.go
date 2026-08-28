package migrations

import (
	"encoding/json"
	"log"
	"os"
	"strings"

	"gorm.io/gorm"
)

var hadithSectionTranslationPaths = []string{
	"data/hadith_section_translations_id.json",
	"../../../data/hadith_section_translations_id.json",
}

func loadHadithSectionTranslations() map[string]string {
	for _, path := range hadithSectionTranslationPaths {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}

		var translations map[string]string
		if err := json.Unmarshal(data, &translations); err != nil {
			log.Printf("[seeder] hadith section translations invalid: %v", err)
			return nil
		}
		return translations
	}

	log.Println("[seeder] hadith section translations tidak ditemukan")
	return nil
}

func BackfillHadithSectionTranslations(db *gorm.DB) error {
	translations := loadHadithSectionTranslations()
	if len(translations) == 0 {
		return nil
	}

	for en, idn := range translations {
		if strings.TrimSpace(en) == "" || strings.TrimSpace(idn) == "" {
			continue
		}
		if err := db.Exec(`
			UPDATE translation
			SET idn = ?
			WHERE en = ?
			  AND (idn IS NULL OR idn = '' OR idn = en)
		`, idn, en).Error; err != nil {
			return err
		}
	}
	return nil
}
