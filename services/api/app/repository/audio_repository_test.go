package repository

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func TestFindSurahAudioBySurahIDAcceptsSurahNumber(t *testing.T) {
	db := newAudioTestDB(t)
	repo := NewAudioRepository(db)

	surahID := 200
	surahNumber := 2
	wrongSurahID := 2
	wrongSurahNumber := 99
	firstAyahNumber := 1
	firstAyahID := 800
	wrongAyahID := 801
	translationID := 1

	if err := db.Create(&model.Surah{
		BaseID:        model.BaseID{ID: &surahID},
		Number:        &surahNumber,
		TranslationID: &translationID,
	}).Error; err != nil {
		t.Fatalf("seed numbered surah: %v", err)
	}
	if err := db.Create(&model.Surah{
		BaseID:        model.BaseID{ID: &wrongSurahID},
		Number:        &wrongSurahNumber,
		TranslationID: &translationID,
	}).Error; err != nil {
		t.Fatalf("seed id-collision surah: %v", err)
	}
	if err := db.Create(&model.Ayah{BaseID: model.BaseID{ID: &firstAyahID}, Number: &firstAyahNumber, SurahID: &surahID, TranslationID: &translationID}).Error; err != nil {
		t.Fatalf("seed numbered surah ayah: %v", err)
	}
	if err := db.Create(&model.Ayah{BaseID: model.BaseID{ID: &wrongAyahID}, Number: &firstAyahNumber, SurahID: &wrongSurahID, TranslationID: &translationID}).Error; err != nil {
		t.Fatalf("seed id-collision ayah: %v", err)
	}
	if err := db.Create(&model.AyahAudio{
		AyahID:   &firstAyahID,
		QariName: "Mishary Rashid Al-Afasy",
		QariSlug: "mishary-rashid-alafasy",
		AudioURL: "https://everyayah.com/data/Alafasy_128kbps/002001.mp3",
	}).Error; err != nil {
		t.Fatalf("seed numbered surah ayah audio: %v", err)
	}
	if err := db.Create(&model.AyahAudio{
		AyahID:   &wrongAyahID,
		QariName: "Wrong Surah",
		QariSlug: "wrong-surah",
		AudioURL: "https://example.com/wrong.mp3",
	}).Error; err != nil {
		t.Fatalf("seed id-collision ayah audio: %v", err)
	}

	list, err := repo.FindSurahAudioBySurahID(surahNumber)
	if err != nil {
		t.Fatalf("FindSurahAudioBySurahID: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected one playable first-ayah source, got %d rows: %#v", len(list), list)
	}
	if list[0].SurahID == nil || *list[0].SurahID != surahID {
		t.Fatalf("expected resolved surah id %d, got %#v", surahID, list[0].SurahID)
	}
	if list[0].QariSlug != "mishary-rashid-alafasy" {
		t.Fatalf("expected numbered surah qari, got %q", list[0].QariSlug)
	}
}

func TestFindSurahAudioBySurahIDPrefersFirstAyahAudio(t *testing.T) {
	db := newAudioTestDB(t)
	repo := NewAudioRepository(db)

	surahID := 2
	firstAyahNumber := 1
	secondAyahNumber := 2
	firstAyahID := 8
	secondAyahID := 9
	translationID := 1
	if err := db.Create(&model.Ayah{BaseID: model.BaseID{ID: &firstAyahID}, Number: &firstAyahNumber, SurahID: &surahID, TranslationID: &translationID}).Error; err != nil {
		t.Fatalf("seed first ayah: %v", err)
	}
	if err := db.Create(&model.Ayah{BaseID: model.BaseID{ID: &secondAyahID}, Number: &secondAyahNumber, SurahID: &surahID, TranslationID: &translationID}).Error; err != nil {
		t.Fatalf("seed second ayah: %v", err)
	}
	if err := db.Create(&model.SurahAudio{
		SurahID:  &surahID,
		QariName: "Broken Surah Source",
		QariSlug: "broken-surah-source",
		AudioURL: "https://download.quranicaudio.com/quran/broken/002.mp3",
	}).Error; err != nil {
		t.Fatalf("seed surah audio: %v", err)
	}

	if err := db.Create(&model.AyahAudio{
		AyahID:   &firstAyahID,
		QariName: "Mishary Rashid Al-Afasy",
		QariSlug: "mishary-rashid-alafasy",
		AudioURL: "https://everyayah.com/data/Alafasy_128kbps/002001.mp3",
	}).Error; err != nil {
		t.Fatalf("seed first ayah audio: %v", err)
	}
	if err := db.Create(&model.AyahAudio{
		AyahID:   &secondAyahID,
		QariName: "Should Not Be Used",
		QariSlug: "second-ayah",
		AudioURL: "https://everyayah.com/data/Alafasy_128kbps/002002.mp3",
	}).Error; err != nil {
		t.Fatalf("seed second ayah audio: %v", err)
	}

	list, err := repo.FindSurahAudioBySurahID(surahID)
	if err != nil {
		t.Fatalf("FindSurahAudioBySurahID: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected first ayah audio only, got %d rows: %#v", len(list), list)
	}
	if list[0].QariSlug != "mishary-rashid-alafasy" {
		t.Fatalf("expected ayah qari source, got %q", list[0].QariSlug)
	}
	if list[0].AudioURL != "https://everyayah.com/data/Alafasy_128kbps/002001.mp3" {
		t.Fatalf("expected playable ayah URL, got %q", list[0].AudioURL)
	}
}

func TestFindSurahAudioBySurahIDFallsBackToSurahAudio(t *testing.T) {
	db := newAudioTestDB(t)
	repo := NewAudioRepository(db)

	surahID := 2
	if err := db.Create(&model.SurahAudio{
		SurahID:  &surahID,
		QariName: "Legacy Surah Source",
		QariSlug: "legacy-surah-source",
		AudioURL: "https://example.com/surah.mp3",
	}).Error; err != nil {
		t.Fatalf("seed surah audio: %v", err)
	}

	list, err := repo.FindSurahAudioBySurahID(surahID)
	if err != nil {
		t.Fatalf("FindSurahAudioBySurahID: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected fallback surah audio, got %d rows", len(list))
	}
	if list[0].QariSlug != "legacy-surah-source" {
		t.Fatalf("expected legacy surah source, got %q", list[0].QariSlug)
	}
}

func newAudioTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	// Mirror the app's naming strategy (app/db/postgresql.go) so queries that
	// qualify columns by table name behave the same as in production.
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{SingularTable: true},
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Surah{}, &model.Ayah{}, &model.AyahAudio{}, &model.SurahAudio{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	return db
}
