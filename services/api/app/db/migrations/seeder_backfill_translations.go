package migrations

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

// BackfillTranslations creates Translation rows for any content row that does
// not yet have translation_id linked. The Indonesian fields are pulled from
// the legacy columns; English fields stay empty for tables that have no EN
// content yet (frontend falls back to idn). For tables that already have an
// English column (e.g. AsmaUlHusna), we copy that across as well.
//
// Idempotent: rows with translation_id != NULL are skipped on subsequent runs.
// The bilingual-aware seeders for Doa/Dzikir handle their own Translation
// upserts and are not touched here.
func BackfillTranslations(db *gorm.DB) error {
	if err := backfillKajian(db); err != nil {
		return err
	}
	if err := backfillSholatGuide(db); err != nil {
		return err
	}
	if err := backfillManasik(db); err != nil {
		return err
	}
	if err := backfillTahlilItems(db); err != nil {
		return err
	}
	if err := backfillAsbabunNuzul(db); err != nil {
		return err
	}
	if err := backfillFiqhCategories(db); err != nil {
		return err
	}
	if err := backfillFiqhItems(db); err != nil {
		return err
	}
	if err := backfillDictionary(db); err != nil {
		return err
	}
	if err := backfillHistory(db); err != nil {
		return err
	}
	if err := backfillSirohCategories(db); err != nil {
		return err
	}
	if err := backfillSirohContents(db); err != nil {
		return err
	}
	if err := backfillBlogCategories(db); err != nil {
		return err
	}
	if err := backfillBlogTags(db); err != nil {
		return err
	}
	if err := backfillBlogPosts(db); err != nil {
		return err
	}
	if err := backfillQuiz(db); err != nil {
		return err
	}
	if err := backfillAsmaUlHusna(db); err != nil {
		return err
	}
	if err := backfillAmalanItems(db); err != nil {
		return err
	}
	if err := backfillIslamicEvents(db); err != nil {
		return err
	}
	if err := backfillDoa(db); err != nil {
		return err
	}
	if err := backfillDzikir(db); err != nil {
		return err
	}
	if err := backfillPerawi(db); err != nil {
		return err
	}
	if err := backfillJarhTadil(db); err != nil {
		return err
	}
	return nil
}

// linkTranslation creates a Translation row from the supplied data and updates
// the parent table's translation_id to point at it. The parent row is matched
// by (table, idColumn = idValue).
func linkTranslation(db *gorm.DB, table, idColumn string, idValue interface{}, tr *model.Translation) error {
	if err := db.Create(tr).Error; err != nil {
		return err
	}
	return db.Table(table).Where(idColumn+" = ?", idValue).Update("translation_id", tr.ID).Error
}

func backfillKajian(db *gorm.DB) error {
	var rows []model.Kajian
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			DescriptionIdn: stringPtr(row.Description),
		}
		if err := linkTranslation(db, "kajian", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillSholatGuide(db *gorm.DB) error {
	var rows []model.SholatGuide
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			Ar:             stringPtr(row.Arabic),
			LatinIdn:       stringPtr(row.Transliteration),
			DescriptionIdn: stringPtr(row.TranslationText),
		}
		if err := linkTranslation(db, "sholat_guide", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillManasik(db *gorm.DB) error {
	var rows []model.ManasikStep
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			Ar:             stringPtr(row.Arabic),
			LatinIdn:       stringPtr(row.Transliteration),
			DescriptionIdn: stringPtr(row.TranslationText),
		}
		if err := linkTranslation(db, "manasik_step", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillTahlilItems(db *gorm.DB) error {
	var rows []model.TahlilItem
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Label),
			Ar:             stringPtr(row.Arabic),
			LatinIdn:       stringPtr(row.Transliteration),
			DescriptionIdn: stringPtr(row.TranslationText),
		}
		if err := linkTranslation(db, "tahlil_item", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillAsbabunNuzul(db *gorm.DB) error {
	var rows []model.AsbabunNuzul
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			LatinIdn:       stringPtr(row.Narrator),
			DescriptionIdn: stringPtr(row.Content),
		}
		if err := linkTranslation(db, "asbabun_nuzul", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillFiqhCategories(db *gorm.DB) error {
	var rows []model.FiqhCategory
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Name),
			DescriptionIdn: stringPtr(row.Description),
		}
		if err := linkTranslation(db, "fiqh_category", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillFiqhItems(db *gorm.DB) error {
	var rows []model.FiqhItem
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			DescriptionIdn: stringPtr(row.Content),
		}
		if err := linkTranslation(db, "fiqh_item", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillDictionary(db *gorm.DB) error {
	var rows []model.IslamicTerm
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Term),
			DescriptionIdn: stringPtr(row.Definition),
		}
		if err := linkTranslation(db, "islamic_term", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillHistory(db *gorm.DB) error {
	var rows []model.HistoryEvent
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			DescriptionIdn: stringPtr(row.Description),
		}
		if err := linkTranslation(db, "history_event", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillSirohCategories(db *gorm.DB) error {
	var rows []model.SirohCategory
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{Idn: stringPtr(row.Title)}
		if err := linkTranslation(db, "siroh_category", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillSirohContents(db *gorm.DB) error {
	var rows []model.SirohContent
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			DescriptionIdn: stringPtr(row.Content),
		}
		if err := linkTranslation(db, "siroh_content", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillBlogCategories(db *gorm.DB) error {
	var rows []model.BlogCategory
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Name),
			DescriptionIdn: stringPtr(row.Description),
		}
		if err := linkTranslation(db, "blog_category", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillBlogTags(db *gorm.DB) error {
	var rows []model.BlogTag
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{Idn: stringPtr(row.Name)}
		if err := linkTranslation(db, "blog_tag", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillBlogPosts(db *gorm.DB) error {
	var rows []model.BlogPost
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			DescriptionIdn: stringPtr(row.Content),
		}
		if err := linkTranslation(db, "blog_post", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillQuiz(db *gorm.DB) error {
	var rows []model.Quiz
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.QuestionText),
			DescriptionIdn: stringPtr(row.Explanation),
		}
		if err := linkTranslation(db, "quiz", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillAsmaUlHusna(db *gorm.DB) error {
	var rows []model.AsmaUlHusna
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Indonesian),
			En:             stringPtr(row.English),
			Ar:             stringPtr(row.Arabic),
			LatinIdn:       stringPtr(row.Transliteration),
			DescriptionIdn: stringPtr(row.Meaning),
		}
		if err := linkTranslation(db, "asma_ul_husna", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillAmalanItems(db *gorm.DB) error {
	var rows []model.AmalanItem
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Name),
			DescriptionIdn: stringPtr(row.Description),
		}
		if err := linkTranslation(db, "amalan_item", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillIslamicEvents(db *gorm.DB) error {
	var rows []model.IslamicEvent
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Name),
			DescriptionIdn: stringPtr(row.Description),
		}
		if err := linkTranslation(db, "islamic_event", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillDoa(db *gorm.DB) error {
	var rows []model.Doa
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			LatinIdn:       stringPtr(row.Transliteration),
			DescriptionIdn: stringPtr(row.TranslationText),
			Ar:             stringPtr(row.Arabic),
		}
		if err := linkTranslation(db, "doa", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillDzikir(db *gorm.DB) error {
	var rows []model.Dzikir
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		tr := &model.Translation{
			Idn:            stringPtr(row.Title),
			LatinIdn:       stringPtr(row.Transliteration),
			DescriptionIdn: stringPtr(row.TranslationText),
			Ar:             stringPtr(row.Arabic),
		}
		if err := linkTranslation(db, "dzikir", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillPerawi(db *gorm.DB) error {
	var rows []model.Perawi
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		biografis := ""
		if row.Biografis != nil {
			biografis = *row.Biografis
		}
		tr := &model.Translation{
			Idn:            stringPtr(biografis),
			DescriptionIdn: stringPtr(biografis),
		}
		if err := linkTranslation(db, "perawi", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}

func backfillJarhTadil(db *gorm.DB) error {
	var rows []model.JarhTadil
	if err := db.Where("translation_id IS NULL").Find(&rows).Error; err != nil {
		return err
	}
	for _, row := range rows {
		teksNilai := ""
		if row.TeksNilai != nil {
			teksNilai = *row.TeksNilai
		}
		catatan := ""
		if row.Catatan != nil {
			catatan = *row.Catatan
		}
		tr := &model.Translation{
			Idn:            stringPtr(teksNilai),
			DescriptionIdn: stringPtr(catatan),
		}
		if err := linkTranslation(db, "jarh_tadil", "id", row.ID, tr); err != nil {
			return err
		}
	}
	return nil
}
