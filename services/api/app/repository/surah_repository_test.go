package repository

import (
	"net/http/httptest"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

func TestParseSurahNumberLookup(t *testing.T) {
	tests := []struct {
		name string
		want int
		ok   bool
	}{
		{name: "1-Al-Fatihah", want: 1, ok: true},
		{name: "114/An-Naas", want: 114, ok: true},
		{name: "Al-Fatihah", ok: false},
		{name: "115-Al-Fatihah", ok: false},
	}

	for _, tt := range tests {
		got, ok := parseSurahNumberLookup(tt.name)
		if ok != tt.ok {
			t.Fatalf("%s: expected ok=%v, got %v", tt.name, tt.ok, ok)
		}
		if ok && *got != tt.want {
			t.Fatalf("%s: expected %d, got %d", tt.name, tt.want, *got)
		}
	}
}

func TestSurahNameCandidates(t *testing.T) {
	got := surahNameCandidates("Al-Faatihah")
	want := map[string]bool{
		"al-faatihah": true,
		"al faatihah": true,
		"al-faatiha":  true,
		"al faatiha":  true,
	}

	for candidate := range want {
		if !containsString(got, candidate) {
			t.Fatalf("expected candidates %v to contain %q", got, candidate)
		}
	}
}

func TestSurahRepositoryLoadsAyahsBySurahPrimaryKey(t *testing.T) {
	db := newAyahRepositoryTestDB(t)
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("get db: %v", err)
	}
	sqlDB.SetMaxOpenConns(1)
	repo := NewSurahRepository(db, paginate.New())

	prevSurahID := 100
	prevSurahNumber := 1
	surahID := 200
	surahNumber := 2
	nextSurahID := 201
	nextSurahNumber := 3
	surahTranslation := &model.Translation{
		Idn:     strptrOrNil("Al-Baqarah"),
		LatinEn: strptrOrNil("Al-Baqara"),
	}
	if err := db.Create(surahTranslation).Error; err != nil {
		t.Fatalf("create surah translation: %v", err)
	}
	surah := &model.Surah{
		BaseID:        model.BaseID{ID: &surahID},
		Number:        &surahNumber,
		TranslationID: surahTranslation.ID,
	}
	if err := db.Create(surah).Error; err != nil {
		t.Fatalf("create surah: %v", err)
	}
	if err := db.Create(&model.Surah{
		BaseID:        model.BaseID{ID: &prevSurahID},
		Number:        &prevSurahNumber,
		TranslationID: surahTranslation.ID,
	}).Error; err != nil {
		t.Fatalf("create prev surah: %v", err)
	}
	if err := db.Create(&model.Surah{
		BaseID:        model.BaseID{ID: &nextSurahID},
		Number:        &nextSurahNumber,
		TranslationID: surahTranslation.ID,
	}).Error; err != nil {
		t.Fatalf("create next surah: %v", err)
	}

	wrongSurahID := surahNumber
	wrongSurahNumber := 99
	wrongSurah := &model.Surah{
		BaseID:        model.BaseID{ID: &wrongSurahID},
		Number:        &wrongSurahNumber,
		TranslationID: surahTranslation.ID,
	}
	if err := db.Create(wrongSurah).Error; err != nil {
		t.Fatalf("create wrong surah: %v", err)
	}

	createAyahTestAyah(t, db, surah, 1, 2, 1)
	createAyahTestAyah(t, db, wrongSurah, 1, 2, 1)

	app := fiber.New()
	app.Get("/", func(ctx *fiber.Ctx) error {
		got, err := repo.FindByName(ctx, strptrOrNil("2-Al-Baqara"))
		if err != nil {
			t.Fatalf("find by name: %v", err)
		}
		if len(got.Ayahs) != 1 {
			t.Fatalf("expected 1 ayah, got %d", len(got.Ayahs))
		}
		if got.Ayahs[0].SurahID == nil || *got.Ayahs[0].SurahID != surahID {
			t.Fatalf("expected ayah from surah id %d, got %#v", surahID, got.Ayahs[0].SurahID)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})

	resp, err := app.Test(httptest.NewRequest("GET", "/?page=0&size=10", nil))
	if err != nil {
		t.Fatalf("fiber test: %v", err)
	}
	if resp.StatusCode != fiber.StatusNoContent {
		t.Fatalf("expected 204, got %d", resp.StatusCode)
	}
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
