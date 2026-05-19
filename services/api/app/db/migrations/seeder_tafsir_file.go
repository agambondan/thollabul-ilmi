package migrations

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type tafsirVerseRow struct {
	Chapter int    `json:"chapter"`
	Verse   int    `json:"verse"`
	Text    string `json:"text"`
}

type tafsirSurahFile struct {
	Chapter []tafsirVerseRow `json:"chapter"`
}

type ibnuKatsirVerse struct {
	VerseKey string `json:"verse_key"`
	Text     string `json:"text"`
}

type tafsirwebVerse struct {
	Surah int    `json:"surah"`
	Ayat  int    `json:"ayat"`
	Text  string `json:"text"`
}

// SeedTafsirFromFiles seeds all tafsir sources from data/ directories.
// Sumber:
//   - data/tafsir/ind-jalaladdinalmah/ → Jalalain (ID) via kemenag_translation_id
//   - data/tafsir/ind-muhammadquraish/ → Quraish Shihab (ID) via ibnu_katsir_translation_id
//   - data/ibnukatsir/ → Ibnu Katsir (EN) via Translation.En dari ibnu_katsir_translation_id
//   - data/tafsirweb/ → TafsirWeb (ID) via Translation.Idn dari ibnu_katsir_translation_id
func SeedTafsirFromFiles(db *gorm.DB) {
	const dataDir = "data/tafsir"
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		log.Println("[seeder] data/tafsir/ tidak ditemukan - skip SeedTafsirFromFiles")
		return
	}

	type ayahRow struct {
		ID          int
		Number      int
		SurahNumber int
	}
	var ayahs []ayahRow
	if err := db.Raw(`
		SELECT ayah.id, ayah.number, surah.number AS surah_number
		FROM ayah
		JOIN surah ON surah.id = ayah.surah_id
		WHERE ayah.deleted_at IS NULL AND surah.deleted_at IS NULL
	`).Scan(&ayahs).Error; err != nil {
		log.Printf("[seeder] SeedTafsirFromFiles: ayah index gagal: %v", err)
		return
	}
	if len(ayahs) == 0 {
		log.Println("[seeder] SeedTafsirFromFiles: ayah index kosong - jalankan SeedQuranFromFile dulu")
		return
	}

	ayahMap := make(map[string]int, len(ayahs))
	for _, a := range ayahs {
		ayahMap[fmt.Sprintf("%d:%d", a.SurahNumber, a.Number)] = a.ID
	}

	// ── Tahap 1: Seed Jalalain + Quraish ──────────────────────────────────
	seedTafsirJalalainQuraish(db, ayahMap)

	// ── Tahap 2: Update Translation.En dengan Ibnu Katsir (English) ───────
	updateTafsirIbnuKatsirEnglish(db, ayahMap)

	// ── Tahap 3: Update Translation.Idn dengan TafsirWeb (ID) ─────────────
	updateTafsirTafsirweb(db, ayahMap)
}

// ── Tahap 1: Jalalain + Quraish ──────────────────────────────────────────────

func seedTafsirJalalainQuraish(db *gorm.DB, ayahMap map[string]int) {
	const dataDir = "data/tafsir"

	var existing []model.Tafsir
	db.Select("id", "ayah_id", "kemenag_translation_id", "ibnu_katsir_translation_id").Find(&existing)
	existingByAyah := make(map[int]model.Tafsir, len(existing))
	for _, t := range existing {
		if t.AyahID != nil {
			existingByAyah[*t.AyahID] = t
		}
	}

	jalalaynDir := filepath.Join(dataDir, "ind-jalaladdinalmah")
	quraishDir := filepath.Join(dataDir, "ind-muhammadquraish")
	created := 0

	for surah := 1; surah <= 114; surah++ {
		jalalayn := readTafsirSurah(filepath.Join(jalalaynDir, fmt.Sprintf("%d.json", surah)))
		quraish := readTafsirSurah(filepath.Join(quraishDir, fmt.Sprintf("%d.json", surah)))
		if len(jalalayn) == 0 && len(quraish) == 0 {
			continue
		}

		maxAyah := 0
		for ayah := range jalalayn {
			if ayah > maxAyah {
				maxAyah = ayah
			}
		}
		for ayah := range quraish {
			if ayah > maxAyah {
				maxAyah = ayah
			}
		}

		for ayah := 1; ayah <= maxAyah; ayah++ {
			ayahID, ok := ayahMap[fmt.Sprintf("%d:%d", surah, ayah)]
			if !ok {
				continue
			}
			jalalaynText := jalalayn[ayah]
			quraishText := quraish[ayah]
			if jalalaynText == "" && quraishText == "" {
				continue
			}

			existingTafsir, exists := existingByAyah[ayahID]
			if exists {
				updates := map[string]interface{}{}
				if jalalaynText != "" && existingTafsir.KemenagTranslationID == nil {
					if id := createTafsirTranslation(db, jalalaynText, "jalalain"); id != nil {
						updates["kemenag_translation_id"] = *id
						existingTafsir.KemenagTranslationID = id
					}
				}
				if quraishText != "" && existingTafsir.IbnuKatsirTranslationID == nil {
					if id := createTafsirTranslation(db, quraishText, "quraish"); id != nil {
						updates["ibnu_katsir_translation_id"] = *id
						existingTafsir.IbnuKatsirTranslationID = id
					}
				}
				if len(updates) > 0 && existingTafsir.ID != nil {
					if err := db.Model(&model.Tafsir{}).Where("id = ?", *existingTafsir.ID).Updates(updates).Error; err != nil {
						log.Printf("[seeder] tafsir QS %d:%d update gagal: %v", surah, ayah, err)
						continue
					}
					existingByAyah[ayahID] = existingTafsir
					created++
				}
				continue
			}

			tafsir := model.Tafsir{AyahID: lib.Intptr(ayahID)}
			if jalalaynText != "" {
				tafsir.KemenagTranslationID = createTafsirTranslation(db, jalalaynText, "jalalain")
			}
			if quraishText != "" {
				tafsir.IbnuKatsirTranslationID = createTafsirTranslation(db, quraishText, "quraish")
			}
			if tafsir.KemenagTranslationID == nil && tafsir.IbnuKatsirTranslationID == nil {
				continue
			}
			if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&tafsir).Error; err != nil {
				log.Printf("[seeder] tafsir QS %d:%d gagal: %v", surah, ayah, err)
				continue
			}
			existingByAyah[ayahID] = tafsir
			created++
		}
	}

	log.Printf("[seeder] SeedTafsirJalalainQuraish: %d tafsir seeded/updated", created)
}

// ── Tahap 2: Ibnu Katsir English ─────────────────────────────────────────────

func updateTafsirIbnuKatsirEnglish(db *gorm.DB, ayahMap map[string]int) {
	const ibnukatsirDir = "data/ibnukatsir"
	if _, err := os.Stat(ibnukatsirDir); os.IsNotExist(err) {
		log.Println("[seeder] data/ibnukatsir/ tidak ditemukan — skip Ibnu Katsir English")
		return
	}

	type row struct {
		ID              int
		SurahNumber     int
		AyahNumber      int
		IbnuKatsirTrID  *int
	}
	var rows []row
	db.Raw(`
		SELECT t.id, surah.number AS surah_number, ayah.number AS ayah_number,
		       t.ibnu_katsir_translation_id
		FROM tafsir t
		JOIN ayah ON ayah.id = t.ayah_id
		JOIN surah ON surah.id = ayah.surah_id
		WHERE t.deleted_at IS NULL
		  AND t.ibnu_katsir_translation_id IS NOT NULL
		  AND ayah.deleted_at IS NULL
		  AND surah.deleted_at IS NULL
	`).Scan(&rows)

	ayahToTrID := make(map[string]int, len(rows))
	for _, r := range rows {
		if r.IbnuKatsirTrID != nil {
			key := fmt.Sprintf("%d:%d", r.SurahNumber, r.AyahNumber)
			ayahToTrID[key] = *r.IbnuKatsirTrID
		}
	}

	log.Printf("[seeder] Ibnu Katsir English: %d target records ditemukan", len(ayahToTrID))

	updated := 0
	for surah := 1; surah <= 114; surah++ {
		path := filepath.Join(ibnukatsirDir, fmt.Sprintf("%d.json", surah))
		verses := loadIbnuKatsirFile(path)
		if len(verses) == 0 {
			continue
		}
		for _, v := range verses {
			if v.Text == "" {
				continue
			}
			parts := strings.SplitN(v.VerseKey, ":", 2)
			if len(parts) != 2 {
				continue
			}
			key := fmt.Sprintf("%s:%s", parts[0], parts[1])
			trID, ok := ayahToTrID[key]
			if !ok {
				continue
			}
			if err := db.Model(&model.Translation{}).
				Where("id = ? AND (en IS NULL OR en = '')", trID).
				Update("en", v.Text).Error; err != nil {
				continue
			}
			updated++
		}
	}
	log.Printf("[seeder] Ibnu Katsir English: %d Translation.En diupdate", updated)
}

func loadIbnuKatsirFile(path string) []ibnuKatsirVerse {
	f, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer f.Close()
	var verses []ibnuKatsirVerse
	if err := json.NewDecoder(f).Decode(&verses); err != nil {
		return nil
	}
	return verses
}

// ── Tahap 3: TafsirWeb Indonesia ─────────────────────────────────────────────

func updateTafsirTafsirweb(db *gorm.DB, ayahMap map[string]int) {
	const tafsirwebDir = "data/tafsirweb"
	if _, err := os.Stat(tafsirwebDir); os.IsNotExist(err) {
		log.Println("[seeder] data/tafsirweb/ tidak ditemukan — skip TafsirWeb")
		return
	}

	type row struct {
		SurahNumber     int
		AyahNumber      int
		IbnuKatsirTrID  *int
	}
	var rows []row
	db.Raw(`
		SELECT surah.number AS surah_number, ayah.number AS ayah_number,
		       t.ibnu_katsir_translation_id
		FROM tafsir t
		JOIN ayah ON ayah.id = t.ayah_id
		JOIN surah ON surah.id = ayah.surah_id
		WHERE t.deleted_at IS NULL
		  AND t.ibnu_katsir_translation_id IS NOT NULL
		  AND ayah.deleted_at IS NULL
		  AND surah.deleted_at IS NULL
	`).Scan(&rows)

	ayahToTrID := make(map[string]int, len(rows))
	for _, r := range rows {
		if r.IbnuKatsirTrID != nil {
			key := fmt.Sprintf("%d:%d", r.SurahNumber, r.AyahNumber)
			ayahToTrID[key] = *r.IbnuKatsirTrID
		}
	}

	log.Printf("[seeder] TafsirWeb: %d target records ditemukan", len(ayahToTrID))

	updated := 0
	for surah := 1; surah <= 114; surah++ {
		dir := filepath.Join(tafsirwebDir, fmt.Sprintf("%d", surah))
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}
			// Parse ayah number from filename (e.g. "1.json" → 1)
			ayahNum, err := strconv.Atoi(strings.TrimSuffix(entry.Name(), ".json"))
			if err != nil {
				continue
			}
			key := fmt.Sprintf("%d:%d", surah, ayahNum)
			trID, ok := ayahToTrID[key]
			if !ok {
				continue
			}
			path := filepath.Join(dir, entry.Name())
			text := readTafsirwebFile(path)
			if text == "" {
				continue
			}
			if err := db.Model(&model.Translation{}).
				Where("id = ? AND (idn IS NULL OR idn = '')", trID).
				Update("idn", text).Error; err != nil {
				continue
			}
			updated++
		}
	}
	log.Printf("[seeder] TafsirWeb: %d Translation.Idn diupdate", updated)
}

func readTafsirwebFile(path string) string {
	f, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer f.Close()
	var v tafsirwebVerse
	if err := json.NewDecoder(f).Decode(&v); err != nil {
		return ""
	}
	return v.Text
}

// ── Shared helpers ───────────────────────────────────────────────────────────

func createTafsirTranslation(db *gorm.DB, text string, source string) *int {
	tr := model.Translation{DescriptionIdn: lib.Strptr(text)}
	if err := db.Create(&tr).Error; err != nil {
		log.Printf("[seeder] tafsir translation %s gagal: %v", source, err)
		return nil
	}
	return tr.ID
}

func readTafsirSurah(path string) map[int]string {
	f, err := os.Open(path)
	if err != nil {
		return map[int]string{}
	}
	defer f.Close()

	var surah tafsirSurahFile
	if err := json.NewDecoder(f).Decode(&surah); err != nil {
		log.Printf("[seeder] parse %s gagal: %v", path, err)
		return map[int]string{}
	}

	verses := make(map[int]string, len(surah.Chapter))
	for _, row := range surah.Chapter {
		if row.Text != "" {
			verses[row.Verse] = row.Text
		}
	}
	return verses
}
