package migrations

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const staticDataDir = "data/static"

// SeedStaticFromFiles seeds all static Islamic content from data/static/*.json.
// No-op per table if the static dir is absent or the table already has data.
// Call from Seeder() after DB is migrated.
func SeedStaticFromFiles(db *gorm.DB) {
	if _, err := os.Stat(staticDataDir); os.IsNotExist(err) {
		log.Println("[seeder] data/static/ tidak ditemukan — skip SeedStaticFromFiles")
		return
	}
	seedDoaFromFile(db)
	seedAsmaUlHusnaFromFile(db)
	seedAmalanItemFromFile(db)
	seedDzikirFromFile(db)
	seedSholatGuideFromFile(db)
	seedFiqhCategoriesFromFile(db)
	seedFiqhItemsFromFile(db)
	seedTahlilCollectionsFromFile(db)
	seedTahlilItemsFromFile(db)
	seedSirohCategoriesFromFile(db)
	seedSirohContentsFromFile(db)
	seedBlogCategoriesFromFile(db)
	seedBlogTagsFromFile(db)
	seedKajianFromFile(db)
	seedAchievementsFromFile(db)
	seedQuizQuestionsFromFile(db)
	seedIslamicEventsFromFile(db)
	seedHistoryEventsFromFile(db)
	seedManasikStepsFromFile(db)
	seedIslamicTermsFromFile(db)
	seedAsbabunNuzulFromFile(db)
	seedPerawiFromFile(db)
	seedJarhTadilFromFile(db)
	seedPerawiGuruFromFile(db)
	seedTokohTarikhFromFile(db)
	SeedLocationsFromFile(db)
}

// ── helpers ───────────────────────────────────────────────────────────────────

func readStaticJSON(name string, dst interface{}) bool {
	path := staticDataDir + "/" + name
	f, err := os.Open(path)
	if err != nil {
		log.Printf("[seeder] %s tidak ditemukan — skip", path)
		return false
	}
	defer f.Close()
	if err := json.NewDecoder(f).Decode(dst); err != nil {
		log.Printf("[seeder] parse %s gagal: %v", path, err)
		return false
	}
	return true
}

// ── Doa ───────────────────────────────────────────────────────────────────────

func seedDoaFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.Doa{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Category        string `json:"category"`
		Title           string `json:"title"`
		Arabic          string `json:"arabic"`
		Transliteration string `json:"transliteration"`
		TranslationText string `json:"translation_text"`
		Source          string `json:"source"`
	}
	var rows []row
	if !readStaticJSON("doa.json", &rows) {
		return
	}
	log.Printf("[seeder] seedDoaFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.Doa{
			Category:        model.DoaCategory(r.Category),
			Title:           r.Title,
			Arabic:          r.Arabic,
			Transliteration: r.Transliteration,
			TranslationText: r.TranslationText,
			Source:          r.Source,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "category"}, {Name: "title"}},
			DoUpdates: clause.AssignmentColumns([]string{"arabic", "transliteration", "translation", "source"}),
		}).Create(&item)
	}
}

// ── Asmaul Husna ──────────────────────────────────────────────────────────────

func seedAsmaUlHusnaFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.AsmaUlHusna{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Number          int    `json:"number"`
		Arabic          string `json:"arabic"`
		Transliteration string `json:"transliteration"`
		Indonesian      string `json:"indonesian"`
		English         string `json:"english"`
		Meaning         string `json:"meaning"`
	}
	var rows []row
	if !readStaticJSON("asma_ul_husna.json", &rows) {
		return
	}
	log.Printf("[seeder] seedAsmaUlHusnaFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.AsmaUlHusna{
			Number:          r.Number,
			Arabic:          r.Arabic,
			Transliteration: r.Transliteration,
			Indonesian:      r.Indonesian,
			English:         r.English,
			Meaning:         r.Meaning,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "number"}},
			DoUpdates: clause.AssignmentColumns([]string{"arabic", "transliteration", "indonesian", "english", "meaning"}),
		}).Create(&item)
	}
}

// ── Amalan Item ───────────────────────────────────────────────────────────────

func seedAmalanItemFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.AmalanItem{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Category    string `json:"category"`
	}
	var rows []row
	if !readStaticJSON("amalan_item.json", &rows) {
		return
	}
	log.Printf("[seeder] seedAmalanItemFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.AmalanItem{Name: r.Name, Description: r.Description, Category: model.AmalanCategory(r.Category)}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"description", "category"}),
		}).Create(&item)
	}
}

// ── Dzikir ────────────────────────────────────────────────────────────────────

func seedDzikirFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.Dzikir{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Category        string `json:"category"`
		Title           string `json:"title"`
		Arabic          string `json:"arabic"`
		Transliteration string `json:"transliteration"`
		TranslationText string `json:"translation_text"`
		Count           int    `json:"count"`
		Fadhilah        string `json:"fadhilah"`
		Source          string `json:"source"`
		Occasion        string `json:"occasion"`
	}
	var rows []row
	if !readStaticJSON("dzikir.json", &rows) {
		return
	}
	log.Printf("[seeder] seedDzikirFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.Dzikir{
			Category:        model.DzikirCategory(r.Category),
			Title:           r.Title,
			Arabic:          r.Arabic,
			Transliteration: r.Transliteration,
			TranslationText: r.TranslationText,
			Count:           r.Count,
			Fadhilah:        r.Fadhilah,
			Source:          r.Source,
			Occasion:        r.Occasion,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "category"}, {Name: "title"}},
			DoUpdates: clause.AssignmentColumns([]string{"arabic", "transliteration", "translation", "count", "fadhilah", "source", "occasion"}),
		}).Create(&item)
	}
}

// ── Sholat Guide ──────────────────────────────────────────────────────────────

func seedSholatGuideFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.SholatGuide{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Step            int    `json:"step"`
		Title           string `json:"title"`
		Arabic          string `json:"arabic"`
		Transliteration string `json:"transliteration"`
		TranslationText string `json:"translation_text"`
		Description     string `json:"description"`
		Source          string `json:"source"`
		Notes           string `json:"notes"`
	}
	var rows []row
	if !readStaticJSON("sholat_guide.json", &rows) {
		return
	}
	log.Printf("[seeder] seedSholatGuideFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.SholatGuide{
			Step:            r.Step,
			Title:           r.Title,
			Arabic:          r.Arabic,
			Transliteration: r.Transliteration,
			TranslationText: r.TranslationText,
			Description:     r.Description,
			Source:          r.Source,
			Notes:           r.Notes,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "step"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "arabic", "transliteration", "translation", "description", "source", "notes"}),
		}).Create(&item)
	}
}

// ── Fiqh Category ─────────────────────────────────────────────────────────────

func seedFiqhCategoriesFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.FiqhCategory{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
	}
	var rows []row
	if !readStaticJSON("fiqh_category.json", &rows) {
		return
	}
	log.Printf("[seeder] seedFiqhCategoriesFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.FiqhCategory{Name: r.Name, Slug: r.Slug, Description: r.Description}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"name", "description"}),
		}).Create(&item)
	}
}

// ── Fiqh Item ─────────────────────────────────────────────────────────────────

func seedFiqhItemsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.FiqhItem{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		CategorySlug string `json:"category_slug"`
		Title        string `json:"title"`
		Slug         string `json:"slug"`
		Content      string `json:"content"`
		Source       string `json:"source"`
		SortOrder    int    `json:"sort_order"`
	}
	var rows []row
	if !readStaticJSON("fiqh_item.json", &rows) {
		return
	}
	log.Printf("[seeder] seedFiqhItemsFromFile: %d entri", len(rows))
	catCache := make(map[string]int)
	for _, r := range rows {
		catID, ok := catCache[r.CategorySlug]
		if !ok {
			var cat model.FiqhCategory
			if err := db.Where("slug = ?", r.CategorySlug).First(&cat).Error; err != nil {
				log.Printf("[seeder] fiqh_item: category '%s' tidak ditemukan — skip", r.CategorySlug)
				continue
			}
			catID = *cat.ID
			catCache[r.CategorySlug] = catID
		}
		catIDPtr := catID
		item := model.FiqhItem{
			CategoryID: &catIDPtr,
			Title:      r.Title,
			Slug:       r.Slug,
			Content:    r.Content,
			Source:     r.Source,
			SortOrder:  r.SortOrder,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "content", "source", "sort_order"}),
		}).Create(&item)
	}
}

// ── Tahlil Collection ─────────────────────────────────────────────────────────

func seedTahlilCollectionsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.TahlilCollection{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Type        string `json:"type"`
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	var rows []row
	if !readStaticJSON("tahlil_collection.json", &rows) {
		return
	}
	log.Printf("[seeder] seedTahlilCollectionsFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.TahlilCollection{Type: model.TahlilType(r.Type), Title: r.Title, Description: r.Description}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "type"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "description"}),
		}).Create(&item)
	}
}

// ── Tahlil Item ───────────────────────────────────────────────────────────────

func seedTahlilItemsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.TahlilItem{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		CollectionType  string `json:"collection_type"`
		SortOrder       int    `json:"sort_order"`
		Label           string `json:"label"`
		Arabic          string `json:"arabic"`
		Transliteration string `json:"transliteration"`
		TranslationText string `json:"translation_text"`
		Repeat          int    `json:"repeat"`
	}
	var rows []row
	if !readStaticJSON("tahlil_item.json", &rows) {
		return
	}
	log.Printf("[seeder] seedTahlilItemsFromFile: %d entri", len(rows))
	colCache := make(map[string]int)
	for _, r := range rows {
		colID, ok := colCache[r.CollectionType]
		if !ok {
			var col model.TahlilCollection
			if err := db.Where("type = ?", r.CollectionType).First(&col).Error; err != nil {
				log.Printf("[seeder] tahlil_item: collection '%s' tidak ditemukan — skip", r.CollectionType)
				continue
			}
			colID = *col.ID
			colCache[r.CollectionType] = colID
		}
		colIDPtr := colID
		item := model.TahlilItem{
			CollectionID:    &colIDPtr,
			SortOrder:       r.SortOrder,
			Label:           r.Label,
			Arabic:          r.Arabic,
			Transliteration: r.Transliteration,
			TranslationText: r.TranslationText,
			Repeat:          r.Repeat,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "collection_id"}, {Name: "sort_order"}},
			DoUpdates: clause.AssignmentColumns([]string{"label", "arabic", "transliteration", "translation", "repeat"}),
		}).Create(&item)
	}
}

// ── Siroh Category ────────────────────────────────────────────────────────────

func seedSirohCategoriesFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.SirohCategory{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Title string `json:"title"`
		Slug  string `json:"slug"`
		Order int    `json:"order"`
	}
	var rows []row
	if !readStaticJSON("siroh_category.json", &rows) {
		return
	}
	log.Printf("[seeder] seedSirohCategoriesFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.SirohCategory{Title: r.Title, Slug: r.Slug, Order: r.Order}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", `"order"`}),
		}).Create(&item)
	}
}

// ── Siroh Content ─────────────────────────────────────────────────────────────

func seedSirohContentsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.SirohContent{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		CategorySlug string `json:"category_slug"`
		Title        string `json:"title"`
		Slug         string `json:"slug"`
		Content      string `json:"content"`
		Order        int    `json:"order"`
	}
	var rows []row
	if !readStaticJSON("siroh_content.json", &rows) {
		return
	}
	log.Printf("[seeder] seedSirohContentsFromFile: %d entri", len(rows))
	catCache := make(map[string]int)
	for _, r := range rows {
		catID, ok := catCache[r.CategorySlug]
		if !ok {
			var cat model.SirohCategory
			if err := db.Where("slug = ?", r.CategorySlug).First(&cat).Error; err != nil {
				log.Printf("[seeder] siroh_content: category '%s' tidak ditemukan — skip", r.CategorySlug)
				continue
			}
			catID = *cat.ID
			catCache[r.CategorySlug] = catID
		}
		catIDPtr := catID
		item := model.SirohContent{
			CategoryID: &catIDPtr,
			Title:      r.Title,
			Slug:       r.Slug,
			Content:    r.Content,
			Order:      r.Order,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "content", `"order"`}),
		}).Create(&item)
	}
}

// ── Blog Category ─────────────────────────────────────────────────────────────

func seedBlogCategoriesFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.BlogCategory{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
	}
	var rows []row
	if !readStaticJSON("blog_category.json", &rows) {
		return
	}
	log.Printf("[seeder] seedBlogCategoriesFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.BlogCategory{Name: r.Name, Slug: r.Slug, Description: r.Description}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"name", "description"}),
		}).Create(&item)
	}
}

// ── Blog Tag ──────────────────────────────────────────────────────────────────

func seedBlogTagsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.BlogTag{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Name string `json:"name"`
		Slug string `json:"slug"`
	}
	var rows []row
	if !readStaticJSON("blog_tag.json", &rows) {
		return
	}
	log.Printf("[seeder] seedBlogTagsFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.BlogTag{Name: r.Name, Slug: r.Slug}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"name"}),
		}).Create(&item)
	}
}

// ── Kajian ────────────────────────────────────────────────────────────────────

func seedKajianFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.Kajian{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Title       string `json:"title"`
		Speaker     string `json:"speaker"`
		Topic       string `json:"topic"`
		Type        string `json:"type"`
		Description string `json:"description"`
		Duration    int    `json:"duration"`
		PublishedAt string `json:"published_at"`
	}
	var rows []row
	if !readStaticJSON("kajian.json", &rows) {
		return
	}
	log.Printf("[seeder] seedKajianFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.Kajian{
			Title:       r.Title,
			Speaker:     r.Speaker,
			Topic:       r.Topic,
			Type:        model.KajianType(r.Type),
			Description: r.Description,
			Duration:    r.Duration,
			PublishedAt: r.PublishedAt,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "title"}, {Name: "speaker"}},
			DoUpdates: clause.AssignmentColumns([]string{"description", "duration", "published_at"}),
		}).Create(&item)
	}
}

// ── Achievement ───────────────────────────────────────────────────────────────

func seedAchievementsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.Achievement{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Code        string `json:"code"`
		Name        string `json:"name"`
		NameEn      string `json:"name_en"`
		Description string `json:"description"`
		DescEn      string `json:"desc_en"`
		Icon        string `json:"icon"`
		Category    string `json:"category"`
		Threshold   int    `json:"threshold"`
	}
	var rows []row
	if !readStaticJSON("achievement.json", &rows) {
		return
	}
	log.Printf("[seeder] seedAchievementsFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.Achievement{
			Code:        r.Code,
			Name:        r.Name,
			NameEn:      r.NameEn,
			Description: r.Description,
			DescEn:      r.DescEn,
			Icon:        r.Icon,
			Category:    r.Category,
			Threshold:   r.Threshold,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "code"}},
			DoUpdates: clause.AssignmentColumns([]string{"name", "name_en", "description", "desc_en", "icon", "category", "threshold"}),
		}).Create(&item)
	}
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

func seedQuizQuestionsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.Quiz{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Type          string `json:"type"`
		Difficulty    string `json:"difficulty"`
		QuestionText  string `json:"question_text"`
		CorrectAnswer string `json:"correct_answer"`
		Options       string `json:"options"`
		Explanation   string `json:"explanation"`
	}
	var rows []row
	if !readStaticJSON("quiz.json", &rows) {
		return
	}
	log.Printf("[seeder] seedQuizQuestionsFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.Quiz{
			Type:          model.QuizType(r.Type),
			Difficulty:    r.Difficulty,
			QuestionText:  r.QuestionText,
			CorrectAnswer: r.CorrectAnswer,
			Options:       r.Options,
			Explanation:   r.Explanation,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "question_text"}},
			DoUpdates: clause.AssignmentColumns([]string{"type", "difficulty", "correct_answer", "options", "explanation"}),
		}).Create(&item)
	}
}

// ── Islamic Event ─────────────────────────────────────────────────────────────

func seedIslamicEventsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.IslamicEvent{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Name        string `json:"name"`
		HijriMonth  int    `json:"hijri_month"`
		HijriDay    int    `json:"hijri_day"`
		Category    string `json:"category"`
		Description string `json:"description"`
	}
	var rows []row
	if !readStaticJSON("islamic_event.json", &rows) {
		return
	}
	log.Printf("[seeder] seedIslamicEventsFromFile: %d entri", len(rows))
	for _, r := range rows {
		tr := model.Translation{
			Idn:            stringPtr(r.Name),
			DescriptionIdn: stringPtr(r.Description),
		}
		if err := db.Create(&tr).Error; err != nil {
			log.Printf("[seeder] islamic_event translation '%s': %v", r.Name, err)
		}
		item := model.IslamicEvent{
			Name:          r.Name,
			HijriMonth:    r.HijriMonth,
			HijriDay:      r.HijriDay,
			Category:      model.IslamicEventCategory(r.Category),
			Description:   r.Description,
			TranslationID: tr.ID,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "hijri_month"}, {Name: "hijri_day"}, {Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"description", "category", "translation_id"}),
		}).Create(&item)
	}
}

// ── History Event ─────────────────────────────────────────────────────────────

func seedHistoryEventsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.HistoryEvent{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		YearHijri     int    `json:"year_hijri"`
		YearMiladi    int    `json:"year_miladi"`
		Title         string `json:"title"`
		Slug          string `json:"slug"`
		Description   string `json:"description"`
		Category      string `json:"category"`
		IsSignificant bool   `json:"is_significant"`
	}
	var rows []row
	if !readStaticJSON("history_event.json", &rows) {
		return
	}
	log.Printf("[seeder] seedHistoryEventsFromFile: %d entri", len(rows))
	for _, r := range rows {
		tr := model.Translation{
			Idn:            stringPtr(r.Title),
			DescriptionIdn: stringPtr(r.Description),
		}
		if err := db.Create(&tr).Error; err != nil {
			log.Printf("[seeder] history_event translation '%s': %v", r.Title, err)
		}
		item := model.HistoryEvent{
			YearHijri:     r.YearHijri,
			YearMiladi:    r.YearMiladi,
			Title:         r.Title,
			Slug:          r.Slug,
			Description:   r.Description,
			Category:      model.HistoryCategory(r.Category),
			IsSignificant: r.IsSignificant,
			TranslationID: tr.ID,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "description", "year_hijri", "year_miladi", "category", "is_significant", "translation_id"}),
		}).Create(&item)
	}
}

// ── Manasik Step ──────────────────────────────────────────────────────────────

func seedManasikStepsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.ManasikStep{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Type            string `json:"type"`
		StepOrder       int    `json:"step_order"`
		Title           string `json:"title"`
		Description     string `json:"description"`
		Arabic          string `json:"arabic"`
		Transliteration string `json:"transliteration"`
		TranslationText string `json:"translation_text"`
		Notes           string `json:"notes"`
		IsWajib         bool   `json:"is_wajib"`
	}
	var rows []row
	if !readStaticJSON("manasik_step.json", &rows) {
		return
	}
	log.Printf("[seeder] seedManasikStepsFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.ManasikStep{
			Type:            model.ManasikType(r.Type),
			StepOrder:       r.StepOrder,
			Title:           r.Title,
			Description:     r.Description,
			Arabic:          r.Arabic,
			Transliteration: r.Transliteration,
			TranslationText: r.TranslationText,
			Notes:           r.Notes,
			IsWajib:         r.IsWajib,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "type"}, {Name: "step_order"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "description", "arabic", "transliteration", "translation", "notes", "is_wajib"}),
		}).Create(&item)
	}
}

// ── Islamic Term ──────────────────────────────────────────────────────────────

func seedIslamicTermsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.IslamicTerm{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Term       string `json:"term"`
		Category   string `json:"category"`
		Definition string `json:"definition"`
		Example    string `json:"example"`
		Source     string `json:"source"`
		Origin     string `json:"origin"`
	}
	var rows []row
	if !readStaticJSON("islamic_term.json", &rows) {
		return
	}
	log.Printf("[seeder] seedIslamicTermsFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.IslamicTerm{
			Term:       r.Term,
			Category:   model.TermCategory(r.Category),
			Definition: r.Definition,
			Example:    r.Example,
			Source:     r.Source,
			Origin:     r.Origin,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "term"}},
			DoUpdates: clause.AssignmentColumns([]string{"category", "definition", "example", "source", "origin"}),
		}).Create(&item)
	}
}

// ── Asbabun Nuzul ─────────────────────────────────────────────────────────────

func seedAsbabunNuzulFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.AsbabunNuzul{}).Count(&count)
	if count > 0 {
		return
	}
	type ayahRef struct {
		SurahNumber int `json:"surah_number"`
		AyahNumber  int `json:"ayah_number"`
	}
	type row struct {
		Title      string    `json:"title"`
		Narrator   string    `json:"narrator"`
		Content    string    `json:"content"`
		Source     string    `json:"source"`
		DisplayRef string    `json:"display_ref"`
		Ayahs      []ayahRef `json:"ayahs"`
	}
	var rows []row
	if !readStaticJSON("asbabun_nuzul.json", &rows) {
		return
	}
	log.Printf("[seeder] seedAsbabunNuzulFromFile: %d entri", len(rows))

	// Build ayah index: "surah:ayah" → ayah.id
	type ayahIdx struct {
		ID          int
		Number      int
		SurahNumber int
	}
	var idxRows []ayahIdx
	db.Raw(`SELECT ayah.id, ayah.number, surah.number AS surah_number FROM ayah JOIN surah ON surah.id = ayah.surah_id`).Scan(&idxRows)
	ayahMap := make(map[string]int, len(idxRows))
	for _, a := range idxRows {
		ayahMap[fmt.Sprintf("%d:%d", a.SurahNumber, a.Number)] = a.ID
	}

	for _, r := range rows {
		var existing model.AsbabunNuzul
		if err := db.Where("title = ?", r.Title).First(&existing).Error; err == nil {
			continue // already exists
		}
		var ayahs []model.Ayah
		for _, ref := range r.Ayahs {
			if id, ok := ayahMap[fmt.Sprintf("%d:%d", ref.SurahNumber, ref.AyahNumber)]; ok {
				ayahs = append(ayahs, model.Ayah{BaseID: model.BaseID{ID: &id}})
			}
		}
		tr := model.Translation{
			Idn:            stringPtr(r.Title),
			LatinIdn:       stringPtr(r.Narrator),
			DescriptionIdn: stringPtr(r.Content),
		}
		if err := db.Create(&tr).Error; err != nil {
			log.Printf("[seeder] asbabun_nuzul translation '%s': %v", r.Title, err)
		}
		item := model.AsbabunNuzul{
			Title:         r.Title,
			Narrator:      r.Narrator,
			Content:       r.Content,
			Source:        r.Source,
			DisplayRef:    r.DisplayRef,
			TranslationID: tr.ID,
			Ayahs:         ayahs,
		}
		if err := db.Create(&item).Error; err != nil {
			log.Printf("[seeder] asbabun_nuzul create '%s': %v", r.Title, err)
		}
	}
}

// ── Perawi ────────────────────────────────────────────────────────────────────

func seedPerawiFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.Perawi{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		NamaArab    string `json:"nama_arab"`
		NamaLatin   string `json:"nama_latin"`
		NamaLengkap string `json:"nama_lengkap"`
		Kunyah      string `json:"kunyah"`
		Nisbah      string `json:"nisbah"`
		TahunLahir  *int   `json:"tahun_lahir"`
		TahunWafat  *int   `json:"tahun_wafat"`
		TahunHijri  bool   `json:"tahun_hijri"`
		TempatLahir string `json:"tempat_lahir"`
		TempatWafat string `json:"tempat_wafat"`
		Tabaqah     string `json:"tabaqah"`
		Status      string `json:"status"`
		Biografis   string `json:"biografis"`
	}
	var rows []row
	if !readStaticJSON("perawi.json", &rows) {
		return
	}
	log.Printf("[seeder] seedPerawiFromFile: %d entri", len(rows))
	for _, r := range rows {
		tr := model.Translation{
			Idn:            stringPtr(r.Biografis),
			DescriptionIdn: stringPtr(r.Biografis),
		}
		if err := db.Create(&tr).Error; err != nil {
			log.Printf("[seeder] perawi translation '%s': %v", r.NamaLatin, err)
			continue
		}
		item := model.Perawi{
			NamaArab:      strptrIfNonEmpty(r.NamaArab),
			NamaLatin:     strptrIfNonEmpty(r.NamaLatin),
			NamaLengkap:   strptrIfNonEmpty(r.NamaLengkap),
			Kunyah:        strptrIfNonEmpty(r.Kunyah),
			Nisbah:        strptrIfNonEmpty(r.Nisbah),
			TahunLahir:    r.TahunLahir,
			TahunWafat:    r.TahunWafat,
			TahunHijri:    &r.TahunHijri,
			TempatLahir:   strptrIfNonEmpty(r.TempatLahir),
			TempatWafat:   strptrIfNonEmpty(r.TempatWafat),
			Tabaqah:       strptrIfNonEmpty(r.Tabaqah),
			Status:        strptrIfNonEmpty(r.Status),
			Biografis:     strptrIfNonEmpty(r.Biografis),
			TranslationID: tr.ID,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "nama_latin"}},
			DoUpdates: clause.AssignmentColumns([]string{"nama_arab", "nama_lengkap", "kunyah", "nisbah", "tahun_lahir", "tahun_wafat", "tempat_lahir", "tempat_wafat", "tabaqah", "status", "biografis", "translation_id"}),
		}).Create(&item)
	}
}

// ── Jarh Tadil ────────────────────────────────────────────────────────────────

func seedJarhTadilFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.JarhTadil{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		PerawiNamaLatin  string  `json:"perawi_nama_latin"`
		PenilaiNamaLatin string  `json:"penilai_nama_latin"`
		JenisNilai       string  `json:"jenis_nilai"`
		Tingkat          *int    `json:"tingkat"`
		TeksNilai        *string `json:"teks_nilai"`
		Sumber           *string `json:"sumber"`
		Halaman          *string `json:"halaman"`
		Catatan          *string `json:"catatan"`
	}
	var rows []row
	if !readStaticJSON("jarh_tadil.json", &rows) {
		return
	}
	log.Printf("[seeder] seedJarhTadilFromFile: %d entri", len(rows))
	perawiCache := make(map[string]int)
	lookupPerawi := func(namaLatin string) (int, bool) {
		if id, ok := perawiCache[namaLatin]; ok {
			return id, true
		}
		var p model.Perawi
		if err := db.Where("nama_latin = ?", namaLatin).First(&p).Error; err != nil {
			return 0, false
		}
		perawiCache[namaLatin] = *p.ID
		return *p.ID, true
	}

	for _, r := range rows {
		pID, ok := lookupPerawi(r.PerawiNamaLatin)
		if !ok {
			log.Printf("[seeder] jarh_tadil: perawi '%s' tidak ditemukan — skip", r.PerawiNamaLatin)
			continue
		}
		penilaiID, ok := lookupPerawi(r.PenilaiNamaLatin)
		if !ok {
			log.Printf("[seeder] jarh_tadil: penilai '%s' tidak ditemukan — skip", r.PenilaiNamaLatin)
			continue
		}
		jenisNilai := model.JarhTadilJenis(r.JenisNilai)
		teksVal := ""
		if r.TeksNilai != nil {
			teksVal = *r.TeksNilai
		}
		catatVal := ""
		if r.Catatan != nil {
			catatVal = *r.Catatan
		}
		tr := model.Translation{
			Idn:            stringPtr(teksVal),
			DescriptionIdn: stringPtr(catatVal),
		}
		if err := db.Create(&tr).Error; err != nil {
			log.Printf("[seeder] jarh_tadil translation: %v", err)
			continue
		}
		item := model.JarhTadil{
			PerawiID:      &pID,
			PenilaiID:     &penilaiID,
			JenisNilai:    &jenisNilai,
			Tingkat:       r.Tingkat,
			TeksNilai:     r.TeksNilai,
			Sumber:        r.Sumber,
			Halaman:       r.Halaman,
			Catatan:       r.Catatan,
			TranslationID: tr.ID,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "perawi_id"}, {Name: "penilai_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"jenis_nilai", "tingkat", "teks_nilai", "sumber", "halaman", "catatan", "translation_id"}),
		}).Create(&item)
	}
}

// ── Perawi Guru ───────────────────────────────────────────────────────────────

func seedPerawiGuruFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.PerawiGuru{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		GuruNamaLatin  string `json:"guru_nama_latin"`
		MuridNamaLatin string `json:"murid_nama_latin"`
	}
	var rows []row
	if !readStaticJSON("perawi_guru.json", &rows) {
		return
	}
	log.Printf("[seeder] seedPerawiGuruFromFile: %d relasi", len(rows))
	perawiCache := make(map[string]int)
	lookupPerawi := func(namaLatin string) (int, bool) {
		if id, ok := perawiCache[namaLatin]; ok {
			return id, true
		}
		var p model.Perawi
		if err := db.Where("nama_latin = ?", namaLatin).First(&p).Error; err != nil || p.ID == nil {
			return 0, false
		}
		perawiCache[namaLatin] = *p.ID
		return *p.ID, true
	}
	for _, r := range rows {
		guruID, ok := lookupPerawi(r.GuruNamaLatin)
		if !ok {
			log.Printf("[seeder] perawi_guru: guru '%s' tidak ditemukan — skip", r.GuruNamaLatin)
			continue
		}
		muridID, ok := lookupPerawi(r.MuridNamaLatin)
		if !ok {
			log.Printf("[seeder] perawi_guru: murid '%s' tidak ditemukan — skip", r.MuridNamaLatin)
			continue
		}
		item := model.PerawiGuru{GuruID: &guruID, MuridID: &muridID}
		db.Clauses(clause.OnConflict{DoNothing: true}).Create(&item)
	}
}

// ── Tokoh Tarikh ──────────────────────────────────────────────────────────────

func seedTokohTarikhFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.TokohTarikh{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Nama       string `json:"nama"`
		Era        string `json:"era"`
		TahunLahir string `json:"tahun_lahir"`
		TahunWafat string `json:"tahun_wafat"`
		Biografi   string `json:"biografi"`
		Kontribusi string `json:"kontribusi"`
		Kategori   string `json:"kategori"`
		ImageURL   string `json:"image_url"`
	}
	var rows []row
	if !readStaticJSON("tokoh_tarikh.json", &rows) {
		return
	}
	// ── Locations ───────────────────────────────────────────────────────────────

	log.Printf("[seeder] seedTokohTarikhFromFile: %d entri", len(rows))
	for _, r := range rows {
		tr := model.Translation{
			Idn:            stringPtr(r.Biografi),
			DescriptionIdn: stringPtr(r.Kontribusi),
		}
		if err := db.Create(&tr).Error; err != nil {
			log.Printf("[seeder] tokoh_tarikh translation '%s': %v", r.Nama, err)
			continue
		}
		item := model.TokohTarikh{
			Nama:          r.Nama,
			Era:           r.Era,
			TahunLahir:    r.TahunLahir,
			TahunWafat:    r.TahunWafat,
			Biografi:      r.Biografi,
			Kontribusi:    r.Kontribusi,
			Kategori:      r.Kategori,
			ImageURL:      r.ImageURL,
			TranslationID: tr.ID,
		}
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "nama"}},
			DoUpdates: clause.AssignmentColumns([]string{"era", "kategori", "image_url", "translation_id"}),
		}).Create(&item).Error; err != nil {
			log.Printf("[seeder] tokoh_tarikh insert '%s': %v", r.Nama, err)
		}
	}
}

// ── Locations ───────────────────────────────────────────────────────────────────

func SeedLocationsFromFile(db *gorm.DB) {
	var count int64
	db.Model(&model.Location{}).Count(&count)
	if count > 0 {
		return
	}
	type row struct {
		Name        string  `json:"name"`
		Description string  `json:"description"`
		Latitude    float64 `json:"latitude"`
		Longitude   float64 `json:"longitude"`
		Category    string  `json:"category"`
		Era         string  `json:"era"`
	}
	var rows []row
	path := "data/locations.json"
	f, err := os.Open(path)
	if err != nil {
		log.Printf("[seeder] %s tidak ditemukan — skip", path)
		return
	}
	defer f.Close()
	if err := json.NewDecoder(f).Decode(&rows); err != nil {
		log.Printf("[seeder] parse %s gagal: %v", path, err)
		return
	}
	log.Printf("[seeder] seedLocationsFromFile: %d entri", len(rows))
	for _, r := range rows {
		item := model.Location{
			Name:        r.Name,
			Description: r.Description,
			Latitude:    r.Latitude,
			Longitude:   r.Longitude,
			Category:    r.Category,
			Era:         r.Era,
		}
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"description", "category", "era"}),
		}).Create(&item).Error; err != nil {
			log.Printf("[seeder] location insert error for %s: %v", r.Name, err)
		}
	}
}

// ── private helpers ───────────────────────────────────────────────────────────

func strptrIfNonEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
