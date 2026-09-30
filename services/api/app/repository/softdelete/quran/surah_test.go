package quran

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type surahFixture struct {
	repo repository.SurahRepository

	first, goneTr, third, last, goneNeighbor, gone *model.Surah

	liveAyah, goneAyah, goneTrAyah *model.Ayah
}

func newSurahFixture(t *testing.T) *surahFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Surah{}, &model.Ayah{})
	f := &surahFixture{repo: repository.NewSurahRepository(db, paginate.New())}

	var goneSurahTranslation, goneAyahTranslation *model.Translation
	f.first, _ = newSurah(t, db, 1, "Al Fatihah")
	f.goneTr, goneSurahTranslation = newSurah(t, db, 2, "Al Baqarah")
	f.third, _ = newSurah(t, db, 3, "Ali Imran")
	f.gone, _ = newSurah(t, db, 50, "Mahdzuf")
	f.goneNeighbor, _ = newSurah(t, db, 113, "Al Falaq")
	f.last, _ = newSurah(t, db, 114, "An Nas")

	f.liveAyah, _ = newAyah(t, db, f.first, 1, 1, 1, "live ayah")
	f.goneAyah, _ = newAyah(t, db, f.first, 2, 1, 1, "gone ayah")
	f.goneTrAyah, goneAyahTranslation = newAyah(t, db, f.first, 3, 1, 1, "gone ayah translation")

	testdb.Delete(t, db, f.gone)
	testdb.Delete(t, db, f.goneNeighbor)
	testdb.Delete(t, db, f.goneAyah)
	testdb.Delete(t, db, goneSurahTranslation)
	testdb.Delete(t, db, goneAyahTranslation)
	return f
}

func surahNumbers(surahs []model.Surah) []int {
	var numbers []int
	for _, s := range surahs {
		numbers = append(numbers, idOf(s.Number))
	}
	return numbers
}

func TestSoftDeleteSurahFindAll(t *testing.T) {
	f := newSurahFixture(t)

	page := pageOf(t, "/?page=0&size=50", f.repo.FindAll)
	surahs := sliceOf[model.Surah](t, page.Items)
	assertIDs(t, "FindAll", surahNumbers(surahs), []int{1, 2, 3, 114})
	if page.Total != 4 {
		t.Fatalf("FindAll total: got %d, want 4", page.Total)
	}
	for _, s := range surahs {
		if idOf(s.Number) == 2 {
			if s.Translation != nil {
				t.Fatalf("deleted surah translation leaked: %+v", s.Translation)
			}
			continue
		}
		if s.Translation == nil {
			t.Fatalf("surah %d lost its live translation", idOf(s.Number))
		}
	}
}

func TestSoftDeleteSurahFindByID(t *testing.T) {
	f := newSurahFixture(t)

	if _, err := f.repo.FindById(nil, f.gone.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindById of a deleted surah: got %v, want ErrRecordNotFound", err)
	}

	first, err := f.repo.FindById(nil, f.first.ID)
	if err != nil {
		t.Fatalf("FindById: %v", err)
	}
	if first.Translation == nil {
		t.Fatalf("live surah must keep its live translation")
	}
	if surahID(first.NextSurah) != surahID(f.goneTr) || first.NextSurah.Translation != nil {
		t.Fatalf("next surah must be loaded without its deleted translation, got %+v", first.NextSurah)
	}

	withDeletedTranslation, err := f.repo.FindById(nil, f.goneTr.ID)
	if err != nil {
		t.Fatalf("FindById: %v", err)
	}
	if withDeletedTranslation.Translation != nil {
		t.Fatalf("deleted surah translation leaked: %+v", withDeletedTranslation.Translation)
	}
}

func TestSoftDeleteSurahFindByNumber(t *testing.T) {
	f := newSurahFixture(t)

	deleted := 50
	if _, err := f.repo.FindByNumber(nil, &deleted); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindByNumber of a deleted surah: got %v, want ErrRecordNotFound", err)
	}

	deletedNeighbor := 113
	if _, err := f.repo.FindByNumber(nil, &deletedNeighbor); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindByNumber of a deleted surah: got %v, want ErrRecordNotFound", err)
	}

	second := 2
	got, err := f.repo.FindByNumber(nil, &second)
	if err != nil {
		t.Fatalf("FindByNumber: %v", err)
	}
	if got.Translation != nil {
		t.Fatalf("deleted surah translation leaked: %+v", got.Translation)
	}
	if surahID(got.PrevSurah) != surahID(f.first) || surahID(got.NextSurah) != surahID(f.third) {
		t.Fatalf("neighbors not loaded: prev %+v next %+v", got.PrevSurah, got.NextSurah)
	}

	last := 114
	lastSurah, err := f.repo.FindByNumber(nil, &last)
	if err == nil && surahID(lastSurah.PrevSurah) == surahID(f.goneNeighbor) {
		t.Fatalf("deleted neighbor surah leaked as PrevSurah: %+v", lastSurah.PrevSurah)
	}
}

func TestSoftDeleteSurahFindByNumberLoadsLiveAyahsOnly(t *testing.T) {
	f := newSurahFixture(t)

	first := 1
	got := inFiberCtx(t, "/?page=0&size=50", func(ctx *fiber.Ctx) (*model.Surah, error) {
		return f.repo.FindByNumber(ctx, &first)
	})

	var ids []int
	for _, ayah := range got.Ayahs {
		ids = append(ids, idOf(ayah.ID))
		if idOf(ayah.ID) == idOf(f.goneTrAyah.ID) && ayah.Translation != nil {
			t.Fatalf("deleted ayah translation leaked: %+v", ayah.Translation)
		}
		if idOf(ayah.ID) == idOf(f.liveAyah.ID) && ayah.Translation == nil {
			t.Fatalf("live ayah lost its live translation")
		}
	}
	assertIDs(t, "ayahs of surah", ids, wantIDs(f.liveAyah.ID, f.goneTrAyah.ID))
}

func TestSoftDeleteSurahFindByName(t *testing.T) {
	f := newSurahFixture(t)

	name := "Al Fatihah"
	got, err := f.repo.FindByName(nil, &name)
	if err != nil {
		t.Fatalf("FindByName: %v", err)
	}
	if surahID(got) != surahID(f.first) {
		t.Fatalf("FindByName(%q): got surah %d, want %d", name, surahID(got), surahID(f.first))
	}

	cases := []struct {
		name  string
		input string
	}{
		{name: "deleted surah by name", input: "Mahdzuf"},
		{name: "deleted surah by number", input: "50-mahdzuf"},
		{name: "live surah whose translation is deleted", input: "Al Baqarah"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			input := tc.input
			if _, err := f.repo.FindByName(nil, &input); !errors.Is(err, gorm.ErrRecordNotFound) {
				t.Fatalf("FindByName(%q): got %v, want ErrRecordNotFound", input, err)
			}
		})
	}
}

func TestSoftDeleteSurahCount(t *testing.T) {
	f := newSurahFixture(t)

	count, err := f.repo.Count()
	if err != nil {
		t.Fatalf("Count: %v", err)
	}
	if *count != 4 {
		t.Fatalf("Count: got %d, want 4 live surahs", *count)
	}
}
