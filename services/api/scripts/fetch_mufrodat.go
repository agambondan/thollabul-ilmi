//go:build ignore

// Fetch data per-kata (mufrodat) dari Quran.com API v4 dan simpan ke data/mufrodat.json.
// Tidak butuh koneksi DB — cukup dijalankan sekali dan file di-commit ke git.
//
// Usage:
//
//	go run scripts/fetch_mufrodat.go
//	go run scripts/fetch_mufrodat.go -from 1 -to 10
//	go run scripts/fetch_mufrodat.go -delay 800 -out data/mufrodat.json
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// ── Quran.com API types ───────────────────────────────────────────────────────

type qcVersesResp struct {
	Verses     []qcVerse     `json:"verses"`
	Pagination *qcPagination `json:"pagination"`
}

type qcVerse struct {
	VerseNumber int      `json:"verse_number"`
	Words       []qcWord `json:"words"`
}

type qcWord struct {
	Position        int     `json:"position"`
	TextUthmani     string  `json:"text_uthmani"`
	CharTypeName    string  `json:"char_type_name"`
	Transliteration *qcText `json:"transliteration"`
	Translation     *qcText `json:"translation"`
}

type qcText struct {
	Text string `json:"text"`
}

type qcPagination struct {
	NextPage *int `json:"next_page"`
}

// ── Output JSON types ─────────────────────────────────────────────────────────

type MufrodatFile struct {
	GeneratedAt string          `json:"generated_at"`
	Entries     []AyahWordEntry `json:"entries"`
}

type AyahWordEntry struct {
	Surah int        `json:"surah"`
	Ayah  int        `json:"ayah"`
	Words []WordItem `json:"words"`
}

type WordItem struct {
	Index           int    `json:"index"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	Indonesian      string `json:"indonesian"`
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

var httpClient = &http.Client{Timeout: 30 * time.Second}

func fetchVerses(surahNum, page int) (*qcVersesResp, error) {
	url := fmt.Sprintf(
		"https://api.quran.com/api/v4/verses/by_chapter/%d"+
			"?words=true"+
			"&word_fields=text_uthmani,transliteration,translation"+
			"&language=id"+
			"&per_page=300"+
			"&page=%d",
		surahNum, page,
	)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "thollabul-ilmi-fetcher/1.0")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("status %d untuk surah %d page %d", resp.StatusCode, surahNum, page)
	}
	var result qcVersesResp
	return &result, json.NewDecoder(resp.Body).Decode(&result)
}

func fetchSurah(surahNum int, delay time.Duration) []AyahWordEntry {
	entries := []AyahWordEntry{}
	page := 1
	for {
		resp, err := fetchVerses(surahNum, page)
		if err != nil {
			log.Printf("[surah %3d] ERROR page %d: %v", surahNum, page, err)
			return entries
		}

		for _, verse := range resp.Verses {
			entry := AyahWordEntry{Surah: surahNum, Ayah: verse.VerseNumber}
			wordIdx := 0
			for _, w := range verse.Words {
				if w.CharTypeName != "word" {
					continue
				}
				wordIdx++
				arabic := strings.TrimSpace(w.TextUthmani)
				if arabic == "" {
					continue
				}
				item := WordItem{
					Index:  wordIdx,
					Arabic: arabic,
				}
				if w.Transliteration != nil {
					item.Transliteration = strings.TrimSpace(w.Transliteration.Text)
				}
				if w.Translation != nil {
					item.Indonesian = strings.TrimSpace(w.Translation.Text)
				}
				entry.Words = append(entry.Words, item)
			}
			entries = append(entries, entry)
		}

		if resp.Pagination == nil || resp.Pagination.NextPage == nil {
			break
		}
		page++
		time.Sleep(delay)
	}
	return entries
}

// ── main ──────────────────────────────────────────────────────────────────────

func main() {
	fromFlag := flag.Int("from", 1, "Mulai dari surah")
	toFlag := flag.Int("to", 114, "Sampai surah")
	delayFlag := flag.Int("delay", 600, "Delay ms antar request")
	outFlag := flag.String("out", "data/mufrodat.json", "Output file path")
	flag.Parse()

	delay := time.Duration(*delayFlag) * time.Millisecond

	// Load existing file jika ada (untuk resume partial)
	output := MufrodatFile{GeneratedAt: time.Now().UTC().Format(time.RFC3339)}
	if f, err := os.Open(*outFlag); err == nil {
		_ = json.NewDecoder(f).Decode(&output)
		f.Close()
		log.Printf("Loaded %d existing entries from %s", len(output.Entries), *outFlag)
	}

	// Build set dari (surah, ayah) yang sudah ada
	existing := map[string]bool{}
	for _, e := range output.Entries {
		existing[fmt.Sprintf("%d:%d", e.Surah, e.Ayah)] = true
	}

	start := time.Now()
	totalWords := 0

	for s := *fromFlag; s <= *toFlag; s++ {
		entries := fetchSurah(s, delay)
		for _, e := range entries {
			key := fmt.Sprintf("%d:%d", e.Surah, e.Ayah)
			if !existing[key] {
				output.Entries = append(output.Entries, e)
				existing[key] = true
			}
			totalWords += len(e.Words)
		}
		log.Printf("[surah %3d] %d ayahs, %d kata total", s, len(entries), totalWords)
		if s < *toFlag {
			time.Sleep(delay)
		}
	}

	output.GeneratedAt = time.Now().UTC().Format(time.RFC3339)
	f, err := os.Create(*outFlag)
	if err != nil {
		log.Fatalf("Create %s: %v", *outFlag, err)
	}
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(output); err != nil {
		log.Fatalf("Encode JSON: %v", err)
	}
	log.Printf("Selesai: %d kata dari surah %d–%d dalam %.1fs → %s",
		totalWords, *fromFlag, *toFlag, time.Since(start).Seconds(), *outFlag)
}
