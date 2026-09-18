package migrations

import (
	"log"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

func DropLegacyNonCanonicalHadithBooks(db *gorm.DB) {
	slugs := []string{"arbain-nawawi", "riyadhus-shalihin"}
	var books []model.Book
	if err := db.Unscoped().Where("slug IN ?", slugs).Find(&books).Error; err != nil || len(books) == 0 {
		return
	}

	var bookIDs []int
	var bookTrIDs []int
	for _, b := range books {
		if b.ID != nil {
			bookIDs = append(bookIDs, *b.ID)
		}
		if b.TranslationID != nil {
			bookTrIDs = append(bookTrIDs, *b.TranslationID)
		}
	}
	if len(bookIDs) == 0 {
		return
	}

	var hadithTrIDs []int
	db.Model(&model.Hadith{}).Unscoped().Where("book_id IN ?", bookIDs).Pluck("translation_id", &hadithTrIDs)

	var themeIDs []int
	db.Model(&model.BookThemes{}).Unscoped().Where("book_id IN ?", bookIDs).Pluck("theme_id", &themeIDs)

	var chapterIDs []int
	var chapterTrIDs []int
	if len(themeIDs) > 0 {
		var chapters []model.Chapter
		db.Unscoped().Where("theme_id IN ?", themeIDs).Find(&chapters)
		for _, c := range chapters {
			if c.ID != nil {
				chapterIDs = append(chapterIDs, *c.ID)
			}
			if c.TranslationID != nil {
				chapterTrIDs = append(chapterTrIDs, *c.TranslationID)
			}
		}
	}

	var themeTrIDs []int
	if len(themeIDs) > 0 {
		db.Model(&model.Theme{}).Unscoped().Where("id IN ?", themeIDs).Pluck("translation_id", &themeTrIDs)
	}

	db.Unscoped().Where("book_id IN ?", bookIDs).Delete(&model.Hadith{})
	db.Unscoped().Where("book_id IN ?", bookIDs).Delete(&model.BookThemes{})
	db.Unscoped().Where("book_id IN ?", bookIDs).Delete(&model.BookAsset{})
	if len(chapterIDs) > 0 {
		db.Unscoped().Where("id IN ?", chapterIDs).Delete(&model.Chapter{})
	}
	if len(themeIDs) > 0 {
		db.Unscoped().Where("id IN ?", themeIDs).Delete(&model.Theme{})
	}
	db.Unscoped().Where("id IN ?", bookIDs).Delete(&model.Book{})

	var allTrIDs []int
	allTrIDs = append(allTrIDs, bookTrIDs...)
	allTrIDs = append(allTrIDs, hadithTrIDs...)
	allTrIDs = append(allTrIDs, chapterTrIDs...)
	allTrIDs = append(allTrIDs, themeTrIDs...)
	if len(allTrIDs) > 0 {
		db.Unscoped().Where("id IN ?", allTrIDs).Delete(&model.Translation{})
	}

	db.Unscoped().Where("name = ?", "hadith_arbain_riyadhus.json").Delete(&model.SeedFileState{})
	log.Printf("[migration] DropLegacyNonCanonicalHadithBooks: removed books %v", slugs)
}
