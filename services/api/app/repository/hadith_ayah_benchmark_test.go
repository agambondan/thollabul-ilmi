package repository

import (
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func setupHadithAyahBenchmarkDB(b *testing.B) *gorm.DB {
	b.Helper()
	db, err := gorm.Open(sqlite.Open(fmt.Sprintf("file:memdb_hadith_ayah_%d?mode=memory&cache=shared", b.N)), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		b.Fatalf("open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.Book{}, &model.Hadith{}, &model.HadithAyah{}); err != nil {
		b.Fatalf("migrate: %v", err)
	}

	surahNum := 1
	surahTr := &model.Translation{Idn: strptrOrNil("Al-Fatihah"), Ar: strptrOrNil("الفاتحة")}
	db.Create(surahTr)
	surah := &model.Surah{Number: &surahNum, TranslationID: surahTr.ID}
	db.Create(surah)

	bookSlug := "bukhari"
	bookTr := &model.Translation{Idn: strptrOrNil("Shahih Bukhari")}
	db.Create(bookTr)
	book := &model.Book{Slug: &bookSlug, TranslationID: bookTr.ID}
	db.Create(book)

	hadithNum := 1
	hadithTr := &model.Translation{Idn: strptrOrNil("Innamal a'malu binniyat")}
	db.Create(hadithTr)
	hadith := &model.Hadith{Number: &hadithNum, BookID: book.ID, TranslationID: hadithTr.ID}
	db.Create(hadith)

	for i := 1; i <= 20; i++ {
		ayahNum := i
		ayahTr := &model.Translation{Idn: strptrOrNil(fmt.Sprintf("Ayat %d", i)), Ar: strptrOrNil("آية")}
		db.Create(ayahTr)
		ayah := &model.Ayah{Number: &ayahNum, SurahID: surah.ID, TranslationID: ayahTr.ID}
		db.Create(ayah)

		ha := &model.HadithAyah{
			HadithID: hadith.ID,
			AyahID:   ayah.ID,
			Catatan:  fmt.Sprintf("Catatan %d", i),
		}
		db.Create(ha)
	}

	return db
}

func findHadithAyahByHadithIDPreload(db *gorm.DB, hadithID int) ([]model.HadithAyah, error) {
	var items []model.HadithAyah
	err := db.
		Preload("Ayah").Preload("Ayah.Translation").Preload("Ayah.Surah").Preload("Ayah.Surah.Translation").
		Where("hadith_id = ?", hadithID).
		Order("ayah_id asc").
		Find(&items).Error
	return items, err
}

func BenchmarkHadithAyah_GORM_Preload(b *testing.B) {
	db := setupHadithAyahBenchmarkDB(b)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		items, err := findHadithAyahByHadithIDPreload(db, 1)
		if err != nil || len(items) != 20 {
			b.Fatalf("preload failed: err=%v, count=%d", err, len(items))
		}
	}
}

func BenchmarkHadithAyah_Native_RawScan(b *testing.B) {
	db := setupHadithAyahBenchmarkDB(b)
	repo := NewHadithAyahRepository(db)
	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		items, err := repo.FindByHadithID(1)
		if err != nil || len(items) != 20 {
			b.Fatalf("native raw scan failed: err=%v, count=%d", err, len(items))
		}
	}
}
