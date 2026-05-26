package migrations

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"unicode"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	quranBaseDataFile = "data/quran_base.json"
	mufrodatDataFile  = "data/mufrodat.json"
)

// ── JSON structs (mirror data/quran_base.json) ────────────────────────────────

type quranBaseJSON struct {
	Surahs []surahJSON `json:"surahs"`
}

type surahJSON struct {
	Number          int        `json:"number"`
	NameAr          string     `json:"name_ar"`
	NameEn          string     `json:"name_en"`
	NameTranslation string     `json:"name_translation"`
	Slug            string     `json:"slug"`
	RevelationType  string     `json:"revelation_type"`
	Ayahs           []ayahJSON `json:"ayahs"`
}

type ayahJSON struct {
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

type mufrodatFileJSON struct {
	Entries []ayahWordEntry `json:"entries"`
}

type ayahWordEntry struct {
	Surah int        `json:"surah"`
	Ayah  int        `json:"ayah"`
	Words []wordItem `json:"words"`
}

type wordItem struct {
	Index           int    `json:"index"`
	Arabic          string `json:"arabic"`
	Transliteration string `json:"transliteration"`
	Indonesian      string `json:"indonesian"`
}

// ── SeedQuranFromFile ─────────────────────────────────────────────────────────

// SeedQuranFromFile seeds surah and ayah from data/quran_base.json.
// No-op if the file does not exist or if ayahs are already fully seeded.
func SeedQuranFromFile(db *gorm.DB) {
	cleanupDuplicateQuranAyahs(db)
	cleanupEmbeddedBasmalahInQuranAyahs(db)

	var distinctAyahCount int64
	db.Model(&model.Ayah{}).
		Select("COUNT(DISTINCT CONCAT(surah_id, ':', number))").
		Scan(&distinctAyahCount)
	if distinctAyahCount >= 6236 {
		return
	}

	f, err := os.Open(quranBaseDataFile)
	if err != nil {
		log.Printf("[seeder] quran_base.json tidak ditemukan — skip (%v)", err)
		return
	}
	defer f.Close()

	var data quranBaseJSON
	if err := json.NewDecoder(f).Decode(&data); err != nil {
		log.Printf("[seeder] parse quran_base.json gagal: %v", err)
		return
	}

	log.Printf("[seeder] SeedQuranFromFile: %d surahs...", len(data.Surahs))
	seeded := 0

	for _, sf := range data.Surahs {
		tr := model.Translation{
			Ar:      lib.Strptr(sf.NameAr),
			LatinEn: lib.Strptr(sf.NameEn),
			En:      lib.Strptr(sf.NameTranslation),
			Idn:     lib.Strptr(sf.NameTranslation),
		}
		if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&tr).Error; err != nil {
			log.Printf("[seeder] surah %d translation: %v", sf.Number, err)
			continue
		}

		surah := model.Surah{
			Number:         lib.Intptr(sf.Number),
			TranslationID:  tr.ID,
			NumberOfAyahs:  lib.Intptr(len(sf.Ayahs)),
			RevelationType: lib.Strptr(sf.RevelationType),
			Slug:           lib.Strptr(sf.Slug),
			Identifier:     lib.Strptr(sf.NameEn),
		}
		if err := db.Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "number"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"translation_id", "number_of_ayahs", "revelation_type", "slug", "identifier", "updated_at",
			}),
		}).Create(&surah).Error; err != nil {
			log.Printf("[seeder] surah %d: %v", sf.Number, err)
			continue
		}
		if surah.ID == nil {
			db.Where("number = ?", sf.Number).Select("id").First(&surah)
		}
		if surah.ID == nil {
			continue
		}

		for _, af := range sf.Ayahs {
			ayah := model.Ayah{
				Number:      lib.Intptr(af.Number),
				SurahID:     surah.ID,
				JuzNumber:   lib.Intptr(af.Juz),
				Page:        lib.Intptr(af.Page),
				Manzil:      lib.Intptr(af.Manzil),
				Ruku:        lib.Intptr(af.Ruku),
				HizbQuarter: lib.Intptr(af.HizbQuarter),
				Sajda:       lib.Boolptr(af.Sajda),
			}
			if err := upsertQuranAyahFromFile(db, &ayah, sf.Number, af); err != nil {
				continue
			}
			seeded++
		}
	}
	log.Printf("[seeder] SeedQuranFromFile: %d ayahs seeded", seeded)
}

func upsertQuranAyahFromFile(db *gorm.DB, ayah *model.Ayah, surahNumber int, af ayahJSON) error {
	arabic := cleanQuranArabicText(surahNumber, af.Number, af.Arabic)
	var existing model.Ayah
	err := db.Where("surah_id = ? AND number = ?", ayah.SurahID, af.Number).First(&existing).Error
	if err == nil {
		if existing.TranslationID != nil {
			db.Model(&model.Translation{}).
				Where("id = ?", *existing.TranslationID).
				Updates(map[string]interface{}{
					"ar":  arabic,
					"idn": af.Indonesian,
					"en":  af.English,
				})
			ayah.TranslationID = existing.TranslationID
		} else {
			tr := model.Translation{
				Ar:  lib.Strptr(arabic),
				Idn: lib.Strptr(af.Indonesian),
				En:  lib.Strptr(af.English),
			}
			if err := db.Create(&tr).Error; err != nil {
				return err
			}
			ayah.TranslationID = tr.ID
		}
		return db.Model(&existing).Updates(map[string]interface{}{
			"translation_id": ayah.TranslationID,
			"juz_number":     ayah.JuzNumber,
			"page":           ayah.Page,
			"manzil":         ayah.Manzil,
			"ruku":           ayah.Ruku,
			"hizb_quarter":   ayah.HizbQuarter,
			"sajda":          ayah.Sajda,
		}).Error
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}

	ayahTr := model.Translation{
		Ar:  lib.Strptr(arabic),
		Idn: lib.Strptr(af.Indonesian),
		En:  lib.Strptr(af.English),
	}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&ayahTr).Error; err != nil {
		return err
	}
	ayah.TranslationID = ayahTr.ID
	return db.Create(ayah).Error
}

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
	trimmed := strings.TrimLeftFunc(text, unicode.IsSpace)
	for _, prefix := range quranBasmalahPrefixes {
		if strings.HasPrefix(trimmed, prefix) {
			return strings.TrimLeftFunc(strings.TrimPrefix(trimmed, prefix), unicode.IsSpace)
		}
	}
	return text
}

func cleanupEmbeddedBasmalahInQuranAyahs(db *gorm.DB) {
	type quranAyahTranslationRow struct {
		TranslationID int     `gorm:"column:translation_id"`
		SurahNumber   int     `gorm:"column:surah_number"`
		AyahNumber    int     `gorm:"column:ayah_number"`
		Ar            *string `gorm:"column:ar"`
		ArHtml        *string `gorm:"column:ar_html"`
	}

	var rows []quranAyahTranslationRow
	if err := db.Table("ayah a").
		Select("a.translation_id, s.number AS surah_number, a.number AS ayah_number, tr.ar, tr.ar_html").
		Joins("JOIN surah s ON s.id = a.surah_id").
		Joins("JOIN translation tr ON tr.id = a.translation_id").
		Where("a.deleted_at IS NULL AND a.number = 1 AND s.number NOT IN ?", []int{1, 9}).
		Find(&rows).Error; err != nil {
		log.Printf("[seeder] cleanup basmalah Quran gagal query: %v", err)
		return
	}

	updated := 0
	for _, row := range rows {
		changes := map[string]interface{}{}
		if row.Ar != nil {
			cleaned := cleanQuranArabicText(row.SurahNumber, row.AyahNumber, *row.Ar)
			if cleaned != *row.Ar {
				changes["ar"] = cleaned
			}
		}
		if row.ArHtml != nil {
			cleaned := cleanQuranArabicText(row.SurahNumber, row.AyahNumber, *row.ArHtml)
			if cleaned != *row.ArHtml {
				changes["ar_html"] = cleaned
			}
		}
		if len(changes) == 0 {
			continue
		}
		if err := db.Model(&model.Translation{}).
			Where("id = ?", row.TranslationID).
			Updates(changes).Error; err != nil {
			log.Printf("[seeder] cleanup basmalah translation %d gagal: %v", row.TranslationID, err)
			continue
		}
		updated++
	}
	if updated > 0 {
		log.Printf("[seeder] cleanup basmalah Quran: %d translations updated", updated)
	}
}

func cleanupDuplicateQuranAyahs(db *gorm.DB) {
	if err := db.Transaction(func(tx *gorm.DB) error {
		dedupe := `
			WITH duplicate_ayahs AS (
				SELECT id AS duplicate_id, keep_id
				FROM (
					SELECT id, MIN(id) OVER (PARTITION BY surah_id, number) AS keep_id,
						ROW_NUMBER() OVER (PARTITION BY surah_id, number ORDER BY id) AS rn
					FROM ayah
					WHERE deleted_at IS NULL
				) ranked
				WHERE rn > 1
			)
		`
		statements := []string{
			dedupe + `
				DELETE FROM ayah_audio dup
				USING duplicate_ayahs d
				WHERE dup.ayah_id = d.duplicate_id
					AND EXISTS (
						SELECT 1 FROM ayah_audio keep
						WHERE keep.ayah_id = d.keep_id
							AND keep.qari_slug = dup.qari_slug
					)
			`,
			dedupe + ` UPDATE ayah_audio target SET ayah_id = d.keep_id FROM duplicate_ayahs d WHERE target.ayah_id = d.duplicate_id`,
			dedupe + ` UPDATE tafsir target SET ayah_id = d.keep_id FROM duplicate_ayahs d WHERE target.ayah_id = d.duplicate_id`,
			dedupe + ` UPDATE mufrodat target SET ayah_id = d.keep_id FROM duplicate_ayahs d WHERE target.ayah_id = d.duplicate_id`,
			dedupe + ` UPDATE ayah_asset target SET ayah_id = d.keep_id FROM duplicate_ayahs d WHERE target.ayah_id = d.duplicate_id`,
			dedupe + ` UPDATE reading_progress target SET ayah_id = d.keep_id FROM duplicate_ayahs d WHERE target.ayah_id = d.duplicate_id`,
			dedupe + `
				DELETE FROM asbabun_nuzul_ayahs dup
				USING duplicate_ayahs d
				WHERE dup.ayah_id = d.duplicate_id
					AND EXISTS (
						SELECT 1 FROM asbabun_nuzul_ayahs keep
						WHERE keep.ayah_id = d.keep_id
							AND keep.asbabun_nuzul_id = dup.asbabun_nuzul_id
					)
			`,
			dedupe + ` UPDATE asbabun_nuzul_ayahs target SET ayah_id = d.keep_id FROM duplicate_ayahs d WHERE target.ayah_id = d.duplicate_id`,
			dedupe + ` DELETE FROM ayah target USING duplicate_ayahs d WHERE target.id = d.duplicate_id`,
		}
		for _, stmt := range statements {
			if err := tx.Exec(stmt).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		log.Printf("[seeder] cleanup duplicate Quran ayahs gagal: %v", err)
	}
}

// ── SeedMufrodatFromFile ──────────────────────────────────────────────────────

// SeedMufrodatFromFile seeds per-kata data from data/mufrodat.json.
// Requires ayah table to be populated first (call SeedQuranFromFile before this).
func SeedMufrodatFromFile(db *gorm.DB) {
	var mufCount int64
	db.Model(&model.Mufrodat{}).Count(&mufCount)
	if mufCount >= 77000 {
		return
	}

	f, err := os.Open(mufrodatDataFile)
	if err != nil {
		log.Printf("[seeder] mufrodat.json tidak ditemukan — skip (%v)", err)
		return
	}
	defer f.Close()

	var data mufrodatFileJSON
	if err := json.NewDecoder(f).Decode(&data); err != nil {
		log.Printf("[seeder] parse mufrodat.json gagal: %v", err)
		return
	}

	// Build ayah index: "surah:ayah" → ayah.id
	log.Printf("[seeder] SeedMufrodatFromFile: building ayah index...")
	type row struct {
		ID          int
		Number      int
		SurahNumber int
	}
	var rows []row
	db.Raw(`
		SELECT ayah.id, ayah.number, surah.number AS surah_number
		FROM ayah JOIN surah ON surah.id = ayah.surah_id
	`).Scan(&rows)
	ayahIdx := make(map[string]int, len(rows))
	for _, r := range rows {
		ayahIdx[fmt.Sprintf("%d:%d", r.SurahNumber, r.Number)] = r.ID
	}

	if len(ayahIdx) == 0 {
		log.Println("[seeder] SeedMufrodatFromFile: ayah index kosong — jalankan SeedQuranFromFile dulu")
		return
	}

	log.Printf("[seeder] SeedMufrodatFromFile: %d entries...", len(data.Entries))
	seeded := 0
	for _, entry := range data.Entries {
		ayahID, ok := ayahIdx[fmt.Sprintf("%d:%d", entry.Surah, entry.Ayah)]
		if !ok {
			continue
		}
		for _, w := range entry.Words {
			item := model.Mufrodat{
				AyahID:          lib.Intptr(ayahID),
				WordIndex:       w.Index,
				Arabic:          w.Arabic,
				Transliteration: w.Transliteration,
				Indonesian:      w.Indonesian,
			}
			if err := db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "ayah_id"}, {Name: "word_index"}},
				DoUpdates: clause.AssignmentColumns([]string{"arabic", "transliteration", "indonesian"}),
			}).Create(&item).Error; err == nil {
				seeded++
			}
		}
	}
	log.Printf("[seeder] SeedMufrodatFromFile: %d kata seeded", seeded)
}
