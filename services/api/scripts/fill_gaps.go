//go:build ignore

// fill_gaps.go — mengisi celah data di file hadits_*.json
//
// Sumber pengisian:
//  1. gadingnst/hadith-api (GitHub raw) → mengisi field `idn` yang kosong
//     untuk 7 kitab fawazahmed0: bukhari, muslim, abudaud, tirmidzi,
//     nasai, ibnumajah, malik
//  2. sunnah.com (HTML scraping) → mengisi `en` dan `section_no`/`section_en`
//     untuk Ahmad (hanya hadits nomor 1–1438 yang tersedia terjemahan Inggris)
//
// Note:
//   - Darimi English: sunnah.com menyatakan "has not been translated into English yet"
//     → tidak ada sumber gratis yang valid, field en tetap kosong
//   - Ahmad/Darimi section_en: Darimi tidak tersedia dalam bahasa Inggris di sunnah.com
//     3. sunnah.com (per-hadith lookup) → mengisi section_no/section_en untuk hadits
//     di fawazahmed0 books yang section_no=0 (Reference.Book=0 di sumber asli)
//
// Usage:
//
//	go run scripts/fill_gaps.go
//	go run scripts/fill_gaps.go -data ./data -workers 10
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
	"strconv"
	"strings"
	"sync"
	"time"
)

// HadithRow harus sama dengan yang di scrape_all.go
type HadithRow struct {
	Number    int    `json:"number"`
	Imam      string `json:"imam"`
	SectionNo int    `json:"section_no"`
	SectionEn string `json:"section_en"`
	Ar        string `json:"ar"`
	Idn       string `json:"idn"`
	En        string `json:"en"`
}

// gadingnst slug mapping: slug kita → nama file di gadingnst GitHub raw
var gadingnstSlug = map[string]string{
	"bukhari":   "bukhari",
	"muslim":    "muslim",
	"abudaud":   "abu-daud",
	"tirmidzi":  "tirmidzi",
	"nasai":     "nasai",
	"ibnumajah": "ibnu-majah",
	"malik":     "malik",
}

// sunnah.com slug mapping: slug kita → nama collection di sunnah.com
var sunnahSlug = map[string]string{
	"bukhari":   "bukhari",
	"muslim":    "muslim",
	"abudaud":   "abudawud",
	"tirmidzi":  "tirmidhi",
	"nasai":     "nasai",
	"ibnumajah": "ibnmajah",
	"malik":     "malik",
}

// books with section_no=0 gaps that need sunnah.com lookup
var sectionGapBooks = []string{"bukhari", "muslim", "ibnumajah", "nasai", "malik"}

const (
	gadingnstBase = "https://raw.githubusercontent.com/gadingnst/hadith-api/master/books"
	sunnahBase    = "https://sunnah.com"
)

// Ahmad books tersedia di sunnah.com: book_no → section_name
// Didapat dari https://sunnah.com/ahmad
var ahmadBooks = []int{1, 2, 3, 4, 5, 6, 7}

func main() {
	dataDir := flag.String("data", "./data", "Folder berisi file hadits_*.json")
	workers := flag.Int("workers", 5, "Jumlah goroutine paralel")
	skipPhase := flag.String("skip", "", "Lewati phase tertentu, e.g. '12' untuk skip phase 1 dan 2")
	flag.Parse()

	client := &http.Client{Timeout: 30 * time.Second}

	skip := *skipPhase
	sem := make(chan struct{}, *workers)

	// ── Phase 1: Isi idn gaps dari gadingnst ────────────────────────────────
	if !strings.Contains(skip, "1") {
		log.Println("=== Phase 1: Isi idn gaps dari gadingnst ===")
		var wg1 sync.WaitGroup
		for slug := range gadingnstSlug {
			wg1.Add(1)
			sem <- struct{}{}
			go func(s string) {
				defer wg1.Done()
				defer func() { <-sem }()
				fillIdnFromGadingnst(client, s, *dataDir)
			}(slug)
		}
		wg1.Wait()
		log.Println("Phase 1 selesai.")
	}

	// ── Phase 2: Isi Ahmad en+section dari sunnah.com ────────────────────────
	if !strings.Contains(skip, "2") {
		log.Println("=== Phase 2: Isi Ahmad en+section dari sunnah.com ===")
		ahmadPath := filepath.Join(*dataDir, "hadits_ahmad.json")
		if err := fillAhmadFromSunnah(client, ahmadPath); err != nil {
			log.Printf("Ahmad sunnah.com: %v", err)
		}
	}

	// ── Phase 3: Isi section_no=0 gaps via sunnah.com per-hadith lookup ─────
	if !strings.Contains(skip, "3") {
		log.Println("=== Phase 3: Isi section gaps (section_no=0) dari sunnah.com ===")
		var wg3 sync.WaitGroup
		for _, slug := range sectionGapBooks {
			wg3.Add(1)
			sem <- struct{}{}
			go func(s string) {
				defer wg3.Done()
				defer func() { <-sem }()
				fillSectionFromSunnah(client, s, *dataDir, *workers)
			}(slug)
		}
		wg3.Wait()
		log.Println("Phase 3 selesai.")
	}

	log.Println("=== Semua gap-filling selesai ===")
	printGapSummary(*dataDir)
}

// ── Phase 1: gadingnst idn ──────────────────────────────────────────────────

func fillIdnFromGadingnst(client *http.Client, imam, dataDir string) {
	slug := gadingnstSlug[imam]
	url := fmt.Sprintf("%s/%s.json", gadingnstBase, slug)
	log.Printf("[%s] Download gadingnst idn (%s)...", imam, url)

	type gadingnstHadith struct {
		Number int    `json:"number"`
		Arab   string `json:"arab"`
		ID     string `json:"id"`
	}

	resp, err := client.Get(url)
	if err != nil {
		log.Printf("[%s] ERROR download: %v", imam, err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var gadHadiths []gadingnstHadith
	if err := json.Unmarshal(body, &gadHadiths); err != nil {
		log.Printf("[%s] ERROR parse gadingnst: %v", imam, err)
		return
	}

	// Build index by number
	idnMap := make(map[int]string, len(gadHadiths))
	arMap := make(map[int]string, len(gadHadiths))
	for _, h := range gadHadiths {
		if h.ID != "" {
			idnMap[h.Number] = h.ID
		}
		if h.Arab != "" {
			arMap[h.Number] = h.Arab
		}
	}

	// Load existing file
	path := filepath.Join(dataDir, fmt.Sprintf("hadits_%s.json", imam))
	rows, err := loadJSON(path)
	if err != nil {
		log.Printf("[%s] ERROR load file: %v", imam, err)
		return
	}

	filled := 0
	arFilled := 0
	for i, r := range rows {
		if r.Idn == "" {
			if idn, ok := idnMap[r.Number]; ok {
				rows[i].Idn = idn
				filled++
			}
		}
		// Isi ar jika kosong dan gadingnst punya
		if r.Ar == "" {
			if ar, ok := arMap[r.Number]; ok {
				rows[i].Ar = ar
				arFilled++
			}
		}
	}

	if err := saveJSON(rows, path); err != nil {
		log.Printf("[%s] ERROR save: %v", imam, err)
		return
	}
	log.Printf("[%s] ✓ idn filled=%d, ar filled=%d (dari %d gadingnst records)",
		imam, filled, arFilled, len(gadHadiths))
}

// ── Phase 2: Ahmad English + section dari sunnah.com ─────────────────────────

// ahmadBookInfo menyimpan hasil scraping per book sunnah.com/ahmad/{N}
type hadithInfo struct {
	en        string
	sectionNo int
	sectionEn string
}

func fillAhmadFromSunnah(client *http.Client, path string) error {
	rows, err := loadJSON(path)
	if err != nil {
		return fmt.Errorf("load: %w", err)
	}

	// Scrape semua book pages untuk mendapatkan mapping number → info
	infoMap := make(map[int]hadithInfo)

	for _, bookNo := range ahmadBooks {
		url := fmt.Sprintf("%s/ahmad/%d", sunnahBase, bookNo)
		log.Printf("[ahmad] Scraping sunnah.com/ahmad/%d...", bookNo)

		time.Sleep(300 * time.Millisecond)
		info, err := scrapeAhmadBook(client, url, bookNo)
		if err != nil {
			log.Printf("[ahmad] WARNING book %d: %v", bookNo, err)
			continue
		}
		for num, h := range info {
			infoMap[num] = h
		}
		log.Printf("[ahmad] ✓ book %d: %d hadiths scraped", bookNo, len(info))
	}

	// Fill gaps
	enFilled := 0
	secFilled := 0
	for i, r := range rows {
		if info, ok := infoMap[r.Number]; ok {
			if r.En == "" && info.en != "" {
				rows[i].En = info.en
				enFilled++
			}
			if r.SectionNo == 0 && info.sectionNo > 0 {
				rows[i].SectionNo = info.sectionNo
				rows[i].SectionEn = info.sectionEn
				secFilled++
			}
		}
	}

	if err := saveJSON(rows, path); err != nil {
		return fmt.Errorf("save: %w", err)
	}
	log.Printf("[ahmad] ✓ en filled=%d, section filled=%d (dari %d sunnah.com hadiths)",
		enFilled, secFilled, len(infoMap))
	return nil
}

// Regex precompiled
var (
	reMusnадNum   = regexp.MustCompile(`Musnad Ahmad (\d+)`)
	reEnFull      = regexp.MustCompile(`class="english_hadith_full">(.*?)</div>\s*</div>`)
	reEnHtc       = regexp.MustCompile(`id=htc(\d+)>(.*?)(?:id=htc\d+|</div>\s*</div>\s*</div>\s*</div>)`)
	reBookEnName  = regexp.MustCompile(`(?s)class="book_page_english_name"[^>]*>(.*?)</div>`)
	reStripTags   = regexp.MustCompile(`<[^>]+>`)
	reEnContainer = regexp.MustCompile(`id=t(\d+)>.*?class="english_hadith_full">(.*?)</div>\s*</div>`)
	reHtcBlock    = regexp.MustCompile(`(?s)class="hadithTextContainers"[^>]*id=htc(\d+)>(.*?)(?:class="hadithTextContainers"|$)`)
	reRefNum      = regexp.MustCompile(`reference_sticky">\s*Musnad Ahmad\s+(\d+)`)
	reHtcID       = regexp.MustCompile(`id=htc(\d+)`)
)

func scrapeAhmadBook(client *http.Client, url string, bookNo int) (map[int]hadithInfo, error) {
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	html := string(body)

	// Section name
	sectionEn := ""
	if m := reBookEnName.FindStringSubmatch(html); m != nil {
		sectionEn = strings.TrimSpace(reStripTags.ReplaceAllString(m[1], ""))
	}

	// Extract per-hadith blocks
	// Each block: id=htc{N}>{english_hadith_full}
	// We need to match hadith_number (from reference_sticky) to english text
	//
	// Strategy: split by "reference_sticky" to find hadith numbers, then
	// find the adjacent english_hadith_full content

	result := make(map[int]hadithInfo)

	// Find all reference sticky numbers and their positions
	refMatches := reRefNum.FindAllStringSubmatchIndex(html, -1)
	if len(refMatches) == 0 {
		return result, nil
	}

	// Find all english_hadith_full blocks and their positions
	type enBlock struct {
		pos  int
		text string
	}
	enBlockRe := regexp.MustCompile(`(?s)class="english_hadith_full">(.*?)</div>\s*</div>`)
	var enBlocks []enBlock
	for _, m := range enBlockRe.FindAllStringSubmatchIndex(html, -1) {
		text := strings.TrimSpace(reStripTags.ReplaceAllString(html[m[2]:m[3]], " "))
		text = strings.Join(strings.Fields(text), " ")
		enBlocks = append(enBlocks, enBlock{m[0], text})
	}

	if len(enBlocks) == 0 {
		return result, nil
	}

	// For each reference, find the closest english block AFTER it
	for idx, refM := range refMatches {
		numStr := html[refM[2]:refM[3]]
		num, _ := strconv.Atoi(numStr)
		if num == 0 {
			continue
		}

		// Position of this reference
		refPos := refM[0]
		// Upper bound: next reference
		var upperBound int
		if idx+1 < len(refMatches) {
			upperBound = refMatches[idx+1][0]
		} else {
			upperBound = len(html)
		}

		// Find english block between refPos and upperBound
		for _, eb := range enBlocks {
			if eb.pos >= refPos && eb.pos < upperBound {
				result[num] = hadithInfo{
					en:        eb.text,
					sectionNo: bookNo,
					sectionEn: sectionEn,
				}
				break
			}
		}
	}

	return result, nil
}

// ── Phase 3: section lookup via sunnah.com per-hadith ────────────────────────

// fillSectionFromSunnah fetches section name for every hadith with section_no=0
// using concurrent requests to sunnah.com/{collection}:{number}.
func fillSectionFromSunnah(client *http.Client, imam, dataDir string, concurrency int) {
	collection, ok := sunnahSlug[imam]
	if !ok {
		log.Printf("[%s] no sunnah.com slug, skip", imam)
		return
	}

	path := filepath.Join(dataDir, fmt.Sprintf("hadits_%s.json", imam))
	rows, err := loadJSON(path)
	if err != nil {
		log.Printf("[%s] ERROR load: %v", imam, err)
		return
	}

	// Collect indices needing lookup
	var targets []int
	for i, r := range rows {
		if r.SectionNo == 0 && r.SectionEn == "" {
			targets = append(targets, i)
		}
	}
	if len(targets) == 0 {
		log.Printf("[%s] no section gaps, skip", imam)
		return
	}
	log.Printf("[%s] filling section for %d hadiths via sunnah.com...", imam, len(targets))

	type result struct {
		idx       int
		sectionNo int
		sectionEn string
	}

	reColl := regexp.MustCompile(`(?s)class="book_page_english_name"[^>]*>(.*?)</div>`)
	reBookN := regexp.MustCompile(`href="/` + collection + `/(\d+)"`)

	sem2 := make(chan struct{}, concurrency)
	out := make(chan result, len(targets))

	for _, idx := range targets {
		sem2 <- struct{}{}
		go func(i int) {
			defer func() { <-sem2 }()
			r := rows[i]
			url := fmt.Sprintf("%s/%s:%d", sunnahBase, collection, r.Number)

			resp, err := client.Get(url)
			if err != nil {
				out <- result{i, 0, ""}
				return
			}
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			html := string(body)

			sectionEn := ""
			if m := reColl.FindStringSubmatch(html); m != nil {
				sectionEn = strings.TrimSpace(reStripTags.ReplaceAllString(m[1], ""))
			}
			sectionNo := 0
			if m := reBookN.FindStringSubmatch(html); m != nil {
				sectionNo, _ = strconv.Atoi(m[1])
			}
			out <- result{i, sectionNo, sectionEn}
		}(idx)
	}

	filled := 0
	for range targets {
		res := <-out
		if res.sectionNo > 0 || res.sectionEn != "" {
			rows[res.idx].SectionNo = res.sectionNo
			rows[res.idx].SectionEn = res.sectionEn
			filled++
		}
	}

	if err := saveJSON(rows, path); err != nil {
		log.Printf("[%s] ERROR save: %v", imam, err)
		return
	}
	log.Printf("[%s] ✓ section filled=%d/%d", imam, filled, len(targets))
}

// ── Helpers ──────────────────────────────────────────────────────────────────

func loadJSON(path string) ([]HadithRow, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	var rows []HadithRow
	if err := json.NewDecoder(f).Decode(&rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func saveJSON(rows []HadithRow, path string) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	return enc.Encode(rows)
}

func printGapSummary(dataDir string) {
	books := []string{"abudaud", "ahmad", "bukhari", "darimi", "ibnumajah", "malik", "muslim", "nasai", "tirmidzi"}
	fmt.Println("\n=== Gap Summary After Fill ===")
	fmt.Printf("%-12s %6s %8s %8s %8s %8s\n", "book", "total", "ar_miss", "idn_miss", "en_miss", "sec_miss")
	for _, b := range books {
		path := filepath.Join(dataDir, fmt.Sprintf("hadits_%s.json", b))
		rows, err := loadJSON(path)
		if err != nil {
			continue
		}
		arM, idnM, enM, secM := 0, 0, 0, 0
		for _, r := range rows {
			if r.Ar == "" {
				arM++
			}
			if r.Idn == "" {
				idnM++
			}
			if r.En == "" {
				enM++
			}
			if r.SectionEn == "" {
				secM++
			}
		}
		fmt.Printf("%-12s %6d %8d %8d %8d %8d\n", b, len(rows), arM, idnM, enM, secM)
	}
}
