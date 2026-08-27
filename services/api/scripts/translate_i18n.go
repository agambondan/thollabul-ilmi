//go:build ignore

// Translate Translation.Idn → Translation.En using MyMemory free API (no key needed).
// Only processes records where En IS NULL and Idn IS NOT NULL.
// Safe to re-run — skips already-translated records.
//
// Usage:
//
//	go run scripts/translate_i18n.go
//	DB_HOST=localhost DB_PORT=54320 DB_USER=postgres DB_PASS=postgres DB_NAME=thullabul_ilmi go run scripts/translate_i18n.go
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

const (
	myMemoryAPI   = "https://api.mymemory.translated.net/get"
	googleTransGW = "https://translate.googleapis.com/translate_a/single"
	// Max chars per request
	maxCharsPerRequest = 400
	// Polite delay between requests
	requestDelay = 200 * time.Millisecond
)

type myMemoryResponse struct {
	ResponseData struct {
		TranslatedText string  `json:"translatedText"`
		Match          float64 `json:"match"`
	} `json:"responseData"`
	ResponseStatus  int    `json:"responseStatus"`
	ResponseDetails string `json:"responseDetails"`
}

func truncate(text string) string {
	if len(text) <= maxCharsPerRequest {
		return text
	}
	t := text[:maxCharsPerRequest]
	if idx := strings.LastIndex(t, " "); idx > 200 {
		return t[:idx]
	}
	return t
}

func translateViaMyMemory(client *http.Client, text string) (string, error) {
	reqURL := fmt.Sprintf("%s?q=%s&langpair=id|en", myMemoryAPI, url.QueryEscape(text))
	resp, err := client.Get(reqURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var mr myMemoryResponse
	if err := json.Unmarshal(body, &mr); err != nil {
		return "", fmt.Errorf("parse: %w", err)
	}
	if mr.ResponseStatus != 200 {
		return "", fmt.Errorf("status %d: %s", mr.ResponseStatus, mr.ResponseDetails)
	}
	return strings.TrimSpace(mr.ResponseData.TranslatedText), nil
}

// translateViaGoogle uses the unofficial Google Translate gateway (no key needed).
// Response: [[["translated","source",...]], ...]
func translateViaGoogle(client *http.Client, text string) (string, error) {
	reqURL := fmt.Sprintf("%s?client=gtx&sl=id&tl=en&dt=t&q=%s",
		googleTransGW, url.QueryEscape(text))
	resp, err := client.Get(reqURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	// Parse [[["translation","source",...]], ...]
	var raw [][][]interface{}
	if err := json.Unmarshal(body, &raw); err != nil {
		// Try broader unmarshal
		var anyRaw []interface{}
		if err2 := json.Unmarshal(body, &anyRaw); err2 != nil {
			return "", fmt.Errorf("parse: %w", err)
		}
		if len(anyRaw) == 0 {
			return "", fmt.Errorf("empty response")
		}
		// Try to get first segment
		segs, ok := anyRaw[0].([]interface{})
		if !ok || len(segs) == 0 {
			return "", fmt.Errorf("unexpected structure")
		}
		seg0, ok := segs[0].([]interface{})
		if !ok || len(seg0) == 0 {
			return "", fmt.Errorf("unexpected segment")
		}
		t, _ := seg0[0].(string)
		return strings.TrimSpace(t), nil
	}

	if len(raw) == 0 || len(raw[0]) == 0 || len(raw[0][0]) == 0 {
		return "", fmt.Errorf("empty response")
	}
	t, _ := raw[0][0][0].(string)
	return strings.TrimSpace(t), nil
}

func translateID2EN(client *http.Client, text string) (string, error) {
	if text == "" {
		return "", nil
	}
	text = truncate(text)

	// Try Google Translate first (no key, reliable)
	result, err := translateViaGoogle(client, text)
	if err == nil && result != "" {
		return result, nil
	}
	googleErr := err

	// Fallback: MyMemory
	result, err = translateViaMyMemory(client, text)
	if err == nil && result != "" {
		return result, nil
	}

	return "", fmt.Errorf("Google: %v | MyMemory: %v", googleErr, err)
}

func main() {
	batchSize := flag.Int("batch", 50, "Records per run (MyMemory free: ~500 words/request, 5000 words/day)")
	flag.Parse()

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

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Warn),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("koneksi DB gagal: %v", err)
	}

	// Only fetch translation records that belong to our i18n models
	// (translation_id references from these tables)
	targetIDs := collectTargetIDs(db)
	if len(targetIDs) == 0 {
		log.Println("Tidak ada Translation record yang perlu diproses.")
		return
	}
	log.Printf("Ditemukan %d Translation IDs dari tabel i18n", len(targetIDs))

	var records []model.Translation
	db.Where("id IN ? AND ((en IS NULL AND idn IS NOT NULL) OR (description_en IS NULL AND description_idn IS NOT NULL))", targetIDs).
		Order("id DESC").
		Limit(*batchSize).
		Find(&records)

	if len(records) == 0 {
		log.Println("Semua record sudah diterjemahkan.")
		return
	}
	log.Printf("Memproses %d records (dari total %d yang belum diterjemahkan)...", len(records), len(targetIDs))

	client := &http.Client{Timeout: 15 * time.Second}
	start := time.Now()
	ok, fail := 0, 0

	for i, r := range records {
		updates := map[string]interface{}{}

		if (r.En == nil || *r.En == "") && r.Idn != nil && *r.Idn != "" {
			translated, err := translateID2EN(client, *r.Idn)
			if err != nil {
				log.Printf("[%d/%d] ID %d (idn) ERROR: %v", i+1, len(records), *r.ID, err)
				fail++
				time.Sleep(requestDelay * 3)
				continue
			}
			updates["en"] = translated
			time.Sleep(requestDelay)
		}

		if (r.DescriptionEn == nil || *r.DescriptionEn == "") && r.DescriptionIdn != nil && *r.DescriptionIdn != "" {
			translated, err := translateID2EN(client, *r.DescriptionIdn)
			if err != nil {
				log.Printf("[%d/%d] ID %d (description_idn) ERROR: %v", i+1, len(records), *r.ID, err)
				fail++
				time.Sleep(requestDelay * 3)
				continue
			}
			updates["description_en"] = translated
			time.Sleep(requestDelay)
		}

		if len(updates) == 0 {
			continue
		}

		if err := db.Model(&r).Updates(updates).Error; err != nil {
			log.Printf("[%d/%d] ID %d DB error: %v", i+1, len(records), *r.ID, err)
			fail++
			continue
		}

		ok++
		if ok%10 == 0 {
			log.Printf("Progress: %d/%d translated, %d error, %.1fs elapsed",
				ok, len(records), fail, time.Since(start).Seconds())
		}
	}

	log.Printf("Selesai: %d berhasil, %d gagal, %.1fs", ok, fail, time.Since(start).Seconds())
	if fail > 0 {
		log.Println("Re-run script untuk mencoba ulang yang gagal.")
	}
}

// collectTargetIDs mengumpulkan semua translation_id dari ke-14 tabel i18n.
func collectTargetIDs(db *gorm.DB) []int {
	ids := make(map[int]struct{})

	queries := []string{
		"SELECT translation_id FROM doa WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM dzikir WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM manasik_step WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM sholat_guide WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM tahlil_item WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM asbabun_nuzul WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM fiqh_category WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM fiqh_item WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM siroh_category WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM siroh_content WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM quiz WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM islamic_term WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM amalan_item WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM kajian WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM history_event WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM blog_category WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM blog_tag WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM blog_post WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM asma_ul_husna WHERE translation_id IS NOT NULL",
		"SELECT translation_id FROM islamic_event WHERE translation_id IS NOT NULL",
	}

	for _, q := range queries {
		var rawIDs []int
		db.Raw(q).Scan(&rawIDs)
		for _, id := range rawIDs {
			ids[id] = struct{}{}
		}
	}

	result := make([]int, 0, len(ids))
	for id := range ids {
		result = append(result, id)
	}
	return result
}
