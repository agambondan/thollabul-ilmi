package quran

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"gorm.io/gorm"
)

func newHadithAyah(t *testing.T, db *gorm.DB, hadith *model.Hadith, ayah *model.Ayah, note string) *model.HadithAyah {
	t.Helper()
	row := &model.HadithAyah{HadithID: hadith.ID, AyahID: ayah.ID, Catatan: note}
	mustCreate(t, db, row)
	return row
}

func hadithID(h *model.Hadith) int {
	if h == nil {
		return 0
	}
	return idOf(h.ID)
}

type hadithAyahFixture struct {
	repo repository.HadithAyahRepository

	liveHadith, goneBookHadith, goneBookTrHadith, goneTrHadith, goneHadith, extraHadith *model.Hadith
	liveBook, goneBook, goneBookTrBook                                                  *model.Book
	liveAyah, goneAyah, goneSurahAyah, goneSurahTrAyah, goneAyahTrAyah                  *model.Ayah

	liveRow, goneAyahRow, goneSurahRow, goneSurahTrRow, goneAyahTrRow *model.HadithAyah
	goneBookRow, goneBookTrRow, goneTrRow, goneHadithRow              *model.HadithAyah
	deletedRow                                                        *model.HadithAyah
}

func newHadithAyahFixture(t *testing.T) *hadithAyahFixture {
	t.Helper()
	db := testdb.Open(t,
		&model.Translation{}, &model.Surah{}, &model.Ayah{},
		&model.Book{}, &model.Theme{}, &model.Chapter{}, &model.Hadith{}, &model.HadithAyah{},
	)
	f := &hadithAyahFixture{repo: repository.NewHadithAyahRepository(db)}

	liveSurah, _ := newSurah(t, db, 1, "live surah")
	goneSurah, _ := newSurah(t, db, 2, "gone surah")
	goneSurahTrSurah, goneSurahTr := newSurah(t, db, 3, "gone surah translation")

	f.liveAyah, _ = newAyah(t, db, liveSurah, 1, 1, 1, "live ayah")
	f.goneAyah, _ = newAyah(t, db, liveSurah, 2, 1, 1, "gone ayah")
	f.goneSurahAyah, _ = newAyah(t, db, goneSurah, 1, 2, 2, "gone surah ayah")
	f.goneSurahTrAyah, _ = newAyah(t, db, goneSurahTrSurah, 1, 3, 3, "gone surah translation ayah")
	var goneAyahTr *model.Translation
	f.goneAyahTrAyah, goneAyahTr = newAyah(t, db, liveSurah, 3, 1, 1, "gone ayah translation")
	extraAyah, _ := newAyah(t, db, liveSurah, 4, 1, 1, "extra ayah")

	var goneBookTr *model.Translation
	f.liveBook, _ = newBook(t, db, "bukhari")
	f.goneBook, _ = newBook(t, db, "gone")
	f.goneBookTrBook, goneBookTr = newBook(t, db, "muslim")

	var goneHadithTr *model.Translation
	f.liveHadith, _ = newHadith(t, db, f.liveBook, 1, "live hadith")
	f.goneBookHadith, _ = newHadith(t, db, f.goneBook, 2, "gone book hadith")
	f.goneBookTrHadith, _ = newHadith(t, db, f.goneBookTrBook, 3, "gone book translation hadith")
	f.goneTrHadith, goneHadithTr = newHadith(t, db, f.liveBook, 4, "gone translation hadith")
	f.goneHadith, _ = newHadith(t, db, f.liveBook, 5, "gone hadith")
	f.extraHadith, _ = newHadith(t, db, f.liveBook, 6, "extra hadith")

	f.liveRow = newHadithAyah(t, db, f.liveHadith, f.liveAyah, "live")
	f.goneBookRow = newHadithAyah(t, db, f.goneBookHadith, f.liveAyah, "gone book")
	f.goneBookTrRow = newHadithAyah(t, db, f.goneBookTrHadith, f.liveAyah, "gone book translation")
	f.goneTrRow = newHadithAyah(t, db, f.goneTrHadith, f.liveAyah, "gone translation")
	f.goneHadithRow = newHadithAyah(t, db, f.goneHadith, f.liveAyah, "gone hadith")
	f.deletedRow = newHadithAyah(t, db, f.extraHadith, f.liveAyah, "deleted row")
	f.goneAyahRow = newHadithAyah(t, db, f.liveHadith, f.goneAyah, "gone ayah")
	f.goneSurahRow = newHadithAyah(t, db, f.liveHadith, f.goneSurahAyah, "gone surah")
	f.goneSurahTrRow = newHadithAyah(t, db, f.liveHadith, f.goneSurahTrAyah, "gone surah translation")
	f.goneAyahTrRow = newHadithAyah(t, db, f.liveHadith, f.goneAyahTrAyah, "gone ayah translation")
	extraRow := newHadithAyah(t, db, f.liveHadith, extraAyah, "extra")
	testdb.Delete(t, db, extraRow)

	testdb.Delete(t, db, f.deletedRow)
	testdb.Delete(t, db, f.goneAyah)
	testdb.Delete(t, db, goneSurah)
	testdb.Delete(t, db, goneSurahTr)
	testdb.Delete(t, db, goneAyahTr)
	testdb.Delete(t, db, f.goneBook)
	testdb.Delete(t, db, goneBookTr)
	testdb.Delete(t, db, goneHadithTr)
	testdb.Delete(t, db, f.goneHadith)
	return f
}

func TestSoftDeleteHadithAyahFindByHadithID(t *testing.T) {
	f := newHadithAyahFixture(t)

	t.Run("deleted rows are hidden and deleted ayah relations come back empty", func(t *testing.T) {
		items, err := f.repo.FindByHadithID(hadithID(f.liveHadith))
		if err != nil {
			t.Fatalf("FindByHadithID: %v", err)
		}

		got := make(map[int]model.HadithAyah, len(items))
		var ids []int
		for _, item := range items {
			ids = append(ids, idOf(item.ID))
			got[idOf(item.ID)] = item
		}
		assertIDs(t, "rows of live hadith", ids, wantIDs(
			f.liveRow.ID, f.goneAyahRow.ID, f.goneSurahRow.ID, f.goneSurahTrRow.ID, f.goneAyahTrRow.ID,
		))

		if item := got[idOf(f.liveRow.ID)]; hadithID(item.Hadith) != hadithID(f.liveHadith) ||
			item.Hadith.Translation == nil || item.Hadith.Book == nil || item.Hadith.Book.Translation == nil ||
			ayahID(item.Ayah) != ayahID(f.liveAyah) || item.Ayah.Translation == nil ||
			item.Ayah.Surah == nil || item.Ayah.Surah.Translation == nil {
			t.Fatalf("live row must keep its full live graph, got %+v", item)
		}

		if item := got[idOf(f.goneAyahRow.ID)]; item.Ayah != nil {
			t.Fatalf("deleted ayah must not be returned, got %+v", item.Ayah)
		}

		if item := got[idOf(f.goneSurahRow.ID)]; ayahID(item.Ayah) != ayahID(f.goneSurahAyah) || item.Ayah.Surah != nil {
			t.Fatalf("deleted surah must not be returned on a live ayah, got %+v", item.Ayah)
		}

		if item := got[idOf(f.goneSurahTrRow.ID)]; ayahID(item.Ayah) != ayahID(f.goneSurahTrAyah) ||
			item.Ayah.Surah == nil || item.Ayah.Surah.Translation != nil {
			t.Fatalf("surah with deleted translation must be kept with empty translation, got %+v", item.Ayah)
		}

		if item := got[idOf(f.goneAyahTrRow.ID)]; ayahID(item.Ayah) != ayahID(f.goneAyahTrAyah) || item.Ayah.Translation != nil {
			t.Fatalf("ayah with deleted translation must be kept with empty translation, got %+v", item.Ayah)
		}
	})

	t.Run("deleted book is not hydrated", func(t *testing.T) {
		items, err := f.repo.FindByHadithID(hadithID(f.goneBookHadith))
		if err != nil {
			t.Fatalf("FindByHadithID: %v", err)
		}
		if len(items) != 1 || idOf(items[0].ID) != idOf(f.goneBookRow.ID) {
			t.Fatalf("expected the row of the hadith with a deleted book, got %+v", items)
		}
		if items[0].Hadith == nil {
			t.Fatalf("live hadith must be returned")
		}
		if items[0].Hadith.Book != nil {
			t.Fatalf("deleted book must not be returned, got %+v", items[0].Hadith.Book)
		}
	})

	t.Run("deleted book translation is not hydrated", func(t *testing.T) {
		items, err := f.repo.FindByHadithID(hadithID(f.goneBookTrHadith))
		if err != nil {
			t.Fatalf("FindByHadithID: %v", err)
		}
		if len(items) != 1 || items[0].Hadith == nil || items[0].Hadith.Book == nil {
			t.Fatalf("live hadith and book must be returned, got %+v", items)
		}
		if items[0].Hadith.Book.Translation != nil {
			t.Fatalf("deleted book translation must not be returned, got %+v", items[0].Hadith.Book.Translation)
		}
	})

	t.Run("deleted hadith translation is not hydrated", func(t *testing.T) {
		items, err := f.repo.FindByHadithID(hadithID(f.goneTrHadith))
		if err != nil {
			t.Fatalf("FindByHadithID: %v", err)
		}
		if len(items) != 1 || items[0].Hadith == nil {
			t.Fatalf("live hadith must be returned, got %+v", items)
		}
		if items[0].Hadith.Translation != nil {
			t.Fatalf("deleted hadith translation must not be returned, got %+v", items[0].Hadith.Translation)
		}
	})

	t.Run("deleted hadith is not hydrated", func(t *testing.T) {
		items, err := f.repo.FindByHadithID(hadithID(f.goneHadith))
		if err != nil {
			t.Fatalf("FindByHadithID: %v", err)
		}
		if len(items) != 1 || idOf(items[0].ID) != idOf(f.goneHadithRow.ID) {
			t.Fatalf("expected the live row of the deleted hadith, got %+v", items)
		}
		if items[0].Hadith != nil {
			t.Fatalf("deleted hadith must not be returned, got %+v", items[0].Hadith)
		}
	})

	t.Run("hadith whose only row is deleted lists nothing", func(t *testing.T) {
		items, err := f.repo.FindByHadithID(hadithID(f.extraHadith))
		if err != nil {
			t.Fatalf("FindByHadithID: %v", err)
		}
		if len(items) != 0 {
			t.Fatalf("deleted row leaked: %+v", items)
		}
	})
}

func TestSoftDeleteHadithAyahFindByAyahID(t *testing.T) {
	f := newHadithAyahFixture(t)

	items, err := f.repo.FindByAyahID(ayahID(f.liveAyah))
	if err != nil {
		t.Fatalf("FindByAyahID: %v", err)
	}

	got := make(map[int]model.HadithAyah, len(items))
	var ids []int
	for _, item := range items {
		ids = append(ids, idOf(item.ID))
		got[idOf(item.ID)] = item
	}
	assertIDs(t, "rows of live ayah", ids, wantIDs(
		f.liveRow.ID, f.goneBookRow.ID, f.goneBookTrRow.ID, f.goneTrRow.ID, f.goneHadithRow.ID,
	))

	if item := got[idOf(f.liveRow.ID)]; hadithID(item.Hadith) != hadithID(f.liveHadith) ||
		item.Hadith.Book == nil || item.Hadith.Book.Translation == nil || item.Hadith.Translation == nil {
		t.Fatalf("live row must keep its full live graph, got %+v", item)
	}
	if item := got[idOf(f.goneBookRow.ID)]; item.Hadith == nil || item.Hadith.Book != nil {
		t.Fatalf("deleted book must not be returned, got %+v", item.Hadith)
	}
	if item := got[idOf(f.goneBookTrRow.ID)]; item.Hadith == nil || item.Hadith.Book == nil || item.Hadith.Book.Translation != nil {
		t.Fatalf("book with deleted translation must be kept with empty translation, got %+v", item.Hadith)
	}
	if item := got[idOf(f.goneTrRow.ID)]; item.Hadith == nil || item.Hadith.Translation != nil {
		t.Fatalf("hadith with deleted translation must be kept with empty translation, got %+v", item.Hadith)
	}
	if item := got[idOf(f.goneHadithRow.ID)]; item.Hadith != nil {
		t.Fatalf("deleted hadith must not be returned, got %+v", item.Hadith)
	}

	t.Run("deleted ayah is not hydrated", func(t *testing.T) {
		deletedLookup, err := f.repo.FindByAyahID(ayahID(f.goneAyah))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		if len(deletedLookup) != 1 || idOf(deletedLookup[0].ID) != idOf(f.goneAyahRow.ID) {
			t.Fatalf("expected the live row of the deleted ayah, got %+v", deletedLookup)
		}
		if deletedLookup[0].Ayah != nil {
			t.Fatalf("deleted ayah must not be returned, got %+v", deletedLookup[0].Ayah)
		}
	})
}

func TestSoftDeleteHadithAyahFindAllAndFindByID(t *testing.T) {
	f := newHadithAyahFixture(t)

	items, err := f.repo.FindAll()
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	for _, item := range items {
		if idOf(item.ID) == idOf(f.deletedRow.ID) {
			t.Fatalf("deleted row leaked through FindAll")
		}
	}
	if len(items) != 9 {
		t.Fatalf("FindAll: got %d live rows, want 9", len(items))
	}

	if _, err := f.repo.FindByID(idOf(f.deletedRow.ID)); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindByID of a deleted row: got %v, want ErrRecordNotFound", err)
	}
	if got, err := f.repo.FindByID(idOf(f.liveRow.ID)); err != nil || idOf(got.ID) != idOf(f.liveRow.ID) {
		t.Fatalf("FindByID of a live row: got %+v, err %v", got, err)
	}
}
