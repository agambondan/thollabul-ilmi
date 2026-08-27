//go:build ignore

// Dump data Al-Quran dari DB ke file JSON (data/quran_base.json dan data/mufrodat.json).
// Gunakan ini untuk generate file data dari DB yang sudah terisi, tanpa harus re-scraping.
//
// Usage:
//
//	go run scripts/dump_to_files.go                          # dump semua
//	go run scripts/dump_to_files.go -quran -out-quran data/quran_base.json
//	go run scripts/dump_to_files.go -mufrodat -out-mufrodat data/mufrodat.json
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

// ── Output JSON types (sama dengan fetch_*.go) ────────────────────────────────

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

// ── DB row types ──────────────────────────────────────────────────────────────

type surahRow struct {
	SurahNumber     int
	NameAr          string
	NameEn          string
	NameTranslation string
	Slug            string
	RevelationType  string
}

type ayahRow struct {
	SurahNumber int
	AyahNumber  int
	Arabic      string
	Indonesian  string
	English     string
	Juz         int
	Page        int
	Manzil      int
	Ruku        int
	HizbQuarter int
	Sajda       bool
}

type mufrodatRow struct {
	SurahNumber     int
	AyahNumber      int
	WordIndex       int
	Arabic          string
	Transliteration string
	Indonesian      string
}

// ── Dump functions ────────────────────────────────────────────────────────────

func dumpQuranBase(db *gorm.DB, outPath string) error {
	log.Println("Dumping surah data...")
	var surahs []surahRow
	db.Raw(`
		SELECT
			s.number        AS surah_number,
			COALESCE(t.ar, '')       AS name_ar,
			COALESCE(t.latin_en, '') AS name_en,
			COALESCE(t.en, '')       AS name_translation,
			COALESCE(s.slug, '')     AS slug,
			COALESCE(s.revelation_type, '') AS revelation_type
		FROM surah s
		LEFT JOIN translation t ON t.id = s.translation_id
		ORDER BY s.number
	`).Scan(&surahs)
	log.Printf("  %d surahs", len(surahs))

	log.Println("Dumping ayah data...")
	var ayahs []ayahRow
	db.Raw(`
		SELECT
			s.number         AS surah_number,
			a.number         AS ayah_number,
			COALESCE(t.ar, '')       AS arabic,
			COALESCE(t.idn, '')      AS indonesian,
			COALESCE(t.en, '')       AS english,
			COALESCE(a.juz_number, 0) AS juz,
			COALESCE(a.page, 0)      AS page,
			COALESCE(a.manzil, 0)    AS manzil,
			COALESCE(a.ruku, 0)      AS ruku,
			COALESCE(a.hizb_quarter, 0) AS hizb_quarter,
			COALESCE(a.sajda, false) AS sajda
		FROM ayah a
		JOIN surah s ON s.id = a.surah_id
		LEFT JOIN translation t ON t.id = a.translation_id
		ORDER BY s.number, a.number
	`).Scan(&ayahs)
	log.Printf("  %d ayahs", len(ayahs))

	// Build surah map
	surahMap := map[int]*SurahFile{}
	output := QuranBaseFile{
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		Surahs:      make([]SurahFile, 0, len(surahs)),
	}
	for _, s := range surahs {
		sf := SurahFile{
			Number:          s.SurahNumber,
			NameAr:          s.NameAr,
			NameEn:          s.NameEn,
			NameTranslation: s.NameTranslation,
			Slug:            s.Slug,
			RevelationType:  s.RevelationType,
			Ayahs:           []AyahFile{},
		}
		output.Surahs = append(output.Surahs, sf)
		surahMap[s.SurahNumber] = &output.Surahs[len(output.Surahs)-1]
	}
	for _, a := range ayahs {
		sf, ok := surahMap[a.SurahNumber]
		if !ok {
			continue
		}
		sf.Ayahs = append(sf.Ayahs, AyahFile{
			Number:      a.AyahNumber,
			Arabic:      a.Arabic,
			Indonesian:  a.Indonesian,
			English:     a.English,
			Juz:         a.Juz,
			Page:        a.Page,
			Manzil:      a.Manzil,
			Ruku:        a.Ruku,
			HizbQuarter: a.HizbQuarter,
			Sajda:       a.Sajda,
		})
	}

	return writeJSON(outPath, output)
}

func dumpMufrodat(db *gorm.DB, outPath string) error {
	log.Println("Dumping mufrodat data...")
	var rows []mufrodatRow
	db.Raw(`
		SELECT
			s.number          AS surah_number,
			a.number          AS ayah_number,
			m.word_index      AS word_index,
			m.arabic          AS arabic,
			COALESCE(m.transliteration, '') AS transliteration,
			COALESCE(m.indonesian, '')      AS indonesian
		FROM mufrodat m
		JOIN ayah a    ON a.id = m.ayah_id
		JOIN surah s   ON s.id = a.surah_id
		ORDER BY s.number, a.number, m.word_index
	`).Scan(&rows)
	log.Printf("  %d kata", len(rows))

	// Group by (surah, ayah)
	type key struct{ Surah, Ayah int }
	entryMap := map[key]*AyahWordEntry{}
	var orderedKeys []key

	for _, r := range rows {
		k := key{r.SurahNumber, r.AyahNumber}
		if _, ok := entryMap[k]; !ok {
			entryMap[k] = &AyahWordEntry{Surah: r.SurahNumber, Ayah: r.AyahNumber}
			orderedKeys = append(orderedKeys, k)
		}
		entryMap[k].Words = append(entryMap[k].Words, WordItem{
			Index:           r.WordIndex,
			Arabic:          r.Arabic,
			Transliteration: r.Transliteration,
			Indonesian:      r.Indonesian,
		})
	}

	output := MufrodatFile{
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
		Entries:     make([]AyahWordEntry, 0, len(orderedKeys)),
	}
	for _, k := range orderedKeys {
		output.Entries = append(output.Entries, *entryMap[k])
	}

	return writeJSON(outPath, output)
}

func writeJSON(path string, v interface{}) error {
	if err := os.MkdirAll("data", 0755); err != nil {
		return err
	}
	f, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create %s: %w", path, err)
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(v); err != nil {
		return fmt.Errorf("encode %s: %w", path, err)
	}
	info, _ := f.Stat()
	log.Printf("Saved %s (%.1f MB)", path, float64(info.Size())/1e6)
	return nil
}

// ── main ──────────────────────────────────────────────────────────────────────

func main() {
	dumpQuranFlag := flag.Bool("quran", false, "Dump quran_base saja")
	dumpMufrodatFlag := flag.Bool("mufrodat", false, "Dump mufrodat saja")
	outQuranFlag := flag.String("out-quran", "data/quran_base.json", "Output quran_base")
	outMufrodatFlag := flag.String("out-mufrodat", "data/mufrodat.json", "Output mufrodat")
	flag.Parse()

	// Default: dump semua
	dumpAll := !*dumpQuranFlag && !*dumpMufrodatFlag

	for _, f := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(f); err == nil {
			log.Printf("Config: %s", f)
			break
		}
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		viper.GetString("db_host"), viper.GetString("db_port"),
		viper.GetString("db_user"), viper.GetString("db_pass"),
		viper.GetString("db_name"),
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("Koneksi DB gagal: %v", err)
	}

	start := time.Now()

	if dumpAll || *dumpQuranFlag {
		if err := dumpQuranBase(db, *outQuranFlag); err != nil {
			log.Fatalf("Dump quran_base gagal: %v", err)
		}
	}
	if dumpAll || *dumpMufrodatFlag {
		if err := dumpMufrodat(db, *outMufrodatFlag); err != nil {
			log.Fatalf("Dump mufrodat gagal: %v", err)
		}
	}

	log.Printf("Selesai dalam %.1fs", time.Since(start).Seconds())
}
