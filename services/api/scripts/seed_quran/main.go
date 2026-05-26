package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/config"
	appdb "github.com/agambondan/islamic-explorer/app/db"
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	baseURL      = "https://api.alquran.cloud/v1"
	editionAr    = "quran-uthmani"
	editionIdn   = "id.indonesian"
	editionEn    = "en.asad"
	requestDelay = 300 * time.Millisecond
)

var quranBasmalahPrefixes = []string{
	"بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
	"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
	"بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ",
	"بسم الله الرحمن الرحيم",
}

func cleanQuranArabicText(surahNumber int, ayahNumber int, text string) string {
	if ayahNumber != 1 || surahNumber == 1 || surahNumber == 9 {
		return text
	}
	return stripLeadingQuranBasmalah(text)
}

func stripLeadingQuranBasmalah(text string) string {
	trimmed := strings.TrimLeft(text, " \n\t\r")
	for _, prefix := range quranBasmalahPrefixes {
		if strings.HasPrefix(trimmed, prefix) {
			return strings.TrimLeft(strings.TrimPrefix(trimmed, prefix), " \n\t\r")
		}
	}
	return text
}

// ─── API response structs ─────────────────────────────────────────────────────

type SurahListResponse struct {
	Code   int         `json:"code"`
	Status string      `json:"status"`
	Data   []SurahMeta `json:"data"`
}

type SurahMeta struct {
	Number                 int    `json:"number"`
	Name                   string `json:"name"`
	EnglishName            string `json:"englishName"`
	EnglishNameTranslation string `json:"englishNameTranslation"`
	NumberOfAyahs          int    `json:"numberOfAyahs"`
	RevelationType         string `json:"revelationType"`
}

type SurahEditionsResponse struct {
	Code   int            `json:"code"`
	Status string         `json:"status"`
	Data   []SurahEdition `json:"data"`
}

type SurahEdition struct {
	Number         int         `json:"number"`
	Name           string      `json:"name"`
	EnglishName    string      `json:"englishName"`
	NumberOfAyahs  int         `json:"numberOfAyahs"`
	RevelationType string      `json:"revelationType"`
	Edition        EditionMeta `json:"edition"`
	Ayahs          []AyahRaw   `json:"ayahs"`
}

type EditionMeta struct {
	Identifier string `json:"identifier"`
	Language   string `json:"language"`
	Name       string `json:"name"`
}

type AyahRaw struct {
	Number        int        `json:"number"`
	Text          string     `json:"text"`
	NumberInSurah int        `json:"numberInSurah"`
	Juz           int        `json:"juz"`
	Manzil        int        `json:"manzil"`
	Page          int        `json:"page"`
	Ruku          int        `json:"ruku"`
	HizbQuarter   int        `json:"hizbQuarter"`
	Sajda         SajdaField `json:"sajda"`
}

// SajdaField bisa false atau object {"id":N,"recommended":bool,"obligatory":bool}
type SajdaField struct {
	Value bool
}

func (s *SajdaField) UnmarshalJSON(data []byte) error {
	raw := strings.TrimSpace(string(data))
	if raw == "false" {
		s.Value = false
		return nil
	}
	if raw == "true" {
		s.Value = true
		return nil
	}
	// object form — ada sajda
	s.Value = true
	return nil
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

var httpClient = &http.Client{Timeout: 30 * time.Second}

func fetchJSON(url string, dest interface{}) error {
	resp, err := httpClient.Get(url)
	if err != nil {
		return fmt.Errorf("GET %s: %w", url, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("GET %s: status %d", url, resp.StatusCode)
	}
	return json.NewDecoder(resp.Body).Decode(dest)
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

func saveTranslation(db *gorm.DB, t *model.Translation) error {
	return db.Clauses(clause.OnConflict{DoNothing: true}).Create(t).Error
}

func saveOrUpdateTranslation(db *gorm.DB, existingID *int, t *model.Translation) error {
	if existingID != nil {
		t.ID = existingID
		return db.Model(&model.Translation{}).
			Where("id = ?", *existingID).
			Updates(map[string]interface{}{
				"ar":             t.Ar,
				"idn":            t.Idn,
				"en":             t.En,
				"latin_en":       t.LatinEn,
				"description_ar": t.DescriptionAr,
			}).Error
	}
	return saveTranslation(db, t)
}

func saveSurah(db *gorm.DB, s *model.Surah) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "number"}},
		DoUpdates: clause.AssignmentColumns([]string{"translation_id", "number_of_ayahs", "revelation_type", "identifier", "slug"}),
	}).Create(s).Error
}

func saveAyah(db *gorm.DB, a *model.Ayah) error {
	var existing model.Ayah
	err := db.Where("surah_id = ? AND number = ?", a.SurahID, a.Number).First(&existing).Error
	if err == nil {
		a.ID = existing.ID
		return db.Model(&existing).Updates(map[string]interface{}{
			"translation_id": a.TranslationID,
			"juz_number":     a.JuzNumber,
			"manzil":         a.Manzil,
			"page":           a.Page,
			"ruku":           a.Ruku,
			"hizb_quarter":   a.HizbQuarter,
			"sajda":          a.Sajda,
		}).Error
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}
	return db.Create(a).Error
}

// ─── Main logic ──────────────────────────────────────────────────────────────

func run(db *gorm.DB) error {
	// 1. Fetch surah list
	log.Println("Fetching surah list...")
	var surahList SurahListResponse
	if err := fetchJSON(baseURL+"/surah", &surahList); err != nil {
		return err
	}
	log.Printf("Found %d surahs\n", len(surahList.Data))

	for _, meta := range surahList.Data {
		log.Printf("[%3d/114] Surah %s (%s)...", meta.Number, meta.EnglishName, meta.Name)

		// 2. Fetch surah dengan 3 editions sekaligus
		url := fmt.Sprintf("%s/surah/%d/editions/%s,%s,%s", baseURL, meta.Number, editionAr, editionIdn, editionEn)
		var edResp SurahEditionsResponse
		if err := fetchJSON(url, &edResp); err != nil {
			log.Printf("  ERROR fetch surah %d: %v — skip", meta.Number, err)
			time.Sleep(requestDelay)
			continue
		}

		// Map editions by identifier
		edMap := map[string]*SurahEdition{}
		for i := range edResp.Data {
			edMap[edResp.Data[i].Edition.Identifier] = &edResp.Data[i]
		}

		arEd, idnEd, enEd := edMap[editionAr], edMap[editionIdn], edMap[editionEn]
		if arEd == nil {
			log.Printf("  WARN: arabic edition not found for surah %d", meta.Number)
			time.Sleep(requestDelay)
			continue
		}

		// 3. Simpan Translation untuk Surah (nama surah)
		surahTranslation := &model.Translation{
			Ar:            lib.Strptr(meta.Name),
			LatinEn:       lib.Strptr(meta.EnglishName),
			En:            lib.Strptr(meta.EnglishNameTranslation),
			Idn:           lib.Strptr(meta.EnglishNameTranslation), // fallback, nama surah Inggris = Idn
			DescriptionAr: lib.Strptr(meta.Name),
		}
		var existingSurah model.Surah
		var existingSurahTranslationID *int
		if err := db.Where("number = ?", meta.Number).First(&existingSurah).Error; err == nil {
			existingSurahTranslationID = existingSurah.TranslationID
		} else if err != gorm.ErrRecordNotFound {
			return fmt.Errorf("find surah %d: %w", meta.Number, err)
		}

		if err := saveOrUpdateTranslation(db, existingSurahTranslationID, surahTranslation); err != nil {
			return fmt.Errorf("save surah translation %d: %w", meta.Number, err)
		}

		// 4. Simpan Surah
		slug := strings.ToLower(strings.ReplaceAll(meta.EnglishName, " ", "-"))
		surah := &model.Surah{
			BaseID:         model.BaseID{ID: lib.Intptr(meta.Number)},
			Number:         lib.Intptr(meta.Number),
			NumberOfAyahs:  lib.Intptr(meta.NumberOfAyahs),
			RevelationType: lib.Strptr(meta.RevelationType),
			Identifier:     lib.Strptr(meta.EnglishName),
			Slug:           lib.Strptr(slug),
			TranslationID:  surahTranslation.ID,
		}
		if err := saveSurah(db, surah); err != nil {
			return fmt.Errorf("save surah %d: %w", meta.Number, err)
		}
		if surah.ID == nil {
			if err := db.Where("number = ?", meta.Number).Select("id").First(surah).Error; err != nil {
				return fmt.Errorf("reload surah %d: %w", meta.Number, err)
			}
		}

		// 5. Simpan Ayahs
		totalAyah := len(arEd.Ayahs)
		for i := 0; i < totalAyah; i++ {
			arAyah := arEd.Ayahs[i]
			arabic := cleanQuranArabicText(meta.Number, arAyah.NumberInSurah, arAyah.Text)

			ayahTranslation := &model.Translation{
				Ar: lib.Strptr(arabic),
			}
			if idnEd != nil && i < len(idnEd.Ayahs) {
				ayahTranslation.Idn = lib.Strptr(idnEd.Ayahs[i].Text)
			}
			if enEd != nil && i < len(enEd.Ayahs) {
				ayahTranslation.En = lib.Strptr(enEd.Ayahs[i].Text)
			}

			var existingAyah model.Ayah
			var existingAyahTranslationID *int
			if err := db.Where("surah_id = ? AND number = ?", surah.ID, arAyah.NumberInSurah).First(&existingAyah).Error; err == nil {
				existingAyahTranslationID = existingAyah.TranslationID
			} else if err != gorm.ErrRecordNotFound {
				return fmt.Errorf("find ayah surah=%d ayah=%d: %w", meta.Number, arAyah.NumberInSurah, err)
			}

			if err := saveOrUpdateTranslation(db, existingAyahTranslationID, ayahTranslation); err != nil {
				return fmt.Errorf("save ayah translation surah=%d ayah=%d: %w", meta.Number, arAyah.NumberInSurah, err)
			}

			sajda := arAyah.Sajda.Value
			ayah := &model.Ayah{
				Number:        lib.Intptr(arAyah.NumberInSurah),
				SurahID:       surah.ID,
				TranslationID: ayahTranslation.ID,
				JuzNumber:     lib.Intptr(arAyah.Juz),
				Manzil:        lib.Intptr(arAyah.Manzil),
				Page:          lib.Intptr(arAyah.Page),
				Ruku:          lib.Intptr(arAyah.Ruku),
				HizbQuarter:   lib.Intptr(arAyah.HizbQuarter),
				Sajda:         lib.Boolptr(sajda),
			}
			if err := saveAyah(db, ayah); err != nil {
				return fmt.Errorf("save ayah surah=%d ayah=%d: %w", meta.Number, arAyah.NumberInSurah, err)
			}
		}

		log.Printf("  OK — %d ayahs saved", totalAyah)
		time.Sleep(requestDelay)
	}

	log.Println("Done seeding Al-Quran data.")
	return nil
}

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	environment := flag.String("environment", "", "set environment (development|staging|production), default: local")
	flag.Parse()

	switch *environment {
	case "development":
		if err := lib.LoadEnvironmentLocalFlag(".env.development"); err != nil {
			panic(err)
		}
	case "staging":
		if err := lib.LoadEnvironmentLocalFlag(".env.staging"); err != nil {
			panic(err)
		}
	case "production":
		if err := lib.LoadEnvironmentLocalFlag(".env.production"); err != nil {
			panic(err)
		}
	case "container":
		viper.AutomaticEnv()
	default:
		if err := lib.LoadEnvironmentLocalFlag(".env.local"); err != nil {
			panic(err)
		}
	}

	env := config.Environment{}
	envInit := env.Init()

	gormDB := appdb.NewPostgresql(envInit)

	if err := run(gormDB); err != nil {
		log.Fatalf("Seed failed: %v", err)
	}
}
