package quran

import (
	"errors"
	"sort"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"gorm.io/gorm"
)

func newAsbab(t *testing.T, db *gorm.DB, title string, ayahs ...*model.Ayah) (*model.AsbabunNuzul, *model.Translation) {
	t.Helper()
	tr := newTranslation(t, db, title)
	item := &model.AsbabunNuzul{
		Title:         title,
		Narrator:      "narrator",
		Content:       title + " content",
		Source:        "source",
		DisplayRef:    "ref",
		TranslationID: tr.ID,
	}
	for _, ayah := range ayahs {
		item.Ayahs = append(item.Ayahs, *ayah)
	}
	if err := db.Omit("Ayahs.*").Create(item).Error; err != nil {
		t.Fatalf("create asbab %q: %v", title, err)
	}
	return item, tr
}

func asbabIDs(items []model.AsbabunNuzul) []int {
	var ids []int
	for _, item := range items {
		ids = append(ids, idOf(item.ID))
	}
	return ids
}

func asbabAyahIDs(item model.AsbabunNuzul) []int {
	var ids []int
	for _, ayah := range item.Ayahs {
		ids = append(ids, idOf(ayah.ID))
	}
	return ids
}

func findAsbab(items []model.AsbabunNuzul, id *int) *model.AsbabunNuzul {
	for i := range items {
		if idOf(items[i].ID) == idOf(id) {
			return &items[i]
		}
	}
	return nil
}

type asbabFixture struct {
	repo repository.AsbabunNuzulRepository

	liveSurah, goneSurah, goneSurahTrSurah *model.Surah
	liveAyah, goneAyah, goneAyahTrAyah     *model.Ayah
	tailAyah                               *model.Ayah
	goneSurahAyah, goneSurahTrAyah         *model.Ayah

	mixed, goneRow, goneTr, onlyGoneAyah, inGoneSurah, inGoneSurahTr, tail *model.AsbabunNuzul
}

func newAsbabFixture(t *testing.T) *asbabFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.AsbabunNuzul{})
	f := &asbabFixture{repo: repository.NewAsbabunNuzulRepository(db)}

	var goneSurahTr, goneAyahTr, goneAsbabTr *model.Translation
	f.liveSurah, _ = newSurah(t, db, 1, "live surah")
	f.goneSurah, _ = newSurah(t, db, 2, "gone surah")
	f.goneSurahTrSurah, goneSurahTr = newSurah(t, db, 3, "gone surah translation")

	f.liveAyah, _ = newAyah(t, db, f.liveSurah, 1, 1, 1, "live ayah")
	f.goneAyah, _ = newAyah(t, db, f.liveSurah, 2, 1, 1, "gone ayah")
	f.goneAyahTrAyah, goneAyahTr = newAyah(t, db, f.liveSurah, 3, 1, 1, "gone ayah translation")
	f.tailAyah, _ = newAyah(t, db, f.liveSurah, 4, 1, 1, "tail ayah")
	f.goneSurahAyah, _ = newAyah(t, db, f.goneSurah, 1, 2, 2, "gone surah ayah")
	f.goneSurahTrAyah, _ = newAyah(t, db, f.goneSurahTrSurah, 1, 3, 3, "gone surah translation ayah")

	f.mixed, _ = newAsbab(t, db, "mixed", f.liveAyah, f.goneAyah, f.goneAyahTrAyah)
	f.goneRow, _ = newAsbab(t, db, "gone row", f.liveAyah)
	f.goneTr, goneAsbabTr = newAsbab(t, db, "gone translation", f.liveAyah)
	f.onlyGoneAyah, _ = newAsbab(t, db, "only gone ayah", f.goneAyah)
	f.inGoneSurah, _ = newAsbab(t, db, "in gone surah", f.goneSurahAyah)
	f.inGoneSurahTr, _ = newAsbab(t, db, "in gone surah translation", f.goneSurahTrAyah)
	f.tail, _ = newAsbab(t, db, "tail", f.tailAyah)

	testdb.Delete(t, db, f.goneRow)
	testdb.Delete(t, db, f.goneAyah)
	testdb.Delete(t, db, f.goneSurah)
	testdb.Delete(t, db, goneSurahTr)
	testdb.Delete(t, db, goneAyahTr)
	testdb.Delete(t, db, goneAsbabTr)
	return f
}

func TestSoftDeleteAsbabunNuzulFindAll(t *testing.T) {
	f := newAsbabFixture(t)

	t.Run("deleted rows do not take pagination slots", func(t *testing.T) {
		items, err := f.repo.FindAll(0, 2)
		if err != nil {
			t.Fatalf("FindAll: %v", err)
		}
		assertIDs(t, "first page", asbabIDs(items), wantIDs(f.mixed.ID, f.goneTr.ID))

		items, err = f.repo.FindAll(1, 2)
		if err != nil {
			t.Fatalf("FindAll: %v", err)
		}
		assertIDs(t, "second page", asbabIDs(items), wantIDs(f.onlyGoneAyah.ID, f.inGoneSurah.ID))
	})

	t.Run("deleted relations are dropped from live rows", func(t *testing.T) {
		items, err := f.repo.FindAll(0, 100)
		if err != nil {
			t.Fatalf("FindAll: %v", err)
		}
		assertIDs(t, "all", asbabIDs(items), wantIDs(
			f.mixed.ID, f.goneTr.ID, f.onlyGoneAyah.ID, f.inGoneSurah.ID, f.inGoneSurahTr.ID, f.tail.ID,
		))

		mixed := findAsbab(items, f.mixed.ID)
		assertIDs(t, "ayahs of mixed", asbabAyahIDs(*mixed), wantIDs(f.liveAyah.ID, f.goneAyahTrAyah.ID))
		if mixed.Translation == nil || mixed.Ayahs[0].Translation == nil || mixed.Ayahs[0].Surah == nil || mixed.Ayahs[0].Surah.Translation == nil {
			t.Fatalf("live asbab must keep its full live graph, got %+v", mixed)
		}
		if mixed.Ayahs[1].Translation != nil {
			t.Fatalf("deleted ayah translation leaked: %+v", mixed.Ayahs[1].Translation)
		}

		if got := findAsbab(items, f.goneTr.ID); got.Translation != nil {
			t.Fatalf("deleted asbab translation leaked: %+v", got.Translation)
		}
		if got := findAsbab(items, f.onlyGoneAyah.ID); len(got.Ayahs) != 0 {
			t.Fatalf("deleted ayah leaked: %+v", got.Ayahs)
		}
		if got := findAsbab(items, f.inGoneSurah.ID); len(got.Ayahs) != 1 || got.Ayahs[0].Surah != nil {
			t.Fatalf("deleted surah leaked: %+v", got.Ayahs)
		}
		if got := findAsbab(items, f.inGoneSurahTr.ID); len(got.Ayahs) != 1 || got.Ayahs[0].Surah == nil || got.Ayahs[0].Surah.Translation != nil {
			t.Fatalf("deleted surah translation leaked: %+v", got.Ayahs)
		}
	})
}

func TestSoftDeleteAsbabunNuzulFindByAyahID(t *testing.T) {
	f := newAsbabFixture(t)

	items, err := f.repo.FindByAyahID(ayahID(f.liveAyah))
	if err != nil {
		t.Fatalf("FindByAyahID: %v", err)
	}
	assertIDs(t, "asbab of live ayah", asbabIDs(items), wantIDs(f.mixed.ID, f.goneTr.ID))

	mixed := findAsbab(items, f.mixed.ID)
	assertIDs(t, "ayahs of mixed", asbabAyahIDs(*mixed), wantIDs(f.liveAyah.ID, f.goneAyahTrAyah.ID))
	if got := findAsbab(items, f.goneTr.ID); got.Translation != nil {
		t.Fatalf("deleted asbab translation leaked: %+v", got.Translation)
	}

	t.Run("lookup by a deleted ayah never returns the deleted ayah", func(t *testing.T) {
		items, err := f.repo.FindByAyahID(ayahID(f.goneAyah))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		if len(items) != 0 {
			t.Fatalf("lookup by a deleted ayah must return no asbab, got %d items", len(items))
		}
	})

	t.Run("surah of a live ayah is dropped when deleted", func(t *testing.T) {
		items, err := f.repo.FindByAyahID(ayahID(f.goneSurahAyah))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		assertIDs(t, "asbab of ayah in deleted surah", asbabIDs(items), wantIDs(f.inGoneSurah.ID))
		if len(items[0].Ayahs) != 1 || items[0].Ayahs[0].Surah != nil {
			t.Fatalf("deleted surah leaked: %+v", items[0].Ayahs)
		}
	})
}

func TestSoftDeleteAsbabunNuzulFindBySurahNumber(t *testing.T) {
	f := newAsbabFixture(t)

	t.Run("live surah hides deleted asbab and asbab of deleted ayah", func(t *testing.T) {
		items, err := f.repo.FindBySurahNumber(1, 50, 0)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		ids := asbabIDs(items)
		sort.Ints(ids)
		assertIDs(t, "asbab in live surah", ids, wantIDs(f.mixed.ID, f.goneTr.ID, f.tail.ID))

		mixed := findAsbab(items, f.mixed.ID)
		assertIDs(t, "ayahs of mixed", asbabAyahIDs(*mixed), wantIDs(f.liveAyah.ID, f.goneAyahTrAyah.ID))
	})

	t.Run("pagination only counts live rows", func(t *testing.T) {
		items, err := f.repo.FindBySurahNumber(1, 1, 2)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		assertIDs(t, "third page", asbabIDs(items), wantIDs(f.tail.ID))
	})

	t.Run("deleted surah has no asbab", func(t *testing.T) {
		items, err := f.repo.FindBySurahNumber(2, 50, 0)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		if len(items) != 0 {
			t.Fatalf("deleted surah must list no asbab, got %+v", items)
		}
	})

	t.Run("surah with deleted translation still lists asbab", func(t *testing.T) {
		items, err := f.repo.FindBySurahNumber(3, 50, 0)
		if err != nil {
			t.Fatalf("FindBySurahNumber: %v", err)
		}
		assertIDs(t, "asbab in surah with deleted translation", asbabIDs(items), wantIDs(f.inGoneSurahTr.ID))
		if items[0].Ayahs[0].Surah == nil || items[0].Ayahs[0].Surah.Translation != nil {
			t.Fatalf("deleted surah translation leaked: %+v", items[0].Ayahs[0].Surah)
		}
	})
}

func TestSoftDeleteAsbabunNuzulFindByID(t *testing.T) {
	f := newAsbabFixture(t)

	if _, err := f.repo.FindByID(idOf(f.goneRow.ID)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindByID of a deleted asbab: got %v, want ErrRecordNotFound", err)
	}

	got, err := f.repo.FindByID(idOf(f.mixed.ID))
	if err != nil {
		t.Fatalf("FindByID: %v", err)
	}
	assertIDs(t, "ayahs of mixed", asbabAyahIDs(*got), wantIDs(f.liveAyah.ID, f.goneAyahTrAyah.ID))
	if got.Translation == nil || got.Ayahs[0].Surah == nil {
		t.Fatalf("live graph must be kept, got %+v", got)
	}
	if got.Ayahs[1].Translation != nil {
		t.Fatalf("deleted ayah translation leaked: %+v", got.Ayahs[1].Translation)
	}

	onlyGoneAyah, err := f.repo.FindByID(idOf(f.onlyGoneAyah.ID))
	if err != nil {
		t.Fatalf("FindByID: %v", err)
	}
	if len(onlyGoneAyah.Ayahs) != 0 {
		t.Fatalf("deleted ayah leaked: %+v", onlyGoneAyah.Ayahs)
	}

	inGoneSurah, err := f.repo.FindByID(idOf(f.inGoneSurah.ID))
	if err != nil {
		t.Fatalf("FindByID: %v", err)
	}
	if len(inGoneSurah.Ayahs) != 1 || inGoneSurah.Ayahs[0].Surah != nil {
		t.Fatalf("deleted surah leaked: %+v", inGoneSurah.Ayahs)
	}

	goneTr, err := f.repo.FindByID(idOf(f.goneTr.ID))
	if err != nil {
		t.Fatalf("FindByID: %v", err)
	}
	if goneTr.Translation != nil {
		t.Fatalf("deleted asbab translation leaked: %+v", goneTr.Translation)
	}
}

func TestSoftDeleteAsbabunNuzulFindAyahIDsByReferences(t *testing.T) {
	f := newAsbabFixture(t)

	ids, err := f.repo.FindAyahIDsByReferences([]model.AyahReference{
		{SurahNumber: 1, AyahNumber: 1},
		{SurahNumber: 1, AyahNumber: 3},
	})
	if err != nil {
		t.Fatalf("FindAyahIDsByReferences: %v", err)
	}
	assertIDs(t, "live references", ids, wantIDs(f.liveAyah.ID, f.goneAyahTrAyah.ID))

	cases := []struct {
		name string
		ref  model.AyahReference
	}{
		{name: "deleted ayah", ref: model.AyahReference{SurahNumber: 1, AyahNumber: 2}},
		{name: "ayah of deleted surah", ref: model.AyahReference{SurahNumber: 2, AyahNumber: 1}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := f.repo.FindAyahIDsByReferences([]model.AyahReference{tc.ref})
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				t.Fatalf("got %v, want ErrRecordNotFound", err)
			}
		})
	}
}
