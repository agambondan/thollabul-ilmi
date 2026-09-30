package quran

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

func newTafsir(t *testing.T, db *gorm.DB, ayah *model.Ayah, label string) (*model.Tafsir, [3]*model.Translation) {
	t.Helper()
	kemenag := newTranslation(t, db, label+" kemenag")
	katsir := newTranslation(t, db, label+" katsir")
	katsirEn := newTranslation(t, db, label+" katsir en")
	tafsir := &model.Tafsir{
		AyahID:                    ayah.ID,
		KemenagTranslationID:      kemenag.ID,
		IbnuKatsirTranslationID:   katsir.ID,
		IbnuKatsirEnTranslationID: katsirEn.ID,
	}
	mustCreate(t, db, tafsir)
	return tafsir, [3]*model.Translation{kemenag, katsir, katsirEn}
}

type tafsirFixture struct {
	repo repository.TafsirRepository

	surah       *model.Surah
	goneSurah   *model.Surah
	goneTrSurah *model.Surah

	liveAyah        *model.Ayah
	goneRowAyah     *model.Ayah
	goneAyah        *model.Ayah
	goneAyahTrAyah  *model.Ayah
	goneTrAyah      *model.Ayah
	goneSurahAyah   *model.Ayah
	goneSurahTrAyah *model.Ayah

	live          *model.Tafsir
	goneRow       *model.Tafsir
	ofGoneAyah    *model.Tafsir
	ofGoneAyahTr  *model.Tafsir
	ofGoneTr      *model.Tafsir
	ofGoneSurah   *model.Tafsir
	ofGoneSurahTr *model.Tafsir
}

func newTafsirFixture(t *testing.T) *tafsirFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.Tafsir{})
	f := &tafsirFixture{repo: repository.NewTafsirRepository(db, paginate.New())}

	var goneSurahTranslation, goneAyahTranslation *model.Translation
	var goneTafsirTranslations [3]*model.Translation

	f.surah, _ = newSurah(t, db, 1, "live surah")
	f.goneSurah, _ = newSurah(t, db, 2, "gone surah")
	f.goneTrSurah, goneSurahTranslation = newSurah(t, db, 3, "gone surah translation")

	f.liveAyah, _ = newAyah(t, db, f.surah, 1, 1, 1, "live ayah")
	f.goneRowAyah, _ = newAyah(t, db, f.surah, 2, 1, 1, "tafsir deleted ayah")
	f.goneAyah, _ = newAyah(t, db, f.surah, 3, 1, 1, "deleted ayah")
	f.goneAyahTrAyah, goneAyahTranslation = newAyah(t, db, f.surah, 4, 1, 1, "ayah translation deleted")
	f.goneTrAyah, _ = newAyah(t, db, f.surah, 5, 1, 1, "tafsir translation deleted")
	f.goneSurahAyah, _ = newAyah(t, db, f.goneSurah, 1, 2, 2, "gone surah ayah")
	f.goneSurahTrAyah, _ = newAyah(t, db, f.goneTrSurah, 1, 3, 3, "gone surah translation ayah")

	f.live, _ = newTafsir(t, db, f.liveAyah, "live")
	f.goneRow, _ = newTafsir(t, db, f.goneRowAyah, "gone row")
	f.ofGoneAyah, _ = newTafsir(t, db, f.goneAyah, "gone ayah")
	f.ofGoneAyahTr, _ = newTafsir(t, db, f.goneAyahTrAyah, "gone ayah translation")
	f.ofGoneTr, goneTafsirTranslations = newTafsir(t, db, f.goneTrAyah, "gone translation")
	f.ofGoneSurah, _ = newTafsir(t, db, f.goneSurahAyah, "gone surah")
	f.ofGoneSurahTr, _ = newTafsir(t, db, f.goneSurahTrAyah, "gone surah translation")

	testdb.Delete(t, db, f.goneRow)
	testdb.Delete(t, db, f.goneAyah)
	testdb.Delete(t, db, f.goneSurah)
	testdb.Delete(t, db, goneSurahTranslation)
	testdb.Delete(t, db, goneAyahTranslation)
	testdb.Delete(t, db, goneTafsirTranslations[1])
	return f
}

func TestSoftDeleteTafsirFindByAyahID(t *testing.T) {
	f := newTafsirFixture(t)

	t.Run("live tafsir keeps its full live graph", func(t *testing.T) {
		got, err := f.repo.FindByAyahID(idOf(f.liveAyah.ID))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		if idOf(got.ID) != idOf(f.live.ID) {
			t.Fatalf("got tafsir %d, want %d", idOf(got.ID), idOf(f.live.ID))
		}
		if got.KemenagTranslation.ID == nil || got.IbnuKatsirTranslation.ID == nil || got.IbnuKatsirEnTranslation.ID == nil {
			t.Fatalf("live translations must be loaded, got %+v", got)
		}
		if ayahID(got.Ayah) != idOf(f.liveAyah.ID) || surahID(got.Ayah.Surah) != idOf(f.surah.ID) {
			t.Fatalf("live ayah and surah must be loaded, got %+v", got.Ayah)
		}
	})

	t.Run("deleted tafsir is not found", func(t *testing.T) {
		if _, err := f.repo.FindByAyahID(idOf(f.goneRowAyah.ID)); !errors.Is(err, gorm.ErrRecordNotFound) {
			t.Fatalf("expected ErrRecordNotFound for a deleted tafsir, got %v", err)
		}
	})

	t.Run("deleted ayah is not hydrated", func(t *testing.T) {
		got, err := f.repo.FindByAyahID(idOf(f.goneAyah.ID))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		if idOf(got.ID) != idOf(f.ofGoneAyah.ID) {
			t.Fatalf("got tafsir %d, want %d", idOf(got.ID), idOf(f.ofGoneAyah.ID))
		}
		if got.Ayah != nil {
			t.Fatalf("deleted ayah must not be returned, got %+v", got.Ayah)
		}
	})

	t.Run("deleted surah is not hydrated", func(t *testing.T) {
		got, err := f.repo.FindByAyahID(idOf(f.goneSurahAyah.ID))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		if ayahID(got.Ayah) != idOf(f.goneSurahAyah.ID) {
			t.Fatalf("live ayah must be returned, got %+v", got.Ayah)
		}
		if got.Ayah.Surah != nil {
			t.Fatalf("deleted surah must not be returned, got %+v", got.Ayah.Surah)
		}
	})

	t.Run("deleted surah translation is not hydrated", func(t *testing.T) {
		got, err := f.repo.FindByAyahID(idOf(f.goneSurahTrAyah.ID))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		if got.Ayah == nil || got.Ayah.Surah == nil {
			t.Fatalf("live ayah and surah must be returned, got %+v", got.Ayah)
		}
		if got.Ayah.Surah.Translation != nil {
			t.Fatalf("deleted surah translation must not be returned, got %+v", got.Ayah.Surah.Translation)
		}
	})

	t.Run("deleted ayah translation is not hydrated", func(t *testing.T) {
		got, err := f.repo.FindByAyahID(idOf(f.goneAyahTrAyah.ID))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		if got.Ayah == nil {
			t.Fatalf("live ayah must be returned")
		}
		if got.Ayah.Translation != nil {
			t.Fatalf("deleted ayah translation must not be returned, got %+v", got.Ayah.Translation)
		}
	})

	t.Run("deleted tafsir translation is not hydrated", func(t *testing.T) {
		got, err := f.repo.FindByAyahID(idOf(f.goneTrAyah.ID))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		if got.KemenagTranslation.ID == nil || got.IbnuKatsirEnTranslation.ID == nil {
			t.Fatalf("live translations must be kept, got %+v", got)
		}
		if got.IbnuKatsirTranslation.ID != nil {
			t.Fatalf("deleted translation must not be returned, got %+v", got.IbnuKatsirTranslation)
		}
	})
}

func TestSoftDeleteTafsirFindBySurahNumber(t *testing.T) {
	f := newTafsirFixture(t)

	items, err := f.repo.FindBySurahNumber(1, 50, 0)
	if err != nil {
		t.Fatalf("FindBySurahNumber: %v", err)
	}

	var ids []int
	for _, item := range items {
		ids = append(ids, idOf(item.ID))
	}
	assertIDs(t, "tafsir in live surah", ids, wantIDs(f.live.ID, f.ofGoneAyahTr.ID, f.ofGoneTr.ID))

	for _, item := range items {
		if ayahID(item.Ayah) == idOf(f.goneAyah.ID) {
			t.Fatalf("deleted ayah leaked through tafsir %d", idOf(item.ID))
		}
		if idOf(item.ID) == idOf(f.ofGoneAyahTr.ID) && item.Ayah.Translation != nil {
			t.Fatalf("deleted ayah translation leaked: %+v", item.Ayah.Translation)
		}
		if idOf(item.ID) == idOf(f.ofGoneTr.ID) && item.IbnuKatsirTranslation.ID != nil {
			t.Fatalf("deleted tafsir translation leaked: %+v", item.IbnuKatsirTranslation)
		}
	}

	t.Run("pagination only counts live rows", func(t *testing.T) {
		page, err := f.repo.FindBySurahNumber(1, 2, 1)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		var pageIDs []int
		for _, item := range page {
			pageIDs = append(pageIDs, idOf(item.ID))
		}
		assertIDs(t, "second page", pageIDs, wantIDs(f.ofGoneAyahTr.ID, f.ofGoneTr.ID))
	})

	t.Run("deleted surah has no tafsir", func(t *testing.T) {
		got, err := f.repo.FindBySurahNumber(2, 50, 0)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		if len(got) != 0 {
			t.Fatalf("deleted surah must list no tafsir, got %d", len(got))
		}
	})

	t.Run("live surah with deleted translation still lists tafsir", func(t *testing.T) {
		got, err := f.repo.FindBySurahNumber(3, 50, 0)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		if len(got) != 1 || idOf(got[0].ID) != idOf(f.ofGoneSurahTr.ID) {
			t.Fatalf("expected the tafsir of surah 3, got %+v", got)
		}
		if got[0].Ayah == nil || got[0].Ayah.Surah == nil {
			t.Fatalf("live ayah and surah must be returned, got %+v", got[0].Ayah)
		}
		if got[0].Ayah.Surah.Translation != nil {
			t.Fatalf("deleted surah translation leaked: %+v", got[0].Ayah.Surah.Translation)
		}
	})
}
