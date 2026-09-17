package migrations

import (
	"log"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func SeedLibraryBooks(db *gorm.DB) {
	var rows []model.LibraryBook
	if readStaticJSON("library_book.json", &rows) && len(rows) > 0 {
		log.Printf("[seeder] seed library books from file: %d entri", len(rows))
		for i := range rows {
			if rows[i].Slug == "" || rows[i].Title == "" {
				continue
			}
			db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "slug"}},
				DoUpdates: clause.AssignmentColumns([]string{"title", "author", "description", "category", "level", "language", "source_url", "source_note", "format", "source_type", "license", "license_status", "is_source_verified", "status"}),
			}).Create(&rows[i])
		}
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
		{"Kitab Tauhid", "kitab-tauhid", "Syaikh Muhammad bin Abdul Wahhab", "Pembahasan pokok tauhid ibadah, syirik, dan keutamaannya.", "https://archive.org"},
		{"Al-Wajiz fi Fiqhis Sunnah", "al-wajiz-fiqhis-sunnah", "Dr. Abdul Azhim Al-Badawi", "Ringkasan fiqih sunnah berasaskan dalil shahih.", "https://archive.org"},
		{"Ar-Rahiq Al-Makhtum", "ar-rahiq-al-makhtum", "Syaikh Shafiyurrahman Al-Mubarakfuri", "Kajian lengkap sirah nabawiyah.", "https://archive.org"},
		{"Al-Adab Al-Mufrad", "al-adab-al-mufrad", "Imam Al-Bukhari", "Kumpulan hadits akhlak dan adab harian seorang muslim.", "https://sunnah.com/adab"},
		{"Ushul Tsalatsah", "ushul-tsalatsah", "Syaikh Muhammad bin Abdul Wahhab", "Tiga landasan utama mengenal Allah, Islam, dan Rasul.", "https://archive.org"},
		{"Fiqhus Sirah", "fiqhus-sirah", "Syaikh Muhammad Al-Ghazali", "Pelajaran dan ibrah dari perjalanan hidup Nabi.", "https://archive.org"},
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
