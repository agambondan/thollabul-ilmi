//go:build ignore

// Fetch data Al-Quran dari alquran.cloud dan simpan ke data/quran_base.json.
// Jalankan sekali; file yang dihasilkan di-commit ke git sebagai sumber data.
//
// Usage:
//
//	go run scripts/fetch_quran_base.go
//	go run scripts/fetch_quran_base.go -out data/quran_base.json
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
	"unicode"
)

const (
	aqBase     = "https://api.alquran.cloud/v1"
	edAr       = "quran-uthmani"
	edIdn      = "id.indonesian"
	edEn       = "en.sahih" // Saheeh International (bukan en.saheeh — itu arabic!)
	fetchDelay = 300 * time.Millisecond
)

// ── API response types ────────────────────────────────────────────────────────

type aqSurahListResp struct {
	Code int           `json:"code"`
	Data []aqSurahMeta `json:"data"`
}

type aqSurahMeta struct {
	Number                 int    `json:"number"`
	Name                   string `json:"name"`
	EnglishName            string `json:"englishName"`
	EnglishNameTranslation string `json:"englishNameTranslation"`
	NumberOfAyahs          int    `json:"numberOfAyahs"`
	RevelationType         string `json:"revelationType"`
}

type aqEditionsResp struct {
	Code int         `json:"code"`
	Data []aqEdition `json:"data"`
}

type aqEdition struct {
	Edition aqEditionMeta `json:"edition"`
	Ayahs   []aqAyahRaw   `json:"ayahs"`
}

type aqEditionMeta struct {
	Identifier string `json:"identifier"`
}

type aqAyahRaw struct {
	NumberInSurah int        `json:"numberInSurah"`
	Text          string     `json:"text"`
	Juz           int        `json:"juz"`
	Manzil        int        `json:"manzil"`
	Page          int        `json:"page"`
	Ruku          int        `json:"ruku"`
	HizbQuarter   int        `json:"hizbQuarter"`
	Sajda         sajdaField `json:"sajda"`
}

type sajdaField struct{ Value bool }

func (s *sajdaField) UnmarshalJSON(data []byte) error {
	raw := strings.TrimSpace(string(data))
	s.Value = raw != "false"
	return nil
}

// ── Output JSON types ─────────────────────────────────────────────────────────

type QuranBaseFile struct {
	GeneratedAt string      `json:"generated_at"`
	Surahs      []SurahFile `json:"surahs"`
}

type SurahFile struct {
	Number          int        `json:"number"`
	NameAr          string     `json:"name_ar"`
	NameEn          string     `json:"name_en"`
	NameTranslation string     `json:"name_translation"`
	Slug            string     `json:"slug"`
	RevelationType  string     `json:"revelation_type"`
	Ayahs           []AyahFile `json:"ayahs"`
}

type AyahFile struct {
	Number      int    `json:"number"`
	Arabic      string `json:"arabic"`
	Indonesian  string `json:"indonesian"`
	English     string `json:"english"`
	Juz         int    `json:"juz"`
	Page        int    `json:"page"`
	Manzil      int    `json:"manzil"`
	Ruku        int    `json:"ruku"`
	HizbQuarter int    `json:"hizb_quarter"`
	Sajda       bool   `json:"sajda"`
}

var quranBasmalahPrefixes = []string{
	"بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
	"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
	"بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ",
	"بسم الله الرحمن الرحيم",
}

func cleanQuranArabicText(surahNumber int, ayahNumber int, text string) string {
	text = trimLeadingQuranTextNoise(text)
	if ayahNumber != 1 || surahNumber == 1 || surahNumber == 9 {
		return text
	}
	return stripLeadingQuranBasmalah(text)
}

func stripLeadingQuranBasmalah(text string) string {
	trimmed := trimLeadingQuranTextNoise(text)
	for _, prefix := range quranBasmalahPrefixes {
		if strings.HasPrefix(trimmed, prefix) {
			return trimLeadingQuranTextNoise(strings.TrimPrefix(trimmed, prefix))
		}
	}
	return text
}

func trimLeadingQuranTextNoise(text string) string {
	return strings.TrimLeftFunc(text, func(r rune) bool {
		return unicode.IsSpace(r) || r == '\ufeff'
	})
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

var client = &http.Client{Timeout: 30 * time.Second}

func getJSON(url string, dest interface{}) error {
	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("GET %s: %w", url, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("GET %s: status %d", url, resp.StatusCode)
	}
	return json.NewDecoder(resp.Body).Decode(dest)
}

// ── main ──────────────────────────────────────────────────────────────────────

func main() {
	outFlag := flag.String("out", "data/quran_base.json", "Output file path")
	flag.Parse()

	log.Println("Fetching surah list...")
	var listResp aqSurahListResp
	if err := getJSON(aqBase+"/surah", &listResp); err != nil {
		log.Fatalf("Fetch surah list: %v", err)
	}
	log.Printf("Total: %d surahs\n", len(listResp.Data))

	output := QuranBaseFile{
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		Surahs:      make([]SurahFile, 0, 114),
	}

	for _, meta := range listResp.Data {
		url := fmt.Sprintf("%s/surah/%d/editions/%s,%s,%s", aqBase, meta.Number, edAr, edIdn, edEn)
		var edResp aqEditionsResp
		if err := getJSON(url, &edResp); err != nil {
			log.Printf("[surah %3d] ERROR fetch: %v — skip", meta.Number, err)
			time.Sleep(fetchDelay)
			continue
		}

		edMap := map[string]*aqEdition{}
		for i := range edResp.Data {
			edMap[edResp.Data[i].Edition.Identifier] = &edResp.Data[i]
		}
		arEd := edMap[edAr]
		if arEd == nil {
			log.Printf("[surah %3d] WARN: arabic edition missing — skip", meta.Number)
			time.Sleep(fetchDelay)
			continue
		}

		slug := strings.ToLower(strings.ReplaceAll(meta.EnglishName, " ", "-"))
		sf := SurahFile{
			Number:          meta.Number,
			NameAr:          meta.Name,
			NameEn:          meta.EnglishName,
			NameTranslation: meta.EnglishNameTranslation,
			Slug:            slug,
			RevelationType:  meta.RevelationType,
			Ayahs:           make([]AyahFile, 0, len(arEd.Ayahs)),
		}

		idnEd := edMap[edIdn]
		enEd := edMap[edEn]

		for i, arAyah := range arEd.Ayahs {
			af := AyahFile{
				Number:      arAyah.NumberInSurah,
				Arabic:      cleanQuranArabicText(meta.Number, arAyah.NumberInSurah, arAyah.Text),
				Juz:         arAyah.Juz,
				Page:        arAyah.Page,
				Manzil:      arAyah.Manzil,
				Ruku:        arAyah.Ruku,
				HizbQuarter: arAyah.HizbQuarter,
				Sajda:       arAyah.Sajda.Value,
			}
			if idnEd != nil && i < len(idnEd.Ayahs) {
				af.Indonesian = idnEd.Ayahs[i].Text
			}
			if enEd != nil && i < len(enEd.Ayahs) {
				af.English = enEd.Ayahs[i].Text
			}
			sf.Ayahs = append(sf.Ayahs, af)
		}

		output.Surahs = append(output.Surahs, sf)
		log.Printf("[surah %3d] %s — %d ayahs", meta.Number, meta.EnglishName, len(sf.Ayahs))
		time.Sleep(fetchDelay)
	}

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
	log.Printf("Saved %d surahs to %s", len(output.Surahs), *outFlag)
}
