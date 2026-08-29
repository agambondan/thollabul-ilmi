package migrations

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

// SeedHadithFromFiles seeds hadith data from data/hadits_*.json.
// No-op if the file pattern matches nothing or hadith count >= 60000.
func SeedHadithFromFiles(db *gorm.DB) {
	var count int64
	db.Model(&model.Hadith{}).Count(&count)
	if count >= 60000 {
		return
	}

	files, _ := filepath.Glob("data/hadits_*.json")
	if len(files) == 0 {
		log.Println("[seeder] SeedHadithFromFiles: tidak ada data/hadits_*.json — skip")
		return
	}

	imp := &hadithImporter{
		db:                  db,
		sectionTranslations: loadHadithSectionTranslations(),
	}
	for _, f := range files {
		if err := imp.importFile(f); err != nil {
			log.Printf("[seeder] SeedHadithFromFiles ERROR %s: %v", f, err)
		}
	}
}

// ── hadithImporter ────────────────────────────────────────────────────────────

type hadithImporter struct {
	db                  *gorm.DB
	bookCache           map[string]int
	themeCache          map[string]int
	chapterCache        map[string]int
	sectionTranslations map[string]string
}

type hadithRow struct {
	Number    int    `json:"number"`
	Imam      string `json:"imam"`
	SectionNo int    `json:"section_no"`
	SectionEn string `json:"section_en"`
	Ar        string `json:"ar"`
	Idn       string `json:"idn"`
	En        string `json:"en"`
	// scrape_hadits.py format
	Kitab    string `json:"kitab"`
	Bab      string `json:"bab"`
	Terjemah string `json:"terjemah"`
}

func (r *hadithRow) themeKey(bookID int) string {
	if r.SectionNo > 0 {
		return fmt.Sprintf("%d:sec:%d", bookID, r.SectionNo)
	}
	return fmt.Sprintf("%d:kitab:%s", bookID, r.Kitab)
}

func (r *hadithRow) themeName() string {
	if strings.TrimSpace(r.SectionEn) != "" {
		return strings.TrimSpace(r.SectionEn)
	}
	if strings.TrimSpace(r.Kitab) != "" {
		return strings.TrimSpace(r.Kitab)
	}
	return fmt.Sprintf("Tema %d", r.SectionNo)
}

func (r *hadithRow) chapterKey(themeID int) string {
	if r.SectionNo > 0 {
		return fmt.Sprintf("%d:sec:%d", themeID, r.SectionNo)
	}
	return fmt.Sprintf("%d:bab:%s", themeID, r.Bab)
}

func (r *hadithRow) chapterName() string {
	if strings.TrimSpace(r.SectionEn) != "" {
		return strings.TrimSpace(r.SectionEn)
	}
	if strings.TrimSpace(r.Bab) != "" {
		return strings.TrimSpace(r.Bab)
	}
	return fmt.Sprintf("Bab %d", r.SectionNo)
}

func (r *hadithRow) translationIdn() string {
	if r.Idn != "" {
		return r.Idn
	}
	return r.Terjemah
}

func (imp *hadithImporter) importFile(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	var rows []hadithRow
	if err := json.NewDecoder(f).Decode(&rows); err != nil {
		return err
	}
	if len(rows) == 0 {
		return nil
	}

	imam := rows[0].Imam
	log.Printf("[seeder] [%s] %d hadits...", imam, len(rows))

	imp.bookCache = make(map[string]int)
	imp.themeCache = make(map[string]int)
	imp.chapterCache = make(map[string]int)

	start := time.Now()
	for i, row := range rows {
		if err := imp.importRow(row); err != nil {
			log.Printf("[seeder]   skip %s#%d: %v", imam, row.Number, err)
		}
		if (i+1)%1000 == 0 {
			log.Printf("[seeder]   [%s] %d/%d (%.1fs)", imam, i+1, len(rows), time.Since(start).Seconds())
		}
	}
	log.Printf("[seeder] [%s] selesai %d hadits dalam %.1fs", imam, len(rows), time.Since(start).Seconds())
	return nil
}

func (imp *hadithImporter) importRow(row hadithRow) error {
	bookID, err := imp.findOrCreateBook(row.Imam)
	if err != nil {
		return fmt.Errorf("book: %w", err)
	}
	themeID, err := imp.findOrCreateTheme(row.themeKey(bookID), row.themeName(), bookID)
	if err != nil {
		return fmt.Errorf("theme: %w", err)
	}
	chapterID, err := imp.findOrCreateChapter(row.chapterKey(themeID), row.chapterName(), themeID)
	if err != nil {
		return fmt.Errorf("chapter: %w", err)
	}
	return imp.createHadith(row.Number, bookID, themeID, chapterID, row)
}

func (imp *hadithImporter) findOrCreateBook(slug string) (int, error) {
	if id, ok := imp.bookCache[slug]; ok {
		return id, nil
	}
	var book model.Book
	if err := imp.db.Where("slug = ?", slug).First(&book).Error; err != nil {
		return 0, fmt.Errorf("book '%s' tidak ditemukan — jalankan seeder book dulu", slug)
	}
	imp.bookCache[slug] = *book.ID
	return *book.ID, nil
}

func (imp *hadithImporter) findOrCreateTheme(key, name string, bookID int) (int, error) {
	if id, ok := imp.themeCache[key]; ok {
		return id, nil
	}
	type row struct{ ThemeID int }
	var r row
	imp.db.Raw(`
		SELECT bt.theme_id FROM book_themes bt
		JOIN theme t ON t.id = bt.theme_id
		JOIN translation tr ON tr.id = t.translation_id
		WHERE bt.book_id = ? AND (tr.en = ? OR tr.idn = ?) AND t.deleted_at IS NULL LIMIT 1
	`, bookID, name, name).Scan(&r)
	if r.ThemeID > 0 {
		imp.themeCache[key] = r.ThemeID
		return r.ThemeID, nil
	}

	tr := &model.Translation{
		En: lib.Strptr(name),
	}
	if idn, ok := imp.sectionTranslations[strings.TrimSpace(name)]; ok && idn != "" {
		tr.Idn = lib.Strptr(idn)
	} else {
		tr.Idn = lib.Strptr(name)
	}
	if err := imp.db.Create(tr).Error; err != nil {
		return 0, err
	}
	theme := &model.Theme{DefaultLanguage: lib.Strptr("en"), TranslationID: tr.ID}
	if err := imp.db.Create(theme).Error; err != nil {
		return 0, err
	}
	bt := model.BookThemes{BookID: lib.Intptr(bookID), ThemeID: theme.ID}
	if err := imp.db.Create(&bt).Error; err != nil {
		return 0, err
	}
	imp.themeCache[key] = *theme.ID
	return *theme.ID, nil
}

func (imp *hadithImporter) findOrCreateChapter(key, name string, themeID int) (int, error) {
	if id, ok := imp.chapterCache[key]; ok {
		return id, nil
	}
	var existing model.Chapter
	if err := imp.db.
		Joins("JOIN translation tr ON tr.id = chapter.translation_id").
		Where("chapter.theme_id = ? AND (tr.en = ? OR tr.idn = ?) AND chapter.deleted_at IS NULL", themeID, name, name).
		First(&existing).Error; err == nil {
		imp.chapterCache[key] = *existing.ID
		return *existing.ID, nil
	}
	tr := &model.Translation{
		En: lib.Strptr(name),
	}
	if idn, ok := imp.sectionTranslations[strings.TrimSpace(name)]; ok && idn != "" {
		tr.Idn = lib.Strptr(idn)
	} else {
		tr.Idn = lib.Strptr(name)
	}
	if err := imp.db.Create(tr).Error; err != nil {
		return 0, err
	}
	chapter := &model.Chapter{
		ThemeID:         lib.Intptr(themeID),
		DefaultLanguage: lib.Strptr("en"),
		TranslationID:   tr.ID,
	}
	if err := imp.db.Create(chapter).Error; err != nil {
		return 0, err
	}
	imp.chapterCache[key] = *chapter.ID
	return *chapter.ID, nil
}

func (imp *hadithImporter) createHadith(number, bookID, themeID, chapterID int, row hadithRow) error {
	var count int64
	imp.db.Model(&model.Hadith{}).
		Where("number = ? AND book_id = ? AND deleted_at IS NULL", number, bookID).
		Count(&count)
	if count > 0 {
		return nil
	}

	idn := row.translationIdn()
	tr := &model.Translation{}
	if idn != "" {
		tr.Idn = lib.Strptr(idn)
	}
	if row.Ar != "" {
		tr.Ar = lib.Strptr(row.Ar)
	}
	if row.En != "" {
		tr.En = lib.Strptr(row.En)
	}
	if err := imp.db.Create(tr).Error; err != nil {
		return err
	}

	lang := "idn"
	if row.Idn == "" && row.Ar != "" {
		lang = "ar"
	}
	hadith := &model.Hadith{
		Number:          lib.Intptr(number),
		BookID:          lib.Intptr(bookID),
		ThemeID:         lib.Intptr(themeID),
		ChapterID:       lib.Intptr(chapterID),
		TranslationID:   tr.ID,
		DefaultLanguage: lib.Strptr(lang),
	}
	return imp.db.Create(hadith).Error
}
