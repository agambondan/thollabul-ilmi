package migrations

import (
	"fmt"
	"log"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

type staticTafsirRow struct {
	SurahNumber int    `json:"surah_number"`
	AyahNumber  int    `json:"ayah_number"`
	Title       string `json:"title"`
	TafsirIDN   string `json:"tafsir_idn"`
	TafsirEN    string `json:"tafsir_en"`
	Source      string `json:"source"`
}

func seedTafsirRingkasFromFile(db *gorm.DB) {
	var rows []staticTafsirRow
	if !readStaticJSON(db, "tafsir_ringkas.json", &rows) {
		return
	}
	type ayahRow struct{ ID, Number, SurahNumber int }
	var ayahs []ayahRow
	db.Raw(`SELECT ayah.id, ayah.number, surah.number AS surah_number FROM ayah JOIN surah ON surah.id = ayah.surah_id WHERE ayah.deleted_at IS NULL AND surah.deleted_at IS NULL`).Scan(&ayahs)
	idx := map[string]int{}
	for _, a := range ayahs {
		idx[fmtKey(a.SurahNumber, a.Number)] = a.ID
	}
	log.Printf("[seeder] seedTafsirRingkasFromFile: %d entri", len(rows))
	for _, r := range rows {
		ayahID := idx[fmtKey(r.SurahNumber, r.AyahNumber)]
		if ayahID == 0 || r.TafsirIDN == "" {
			continue
		}
		var existing model.Tafsir
		if err := db.Where("ayah_id = ?", ayahID).First(&existing).Error; err == nil {
			trID := upsertStaticTranslation(db, existing.KemenagTranslationID, r.TafsirIDN, r.TafsirEN, "", "", "")
			if existing.KemenagTranslationID == nil && trID != nil {
				db.Model(&existing).Update("kemenag_translation_id", trID)
			}
			continue
		}
		trID := upsertStaticTranslation(db, nil, r.TafsirIDN, r.TafsirEN, "", "", "")
		db.Create(&model.Tafsir{AyahID: lib.Intptr(ayahID), KemenagTranslationID: trID})
	}
}

func upsertStaticTranslation(db *gorm.DB, existingID *int, idn, en, ar, latinIDN, latinEN string) *int {
	updates := map[string]interface{}{"idn": stringPtrOrNil(idn), "en": stringPtrOrNil(en), "ar": stringPtrOrNil(ar), "latin_idn": stringPtrOrNil(latinIDN), "latin_en": stringPtrOrNil(latinEN), "description_idn": stringPtrOrNil(idn), "description_en": stringPtrOrNil(en)}
	if existingID != nil {
		db.Model(&model.Translation{}).Where("id = ?", *existingID).Updates(updates)
		return existingID
	}
	tr := model.Translation{Idn: stringPtrOrNil(idn), En: stringPtrOrNil(en), Ar: stringPtrOrNil(ar), LatinIdn: stringPtrOrNil(latinIDN), LatinEn: stringPtrOrNil(latinEN), DescriptionIdn: stringPtrOrNil(idn), DescriptionEn: stringPtrOrNil(en)}
	db.Create(&tr)
	return tr.ID
}

func fmtKey(a, b int) string { return fmt.Sprintf("%d:%d", a, b) }

