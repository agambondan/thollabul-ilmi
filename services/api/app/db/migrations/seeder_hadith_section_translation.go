package migrations

import (
	"encoding/json"
	"log"
	"os"
	"strings"

	"github.com/agambondan/islamic-explorer/app/model"
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

	if err := backfillBlankThemeTranslations(db); err != nil {
		return err
	}
	if err := backfillBlankChapterTranslations(db); err != nil {
		return err
	}
	return nil
}

func backfillBlankThemeTranslations(db *gorm.DB) error {
	var themes []model.Theme
	if err := db.Preload("Translation").Where("translation_id IS NOT NULL").Find(&themes).Error; err != nil {
		return err
	}
	for _, theme := range themes {
		if theme.ID == nil || theme.Translation == nil || theme.Translation.ID == nil {
			continue
		}
		if strings.TrimSpace(valueOf(theme.Translation.En)) == "" {
			if err := db.Model(&model.Translation{}).Where("id = ?", *theme.Translation.ID).Update("en", "Belum dikategorikan").Error; err != nil {
				return err
			}
		}
		if strings.TrimSpace(valueOf(theme.Translation.Idn)) == "" {
			if err := db.Model(&model.Translation{}).Where("id = ?", *theme.Translation.ID).Update("idn", "Belum dikategorikan").Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func backfillBlankChapterTranslations(db *gorm.DB) error {
	var chapters []model.Chapter
	if err := db.Preload("Translation").Where("translation_id IS NOT NULL").Find(&chapters).Error; err != nil {
		return err
	}
	for _, chapter := range chapters {
		if chapter.ID == nil || chapter.Translation == nil || chapter.Translation.ID == nil {
			continue
		}
		if strings.TrimSpace(valueOf(chapter.Translation.En)) == "" {
			if err := db.Model(&model.Translation{}).Where("id = ?", *chapter.Translation.ID).Update("en", "Belum dikategorikan").Error; err != nil {
				return err
			}
		}
		if strings.TrimSpace(valueOf(chapter.Translation.Idn)) == "" {
			if err := db.Model(&model.Translation{}).Where("id = ?", *chapter.Translation.ID).Update("idn", "Belum dikategorikan").Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func valueOf(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
