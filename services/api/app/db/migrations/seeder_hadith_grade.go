package migrations

import (
	"log"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/gorm"
)

// SeedHadithGrade sets derajat keshahihan untuk kitab-kitab hadits.
//
// Data yang diset:
//   - Shahih Bukhari → seluruh hadits shahih (ijma' ulama)
//   - Shahih Muslim → seluruh hadits shahih (ijma' ulama)
//   - Kitab lainnya: butuh data per-hadits, tidak bisa digeneralisir.
func SeedHadithGrade(db *gorm.DB) {
	// Shahih Bukhari: semua hadits shahih berdasarkan ijma' ulama
	setGradeByBook(db, "bukhari", model.HadithGradeShahih, "Muttafaqun Alaih (Bukhari)")

	// Shahih Muslim: semua hadits shahih berdasarkan ijma' ulama
	setGradeByBook(db, "muslim", model.HadithGradeShahih, "Muttafaqun Alaih (Muslim)")

	log.Println("[seeder] SeedHadithGrade selesai")
}

func setGradeByBook(db *gorm.DB, bookSlug string, grade model.HadithGrade, shahihBy string) {
	var book model.Book
	if err := db.Where("slug = ?", bookSlug).First(&book).Error; err != nil {
		log.Printf("[seeder] SeedHadithGrade: book '%s' tidak ditemukan: %v", bookSlug, err)
		return
	}
	result := db.Model(&model.Hadith{}).
		Where("book_id = ? AND grade IS NULL", book.ID).
		Updates(map[string]interface{}{
			"grade":     grade,
			"shahih_by": shahihBy,
		})
	if result.Error != nil {
		log.Printf("[seeder] SeedHadithGrade: update %s gagal: %v", bookSlug, result.Error)
		return
	}
	log.Printf("[seeder] SeedHadithGrade: %s — %d hadits diset %s", bookSlug, result.RowsAffected, grade)
}
