package migrations

import (
	"errors"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
	"github.com/spf13/viper"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type seedDedupeRule struct {
	model        interface{}
	groupColumns []string
}

func DeduplicateSeedData(db *gorm.DB) {
	rules := []seedDedupeRule{
		{model: model.Doa{}, groupColumns: []string{"category", "title"}},
		{model: model.DailyReminder{}, groupColumns: []string{"title", "author", "source"}},
		{model: model.AmalanItem{}, groupColumns: []string{"category", "name"}},
		{model: model.Dzikir{}, groupColumns: []string{"category", "title"}},
		{model: model.SholatGuide{}, groupColumns: []string{"step"}},
		{model: model.TahlilCollection{}, groupColumns: []string{"type"}},
		{model: model.TahlilItem{}, groupColumns: []string{"collection_id", "sort_order"}},
		{model: model.Kajian{}, groupColumns: []string{"title", "speaker", "published_at"}},
		{model: model.IslamicEvent{}, groupColumns: []string{"hijri_month", "hijri_day", "name"}},
	}

	for _, rule := range rules {
		table, ok := tableName(db, rule.model)
		if !ok || !db.Migrator().HasTable(rule.model) {
			continue
		}
		groupBy := strings.Join(rule.groupColumns, ", ")
		db.Exec("DELETE FROM " + table + " WHERE id NOT IN (SELECT MIN(id) FROM " + table + " GROUP BY " + groupBy + ")")
	}
}

func UpsertSeedData(db *gorm.DB) error {
	if err := upsertAdminUser(db); err != nil {
		return err
	}
	if err := upsertDoaSeeds(db); err != nil {
		return err
	}
	if err := upsertDailyReminderSeeds(db); err != nil {
		return err
	}
	if err := upsertAmalanSeeds(db); err != nil {
		return err
	}
	if err := upsertDzikirSeeds(db); err != nil {
		return err
	}
	if err := upsertSholatGuideSeeds(db); err != nil {
		return err
	}
	if err := upsertTahlilCollectionSeeds(db); err != nil {
		return err
	}
	if err := upsertKajianSeeds(db); err != nil {
		return err
	}
	SeedTier4(db)
	return nil
}

func tableName(db *gorm.DB, value interface{}) (string, bool) {
	stmt := &gorm.Statement{DB: db}
	if err := stmt.Parse(value); err != nil {
		return "", false
	}
	return stmt.Schema.Table, true
}

func upsertAdminUser(db *gorm.DB) error {
	password := viper.GetString("ADMIN_PASSWORD")
	if password == "" {
		password = "Admin@123"
	}
	hashed := lib.PasswordEncrypt(password)
	name := "Admin"
	email := "admin@tholabul-ilmi.com"
	id := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	admin := model.User{
		BaseUUID: model.BaseUUID{ID: id},
		Name:     &name,
		Email:    &email,
		Password: &hashed,
		Role:     model.RoleAdmin,
	}
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "email"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "role"}),
	}).Create(&admin).Error
}

func upsertDoaSeeds(db *gorm.DB) error {
	items := seedDoa()
	englishMap := doaEnglishByKey()
	for i := range items {
		// Upsert Doa row first (matches existing on category+title via unique index).
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "category"}, {Name: "title"}},
			DoUpdates: clause.AssignmentColumns([]string{"arabic", "transliteration", "translation", "source"}),
		}).Create(&items[i]).Error; err != nil {
			return err
		}

		// Build/refresh the bilingual Translation row keyed by (category, title).
		key := string(items[i].Category) + "|" + items[i].Title
		en := englishMap[key]
		latinEn := en.Latin
		if latinEn == "" {
			latinEn = items[i].Transliteration
		}

		var existing model.Doa
		if err := db.Where("category = ? AND title = ?", items[i].Category, items[i].Title).First(&existing).Error; err != nil {
			return err
		}
		tr := model.Translation{
			Idn:            stringPtr(items[i].Title),
			LatinIdn:       stringPtr(items[i].Transliteration),
			DescriptionIdn: stringPtr(items[i].TranslationText),
			Ar:             stringPtr(items[i].Arabic),
			En:             stringPtr(en.Title),
			LatinEn:        stringPtr(latinEn),
			DescriptionEn:  stringPtr(en.Meaning),
		}
		if existing.TranslationID != nil {
			tr.ID = existing.TranslationID
			if err := db.Save(&tr).Error; err != nil {
				return err
			}
		} else {
			if err := db.Create(&tr).Error; err != nil {
				return err
			}
			if err := db.Model(&model.Doa{}).Where("id = ?", existing.ID).
				Update("translation_id", tr.ID).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func stringPtr(s string) *string {
	if s == "" {
		return nil
	}
	v := s
	return &v
}

func upsertAmalanSeeds(db *gorm.DB) error {
	items := seedAmalanItems()
	for i := range items {
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "category"}, {Name: "name"}},
			DoUpdates: clause.AssignmentColumns([]string{"description", "is_active"}),
		}).Create(&items[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

func upsertDailyReminderSeeds(db *gorm.DB) error {
	items := seedDailyReminders()
	for i := range items {
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "title"}, {Name: "author"}, {Name: "source"}},
			DoUpdates: clause.AssignmentColumns([]string{"type", "text", "lang", "is_active", "display_order"}),
		}).Create(&items[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

func upsertDzikirSeeds(db *gorm.DB) error {
	items := seedDzikir()
	englishMap := dzikirEnglishByKey()
	for i := range items {
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "category"}, {Name: "title"}},
			DoUpdates: clause.AssignmentColumns([]string{"occasion", "arabic", "transliteration", "translation", "count", "fadhilah", "source"}),
		}).Create(&items[i]).Error; err != nil {
			return err
		}

		key := string(items[i].Category) + "|" + items[i].Title
		en := englishMap[key]
		latinEn := en.Latin
		if latinEn == "" {
			latinEn = items[i].Transliteration
		}

		var existing model.Dzikir
		if err := db.Where("category = ? AND title = ?", items[i].Category, items[i].Title).First(&existing).Error; err != nil {
			return err
		}
		tr := model.Translation{
			Idn:            stringPtr(items[i].Title),
			LatinIdn:       stringPtr(items[i].Transliteration),
			DescriptionIdn: stringPtr(items[i].TranslationText),
			Ar:             stringPtr(items[i].Arabic),
			En:             stringPtr(en.Title),
			LatinEn:        stringPtr(latinEn),
			DescriptionEn:  stringPtr(en.Meaning),
		}
		if existing.TranslationID != nil {
			tr.ID = existing.TranslationID
			if err := db.Save(&tr).Error; err != nil {
				return err
			}
		} else {
			if err := db.Create(&tr).Error; err != nil {
				return err
			}
			if err := db.Model(&model.Dzikir{}).Where("id = ?", existing.ID).
				Update("translation_id", tr.ID).Error; err != nil {
				return err
			}
		}

		// Persist bilingual fadhilah back to the Dzikir row so the API can serve both.
		updates := map[string]interface{}{
			"fadhilah_idn": items[i].Fadhilah,
			"fadhilah_en":  en.Fadhilah,
		}
		if err := db.Model(&model.Dzikir{}).Where("id = ?", existing.ID).Updates(updates).Error; err != nil {
			return err
		}
	}
	return nil
}

func upsertSholatGuideSeeds(db *gorm.DB) error {
	items := seedSholatGuide()
	for i := range items {
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "step"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "arabic", "transliteration", "translation", "description", "source", "notes"}),
		}).Create(&items[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

func upsertTahlilCollectionSeeds(db *gorm.DB) error {
	items := seedTahlilCollections()
	for i := range items {
		var existing model.TahlilCollection
		err := db.Where("type = ?", items[i].Type).First(&existing).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err := db.Create(&items[i]).Error; err != nil {
				return err
			}
		} else if err == nil {
			existing.Title = items[i].Title
			existing.Description = items[i].Description
			if err := db.Save(&existing).Error; err != nil {
				return err
			}
		} else {
			return err
		}
	}
	return nil
}

func upsertKajianSeeds(db *gorm.DB) error {
	items := seedKajian()
	for i := range items {
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "title"}, {Name: "speaker"}, {Name: "published_at"}},
			DoUpdates: clause.AssignmentColumns([]string{"description", "topic", "type", "url", "duration", "thumbnail_url"}),
		}).Create(&items[i]).Error; err != nil {
			return err
		}
	}
	return nil
}
