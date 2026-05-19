package migrations

import (
	"log"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func SeedLibraryBooks(db *gorm.DB) {
	var count int64
	db.Model(&model.LibraryBook{}).Count(&count)
	if count > 0 {
		return
	}

	type bookDef struct {
		Title       string
		Slug        string
		Author      string
		Description string
		SourceURL   string
	}
	books := []bookDef{
		{"Hadits Arbain An-Nawawi", "arbain-nawawi", "Imam An-Nawawi", "40 hadits inti ajaran Islam. Karya Imam An-Nawawi yang menghimpun hadits-hadits pokok dalam agama Islam.", "https://sunnah.com/nawawi40"},
		{"Riyadhus Shalihin", "riyadhus-shalihin", "Imam An-Nawawi", "Kumpulan hadits tentang adab, akhlak, dan ibadah. Karya klasik Imam An-Nawawi yang sangat populer.", "https://sunnah.com/riyadussalihin"},
		{"Bulughul Maram", "bulughul-maram", "Ibnu Hajar Al-Asqalani", "Kumpulan hadits-hadits hukum yang menjadi rujukan fiqih. Dibahas oleh Ibnu Hajar Al-Asqalani.", "https://sunnah.com/bulugh"},
		{"Mukhtashar Shahih Muslim", "mukhtashar-shahih-muslim", "Imam Al-Mundziri", "Ringkasan Shahih Muslim karya Imam Al-Mundziri. Hadits-hadits pilihan dari kitab Shahih Muslim.", "https://sunnah.com/muslim"},
	}

	if len(books) == 0 {
		return
	}
	log.Printf("[seeder] seed library books: %d entri", len(books))
	for _, b := range books {
		book := model.LibraryBook{
			Title:       b.Title,
			Slug:        b.Slug,
			Author:      b.Author,
			Description: b.Description,
			SourceURL:   b.SourceURL,
			Format:      model.LibraryBookFormatLink,
			Status:      model.LibraryBookStatusPublished,
		}
		db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "slug"}},
			DoUpdates: clause.AssignmentColumns([]string{"title", "author", "description", "source_url"}),
		}).Create(&book)
	}
}
