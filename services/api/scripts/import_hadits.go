//go:build ignore

// Import hadits dari JSON hasil scraping ke PostgreSQL.
// Format JSON bisa dari scrape_all.go (fawazahmed0+gadingnst) ATAU scrape_hadits.py (hadits.in).
//
// Usage:
//
//	go run scripts/import_hadits.go
//	go run scripts/import_hadits.go -data ./data -imam bukhari
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// HadithRow mendukung output dari dua scraper:
//   - scrape_all.go  : SectionNo, SectionEn, Ar, Idn, En
//   - scrape_hadits.py: Kitab, Bab, Terjemah
type HadithRow struct {
	Number int    `json:"number"`
	Imam   string `json:"imam"`
	// Dari scrape_all.go (fawazahmed0 + gadingnst)
	SectionNo int    `json:"section_no"`
	SectionEn string `json:"section_en"`
	Ar        string `json:"ar"`
	Idn       string `json:"idn"`
	En        string `json:"en"`
	// Dari scrape_hadits.py (hadits.in)
	Kitab    string `json:"kitab"`
	Bab      string `json:"bab"`
	Terjemah string `json:"terjemah"`
}

func (r *HadithRow) themeKey(bookID int) string {
	if r.SectionNo > 0 {
		return fmt.Sprintf("%d:sec:%d", bookID, r.SectionNo)
	}
	return fmt.Sprintf("%d:kitab:%s", bookID, r.Kitab)
}

func (r *HadithRow) themeName() string {
	if r.SectionEn != "" {
		return r.SectionEn
	}
	return r.Kitab
}

func (r *HadithRow) chapterKey(themeID int) string {
	if r.SectionNo > 0 {
		return fmt.Sprintf("%d:sec:%d", themeID, r.SectionNo)
	}
	return fmt.Sprintf("%d:bab:%s", themeID, r.Bab)
}

func (r *HadithRow) chapterName() string {
	if r.SectionEn != "" {
		return r.SectionEn
	}
	return r.Bab
}

func (r *HadithRow) translationIdn() string {
	if r.Idn != "" {
		return r.Idn
	}
	return r.Terjemah
}

func main() {
	dataDir := flag.String("data", "./data", "Folder berisi file hadits_*.json")
	imamFlag := flag.String("imam", "", "Import hanya satu imam (opsional)")
	flag.Parse()

	for _, f := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(f); err == nil {
			log.Printf("Config: %s", f)
			break
		}
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		viper.GetString("db_host"),
		viper.GetString("db_port"),
		viper.GetString("db_user"),
		viper.GetString("db_pass"),
		viper.GetString("db_name"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Warn),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("koneksi DB gagal: %v", err)
	}

	importer := &Importer{db: db}

	pattern := filepath.Join(*dataDir, "hadits_*.json")
	if *imamFlag != "" {
		pattern = filepath.Join(*dataDir, fmt.Sprintf("hadits_%s.json", *imamFlag))
	}

	files, err := filepath.Glob(pattern)
	if err != nil || len(files) == 0 {
		log.Fatalf("tidak ada file di %s", pattern)
	}

	for _, f := range files {
		if err := importer.importFile(f); err != nil {
			log.Printf("ERROR %s: %v", f, err)
		}
	}

	log.Println("Import selesai!")
}

type Importer struct {
	db           *gorm.DB
	bookCache    map[string]int
	themeCache   map[string]int
	chapterCache map[string]int
}

func (imp *Importer) importFile(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	var rows []HadithRow
	if err := json.NewDecoder(f).Decode(&rows); err != nil {
		return err
	}

	if len(rows) == 0 {
		return nil
	}
	imam := rows[0].Imam
	log.Printf("[%s] Mulai import %d hadits...", imam, len(rows))

	imp.bookCache = make(map[string]int)
	imp.themeCache = make(map[string]int)
	imp.chapterCache = make(map[string]int)

	start := time.Now()
	for i, row := range rows {
		if err := imp.importRow(row); err != nil {
			log.Printf("  skip %s#%d: %v", imam, row.Number, err)
		}
		if (i+1)%500 == 0 {
			log.Printf("  [%s] %d/%d (%.1fs)", imam, i+1, len(rows), time.Since(start).Seconds())
		}
	}

	log.Printf("[%s] Selesai %d hadits dalam %.1fs", imam, len(rows), time.Since(start).Seconds())
	return nil
}

func (imp *Importer) importRow(row HadithRow) error {
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

func (imp *Importer) findOrCreateBook(slug string) (int, error) {
	if id, ok := imp.bookCache[slug]; ok {
		return id, nil
	}
	var book model.Book
	if err := imp.db.Where("slug = ?", slug).First(&book).Error; err != nil {
		return 0, fmt.Errorf("book %s tidak ditemukan (jalankan seeder dulu): %w", slug, err)
	}
	imp.bookCache[slug] = *book.ID
	return *book.ID, nil
}

func (imp *Importer) findOrCreateTheme(key, name string, bookID int) (int, error) {
	if id, ok := imp.themeCache[key]; ok {
		return id, nil
	}

	type row struct{ ThemeID int }
	var r row
	imp.db.Raw(`
		SELECT bt.theme_id
		FROM book_themes bt
		JOIN theme t ON t.id = bt.theme_id
		JOIN translation tr ON tr.id = t.translation_id
		WHERE bt.book_id = ? AND tr.en = ? AND t.deleted_at IS NULL
		LIMIT 1
	`, bookID, name).Scan(&r)
	if r.ThemeID > 0 {
		imp.themeCache[key] = r.ThemeID
		return r.ThemeID, nil
	}
	// Fallback cari by idn
	imp.db.Raw(`
		SELECT bt.theme_id
		FROM book_themes bt
		JOIN theme t ON t.id = bt.theme_id
		JOIN translation tr ON tr.id = t.translation_id
		WHERE bt.book_id = ? AND tr.idn = ? AND t.deleted_at IS NULL
		LIMIT 1
	`, bookID, name).Scan(&r)
	if r.ThemeID > 0 {
		imp.themeCache[key] = r.ThemeID
		return r.ThemeID, nil
	}

	tr := &model.Translation{En: lib.Strptr(name)}
	if err := imp.db.Create(tr).Error; err != nil {
		return 0, err
	}
	theme := &model.Theme{
		DefaultLanguage: lib.Strptr("en"),
		TranslationID:   tr.ID,
	}
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

func (imp *Importer) findOrCreateChapter(key, name string, themeID int) (int, error) {
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

	tr := &model.Translation{En: lib.Strptr(name)}
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

func (imp *Importer) createHadith(number, bookID, themeID, chapterID int, row HadithRow) error {
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
