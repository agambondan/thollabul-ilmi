package migrations

import (
	"fmt"
	"log"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type staticHadithRow struct {
	Collection      string `json:"collection"`
	BookSlug        string `json:"book_slug"`
	Number          int    `json:"number"`
	Theme           string `json:"theme"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	TranslationIDN  string `json:"translation_idn"`
	TranslationEN   string `json:"translation_en"`
	Grade           string `json:"grade"`
	ShahihBy        string `json:"shahih_by"`
	Takhrij         string `json:"takhrij"`
	Source          string `json:"source"`
}

type staticTafsirRow struct {
	SurahNumber int    `json:"surah_number"`
	AyahNumber  int    `json:"ayah_number"`
	Title       string `json:"title"`
	TafsirIDN   string `json:"tafsir_idn"`
	TafsirEN    string `json:"tafsir_en"`
	Source      string `json:"source"`
}

func seedHadithArbainRiyadhusFromFile(db *gorm.DB) {
	var rows []staticHadithRow
	if !readStaticJSON(db, "hadith_arbain_riyadhus.json", &rows) {
		return
	}
	log.Printf("[seeder] seedHadithArbainRiyadhusFromFile: %d entri", len(rows))
	for _, r := range rows {
		if r.BookSlug == "" || r.Number == 0 || r.Arabic == "" {
			continue
		}
		bookID := ensureStaticHadithBook(db, r.BookSlug, r.Source)
		if bookID == 0 {
			continue
		}
		themeID := ensureStaticHadithTheme(db, bookID, r.Theme)
		chapterID := ensureStaticHadithChapter(db, themeID, r.Source)
		var existing model.Hadith
		trID := (*int)(nil)
		if err := db.Where("book_id = ? AND number = ?", bookID, r.Number).First(&existing).Error; err == nil {
			trID = upsertStaticTranslation(db, existing.TranslationID, r.TranslationIDN, r.TranslationEN, r.Arabic, r.Transliteration, r.Transliteration)
			updates := map[string]interface{}{"theme_id": themeID, "chapter_id": chapterID, "grade": model.HadithGrade(r.Grade), "shahih_by": r.ShahihBy, "grade_notes": r.Takhrij}
			if trID != nil {
				updates["translation_id"] = trID
			}
			db.Model(&existing).Updates(updates)
			continue
		}
		trID = upsertStaticTranslation(db, nil, r.TranslationIDN, r.TranslationEN, r.Arabic, r.Transliteration, r.Transliteration)
		gradeVal := model.HadithGrade(r.Grade)
		h := model.Hadith{Number: lib.Intptr(r.Number), BookID: lib.Intptr(bookID), ThemeID: lib.Intptr(themeID), ChapterID: lib.Intptr(chapterID), TranslationID: trID, DefaultLanguage: lib.Strptr("idn"), Grade: &gradeVal, ShahihBy: lib.Strptr(r.ShahihBy), GradeNotes: lib.Strptr(r.Takhrij)}
		db.Create(&h)
	}
}

func seedTafsirRingkasFromFile(db *gorm.DB) {
	var rows []staticTafsirRow
	if !readStaticJSON(db, "tafsir_ringkas.json", &rows) {
		return
	}
	type ayahRow struct{ ID, Number, SurahNumber int }
	var ayahs []ayahRow
	db.Raw(`SELECT ayah.id, ayah.number, surah.number AS surah_number FROM ayah JOIN surah ON surah.id = ayah.surah_id WHERE ayah.deleted_at IS NULL AND surah.deleted_at IS NULL`).Scan(&ayahs)
	idx := map[string]int{}
	for _, a := range ayahs {
		idx[fmtKey(a.SurahNumber, a.Number)] = a.ID
	}
	log.Printf("[seeder] seedTafsirRingkasFromFile: %d entri", len(rows))
	for _, r := range rows {
		ayahID := idx[fmtKey(r.SurahNumber, r.AyahNumber)]
		if ayahID == 0 || r.TafsirIDN == "" {
			continue
		}
		var existing model.Tafsir
		if err := db.Where("ayah_id = ?", ayahID).First(&existing).Error; err == nil {
			trID := upsertStaticTranslation(db, existing.KemenagTranslationID, r.TafsirIDN, r.TafsirEN, "", "", "")
			if existing.KemenagTranslationID == nil && trID != nil {
				db.Model(&existing).Update("kemenag_translation_id", trID)
			}
			continue
		}
		trID := upsertStaticTranslation(db, nil, r.TafsirIDN, r.TafsirEN, "", "", "")
		db.Create(&model.Tafsir{AyahID: lib.Intptr(ayahID), KemenagTranslationID: trID})
	}
}

func ensureStaticHadithBook(db *gorm.DB, slug, title string) int {
	if title == "" {
		title = slug
	}
	var b model.Book
	if err := db.Where("slug = ?", slug).First(&b).Error; err == nil && b.ID != nil {
		return *b.ID
	}
	trID := upsertStaticTranslation(db, nil, title, title, "", "", "")
	b = model.Book{Slug: lib.Strptr(slug), DefaultLanguage: lib.Strptr("idn"), TranslationID: trID}
	db.Create(&b)
	if b.ID == nil {
		return 0
	}
	return *b.ID
}

func ensureStaticHadithTheme(db *gorm.DB, bookID int, name string) int {
	if name == "" {
		name = "Pilihan"
	}
	type row struct{ ID int }
	var r row
	db.Raw(`SELECT t.id FROM theme t JOIN translation tr ON tr.id = t.translation_id JOIN book_themes bt ON bt.theme_id = t.id WHERE bt.book_id = ? AND (tr.idn = ? OR tr.en = ?) AND t.deleted_at IS NULL LIMIT 1`, bookID, name, name).Scan(&r)
	if r.ID > 0 {
		return r.ID
	}
	trID := upsertStaticTranslation(db, nil, name, name, "", "", "")
	t := model.Theme{DefaultLanguage: lib.Strptr("idn"), TranslationID: trID}
	db.Create(&t)
	if t.ID == nil {
		return 0
	}
	var count int64
	db.Model(&model.BookThemes{}).Where("book_id = ? AND theme_id = ?", bookID, *t.ID).Count(&count)
	if count == 0 {
		db.Create(&model.BookThemes{BookID: lib.Intptr(bookID), ThemeID: t.ID})
	}
	return *t.ID
}

func ensureStaticHadithChapter(db *gorm.DB, themeID int, name string) int {
	if name == "" {
		name = "Pilihan"
	}
	var ch model.Chapter
	if err := db.Joins("JOIN translation tr ON tr.id = chapter.translation_id").Where("chapter.theme_id = ? AND (tr.idn = ? OR tr.en = ?) AND chapter.deleted_at IS NULL", themeID, name, name).First(&ch).Error; err == nil && ch.ID != nil {
		return *ch.ID
	}
	trID := upsertStaticTranslation(db, nil, name, name, "", "", "")
	ch = model.Chapter{ThemeID: lib.Intptr(themeID), DefaultLanguage: lib.Strptr("idn"), TranslationID: trID}
	db.Create(&ch)
	if ch.ID == nil {
		return 0
	}
	return *ch.ID
}

func upsertStaticTranslation(db *gorm.DB, existingID *int, idn, en, ar, latinIDN, latinEN string) *int {
	updates := map[string]interface{}{"idn": stringPtrOrNil(idn), "en": stringPtrOrNil(en), "ar": stringPtrOrNil(ar), "latin_idn": stringPtrOrNil(latinIDN), "latin_en": stringPtrOrNil(latinEN), "description_idn": stringPtrOrNil(idn), "description_en": stringPtrOrNil(en)}
	if existingID != nil {
		db.Model(&model.Translation{}).Where("id = ?", *existingID).Updates(updates)
		return existingID
	}
	tr := model.Translation{Idn: stringPtrOrNil(idn), En: stringPtrOrNil(en), Ar: stringPtrOrNil(ar), LatinIdn: stringPtrOrNil(latinIDN), LatinEn: stringPtrOrNil(latinEN), DescriptionIdn: stringPtrOrNil(idn), DescriptionEn: stringPtrOrNil(en)}
	db.Create(&tr)
	return tr.ID
}

func fmtKey(a, b int) string { return fmt.Sprintf("%d:%d", a, b) }
