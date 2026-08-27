//go:build ignore

// Scraper hadits dari dua sumber:
// - fawazahmed0/hadith-api (CDN): 7 kitab → Arabic + Indonesia (penuh) + English + section names
// - gadingnst/hadith-api (GitHub raw): Ahmad + Darimi → Arabic + Indonesia
//
// Usage:
//
//	go run scripts/scrape_all.go
//	go run scripts/scrape_all.go -imam bukhari
//	go run scripts/scrape_all.go -workers 20
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

// HadithRow adalah format output JSON per hadits, sesuai schema tholabul-ilmi
type HadithRow struct {
	Number    int    `json:"number"`
	Imam      string `json:"imam"`
	SectionNo int    `json:"section_no"` // chapter number dari fawazahmed0 reference.book
	SectionEn string `json:"section_en"` // chapter name dalam bahasa Inggris
	Ar        string `json:"ar"`         // teks Arab → Translation.Ar
	Idn       string `json:"idn"`        // terjemah Indonesia → Translation.Idn
	En        string `json:"en"`         // terjemah Inggris → Translation.En
}

// Mapping slug kita → nama di fawazahmed0 CDN
var fawazBooks = map[string]string{
	"bukhari":   "bukhari",
	"muslim":    "muslim",
	"abudaud":   "abudawud",
	"tirmidzi":  "tirmidhi",
	"nasai":     "nasai",
	"ibnumajah": "ibnmajah",
	"malik":     "malik",
}

// Mapping slug kita → nama di gadingnst GitHub raw
var gadingnstBooks = map[string]string{
	"ahmad":  "ahmad",
	"darimi": "darimi",
}

const (
	fawazBase     = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions"
	gadingnstBase = "https://raw.githubusercontent.com/gadingnst/hadith-api/master/books"
)

func main() {
	imamFlag := flag.String("imam", "", "Scrape hanya satu imam")
	workers := flag.Int("workers", 6, "Jumlah goroutine paralel per edisi")
	outDir := flag.String("out", "./data", "Folder output")
	flag.Parse()

	if err := os.MkdirAll(*outDir, 0755); err != nil {
		log.Fatalf("mkdir: %v", err)
	}

	client := &http.Client{Timeout: 60 * time.Second}

	allBooks := []string{"bukhari", "muslim", "abudaud", "tirmidzi", "nasai", "ibnumajah", "malik", "ahmad", "darimi"}
	if *imamFlag != "" {
		allBooks = []string{*imamFlag}
	}

	var wg sync.WaitGroup
	sem := make(chan struct{}, *workers)

	for _, imam := range allBooks {
		wg.Add(1)
		sem <- struct{}{}
		go func(i string) {
			defer wg.Done()
			defer func() { <-sem }()

			if _, ok := fawazBooks[i]; ok {
				scrapeFawaz(client, i, *outDir)
			} else {
				scrapeGadingnst(client, i, *outDir)
			}
		}(imam)
	}

	wg.Wait()
	log.Println("Semua selesai!")
}

// scrapeFawaz download 3 edisi (ara, ind, eng) dari fawazahmed0 CDN
// lalu merge per hadith number
func scrapeFawaz(client *http.Client, imam, outDir string) {
	fawazName := fawazBooks[imam]
	log.Printf("[%s] Download dari fawazahmed0 (ara+ind+eng)...", imam)

	type fawazHadith struct {
		HadithNumber json.Number `json:"hadithnumber"` // bisa int atau float (e.g. 384.2)
		Text         string      `json:"text"`
		Reference    struct {
			Book   int `json:"book"`
			Hadith int `json:"hadith"`
		} `json:"reference"`
	}
	hadithKey := func(n json.Number) string { return string(n) }
	type sectionDetail struct {
		HadithNumberFirst int `json:"hadithnumber_first"`
	}
	type fawazFile struct {
		Metadata struct {
			Section        map[string]string        `json:"section"`         // per-hadith endpoint
			Sections       map[string]string        `json:"sections"`        // bulk file (sering kosong)
			SectionDetails map[string]sectionDetail `json:"section_details"` // bulk file
		} `json:"metadata"`
		Hadiths []fawazHadith `json:"hadiths"`
	}

	fetchEdition := func(lang string) (*fawazFile, error) {
		url := fmt.Sprintf("%s/%s-%s.min.json", fawazBase, lang, fawazName)
		resp, err := client.Get(url)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		var f fawazFile
		if err := json.Unmarshal(body, &f); err != nil {
			return nil, fmt.Errorf("parse %s: %w", url, err)
		}
		return &f, nil
	}

	// Download paralel
	type editionResult struct {
		lang string
		data *fawazFile
		err  error
	}
	ch := make(chan editionResult, 3)
	for _, lang := range []string{"ara", "ind", "eng"} {
		go func(l string) {
			d, err := fetchEdition(l)
			ch <- editionResult{l, d, err}
		}(lang)
	}

	editions := make(map[string]*fawazFile)
	for i := 0; i < 3; i++ {
		r := <-ch
		if r.err != nil {
			log.Printf("[%s] WARNING edisi %s gagal: %v", imam, r.lang, r.err)
		} else {
			editions[r.lang] = r.data
			log.Printf("[%s] ✓ %s: %d hadits", imam, r.lang, len(r.data.Hadiths))
		}
	}

	// Kumpulkan section_details untuk tahu hadith pertama tiap section
	type secRange struct {
		no          int
		firstHadith int
	}
	var secRanges []secRange
	for _, lang := range []string{"ind", "eng", "ara"} {
		if ed, ok := editions[lang]; ok && len(ed.Metadata.SectionDetails) > 0 {
			for k, v := range ed.Metadata.SectionDetails {
				var n int
				fmt.Sscanf(k, "%d", &n)
				if n > 0 && v.HadithNumberFirst > 0 {
					secRanges = append(secRanges, secRange{n, v.HadithNumberFirst})
				}
			}
			break
		}
	}

	// Fetch section names via per-hadith endpoint (paralel)
	sectionNames := make(map[int]string)
	if len(secRanges) > 0 {
		type secResult struct {
			no   int
			name string
		}
		sch := make(chan secResult, len(secRanges))
		for _, sr := range secRanges {
			go func(s secRange) {
				url := fmt.Sprintf("%s/eng-%s/%d.min.json", fawazBase, fawazName, s.firstHadith)
				resp, err := client.Get(url)
				if err != nil {
					sch <- secResult{s.no, fmt.Sprintf("Section %d", s.no)}
					return
				}
				defer resp.Body.Close()
				body, _ := io.ReadAll(resp.Body)
				var tmp fawazFile
				json.Unmarshal(body, &tmp)
				name := tmp.Metadata.Section[fmt.Sprintf("%d", s.no)]
				if name == "" {
					name = fmt.Sprintf("Section %d", s.no)
				}
				sch <- secResult{s.no, name}
			}(sr)
		}
		for range secRanges {
			r := <-sch
			sectionNames[r.no] = r.name
		}
		log.Printf("[%s] ✓ section names: %d sections", imam, len(sectionNames))
	}

	// Build index: hadithKey → text per language
	type texts struct {
		ar, idn, en string
		number      int
		secNo       int
	}
	textMap := make(map[string]*texts)

	for _, lang := range []string{"ara", "ind", "eng"} {
		ed, ok := editions[lang]
		if !ok {
			continue
		}
		for _, h := range ed.Hadiths {
			k := hadithKey(h.HadithNumber)
			t, exists := textMap[k]
			if !exists {
				n, _ := h.HadithNumber.Float64()
				t = &texts{number: int(n), secNo: h.Reference.Book}
				textMap[k] = t
			}
			switch lang {
			case "ara":
				t.ar = h.Text
			case "ind":
				t.idn = h.Text
			case "eng":
				t.en = h.Text
			}
		}
	}

	// Build output
	rows := make([]HadithRow, 0, len(textMap))
	for _, t := range textMap {
		rows = append(rows, HadithRow{
			Number:    t.number,
			Imam:      imam,
			SectionNo: t.secNo,
			SectionEn: sectionNames[t.secNo],
			Ar:        t.ar,
			Idn:       t.idn,
			En:        t.en,
		})
	}

	saveJSON(rows, imam, outDir)
}

// scrapeGadingnst download dari gadingnst GitHub raw (Ahmad & Darimi)
func scrapeGadingnst(client *http.Client, imam, outDir string) {
	name := gadingnstBooks[imam]
	url := fmt.Sprintf("%s/%s.json", gadingnstBase, name)
	log.Printf("[%s] Download dari gadingnst (%s)...", imam, url)

	resp, err := client.Get(url)
	if err != nil {
		log.Printf("[%s] ERROR: %v", imam, err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[%s] ERROR read: %v", imam, err)
		return
	}

	type gadingnstHadith struct {
		Number int    `json:"number"`
		Arab   string `json:"arab"`
		ID     string `json:"id"`
	}

	var hadiths []gadingnstHadith
	if err := json.Unmarshal(body, &hadiths); err != nil {
		log.Printf("[%s] ERROR parse: %v", imam, err)
		return
	}
	log.Printf("[%s] ✓ gadingnst: %d hadits", imam, len(hadiths))

	rows := make([]HadithRow, 0, len(hadiths))
	for _, h := range hadiths {
		rows = append(rows, HadithRow{
			Number: h.Number,
			Imam:   imam,
			Ar:     h.Arab,
			Idn:    h.ID,
		})
	}

	saveJSON(rows, imam, outDir)
}

func saveJSON(rows []HadithRow, imam, outDir string) {
	path := filepath.Join(outDir, fmt.Sprintf("hadits_%s.json", imam))
	f, err := os.Create(path)
	if err != nil {
		log.Printf("[%s] ERROR create file: %v", imam, err)
		return
	}
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	if err := enc.Encode(rows); err != nil {
		log.Printf("[%s] ERROR encode: %v", imam, err)
		return
	}
	log.Printf("[%s] Saved %d hadits → %s", imam, len(rows), path)
}
