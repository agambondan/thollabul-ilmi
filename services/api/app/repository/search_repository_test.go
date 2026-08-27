//go:build postgres

package repository

import (
	"fmt"
	"os"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func intPtr(i int) *int       { return &i }
func strPtr(s string) *string { return &s }

func newSearchTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	pass := getEnv("DB_PASS", "postgres")
	name := getEnv("DB_NAME", "thullabul_ilmi")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, pass, name)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		SkipDefaultTransaction: true,
	})
	if err != nil {
		t.Fatalf("open postgres: %v", err)
	}

	db.Exec("TRUNCATE TABLE translations, surahs, ayahs, hadiths, books, themes, chapters, islamic_terms, doas, kajians, perawis RESTART IDENTITY CASCADE")

	if err := db.AutoMigrate(
		&model.Translation{},
		&model.Surah{},
		&model.Ayah{},
		&model.Hadith{},
		&model.Book{},
		&model.Theme{},
		&model.Chapter{},
		&model.IslamicTerm{},
		&model.Doa{},
		&model.Kajian{},
		&model.Perawi{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func TestSearchAyahByArabic(t *testing.T) {
	db := newSearchTestDB(t)

	trans := &model.Translation{Ar: strPtr("الرَّحْمَٰنِ الرَّحِيمِ")}
	if err := db.Create(trans).Error; err != nil {
		t.Fatalf("create translation: %v", err)
	}
	surah := &model.Surah{Number: intPtr(1)}
	if err := db.Create(surah).Error; err != nil {
		t.Fatalf("create surah: %v", err)
	}
	one := 1
	ayah := &model.Ayah{SurahID: &one, Number: intPtr(1), TranslationID: &one}
	if err := db.Create(ayah).Error; err != nil {
		t.Fatalf("create ayah: %v", err)
	}

	repo := &searchRepo{db: db}
	results, total, err := repo.SearchAyah("الرَّحْمَٰنِ", 10, 0)
	if err != nil {
		t.Fatalf("search ayah: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected 1 result, got %d", total)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 ayah, got %d", len(results))
	}
}

func TestSearchAyahByTranslation(t *testing.T) {
	db := newSearchTestDB(t)

	trans := &model.Translation{Idn: strPtr("Maha Pengasih Maha Penyayang")}
	if err := db.Create(trans).Error; err != nil {
		t.Fatalf("create translation: %v", err)
	}
	surah := &model.Surah{Number: intPtr(1)}
	if err := db.Create(surah).Error; err != nil {
		t.Fatalf("create surah: %v", err)
	}
	one := 1
	ayah := &model.Ayah{SurahID: &one, Number: intPtr(1), TranslationID: &one}
	if err := db.Create(ayah).Error; err != nil {
		t.Fatalf("create ayah: %v", err)
	}

	repo := &searchRepo{db: db}
	results, total, err := repo.SearchAyah("Pengasih", 10, 0)
	if err != nil {
		t.Fatalf("search ayah: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected 1 result, got %d", total)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 ayah, got %d", len(results))
	}
}

func TestSearchAyahPagination(t *testing.T) {
	db := newSearchTestDB(t)

	for i := 1; i <= 5; i++ {
		trans := &model.Translation{Idn: strPtr("ayat test data")}
		if err := db.Create(trans).Error; err != nil {
			t.Fatalf("create translation %d: %v", i, err)
		}
		surah := &model.Surah{Number: intPtr(i)}
		if err := db.Create(surah).Error; err != nil {
			t.Fatalf("create surah %d: %v", i, err)
		}
		sid := i
		ayah := &model.Ayah{SurahID: &sid, Number: intPtr(i), TranslationID: &sid}
		if err := db.Create(ayah).Error; err != nil {
			t.Fatalf("create ayah %d: %v", i, err)
		}
	}

	repo := &searchRepo{db: db}

	results, total, err := repo.SearchAyah("test", 2, 0)
	if err != nil {
		t.Fatalf("search page 0: %v", err)
	}
	if total != 5 {
		t.Fatalf("expected total 5, got %d", total)
	}
	if len(results) != 2 {
		t.Fatalf("expected 2 results on page 0, got %d", len(results))
	}

	results2, total2, err := repo.SearchAyah("test", 2, 2)
	if err != nil {
		t.Fatalf("search page 1: %v", err)
	}
	if total2 != 5 {
		t.Fatalf("expected total 5 on page 1, got %d", total2)
	}
	if len(results2) != 2 {
		t.Fatalf("expected 2 results on page 1, got %d", len(results2))
	}
}

func TestSearchHadithByArabic(t *testing.T) {
	db := newSearchTestDB(t)

	trans := &model.Translation{Ar: strPtr("إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ")}
	if err := db.Create(trans).Error; err != nil {
		t.Fatalf("create translation: %v", err)
	}
	book := &model.Book{Slug: strPtr("bukhari")}
	if err := db.Create(book).Error; err != nil {
		t.Fatalf("create book: %v", err)
	}
	one := 1
	hadith := &model.Hadith{BookID: &one, Number: intPtr(1), TranslationID: &one}
	if err := db.Create(hadith).Error; err != nil {
		t.Fatalf("create hadith: %v", err)
	}

	repo := &searchRepo{db: db}
	_, total, err := repo.SearchHadith("النِّيَّاتِ", 10, 0)
	if err != nil {
		t.Fatalf("search hadith: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected 1 result, got %d", total)
	}
}

func TestSearchHadithReturnsZeroForNoMatch(t *testing.T) {
	db := newSearchTestDB(t)
	repo := &searchRepo{db: db}
	results, total, err := repo.SearchHadith("nonexistent_qwerty_12345", 10, 0)
	if err != nil {
		t.Fatalf("search hadith no match: %v", err)
	}
	if total != 0 {
		t.Fatalf("expected total 0, got %d", total)
	}
	if len(results) != 0 {
		t.Fatalf("expected 0 results, got %d", len(results))
	}
}

func TestSearchDictionaryByTerm(t *testing.T) {
	db := newSearchTestDB(t)
	entry := &model.IslamicTerm{Term: "Taqwa", Definition: "Ketakwaan kepada Allah"}
	if err := db.Create(entry).Error; err != nil {
		t.Fatalf("create dictionary: %v", err)
	}

	repo := &searchRepo{db: db}
	_, total, err := repo.SearchDictionary("Taqwa", 10, 0)
	if err != nil {
		t.Fatalf("search dictionary: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected 1 result, got %d", total)
	}
}

func TestSearchDoaByTitle(t *testing.T) {
	db := newSearchTestDB(t)
	trans := &model.Translation{Idn: strPtr("Doa sebelum tidur")}
	if err := db.Create(trans).Error; err != nil {
		t.Fatalf("create translation: %v", err)
	}
	one := 1
	doa := &model.Doa{Title: "Doa Tidur", TranslationID: &one}
	if err := db.Create(doa).Error; err != nil {
		t.Fatalf("create doa: %v", err)
	}

	repo := &searchRepo{db: db}
	_, total, err := repo.SearchDoa("Tidur", 10, 0)
	if err != nil {
		t.Fatalf("search doa: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected 1 result, got %d", total)
	}
}

func TestSearchKajianBySpeaker(t *testing.T) {
	db := newSearchTestDB(t)
	trans := &model.Translation{Idn: strPtr("Kajian tafsir")}
	if err := db.Create(trans).Error; err != nil {
		t.Fatalf("create translation: %v", err)
	}
	one := 1
	kajian := &model.Kajian{Title: "Tafsir Juz 30", Speaker: "Ustadz Abdul Somad", TranslationID: &one}
	if err := db.Create(kajian).Error; err != nil {
		t.Fatalf("create kajian: %v", err)
	}

	repo := &searchRepo{db: db}
	_, total, err := repo.SearchKajian("Somad", 10, 0)
	if err != nil {
		t.Fatalf("search kajian: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected 1 result, got %d", total)
	}
}

func TestSearchPerawiByLatinName(t *testing.T) {
	db := newSearchTestDB(t)
	perawi := &model.Perawi{NamaLatin: strPtr("Bukhari")}
	if err := db.Create(perawi).Error; err != nil {
		t.Fatalf("create perawi: %v", err)
	}

	repo := &searchRepo{db: db}
	_, total, err := repo.SearchPerawi("Bukhari", 10, 0)
	if err != nil {
		t.Fatalf("search perawi: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected 1 result, got %d", total)
	}
}

func TestSearchPerawiReturnsZeroForNoMatch(t *testing.T) {
	db := newSearchTestDB(t)
	repo := &searchRepo{db: db}
	results, total, err := repo.SearchPerawi("nonexistent_qwerty_12345", 10, 0)
	if err != nil {
		t.Fatalf("search perawi no match: %v", err)
	}
	if total != 0 {
		t.Fatalf("expected total 0, got %d", total)
	}
	if len(results) != 0 {
		t.Fatalf("expected 0 results, got %d", len(results))
	}
}

func TestSearchAllTypesReturnZeroForEmptyDB(t *testing.T) {
	db := newSearchTestDB(t)
	repo := &searchRepo{db: db}

	tests := []struct {
		name string
		fn   func() (interface{}, int64, error)
	}{
		{"dictionary", func() (interface{}, int64, error) { return repo.SearchDictionary("test", 10, 0) }},
		{"doa", func() (interface{}, int64, error) { return repo.SearchDoa("test", 10, 0) }},
		{"kajian", func() (interface{}, int64, error) { return repo.SearchKajian("test", 10, 0) }},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, total, err := tt.fn()
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if total != 0 {
				t.Fatalf("expected total 0 for empty DB, got %d", total)
			}
		})
	}
}
