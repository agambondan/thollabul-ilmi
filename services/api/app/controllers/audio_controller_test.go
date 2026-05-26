package controllers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestFindSurahAudioRouteAcceptsSurahNumber(t *testing.T) {
	app, db := newAudioControllerTestApp(t)

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
	if err := db.Create(&model.Ayah{
		BaseID:        model.BaseID{ID: &firstAyahID},
		Number:        &firstAyahNumber,
		SurahID:       &surahID,
		TranslationID: &translationID,
	}).Error; err != nil {
		t.Fatalf("seed numbered surah ayah: %v", err)
	}
	if err := db.Create(&model.Ayah{
		BaseID:        model.BaseID{ID: &wrongAyahID},
		Number:        &firstAyahNumber,
		SurahID:       &wrongSurahID,
		TranslationID: &translationID,
	}).Error; err != nil {
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

	res := audioControllerRequest(t, app, "/audio/surah/2")
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}

	var list []model.SurahAudio
	if err := json.NewDecoder(res.Body).Decode(&list); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected one audio source, got %d rows: %#v", len(list), list)
	}
	if list[0].SurahID == nil || *list[0].SurahID != surahID {
		t.Fatalf("expected resolved surah id %d, got %#v", surahID, list[0].SurahID)
	}
	if list[0].QariSlug != "mishary-rashid-alafasy" {
		t.Fatalf("expected numbered surah qari, got %q", list[0].QariSlug)
	}
}

func TestFindSurahAudioRouteReturnsEmptyListWhenNoAudio(t *testing.T) {
	app, _ := newAudioControllerTestApp(t)

	res := audioControllerRequest(t, app, "/audio/surah/114")
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusOK {
		t.Fatalf("expected 200, got %d", res.StatusCode)
	}

	var list []model.SurahAudio
	if err := json.NewDecoder(res.Body).Decode(&list); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(list) != 0 {
		t.Fatalf("expected empty audio list, got %d rows: %#v", len(list), list)
	}
}

func TestFindSurahAudioRouteRejectsInvalidSurahID(t *testing.T) {
	app, _ := newAudioControllerTestApp(t)

	res := audioControllerRequest(t, app, "/audio/surah/not-a-number")
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("expected 400, got %d", res.StatusCode)
	}

	var payload responsePayload
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload.Message != "invalid surah id" {
		t.Fatalf("expected invalid surah id message, got %q", payload.Message)
	}
}

func TestFindAyahAudioRouteRejectsInvalidAyahID(t *testing.T) {
	app, _ := newAudioControllerTestApp(t)

	res := audioControllerRequest(t, app, "/audio/ayah/not-a-number")
	defer res.Body.Close()
	if res.StatusCode != fiber.StatusBadRequest {
		t.Fatalf("expected 400, got %d", res.StatusCode)
	}

	var payload responsePayload
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload.Message != "invalid ayah id" {
		t.Fatalf("expected invalid ayah id message, got %q", payload.Message)
	}
}

type responsePayload struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
}

func newAudioControllerTestApp(t *testing.T) (*fiber.App, *gorm.DB) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.Surah{}, &model.Ayah{}, &model.AyahAudio{}, &model.SurahAudio{}); err != nil {
		t.Fatalf("automigrate: %v", err)
	}

	audioRepo := repository.NewAudioRepository(db)
	controller := NewAudioController(&service.Services{
		Audio: service.NewAudioService(audioRepo),
	})

	app := fiber.New()
	app.Get("/audio/surah/:surahId", controller.FindSurahAudio)
	app.Get("/audio/ayah/:ayahId", controller.FindAyahAudio)
	return app, db
}

func audioControllerRequest(t *testing.T, app *fiber.App, path string) *http.Response {
	t.Helper()

	req := httptest.NewRequest(fiber.MethodGet, path, nil)
	res, err := app.Test(req)
	if err != nil {
		t.Fatalf("request %s: %v", path, err)
	}
	return res
}
