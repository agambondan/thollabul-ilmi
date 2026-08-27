//go:build ignore

// Import data per-kata (mufrodat) dari Quran.com API v4 ke PostgreSQL.
//
// Sumber: https://api.quran.com/api/v4 (endpoint publik, tidak butuh API key)
// Data: teks Arab per kata, transliterasi, terjemahan Indonesia per kata
//
// Usage:
//
//	go run scripts/import_mufrodat.go
//	go run scripts/import_mufrodat.go -surah 1            # hanya satu surah
//	go run scripts/import_mufrodat.go -from 1 -to 114     # range surah
//	go run scripts/import_mufrodat.go -delay 800          # delay ms antar request
//
// PENTING: jalankan dari folder services/api/:
//
//	cd services/api && go run scripts/import_mufrodat.go
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// ── Quran.com API v4 response types ─────────────────────────────────────────

type QCWord struct {
	ID              int         `json:"id"`
	Position        int         `json:"position"`
	TextUthmani     string      `json:"text_uthmani"`
	CharTypeName    string      `json:"char_type_name"` // "word" | "end"
	Transliteration *QCTranslit `json:"transliteration"`
	Translation     *QCTranslit `json:"translation"`
}

type QCTranslit struct {
	Text string `json:"text"`
}

type QCVerse struct {
	ID          int      `json:"id"`
	VerseNumber int      `json:"verse_number"`
	Words       []QCWord `json:"words"`
}

type QCVersesResponse struct {
	Verses     []QCVerse     `json:"verses"`
	Pagination *QCPagination `json:"pagination"`
}

type QCPagination struct {
	PerPage      int  `json:"per_page"`
	CurrentPage  int  `json:"current_page"`
	NextPage     *int `json:"next_page"`
	TotalPages   int  `json:"total_pages"`
	TotalRecords int  `json:"total_records"`
}

// ── Importer ─────────────────────────────────────────────────────────────────

type Importer struct {
	db     *gorm.DB
	client *http.Client
	delay  time.Duration
	// ayahCache: surah_number:ayah_number → ayah.id
	ayahCache map[string]int
}

func (imp *Importer) buildAyahIndex() {
	log.Println("Membangun index ayah dari DB...")
	type row struct {
		ID          int
		Number      int
		SurahNumber int
	}
	var rows []row
	imp.db.Raw(`
		SELECT ayah.id, ayah.number, surah.number AS surah_number
		FROM ayah
		JOIN surah ON surah.id = ayah.surah_id
	`).Scan(&rows)
	imp.ayahCache = make(map[string]int, len(rows))
	for _, r := range rows {
		key := fmt.Sprintf("%d:%d", r.SurahNumber, r.Number)
		imp.ayahCache[key] = r.ID
	}
	log.Printf("Index ayah: %d entries\n", len(imp.ayahCache))
}

func (imp *Importer) fetchVerses(surahNumber, page int) (*QCVersesResponse, error) {
	url := fmt.Sprintf(
		"https://api.quran.com/api/v4/verses/by_chapter/%d"+
			"?words=true"+
			"&word_fields=text_uthmani,transliteration,translation"+
			"&language=id"+
			"&per_page=300"+
			"&page=%d",
		surahNumber, page,
	)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "thollabul-ilmi-importer/1.0")

	resp, err := imp.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("status %d untuk surah %d halaman %d", resp.StatusCode, surahNumber, page)
	}

	var result QCVersesResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode JSON: %w", err)
	}
	return &result, nil
}

func (imp *Importer) importSurah(surahNumber int) (int, error) {
	inserted := 0
	page := 1

	for {
		resp, err := imp.fetchVerses(surahNumber, page)
		if err != nil {
			return inserted, err
		}

		for _, verse := range resp.Verses {
			ayahKey := fmt.Sprintf("%d:%d", surahNumber, verse.VerseNumber)
			ayahID, ok := imp.ayahCache[ayahKey]
			if !ok {
				log.Printf("  SKIP: ayah tidak ditemukan di DB (%s)\n", ayahKey)
				continue
			}

			wordIdx := 0
			for _, word := range verse.Words {
				if word.CharTypeName != "word" {
					continue
				}
				wordIdx++

				arabic := strings.TrimSpace(word.TextUthmani)
				if arabic == "" {
					continue
				}
				translit := ""
				if word.Transliteration != nil {
					translit = strings.TrimSpace(word.Transliteration.Text)
				}
				indonesian := ""
				if word.Translation != nil {
					indonesian = strings.TrimSpace(word.Translation.Text)
				}

				item := model.Mufrodat{
					AyahID:          lib.Intptr(ayahID),
					WordIndex:       wordIdx,
					Arabic:          arabic,
					Transliteration: translit,
					Indonesian:      indonesian,
				}
				result := imp.db.Clauses(clause.OnConflict{
					Columns: []clause.Column{{Name: "ayah_id"}, {Name: "word_index"}},
					DoUpdates: clause.AssignmentColumns([]string{
						"arabic", "transliteration", "indonesian",
					}),
				}).Create(&item)
				if result.Error != nil {
					log.Printf("  ERROR insert %s w%d: %v\n", ayahKey, wordIdx, result.Error)
				} else {
					inserted++
				}
			}
		}

		if resp.Pagination == nil || resp.Pagination.NextPage == nil {
			break
		}
		page++
		time.Sleep(imp.delay)
	}
	return inserted, nil
}

// ── main ──────────────────────────────────────────────────────────────────────

func main() {
	surahFlag := flag.Int("surah", 0, "Import satu surah saja (1-114). 0 = semua")
	fromFlag := flag.Int("from", 1, "Mulai dari surah (inklusif)")
	toFlag := flag.Int("to", 114, "Sampai surah (inklusif)")
	delayFlag := flag.Int("delay", 600, "Delay ms antar request ke quran.com")
	flag.Parse()

	// Sama seperti main.go: prefer .env.local, fallback ke .env.
	loaded := false
	for _, f := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(f); err == nil {
			log.Printf("Config loaded: %s\n", f)
			loaded = true
			break
		}
	}
	if !loaded {
		log.Fatal("Tidak ada file .env.local atau .env ditemukan. Jalankan dari folder services/api/")
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
		log.Fatalf("Koneksi DB gagal: %v", err)
	}

	imp := &Importer{
		db:     db,
		client: &http.Client{Timeout: 30 * time.Second},
		delay:  time.Duration(*delayFlag) * time.Millisecond,
	}
	imp.buildAyahIndex()

	from, to := *fromFlag, *toFlag
	if *surahFlag > 0 {
		from, to = *surahFlag, *surahFlag
	}
	if from < 1 {
		from = 1
	}
	if to > 114 {
		to = 114
	}

	log.Printf("Import mufrodat surah %d–%d (delay %dms)...\n", from, to, *delayFlag)
	start := time.Now()
	totalWords := 0

	for s := from; s <= to; s++ {
		n, err := imp.importSurah(s)
		if err != nil {
			log.Printf("[surah %d] ERROR: %v\n", s, err)
		} else {
			log.Printf("[surah %3d] %d kata", s, n)
		}
		totalWords += n
		if s < to {
			time.Sleep(imp.delay)
		}
	}

	log.Printf("\nSelesai: %d kata dari surah %d–%d dalam %.1fs",
		totalWords, from, to, time.Since(start).Seconds())
}
