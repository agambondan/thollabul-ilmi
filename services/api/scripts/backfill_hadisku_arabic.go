//go:build ignore

// Fill missing Arabic hadith text from HadisKu raw cache, guarded by compare verdicts.
//
// Safety rules:
//   - Default is dry-run.
//   - Only updates one selected book, default: ahmad.
//   - Only uses rows with compare verdict "match".
//   - Only fills empty local/DB Arabic fields; it never overwrites existing text.
//   - It does not update Indonesian translation or grading.
//
// Usage:
//
//	go run scripts/backfill_hadisku_arabic.go
//	go run scripts/backfill_hadisku_arabic.go -book ahmad -apply-files
//	go run scripts/backfill_hadisku_arabic.go -book ahmad -apply-db
//	go run scripts/backfill_hadisku_arabic.go -book ahmad -apply-files -apply-db
package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

type localHadithRow struct {
	Number    int    `json:"number"`
	Imam      string `json:"imam"`
	SectionNo int    `json:"section_no"`
	SectionEn string `json:"section_en"`
	Ar        string `json:"ar"`
	Idn       string `json:"idn"`
	En        string `json:"en"`
	Kitab     string `json:"kitab,omitempty"`
	Bab       string `json:"bab,omitempty"`
	Terjemah  string `json:"terjemah,omitempty"`
}

type compareRow struct {
	Number          int     `json:"number"`
	BookSlug        string  `json:"book_slug"`
	Verdict         string  `json:"verdict"`
	LocalHasArabic  bool    `json:"local_has_arabic"`
	RemoteHasArabic bool    `json:"remote_has_arabic"`
	Coverage        float64 `json:"idn_token_coverage"`
}

type rawRow struct {
	Number int    `json:"number"`
	OK     bool   `json:"ok"`
	Arabic string `json:"arabic"`
	URL    string `json:"url"`
}

type candidate struct {
	Number   int
	Arabic   string
	Coverage float64
	URL      string
}

func main() {
	book := flag.String("book", "ahmad", "Local book slug to backfill. Keep this as ahmad unless another book is fully verified.")
	dataDir := flag.String("data-dir", "./data", "Directory containing hadits_*.json")
	rawDir := flag.String("raw-dir", "./data/hadisku_raw", "Directory containing HadisKu raw JSONL cache")
	compareDir := flag.String("compare-dir", "./data/hadisku_compare", "Directory containing HadisKu compare JSONL")
	applyFiles := flag.Bool("apply-files", false, "Write Arabic text into data/hadits_<book>.json")
	applyDB := flag.Bool("apply-db", false, "Update translation.ar in PostgreSQL for matching hadith rows")
	limit := flag.Int("limit", 0, "Optional max number of candidates to process")
	flag.Parse()

	if *book != "ahmad" {
		log.Fatalf("refusing to backfill %q: only ahmad is allowed by current HadisKu mapping decision", *book)
	}

	localPath := filepath.Join(*dataDir, fmt.Sprintf("hadits_%s.json", *book))
	localRows, err := loadLocalRows(localPath)
	if err != nil {
		log.Fatalf("load local rows: %v", err)
	}
	candidates, err := buildCandidates(*book, localRows, *rawDir, *compareDir)
	if err != nil {
		log.Fatalf("build candidates: %v", err)
	}
	if *limit > 0 && len(candidates) > *limit {
		candidates = candidates[:*limit]
	}

	printCandidateSummary(*book, localRows, candidates)

	if !*applyFiles && !*applyDB {
		log.Println("dry-run only. Pass -apply-files and/or -apply-db to update.")
		return
	}

	if *applyFiles {
		updated, err := applyToFiles(localPath, localRows, candidates)
		if err != nil {
			log.Fatalf("apply files: %v", err)
		}
		log.Printf("file update: %d rows filled in %s", updated, localPath)
	}

	if *applyDB {
		db, err := openDB()
		if err != nil {
			log.Fatalf("open DB: %v", err)
		}
		updated, skipped, err := applyToDB(db, *book, candidates)
		if err != nil {
			log.Fatalf("apply DB: %v", err)
		}
		log.Printf("db update: %d rows filled, %d skipped", updated, skipped)
	}
}

func loadLocalRows(path string) ([]localHadithRow, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var rows []localHadithRow
	if err := json.Unmarshal(content, &rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func loadCompareRows(path string) (map[int]compareRow, error) {
	rows := make(map[int]compareRow)
	if err := readJSONL(path, func(line []byte) error {
		var row compareRow
		if err := json.Unmarshal(line, &row); err != nil {
			return err
		}
		if row.Number > 0 {
			rows[row.Number] = row
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return rows, nil
}

func loadRawRows(path string) (map[int]rawRow, error) {
	rows := make(map[int]rawRow)
	if err := readJSONL(path, func(line []byte) error {
		var row rawRow
		if err := json.Unmarshal(line, &row); err != nil {
			return err
		}
		if row.Number > 0 {
			rows[row.Number] = row
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return rows, nil
}

func readJSONL(path string, handle func([]byte) error) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	buf := make([]byte, 0, 1024*1024)
	scanner.Buffer(buf, 16*1024*1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		if err := handle([]byte(line)); err != nil {
			return fmt.Errorf("%s: %w", path, err)
		}
	}
	return scanner.Err()
}

func buildCandidates(book string, localRows []localHadithRow, rawDir, compareDir string) ([]candidate, error) {
	rawRows, err := loadRawRows(filepath.Join(rawDir, fmt.Sprintf("%s.jsonl", book)))
	if err != nil {
		return nil, err
	}
	compareRows, err := loadCompareRows(filepath.Join(compareDir, fmt.Sprintf("%s.jsonl", book)))
	if err != nil {
		return nil, err
	}

	localByNumber := make(map[int]localHadithRow, len(localRows))
	for _, row := range localRows {
		localByNumber[row.Number] = row
	}

	numbers := make([]int, 0, len(compareRows))
	for number := range compareRows {
		numbers = append(numbers, number)
	}
	sort.Ints(numbers)

	candidates := make([]candidate, 0)
	for _, number := range numbers {
		compare := compareRows[number]
		raw := rawRows[number]
		local, ok := localByNumber[number]
		if !ok {
			continue
		}
		if compare.BookSlug != book || compare.Verdict != "match" || !compare.RemoteHasArabic || !raw.OK {
			continue
		}
		if strings.TrimSpace(local.Ar) != "" || strings.TrimSpace(raw.Arabic) == "" {
			continue
		}
		candidates = append(candidates, candidate{
			Number:   number,
			Arabic:   strings.TrimSpace(raw.Arabic),
			Coverage: compare.Coverage,
			URL:      raw.URL,
		})
	}
	return candidates, nil
}

func printCandidateSummary(book string, localRows []localHadithRow, candidates []candidate) {
	missing := 0
	for _, row := range localRows {
		if strings.TrimSpace(row.Ar) == "" {
			missing++
		}
	}
	log.Printf("[%s] local rows=%d missing_arabic=%d candidates=%d", book, len(localRows), missing, len(candidates))
	if len(candidates) == 0 {
		return
	}
	last := len(candidates)
	if last > 10 {
		last = 10
	}
	for i := 0; i < last; i++ {
		c := candidates[i]
		excerpt := c.Arabic
		if len([]rune(excerpt)) > 80 {
			excerpt = string([]rune(excerpt)[:80]) + "..."
		}
		log.Printf("candidate #%d coverage=%.4f %s", c.Number, c.Coverage, excerpt)
	}
}

func applyToFiles(path string, rows []localHadithRow, candidates []candidate) (int, error) {
	byNumber := make(map[int]string, len(candidates))
	for _, c := range candidates {
		byNumber[c.Number] = c.Arabic
	}
	updated := 0
	for i := range rows {
		if strings.TrimSpace(rows[i].Ar) != "" {
			continue
		}
		if arabic, ok := byNumber[rows[i].Number]; ok && strings.TrimSpace(arabic) != "" {
			rows[i].Ar = arabic
			updated++
		}
	}
	if updated == 0 {
		return 0, nil
	}
	sort.Slice(rows, func(i, j int) bool { return rows[i].Number < rows[j].Number })
	content, err := json.MarshalIndent(rows, "", "  ")
	if err != nil {
		return 0, err
	}
	content = append(content, '\n')
	return updated, os.WriteFile(path, content, 0o644)
}

func openDB() (*gorm.DB, error) {
	for _, envFile := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(envFile); err == nil {
			log.Printf("Config: %s", envFile)
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
	return gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Warn),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
}

func applyToDB(db *gorm.DB, book string, candidates []candidate) (int, int, error) {
	updated := 0
	skipped := 0
	for _, c := range candidates {
		var row struct {
			HadithID      int
			TranslationID int
			CurrentArabic *string
		}
		if err := db.Raw(`
			SELECT h.id AS hadith_id, h.translation_id AS translation_id, tr.ar AS current_arabic
			FROM hadith h
			JOIN book b ON b.id = h.book_id
			JOIN translation tr ON tr.id = h.translation_id
			WHERE b.slug = ? AND h.number = ? AND h.deleted_at IS NULL AND b.deleted_at IS NULL
			LIMIT 1
		`, book, c.Number).Scan(&row).Error; err != nil {
			return updated, skipped, err
		}
		if row.TranslationID == 0 {
			skipped++
			continue
		}
		if row.CurrentArabic != nil && strings.TrimSpace(*row.CurrentArabic) != "" {
			skipped++
			continue
		}
		res := db.Exec(`
			UPDATE translation
			SET ar = ?, updated_at = NOW()
			WHERE id = ? AND (ar IS NULL OR ar = '')
		`, c.Arabic, row.TranslationID)
		if res.Error != nil {
			return updated, skipped, res.Error
		}
		if res.RowsAffected > 0 {
			updated += int(res.RowsAffected)
		} else {
			skipped++
		}
	}
	return updated, skipped, nil
}
