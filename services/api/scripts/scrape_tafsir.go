//go:build ignore

// Scraper tafsir dari fawazahmed0/quran-api CDN:
//   - ind-jalaladdinalmah : Tafsir Jalalayn (Indonesia) → kemenag slot
//   - ind-muhammadquraish : Tafsir Quraish Shihab (Indonesia) → ibnu_katsir slot
//
// Usage:
//
//	go run scripts/scrape_tafsir.go
//	go run scripts/scrape_tafsir.go -workers 10 -out ./data/tafsir
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const (
	quranAPIBase = "https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions"
)

var editions = []string{
	"ind-jalaladdinalmah", // Jalalayn Indonesian
	"ind-muhammadquraish", // Quraish Shihab
}

type VerseRow struct {
	Chapter int    `json:"chapter"`
	Verse   int    `json:"verse"`
	Text    string `json:"text"`
}

type SurahFile struct {
	Chapter []VerseRow `json:"chapter"`
}

func main() {
	workers := flag.Int("workers", 8, "Jumlah goroutine paralel")
	outDir := flag.String("out", "./data/tafsir", "Folder output")
	flag.Parse()

	client := &http.Client{Timeout: 30 * time.Second}

	for _, edition := range editions {
		dir := filepath.Join(*outDir, edition)
		if err := os.MkdirAll(dir, 0755); err != nil {
			log.Fatalf("mkdir %s: %v", dir, err)
		}

		log.Printf("[%s] Mulai download 114 surah...", edition)
		start := time.Now()

		sem := make(chan struct{}, *workers)
		var wg sync.WaitGroup
		var mu sync.Mutex
		errors := 0

		for surah := 1; surah <= 114; surah++ {
			wg.Add(1)
			sem <- struct{}{}
			go func(s int) {
				defer wg.Done()
				defer func() { <-sem }()

				if err := downloadSurah(client, edition, s, dir); err != nil {
					mu.Lock()
					errors++
					mu.Unlock()
					log.Printf("[%s] ERROR surah %d: %v", edition, s, err)
				}
			}(surah)
		}

		wg.Wait()
		log.Printf("[%s] Selesai dalam %.1fs (%d error)", edition, time.Since(start).Seconds(), errors)
	}

	log.Println("Semua scraping selesai!")
}

func downloadSurah(client *http.Client, edition string, surah int, outDir string) error {
	outPath := filepath.Join(outDir, fmt.Sprintf("%d.json", surah))

	// Skip jika sudah ada
	if _, err := os.Stat(outPath); err == nil {
		return nil
	}

	url := fmt.Sprintf("%s/%s/%d.json", quranAPIBase, edition, surah)
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// Validasi parse
	var sf SurahFile
	if err := json.Unmarshal(body, &sf); err != nil {
		return fmt.Errorf("parse: %w", err)
	}
	if len(sf.Chapter) == 0 {
		return fmt.Errorf("chapter kosong")
	}

	if err := os.WriteFile(outPath, body, 0644); err != nil {
		return err
	}

	log.Printf("[%s] surah %3d: %d ayat", edition, surah, len(sf.Chapter))
	return nil
}
