package migrations

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

// BackfillSources populates the `Source` column added to ManasikStep and
// AsmaUlHusna. It runs after seeding, alongside BackfillTranslations, so it
// covers both a fresh database and rows that were already seeded in
// production before this column existed.
//
// AmalanItem is deliberately NOT populated here. Each of its 13 rows (Sholat
// Tahajud, Puasa Senin, Istighfar 100x, ...) needs its own dalil, and citing a
// specific hadith book/number from memory without verifying it against the
// actual text risks exactly the kind of wrong-citation bug this project has
// hit before with mismatched Arabic/translation pairs. Leave `source` empty
// until it can be filled from a checked reference rather than guessed.
//
// Idempotent: only touches rows where `source` is still empty.
func BackfillSources(db *gorm.DB) error {
	if err := backfillManasikSources(db); err != nil {
		return err
	}
	return backfillAsmaUlHusnaSources(db)
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
