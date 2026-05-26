package migrations

import (
	"strings"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func TestCleanQuranArabicTextStripsLeadingBasmalahOutsideFatihahAndTawbah(t *testing.T) {
	got := cleanQuranArabicText(2, 1, "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ")
	if got != "الٓمٓ" {
		t.Fatalf("expected basmalah stripped from Al-Baqara 2:1, got %q", got)
	}
}

func TestCleanQuranArabicTextStripsLeadingBOM(t *testing.T) {
	fatihah := "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
	if got := cleanQuranArabicText(1, 1, "\ufeff"+fatihah); got != fatihah {
		t.Fatalf("expected leading BOM stripped from Al-Fatihah, got %q", got)
	}

	if got := cleanQuranArabicText(2, 1, "\ufeffبِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ"); got != "الٓمٓ" {
		t.Fatalf("expected leading BOM and basmalah stripped from Al-Baqara 2:1, got %q", got)
	}
}

func TestCleanQuranArabicTextKeepsFatihahAndTawbah(t *testing.T) {
	fatihah := "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
	if got := cleanQuranArabicText(1, 1, fatihah); got != fatihah {
		t.Fatalf("expected Al-Fatihah basmalah to remain, got %q", got)
	}

	tawbah := "بَرَآءَةٌ مِّنَ ٱللَّهِ"
	if got := cleanQuranArabicText(9, 1, tawbah); got != tawbah {
		t.Fatalf("expected At-Tawbah text to remain, got %q", got)
	}
}

func TestCleanupQuranTranslationTextNoiseStripsExistingBOM(t *testing.T) {
	db := newQuranMigrationTestDB(t)

	fatihah := "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
	translation := model.Translation{
		Ar:     lib.Strptr("\ufeff" + fatihah),
		ArHtml: lib.Strptr("\ufeff" + fatihah),
	}
	if err := db.Create(&translation).Error; err != nil {
		t.Fatalf("create translation: %v", err)
	}

	surahNumber := 1
	surah := model.Surah{Number: lib.Intptr(surahNumber), TranslationID: translation.ID}
	if err := db.Create(&surah).Error; err != nil {
		t.Fatalf("create surah: %v", err)
	}

	ayahNumber := 1
	ayah := model.Ayah{SurahID: surah.ID, Number: lib.Intptr(ayahNumber), TranslationID: translation.ID}
	if err := db.Create(&ayah).Error; err != nil {
		t.Fatalf("create ayah: %v", err)
	}

	cleanupQuranTranslationTextNoise(db)

	var got model.Translation
	if err := db.First(&got, translation.ID).Error; err != nil {
		t.Fatalf("reload translation: %v", err)
	}
	if got.Ar == nil || strings.HasPrefix(*got.Ar, "\ufeff") {
		t.Fatalf("expected ar leading BOM stripped, got %q", valueOrEmpty(got.Ar))
	}
	if got.ArHtml == nil || strings.HasPrefix(*got.ArHtml, "\ufeff") {
		t.Fatalf("expected ar_html leading BOM stripped, got %q", valueOrEmpty(got.ArHtml))
	}
}

func TestUpsertQuranAyahFromFileBackfillsExistingArHTML(t *testing.T) {
	db := newQuranMigrationTestDB(t)

	translation := model.Translation{Ar: lib.Strptr("old")}
	if err := db.Create(&translation).Error; err != nil {
		t.Fatalf("create translation: %v", err)
	}

	surahNumber := 2
	surah := model.Surah{Number: lib.Intptr(surahNumber), TranslationID: translation.ID}
	if err := db.Create(&surah).Error; err != nil {
		t.Fatalf("create surah: %v", err)
	}

	ayahNumber := 1
	ayah := model.Ayah{SurahID: surah.ID, Number: lib.Intptr(ayahNumber), TranslationID: translation.ID}
	if err := db.Create(&ayah).Error; err != nil {
		t.Fatalf("create ayah: %v", err)
	}

	incomingHTML := `ا<tajweed class="madda_necessary">لٓ</tajweed><tajweed class="madda_necessary">مٓ</tajweed>`
	if err := upsertQuranAyahFromFile(db, &model.Ayah{SurahID: surah.ID}, surahNumber, ayahJSON{
		Number:     ayahNumber,
		Arabic:     "الٓمٓ",
		ArHtml:     incomingHTML,
		Indonesian: "Alif laam miim.",
		English:    "Alif, Lam, Meem.",
	}); err != nil {
		t.Fatalf("upsert quran ayah: %v", err)
	}

	var got model.Translation
	if err := db.First(&got, translation.ID).Error; err != nil {
		t.Fatalf("reload translation: %v", err)
	}
	if got.ArHtml == nil || *got.ArHtml != incomingHTML {
		t.Fatalf("expected ar_html backfilled, got %q", valueOrEmpty(got.ArHtml))
	}
}

func newQuranMigrationTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Silent),
		DisableForeignKeyConstraintWhenMigrating: true,
		NamingStrategy:                           schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Translation{}, &model.Surah{}, &model.Ayah{}); err != nil {
		t.Fatalf("auto migrate: %v", err)
	}
	return db
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
