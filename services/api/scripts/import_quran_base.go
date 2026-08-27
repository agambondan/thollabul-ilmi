//go:build ignore

// Import data dasar Al-Quran (surah + ayah + translation) dari alquran.cloud API.
// Jalankan SEBELUM import_mufrodat.go jika DB masih kosong.
//
// Sumber:
//
//	https://api.alquran.cloud/v1/quran/quran-uthmani      → Arab (uthmani)
//	https://api.alquran.cloud/v1/quran/id.indonesian       → Terjemahan Indonesia
//	https://api.alquran.cloud/v1/quran/en.transliteration  → Transliterasi Latin
//
// Usage:
//
//	go run scripts/import_quran_base.go
//	go run scripts/import_quran_base.go -from 1 -to 10    # range surah
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"sync"
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

// ── alquran.cloud response types ─────────────────────────────────────────────

// sajda can be bool or {"recommended":bool,"obligatory":bool} — use RawMessage
type AQAyah struct {
	Number      int             `json:"numberInSurah"`
	Text        string          `json:"text"`
	Juz         int             `json:"juz"`
	Manzil      int             `json:"manzil"`
	Page        int             `json:"page"`
	Ruku        int             `json:"ruku"`
	HizbQuarter int             `json:"hizbQuarter"`
	SajdaRaw    json.RawMessage `json:"sajda"`
}

func (a *AQAyah) IsSajda() bool {
	if len(a.SajdaRaw) == 0 {
		return false
	}
	// try bool first
	var b bool
	if json.Unmarshal(a.SajdaRaw, &b) == nil {
		return b
	}
	// object form — any non-null object means sajda present
	var obj map[string]interface{}
	return json.Unmarshal(a.SajdaRaw, &obj) == nil
}

type AQSurah struct {
	Number                 int      `json:"number"`
	Name                   string   `json:"name"`
	EnglishName            string   `json:"englishName"`
	EnglishNameTranslation string   `json:"englishNameTranslation"`
	RevelationType         string   `json:"revelationType"`
	NumberOfAyahs          int      `json:"numberOfAyahs"`
	Ayahs                  []AQAyah `json:"ayahs"`
}

type AQQuranResponse struct {
	Code int `json:"code"`
	Data struct {
		Surahs []AQSurah `json:"surahs"`
	} `json:"data"`
}

func fetchEdition(edition string) ([]AQSurah, error) {
	url := fmt.Sprintf("https://api.alquran.cloud/v1/quran/%s", edition)
	log.Printf("Fetching %s ...", edition)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var result AQQuranResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	if result.Code != 200 || len(result.Data.Surahs) == 0 {
		return nil, fmt.Errorf("unexpected response code %d", result.Code)
	}
	return result.Data.Surahs, nil
}

type QuranImporter struct {
	db *gorm.DB
}

func (imp *QuranImporter) run(from, to int, arabicSurahs, latinSurahs, idnSurahs []AQSurah) {
	// Build maps: surah_number → ayah_number → text
	arabicMap := buildTextMap(arabicSurahs)
	latinMap := buildTextMap(latinSurahs)
	idnMap := buildTextMap(idnSurahs)
	surahInfos := buildSurahMap(arabicSurahs)

	for surahNum := from; surahNum <= to; surahNum++ {
		info, ok := surahInfos[surahNum]
		if !ok {
			log.Printf("[surah %d] SKIP: tidak ada data", surahNum)
			continue
		}

		// Upsert Surah.Translation
		var surahTranslation model.Translation
		surahTranslation.LatinEn = lib.Strptr(info.EnglishName)
		surahTranslation.En = lib.Strptr(info.EnglishNameTranslation)
		surahTranslation.Ar = lib.Strptr(info.Name)
		result := imp.db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "id"}},
			DoUpdates: clause.AssignmentColumns([]string{"latin_en", "en", "ar", "updated_at"}),
		}).Create(&surahTranslation)
		if result.Error != nil {
			log.Printf("[surah %d] ERROR upsert surah translation: %v", surahNum, result.Error)
			continue
		}

		// Derive ayah count from actual fetched texts (API may not return numberOfAyahs)
		numAyahs := len(arabicMap[surahNum])
		if numAyahs == 0 {
			numAyahs = info.NumberOfAyahs
		}

		// Upsert Surah
		surah := model.Surah{
			Number:        lib.Intptr(surahNum),
			TranslationID: surahTranslation.ID,
			NumberOfAyahs: lib.Intptr(numAyahs),
		}
		var existingSurah model.Surah
		if err := imp.db.Where("number = ?", surahNum).First(&existingSurah).Error; err == nil {
			surah.BaseID = existingSurah.BaseID
			imp.db.Save(&surah)
		} else {
			if err := imp.db.Create(&surah).Error; err != nil {
				log.Printf("[surah %d] ERROR upsert surah: %v", surahNum, err)
				continue
			}
		}
		if surah.ID == nil {
			log.Printf("[surah %d] ERROR: surah.ID nil setelah upsert", surahNum)
			continue
		}

		ayahCount := 0
		for ayahNum := 1; ayahNum <= numAyahs; ayahNum++ {
			arabic := arabicMap[surahNum][ayahNum]
			latin := latinMap[surahNum][ayahNum]
			idn := idnMap[surahNum][ayahNum]

			// Upsert ayah Translation
			var tr model.Translation
			tr.Ar = lib.Strptr(arabic)
			tr.LatinEn = lib.Strptr(latin)
			tr.Idn = lib.Strptr(idn)

			trResult := imp.db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "id"}},
				DoUpdates: clause.AssignmentColumns([]string{"ar", "latin_en", "idn", "updated_at"}),
			}).Create(&tr)
			if trResult.Error != nil {
				log.Printf("[surah %d, ayah %d] ERROR upsert translation: %v", surahNum, ayahNum, trResult.Error)
				continue
			}

			// Page/juz data from arabic map
			aqAyah := getAQAyah(arabicSurahs, surahNum, ayahNum)
			ayah := model.Ayah{
				Number:        lib.Intptr(ayahNum),
				SurahID:       surah.ID,
				TranslationID: tr.ID,
			}
			if aqAyah != nil {
				ayah.JuzNumber = lib.Intptr(aqAyah.Juz)
				ayah.Manzil = lib.Intptr(aqAyah.Manzil)
				ayah.Page = lib.Intptr(aqAyah.Page)
				ayah.Ruku = lib.Intptr(aqAyah.Ruku)
				ayah.HizbQuarter = lib.Intptr(aqAyah.HizbQuarter)
				sajda := aqAyah.IsSajda()
				ayah.Sajda = &sajda
			}

			// Upsert ayah by (surah_id, number)
			var existingAyah model.Ayah
			if err := imp.db.Where("surah_id = ? AND number = ?", surah.ID, ayahNum).First(&existingAyah).Error; err == nil {
				ayah.BaseID = existingAyah.BaseID
				imp.db.Save(&ayah)
			} else {
				if err := imp.db.Create(&ayah).Error; err != nil {
					log.Printf("[surah %d, ayah %d] ERROR upsert ayah: %v", surahNum, ayahNum, err)
					continue
				}
			}
			ayahCount++
		}
		log.Printf("[surah %3d] %-20s → %d ayat", surahNum, info.EnglishName, ayahCount)
	}
}

// ── helpers ───────────────────────────────────────────────────────────────────

func buildTextMap(surahs []AQSurah) map[int]map[int]string {
	m := make(map[int]map[int]string, len(surahs))
	for _, s := range surahs {
		m[s.Number] = make(map[int]string, len(s.Ayahs))
		for _, a := range s.Ayahs {
			m[s.Number][a.Number] = a.Text
		}
	}
	return m
}

type surahInfo struct {
	EnglishName            string
	EnglishNameTranslation string
	Name                   string
	NumberOfAyahs          int
	RevelationType         string
}

func buildSurahMap(surahs []AQSurah) map[int]surahInfo {
	m := make(map[int]surahInfo, len(surahs))
	for _, s := range surahs {
		m[s.Number] = surahInfo{
			EnglishName:            s.EnglishName,
			EnglishNameTranslation: s.EnglishNameTranslation,
			Name:                   s.Name,
			NumberOfAyahs:          s.NumberOfAyahs,
			RevelationType:         s.RevelationType,
		}
	}
	return m
}

func getAQAyah(surahs []AQSurah, surahNum, ayahNum int) *AQAyah {
	for i := range surahs {
		if surahs[i].Number == surahNum {
			for j := range surahs[i].Ayahs {
				if surahs[i].Ayahs[j].Number == ayahNum {
					return &surahs[i].Ayahs[j]
				}
			}
		}
	}
	return nil
}

// ── main ──────────────────────────────────────────────────────────────────────

func main() {
	fromFlag := flag.Int("from", 1, "Mulai dari surah (inklusif)")
	toFlag := flag.Int("to", 114, "Sampai surah (inklusif)")
	flag.Parse()

	for _, f := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(f); err == nil {
			log.Printf("Config: %s\n", f)
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
		log.Fatalf("Koneksi DB gagal: %v", err)
	}

	// Fetch 3 editions concurrently
	type fetchResult struct {
		surahs []AQSurah
		err    error
	}
	editions := []string{"quran-uthmani", "id.indonesian", "en.transliteration"}
	results := make([]fetchResult, len(editions))
	var wg sync.WaitGroup
	wg.Add(len(editions))
	for i, ed := range editions {
		i, ed := i, ed
		go func() {
			defer wg.Done()
			s, err := fetchEdition(ed)
			results[i] = fetchResult{s, err}
			time.Sleep(200 * time.Millisecond)
		}()
	}
	wg.Wait()

	for i, r := range results {
		if r.err != nil {
			log.Fatalf("Gagal fetch %s: %v", editions[i], r.err)
		}
	}
	arabicSurahs := results[0].surahs
	idnSurahs := results[1].surahs
	latinSurahs := results[2].surahs

	imp := &QuranImporter{db: db}
	start := time.Now()
	log.Printf("Import surah %d–%d ...\n", *fromFlag, *toFlag)
	imp.run(*fromFlag, *toFlag, arabicSurahs, latinSurahs, idnSurahs)
	log.Printf("Selesai dalam %.1fs\n", time.Since(start).Seconds())
}
