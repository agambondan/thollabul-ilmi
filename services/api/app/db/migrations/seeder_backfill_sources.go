package migrations

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

// BackfillSources populates the `Source` column added to ManasikStep,
// AsmaUlHusna and AmalanItem. It runs after seeding, alongside
// BackfillTranslations, so it covers both a fresh database and rows that
// were already seeded in production before this column existed.
//
// Idempotent: only touches rows where `source` is still empty.
func BackfillSources(db *gorm.DB) error {
	if err := backfillManasikSources(db); err != nil {
		return err
	}
	if err := backfillAsmaUlHusnaSources(db); err != nil {
		return err
	}
	if err := backfillAmalanSources(db); err != nil {
		return err
	}
	return backfillFiqhDalil(db)
}

// manasikSources holds the citations that were already present as free text
// inside each step's `Notes` field (QS. Al-Baqarah: 125, HR. Bukhari No.
// 1751, ...). This lifts them into the structured `source` column so the web
// and mobile clients can render them as linked source badges instead of
// leaving them buried in a paragraph of notes. Steps with no citation in
// their original Notes text are left out here — nothing is invented for
// them.
var manasikSources = []struct {
	Type      model.ManasikType
	StepOrder int
	Source    string
}{
	{model.ManasikTypeUmrah, 5, "QS. Al-Baqarah: 125"},
	{model.ManasikTypeUmrah, 7, "QS. Al-Fath: 27"},
	{model.ManasikTypeHaji, 3, "HR. Abu Dawud; HR. Tirmidzi No. 3585"},
	{model.ManasikTypeHaji, 5, "HR. Bukhari No. 1751"},
	{model.ManasikTypeHaji, 6, "QS. Al-Baqarah: 196"},
	{model.ManasikTypeHaji, 8, "QS. Al-Hajj: 29"},
	{model.ManasikTypeHaji, 10, "HR. Bukhari No. 1755"},
}

func backfillManasikSources(db *gorm.DB) error {
	for _, entry := range manasikSources {
		if err := db.Model(&model.ManasikStep{}).
			Where("type = ? AND step_order = ? AND (source IS NULL OR source = '')", entry.Type, entry.StepOrder).
			Update("source", entry.Source).Error; err != nil {
			return err
		}
	}
	return nil
}

// asmaUlHusnaSource is the hadith establishing that Allah has 99 names —
// the basis for enumerating them at all. This project already cites it, in
// exactly this form, in the Asmaul Husna quiz question in seeder_tier3.go:
// "Nabi صلى الله عليه وسلم bersabda: 'Sesungguhnya Allah memiliki 99 nama...'".
// It applies to the set as a whole, not a specific ayah per name — scholars
// differ on which single ayah "derives" any individual name, so no per-name
// Quranic citation is added here.
const asmaUlHusnaSource = "HR. Bukhari No. 2736; HR. Muslim No. 2677"

func backfillAsmaUlHusnaSources(db *gorm.DB) error {
	return db.Model(&model.AsmaUlHusna{}).
		Where("source IS NULL OR source = ''").
		Update("source", asmaUlHusnaSource).Error
}

// amalanSources holds the dalil for each seeded AmalanItem row. Each
// citation was independently researched and adversarially verified (3
// independent fact-checkers per candidate, majority must confirm) rather
// than written from memory — see docs/reviews/2026-09-01-web-frontend-deep-review.md
// catatan #9 for the process. "Sholawat 100x" is deliberately left out: the
// verifiers could not corroborate a specific "100 kali" narration for it, so
// its source stays empty rather than shipping an unverified guess.
var amalanSources = []struct {
	Category model.AmalanCategory
	Name     string
	Source   string
}{
	{model.AmalanSholat, "Sholat Tahajud", "QS. Al-Isra: 79; HR. Muslim No. 1163"},
	{model.AmalanSholat, "Sholat Dhuha", "HR. Muslim No. 720"},
	{model.AmalanSholat, "Sholat Rawatib", "HR. Muslim No. 728"},
	{model.AmalanPuasa, "Puasa Senin", "HR. Muslim No. 1162"},
	{model.AmalanPuasa, "Puasa Kamis", "HR. Tirmidzi No. 747"},
	{model.AmalanPuasa, "Puasa Ayyamul Bidh", "HR. Tirmidzi No. 761; Nasai No. 2424"},
	{model.AmalanDzikir, "Dzikir Pagi", "QS. Al-Ahzab: 41-42"},
	{model.AmalanDzikir, "Dzikir Petang", "QS. Al-Ahzab: 41-42"},
	{model.AmalanDzikir, "Istighfar 100x", "HR. Muslim No. 2702"},
	{model.AmalanSedekah, "Sedekah Harian", "HR. Bukhari No. 2989; Muslim No. 1009"},
	{model.AmalanLainnya, "Tilawah Al-Quran", "HR. Tirmidzi No. 2910"},
	{model.AmalanLainnya, "Baca Hadith", "HR. Abu Dawud No. 3660; Tirmidzi No. 2656; Ibnu Majah No. 230"},
}

func backfillAmalanSources(db *gorm.DB) error {
	for _, entry := range amalanSources {
		if err := db.Model(&model.AmalanItem{}).
			Where("category = ? AND name = ? AND (source IS NULL OR source = '')", entry.Category, entry.Name).
			Update("source", entry.Source).Error; err != nil {
			return err
		}
	}
	return nil
}

func backfillFiqhDalil(db *gorm.DB) error {
	type row struct {
		Slug   string `json:"slug"`
		Source string `json:"source"`
		Dalil  string `json:"dalil"`
	}
	var rows []row
	if !readStaticJSON("fiqh_item.json", &rows) {
		return nil
	}
	for _, entry := range rows {
		dalil := entry.Dalil
		if dalil == "" {
			dalil = entry.Source
		}
		if err := db.Model(&model.FiqhItem{}).
			Where("slug = ?", entry.Slug).
			Updates(map[string]interface{}{"source": entry.Source, "dalil": dalil}).Error; err != nil {
			return err
		}
	}
	return nil
}
