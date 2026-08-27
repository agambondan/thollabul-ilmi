//go:build ignore

// AutoMigrate kolom grading baru pada tabel hadith, lalu mengisi
// grade + shahih_by untuk kitab yang derajatnya sudah diketahui:
//   - Shahih Bukhari  → semua shahih (disepakati Bukhari & Muslim)
//   - Shahih Muslim   → semua shahih
//   - Muwattha' Malik → sebagian besar shahih (ulama sepakat)
//
// Untuk kitab Sunan (Abu Dawud, Tirmidzi, Nasai, Ibnu Majah, Ahmad)
// grading bervariasi per hadits — diisi kosong, perlu scraper tersendiri.
//
// Usage:
//
//	go run scripts/migrate_hadith_grade.go
//	DB_HOST=localhost DB_PORT=54320 DB_USER=postgres DB_PASS=postgres DB_NAME=thullabul_ilmi go run scripts/migrate_hadith_grade.go
package main

import (
	"fmt"
	"log"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/spf13/viper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func main() {
	for _, envFile := range []string{".env.local", ".env"} {
		if err := lib.LoadEnvironmentLocalFlag(envFile); err == nil {
			log.Printf("Config: %s", envFile)
			break
		}
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		viper.GetString("db_host"), viper.GetString("db_port"),
		viper.GetString("db_user"), viper.GetString("db_pass"), viper.GetString("db_name"),
	)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Warn),
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		log.Fatalf("koneksi DB gagal: %v", err)
	}

	log.Println("AutoMigrate hadith...")
	if err := db.AutoMigrate(&model.Hadith{}); err != nil {
		log.Fatalf("AutoMigrate: %v", err)
	}
	log.Println("OK")

	// Kitab dengan semua hadits berstatus Shahih (muttafaq 'alaih / ijma')
	type kitabGrade struct {
		slug     string
		grade    model.HadithGrade
		shahihBy string
		notes    string
	}

	kitabs := []kitabGrade{
		{
			slug:     "bukhari",
			grade:    model.HadithGradeShahih,
			shahihBy: "Al-Bukhari, Ulama Ahlul Hadits",
			notes:    "Seluruh hadits dalam Shahih Al-Bukhari telah disepakati keshahihannya. Al-Bukhari mensyaratkan bertemu dan bertemu langsung (liqa') antar perawi.",
		},
		{
			slug:     "muslim",
			grade:    model.HadithGradeShahih,
			shahihBy: "Muslim bin Al-Hajjaj, Ulama Ahlul Hadits",
			notes:    "Seluruh hadits dalam Shahih Muslim telah disepakati keshahihannya. Muttafaq 'alaih bersama Shahih Bukhari adalah yang tertinggi derajatnya.",
		},
		{
			slug:     "malik",
			grade:    model.HadithGradeShahih,
			shahihBy: "Imam Malik, Asy-Syafi'i, Ibn Abd Al-Barr",
			notes:    "Mayoritas hadits Muwattha' Malik adalah shahih atau hasan. Imam Asy-Syafi'i: 'Tidak ada kitab setelah Al-Quran yang lebih shahih dari Muwattha'.' (sebelum Shahihain dikumpulkan).",
		},
	}

	total := 0
	for _, k := range kitabs {
		// Cari book ID berdasarkan slug
		var bookID int
		if err := db.Raw("SELECT id FROM book WHERE slug = ? AND deleted_at IS NULL LIMIT 1", k.slug).Scan(&bookID).Error; err != nil || bookID == 0 {
			log.Printf("book '%s' tidak ditemukan, skip", k.slug)
			continue
		}

		grade := k.grade
		shahihBy := k.shahihBy
		notes := k.notes

		res := db.Model(&model.Hadith{}).
			Where("book_id = ? AND grade IS NULL AND deleted_at IS NULL", bookID).
			Updates(map[string]interface{}{
				"grade":       grade,
				"shahih_by":   shahihBy,
				"grade_notes": notes,
			})
		if res.Error != nil {
			log.Printf("ERROR %s: %v", k.slug, res.Error)
			continue
		}
		log.Printf("%-10s (book_id=%d): %d hadits di-grade '%s'", k.slug, bookID, res.RowsAffected, grade)
		total += int(res.RowsAffected)
	}

	// Hadits dari kitab Sunan yang belum di-grade — set notes saja
	sunanSlugs := []struct{ slug, notes string }{
		{"abudaud", "Sunan Abu Dawud: campuran shahih, hasan, dhaif. Abu Dawud: 'Aku tulis 500.000 hadits, lalu memilih 4.800 untuk kitab ini.' Perlu verifikasi per-hadits."},
		{"tirmidzi", "Jami' At-Tirmidzi: banyak hadits disertai komentar derajat langsung oleh At-Tirmidzi (hasan, shahih, gharib, dhaif). Perlu parsing teks komentar per-hadits."},
		{"nasai", "Sunan An-Nasai (Al-Mujtaba): termasuk ketat setelah Shahihain. Hadits dhaif lebih sedikit dibanding kitab sunan lain."},
		{"ibnumajah", "Sunan Ibnu Majah: mengandung hadits hasan, sebagian dhaif, dan beberapa maudhu'. Perlu verifikasi per-hadits (Al-Albani, Syu'aib Al-Arnauth)."},
		{"ahmad", "Musnad Ahmad: sangat besar (~27.000 hadits), bervariasi dari shahih hingga dhaif. Al-Albani dan Syu'aib Al-Arnauth telah mentahqiq seluruhnya."},
		{"darimi", "Sunan Ad-Darimi: umumnya hadits kuat, sebanding dengan Sunan Abu Dawud."},
	}

	for _, s := range sunanSlugs {
		var bookID int
		if err := db.Raw("SELECT id FROM book WHERE slug = ? AND deleted_at IS NULL LIMIT 1", s.slug).Scan(&bookID).Error; err != nil || bookID == 0 {
			continue
		}
		notes := s.notes
		res := db.Model(&model.Hadith{}).
			Where("book_id = ? AND grade_notes IS NULL AND deleted_at IS NULL", bookID).
			Update("grade_notes", notes)
		if res.Error != nil {
			log.Printf("ERROR %s: %v", s.slug, res.Error)
			continue
		}
		log.Printf("%-10s (book_id=%d): %d hadits — grade_notes diisi", s.slug, bookID, res.RowsAffected)
	}

	log.Printf("Selesai: %d hadits di-grade", total)
}
