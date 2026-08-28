//go:build ignore

// Scraper Tafsir Ibnu Katsir (Ringkas) Indonesia dari tafsirweb.com
// Source: tafsirweb.com — konten berlabel "Tafsir Ibnu Katsir (Ringkas) / Fathul Karim"
//
// Memerlukan file URL mapping: ./data/tafsirweb_urls.json
// (Jalankan scripts/gen_tafsirweb_urls.py terlebih dahulu untuk generate file ini)
//
// Output: ./data/tafsirweb/{surah_number}/{ayat}.json
//
//	tiap file: {"surah": N, "ayat": N, "text": "...tafsir ibnu katsir..."}
//
// Usage:
//
//	go run scripts/scrape_tafsirweb.go
//	go run scripts/scrape_tafsirweb.go -workers 4 -out ./data/tafsirweb
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

type URLEntry struct {
	Surah string `json:"surah"`
	Ayat  int    `json:"ayat"`
	ID    int    `json:"id"`
	URL   string `json:"url"`
}

type AyatResult struct {
	Surah int    `json:"surah"`
	Ayat  int    `json:"ayat"`
	Text  string `json:"text"`
}

var (
	htmlTagRe    = regexp.MustCompile(`<[^>]+>`)
	entityRe     = regexp.MustCompile(`&#\d+;`)
	multiSpaceRe = regexp.MustCompile(`\s{2,}`)
)

func stripHTML(s string) string {
	s = htmlTagRe.ReplaceAllString(s, " ")
	s = entityRe.ReplaceAllString(s, "")
	s = strings.ReplaceAll(s, "&nbsp;", " ")
	s = strings.ReplaceAll(s, "&amp;", "&")
	s = strings.ReplaceAll(s, "&lt;", "<")
	s = strings.ReplaceAll(s, "&gt;", ">")
	s = strings.ReplaceAll(s, "&quot;", "\"")
	s = multiSpaceRe.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

// extractIbnuKatsir finds the Ibnu Katsir section on a tafsirweb page.
func extractIbnuKatsir(html string) string {
	lower := strings.ToLower(html)
	idx := strings.Index(lower, "ibnu katsir")
	if idx == -1 {
		return ""
	}

	after := html[idx:]

	// Find the end: next book icon (📚) or end of article
	nextBook := strings.Index(after[50:], "&#128218")
	nextH2 := strings.Index(after[50:], "<h2")
	articleEnd := strings.Index(after[50:], "</article>")

	end := len(after)
	for _, pos := range []int{nextBook, nextH2, articleEnd} {
		if pos > 0 && (50+pos) < end {
			end = 50 + pos
		}
	}

	snippet := after[:end]
	text := stripHTML(snippet)

	// Remove the label prefix "Ibnu Katsir (Ringkas) / Fathul Karim..."
	// Keep everything after the first sentence of the label (ends at 'Madinah' or 'Katsir')
	if labelEnd := strings.Index(text, "Madinah"); labelEnd > 0 && labelEnd < 300 {
		text = strings.TrimSpace(text[labelEnd+len("Madinah"):])
	} else if colon := strings.Index(text, ":"); colon > 0 && colon < 200 {
		// If there's a colon soon after the label, split there
		after2 := strings.TrimSpace(text[colon+1:])
		if len(after2) > 50 {
			text = after2
		}
	}

	return strings.TrimSpace(text)
}

func main() {
	urlFile := flag.String("urls", "./data/tafsirweb_urls.json", "File URL list dari gen_tafsirweb_urls.py")
	mappingFile := flag.String("mapping", "./data/tafsirweb_mapping.json", "File slug→surah mapping")
	outDir := flag.String("out", "./data/tafsirweb", "Folder output")
	workers := flag.Int("workers", 4, "Goroutine paralel (jangan terlalu tinggi, bisa kena rate limit)")
	flag.Parse()

	// Load URL list
	urlData, err := os.ReadFile(*urlFile)
	if err != nil {
		log.Fatalf("gagal baca %s: %v", *urlFile, err)
	}
	var entries []URLEntry
	if err := json.Unmarshal(urlData, &entries); err != nil {
		log.Fatalf("parse urls: %v", err)
	}

	// Load slug→surah mapping
	mapData, err := os.ReadFile(*mappingFile)
	if err != nil {
		log.Fatalf("gagal baca %s: %v", *mappingFile, err)
	}
	var slugMapping map[string]int
	if err := json.Unmarshal(mapData, &slugMapping); err != nil {
		log.Fatalf("parse mapping: %v", err)
	}

	// Create output dirs
	for surahNum := 1; surahNum <= 114; surahNum++ {
		if err := os.MkdirAll(filepath.Join(*outDir, fmt.Sprintf("%d", surahNum)), 0o755); err != nil {
			log.Fatalf("mkdir: %v", err)
		}
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	log.Printf("Mulai scraping %d ayat dari tafsirweb.com...", len(entries))
	start := time.Now()

	type job struct {
		entry    URLEntry
		surahNum int
	}

	jobs := make([]job, 0, len(entries))
	for _, e := range entries {
		surahNum, ok := slugMapping[e.Surah]
		if !ok {
			log.Printf("WARN: no mapping for %s", e.Surah)
			continue
		}
		jobs = append(jobs, job{e, surahNum})
	}

	sem := make(chan struct{}, *workers)
	var wg sync.WaitGroup
	var mu sync.Mutex
	errors := 0
	done := 0

	for _, j := range jobs {
		wg.Add(1)
		sem <- struct{}{}
		go func(j job) {
			defer wg.Done()
			defer func() { <-sem }()

			outPath := filepath.Join(*outDir, fmt.Sprintf("%d", j.surahNum), fmt.Sprintf("%d.json", j.entry.Ayat))
			if _, err := os.Stat(outPath); err == nil {
				mu.Lock()
				done++
				mu.Unlock()
				return
			}

			text, err := scrapeAyat(client, j.entry.URL)
			mu.Lock()
			defer mu.Unlock()
			done++
			if err != nil {
				errors++
				log.Printf("ERROR [%d:%d] %v", j.surahNum, j.entry.Ayat, err)
				return
			}

			result := AyatResult{Surah: j.surahNum, Ayat: j.entry.Ayat, Text: text}
			f, err := os.Create(outPath)
			if err != nil {
				errors++
				return
			}
			enc := json.NewEncoder(f)
			enc.SetEscapeHTML(false)
			enc.Encode(result)
			f.Close()

			if done%500 == 0 {
				log.Printf("Progress: %d/%d (%.0f%%), errors: %d, elapsed: %.1fs",
					done, len(jobs), float64(done)/float64(len(jobs))*100,
					errors, time.Since(start).Seconds())
			}
		}(j)

		// Small sleep between requests to be polite
		time.Sleep(50 * time.Millisecond)
	}

	wg.Wait()
	log.Printf("Selesai: %d ayat, %d error, %.1fs", done, errors, time.Since(start).Seconds())
}

func scrapeAyat(client *http.Client, url string) (string, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36")
	req.Header.Set("Accept", "text/html")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	text := extractIbnuKatsir(string(body))
	if text == "" {
		return "", fmt.Errorf("ibnu katsir content not found")
	}

	return text, nil
}
