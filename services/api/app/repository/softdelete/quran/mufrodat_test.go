package quran

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"gorm.io/gorm"
)

func newMufrodat(t *testing.T, db *gorm.DB, ayah *model.Ayah, index int, root string) *model.Mufrodat {
	t.Helper()
	m := &model.Mufrodat{
		AyahID:          ayah.ID,
		WordIndex:       index,
		Arabic:          root,
		Transliteration: root,
		Indonesian:      root,
		RootWord:        root,
		PartOfSpeech:    "noun",
	}
	mustCreate(t, db, m)
	return m
}

func mufrodatIDs(items []model.Mufrodat) []int {
	var ids []int
	for _, item := range items {
		ids = append(ids, idOf(item.ID))
	}
	return ids
}

type mufrodatFixture struct {
	repo repository.MufrodatRepository

	ayah, goneAyah, goneSurahAyah, goneSurahTrAyah, goneAyahTrAyah *model.Ayah

	live, liveTwo, goneRow, ofGoneAyah, ofGoneSurah, ofGoneSurahTr, ofGoneAyahTr *model.Mufrodat
}

func newMufrodatFixture(t *testing.T) *mufrodatFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.Mufrodat{})
	f := &mufrodatFixture{repo: repository.NewMufrodatRepository(db)}

	liveSurah, _ := newSurah(t, db, 1, "live surah")
	goneSurah, _ := newSurah(t, db, 2, "gone surah")
	goneSurahTrSurah, goneSurahTr := newSurah(t, db, 3, "gone surah translation")

	var goneAyahTr *model.Translation
	f.ayah, _ = newAyah(t, db, liveSurah, 1, 10, 1, "live ayah")
	f.goneAyah, _ = newAyah(t, db, liveSurah, 2, 10, 1, "gone ayah")
	f.goneAyahTrAyah, goneAyahTr = newAyah(t, db, liveSurah, 3, 10, 1, "gone ayah translation")
	f.goneSurahAyah, _ = newAyah(t, db, goneSurah, 1, 10, 1, "gone surah ayah")
	f.goneSurahTrAyah, _ = newAyah(t, db, goneSurahTrSurah, 1, 10, 1, "gone surah translation ayah")

	f.live = newMufrodat(t, db, f.ayah, 1, "live")
	f.goneRow = newMufrodat(t, db, f.ayah, 2, "gone row")
	f.liveTwo = newMufrodat(t, db, f.ayah, 3, "live two")
	f.ofGoneAyah = newMufrodat(t, db, f.goneAyah, 1, "gone ayah")
	f.ofGoneAyahTr = newMufrodat(t, db, f.goneAyahTrAyah, 1, "gone ayah translation")
	f.ofGoneSurah = newMufrodat(t, db, f.goneSurahAyah, 1, "gone surah")
	f.ofGoneSurahTr = newMufrodat(t, db, f.goneSurahTrAyah, 1, "gone surah translation")

	testdb.Delete(t, db, f.goneRow)
	testdb.Delete(t, db, f.goneAyah)
	testdb.Delete(t, db, goneSurah)
	testdb.Delete(t, db, goneSurahTr)
	testdb.Delete(t, db, goneAyahTr)
	return f
}

func TestSoftDeleteMufrodatFindByAyahID(t *testing.T) {
	f := newMufrodatFixture(t)

	t.Run("deleted word is hidden", func(t *testing.T) {
		items, err := f.repo.FindByAyahID(ayahID(f.ayah))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		assertIDs(t, "words of live ayah", mufrodatIDs(items), wantIDs(f.live.ID, f.liveTwo.ID))
		for _, item := range items {
			if ayahID(item.Ayah) != ayahID(f.ayah) || item.Ayah.Translation == nil ||
				item.Ayah.Surah == nil {
				t.Fatalf("live word must keep its full live graph, got %+v", item.Ayah)
			}
		}
	})

	t.Run("deleted ayah is not hydrated", func(t *testing.T) {
		items, err := f.repo.FindByAyahID(ayahID(f.goneAyah))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		assertIDs(t, "words of deleted ayah", mufrodatIDs(items), wantIDs(f.ofGoneAyah.ID))
		if len(items) == 1 && items[0].Ayah != nil {
			t.Fatalf("deleted ayah must not be returned, got %+v", items[0].Ayah)
		}
	})

	t.Run("deleted surah is not hydrated", func(t *testing.T) {
		items, err := f.repo.FindByAyahID(ayahID(f.goneSurahAyah))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		assertIDs(t, "words of ayah in deleted surah", mufrodatIDs(items), wantIDs(f.ofGoneSurah.ID))
		if len(items) == 1 && (items[0].Ayah == nil || items[0].Ayah.Surah != nil) {
			t.Fatalf("live ayah must be kept and deleted surah dropped, got %+v", items[0].Ayah)
		}
	})

	t.Run("deleted ayah translation is not hydrated", func(t *testing.T) {
		items, err := f.repo.FindByAyahID(ayahID(f.goneAyahTrAyah))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		assertIDs(t, "words of ayah with deleted translation", mufrodatIDs(items), wantIDs(f.ofGoneAyahTr.ID))
		if len(items) == 1 && (items[0].Ayah == nil || items[0].Ayah.Translation != nil) {
			t.Fatalf("live ayah must be kept and deleted translation dropped, got %+v", items[0].Ayah)
		}
	})
}

func TestSoftDeleteMufrodatFindBySurahNumber(t *testing.T) {
	f := newMufrodatFixture(t)

	t.Run("live surah hides deleted words and words of deleted ayah", func(t *testing.T) {
		items, err := f.repo.FindBySurahNumber(1)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		assertIDs(t, "words of live surah", mufrodatIDs(items), wantIDs(f.live.ID, f.liveTwo.ID, f.ofGoneAyahTr.ID))
		for _, item := range items {
			if idOf(item.ID) == idOf(f.ofGoneAyahTr.ID) && item.Ayah.Translation != nil {
				t.Fatalf("deleted ayah translation leaked: %+v", item.Ayah.Translation)
			}
		}
	})

	t.Run("deleted surah has no words", func(t *testing.T) {
		items, err := f.repo.FindBySurahNumber(2)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		if len(items) != 0 {
			t.Fatalf("deleted surah must list no words, got %+v", items)
		}
	})

	t.Run("surah with deleted translation still lists words", func(t *testing.T) {
		items, err := f.repo.FindBySurahNumber(3)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		assertIDs(t, "words of surah with deleted translation", mufrodatIDs(items), wantIDs(f.ofGoneSurahTr.ID))
	})
}

func TestSoftDeleteMufrodatFindBySurahAndAyahNumber(t *testing.T) {
	f := newMufrodatFixture(t)

	t.Run("live ayah hides deleted words", func(t *testing.T) {
		items, err := f.repo.FindBySurahAndAyahNumber(1, 1)
		if err != nil {
			t.Fatalf("FindBySurahAndAyahNumber: %v", err)
		}
		assertIDs(t, "words of live ayah", mufrodatIDs(items), wantIDs(f.live.ID, f.liveTwo.ID))
	})

	t.Run("deleted ayah has no words", func(t *testing.T) {
		items, err := f.repo.FindBySurahAndAyahNumber(1, 2)
		if err != nil {
			t.Fatalf("FindBySurahAndAyahNumber: %v", err)
		}
		if len(items) != 0 {
			t.Fatalf("deleted ayah must list no words, got %+v", items)
		}
	})

	t.Run("deleted surah has no words", func(t *testing.T) {
		items, err := f.repo.FindBySurahAndAyahNumber(2, 1)
		if err != nil {
			t.Fatalf("FindBySurahAndAyahNumber: %v", err)
		}
		if len(items) != 0 {
			t.Fatalf("deleted surah must list no words, got %+v", items)
		}
	})
}

func TestSoftDeleteMufrodatFindByPage(t *testing.T) {
	f := newMufrodatFixture(t)

	items, err := f.repo.FindByPage(10)
	if err != nil {
		t.Fatalf("FindByPage: %v", err)
	}
	assertIDs(t, "words on page", mufrodatIDs(items), wantIDs(
		f.live.ID, f.liveTwo.ID, f.ofGoneAyahTr.ID, f.ofGoneSurah.ID, f.ofGoneSurahTr.ID,
	))

	for _, item := range items {
		switch idOf(item.ID) {
		case idOf(f.ofGoneAyahTr.ID):
			if item.Ayah.Translation != nil {
				t.Fatalf("deleted ayah translation leaked: %+v", item.Ayah.Translation)
			}
		case idOf(f.ofGoneSurah.ID):
			if item.Ayah == nil || item.Ayah.Surah != nil {
				t.Fatalf("deleted surah must not be returned, got %+v", item.Ayah)
			}
		case idOf(f.ofGoneSurahTr.ID):
			if item.Ayah == nil || item.Ayah.Surah == nil {
				t.Fatalf("live surah must be kept, got %+v", item.Ayah)
			}
		}
	}
}
