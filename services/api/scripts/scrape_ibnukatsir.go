//go:build ignore

// Scraper Tafsir Ibnu Katsir (Abridged, English) dari qurancdn.com
// Source: quran.com / qurancdn.com API, tafsir ID 169 (Ibn Kathir Abridged)
//
// Output: ./data/ibnukatsir/{surah}.json
//
//	tiap file: array of {"verse_key":"1:1","text":"...stripped HTML..."}
//
// Usage:
//
//	go run scripts/scrape_ibnukatsir.go
//	go run scripts/scrape_ibnukatsir.go -workers 6 -out ./data/ibnukatsir
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
	"regexp"
	"strings"
	"sync"
	"time"
)

const (
	quranCDNBase = "https://api.qurancdn.com/api/qdc/tafsirs/169/by_chapter"
	perPage      = 300
)

type CDNVerse struct {
	VerseKey string `json:"verse_key"`
	Text     string `json:"text"`
}

type cdnResponse struct {
	Tafsirs []struct {
		VerseKey string `json:"verse_key"`
		Text     string `json:"text"`
	} `json:"tafsirs"`
	Pagination struct {
		TotalPages int `json:"total_pages"`
	} `json:"pagination"`
}

var htmlTagRe = regexp.MustCompile(`<[^>]+>`)
var multiSpaceRe = regexp.MustCompile(`\s{2,}`)

func stripHTML(s string) string {
	s = htmlTagRe.ReplaceAllString(s, " ")
	s = strings.ReplaceAll(s, "&nbsp;", " ")
	s = strings.ReplaceAll(s, "&amp;", "&")
	s = strings.ReplaceAll(s, "&lt;", "<")
	s = strings.ReplaceAll(s, "&gt;", ">")
	s = strings.ReplaceAll(s, "&quot;", "\"")
	s = multiSpaceRe.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

func main() {
	workers := flag.Int("workers", 6, "Jumlah goroutine paralel")
	outDir := flag.String("out", "./data/ibnukatsir", "Folder output")
	flag.Parse()

	if err := os.MkdirAll(*outDir, 0755); err != nil {
		log.Fatalf("mkdir: %v", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}

	log.Println("Mulai download Tafsir Ibnu Katsir (114 surah)...")
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

			if err := downloadChapter(client, s, *outDir); err != nil {
				mu.Lock()
				errors++
				mu.Unlock()
				log.Printf("ERROR surah %d: %v", s, err)
			}
		}(surah)
	}

	wg.Wait()
	log.Printf("Selesai dalam %.1fs (%d error)", time.Since(start).Seconds(), errors)
}

func downloadChapter(client *http.Client, surah int, outDir string) error {
	outPath := filepath.Join(outDir, fmt.Sprintf("%d.json", surah))
	if _, err := os.Stat(outPath); err == nil {
		return nil
	}

	url := fmt.Sprintf("%s/%d?per_page=%d", quranCDNBase, surah, perPage)
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

	var cdn cdnResponse
	if err := json.Unmarshal(body, &cdn); err != nil {
		return fmt.Errorf("parse: %w", err)
	}

	if len(cdn.Tafsirs) == 0 {
		return fmt.Errorf("empty tafsir")
	}

	// Strip HTML from text
	verses := make([]CDNVerse, 0, len(cdn.Tafsirs))
	for _, t := range cdn.Tafsirs {
		verses = append(verses, CDNVerse{
			VerseKey: t.VerseKey,
			Text:     stripHTML(t.Text),
		})
	}

	f, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	if err := enc.Encode(verses); err != nil {
		return err
	}

	log.Printf("Surah %3d: %d ayat", surah, len(verses))
	return nil
}
