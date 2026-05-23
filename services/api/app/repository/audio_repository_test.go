package repository

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

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

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Ayah{}, &model.AyahAudio{}, &model.SurahAudio{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}
	return db
}
