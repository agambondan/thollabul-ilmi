package quran

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"gorm.io/gorm"
)

func newMunasabah(t *testing.T, db *gorm.DB, from, to *model.Ayah, description string) *model.Munasabah {
	t.Helper()
	m := &model.Munasabah{
		AyahFromID:  from.ID,
		AyahToID:    to.ID,
		Description: description,
	}
	mustCreate(t, db, m)
	return m
}

func TestSoftDeleteMunasabahFindByAyahID(t *testing.T) {
	db := testdb.Open(t, &model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.Munasabah{})
	repo := repository.NewMunasabahRepository(db)

	liveSurah, _ := newSurah(t, db, 1, "live surah")
	goneSurah, _ := newSurah(t, db, 2, "gone surah")
	goneSurahTrSurah, goneSurahTr := newSurah(t, db, 3, "gone surah translation")

	from, _ := newAyah(t, db, liveSurah, 1, 1, 1, "from")
	liveTo, _ := newAyah(t, db, liveSurah, 2, 1, 1, "live to")
	goneTrTo, goneTrToTr := newAyah(t, db, liveSurah, 3, 1, 1, "gone translation to")
	goneTo, _ := newAyah(t, db, liveSurah, 4, 1, 1, "gone to")
	goneSurahTo, _ := newAyah(t, db, goneSurah, 1, 2, 2, "gone surah to")
	goneSurahTrTo, _ := newAyah(t, db, goneSurahTrSurah, 1, 3, 3, "gone surah translation to")
	goneFrom, _ := newAyah(t, db, liveSurah, 5, 1, 1, "gone from")

	live := newMunasabah(t, db, from, liveTo, "live")
	withGoneTranslation := newMunasabah(t, db, from, goneTrTo, "ayah translation deleted")
	withGoneAyah := newMunasabah(t, db, from, goneTo, "ayah deleted")
	withGoneSurah := newMunasabah(t, db, from, goneSurahTo, "surah deleted")
	withGoneSurahTranslation := newMunasabah(t, db, from, goneSurahTrTo, "surah translation deleted")
	goneRow := newMunasabah(t, db, from, liveTo, "munasabah deleted")
	withGoneSource := newMunasabah(t, db, goneFrom, liveTo, "source ayah deleted")

	testdb.Delete(t, db, goneRow)
	testdb.Delete(t, db, goneTo)
	testdb.Delete(t, db, goneFrom)
	testdb.Delete(t, db, goneSurah)
	testdb.Delete(t, db, goneSurahTr)
	testdb.Delete(t, db, goneTrToTr)

	t.Run("deleted munasabah is hidden and deleted relations come back empty", func(t *testing.T) {
		items, err := repo.FindByAyahID(idOf(from.ID))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}

		got := make(map[int]model.Munasabah, len(items))
		var ids []int
		for _, item := range items {
			ids = append(ids, idOf(item.ID))
			got[idOf(item.ID)] = item
		}
		assertIDs(t, "munasabah for source ayah", ids, wantIDs(
			live.ID, withGoneTranslation.ID, withGoneAyah.ID, withGoneSurah.ID, withGoneSurahTranslation.ID,
		))

		if item := got[idOf(live.ID)]; ayahID(item.AyahTo) != idOf(liveTo.ID) ||
			surahID(item.AyahTo.Surah) != idOf(liveSurah.ID) ||
			translationID(item.AyahTo.Translation) == 0 ||
			translationID(item.AyahTo.Surah.Translation) == 0 ||
			ayahID(item.AyahFrom) != idOf(from.ID) {
			t.Fatalf("live munasabah must keep its full live graph, got %+v", item)
		}

		if item := got[idOf(withGoneTranslation.ID)]; ayahID(item.AyahTo) != idOf(goneTrTo.ID) || item.AyahTo.Translation != nil {
			t.Fatalf("ayah with deleted translation must be kept with empty translation, got %+v", item.AyahTo)
		}

		if item := got[idOf(withGoneAyah.ID)]; item.AyahTo != nil {
			t.Fatalf("deleted target ayah must not be returned, got %+v", item.AyahTo)
		}

		if item := got[idOf(withGoneSurah.ID)]; ayahID(item.AyahTo) != idOf(goneSurahTo.ID) || item.AyahTo.Surah != nil {
			t.Fatalf("deleted surah must not be returned on a live ayah, got %+v", item.AyahTo)
		}

		if item := got[idOf(withGoneSurahTranslation.ID)]; ayahID(item.AyahTo) != idOf(goneSurahTrTo.ID) ||
			item.AyahTo.Surah == nil || item.AyahTo.Surah.Translation != nil {
			t.Fatalf("surah with deleted translation must be kept with empty translation, got %+v", item.AyahTo)
		}
	})

	t.Run("deleted source ayah is not hydrated", func(t *testing.T) {
		items, err := repo.FindByAyahID(idOf(liveTo.ID))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}

		var ids []int
		for _, item := range items {
			ids = append(ids, idOf(item.ID))
			if idOf(item.ID) == idOf(withGoneSource.ID) && item.AyahFrom != nil {
				t.Fatalf("deleted source ayah must not be returned, got %+v", item.AyahFrom)
			}
		}
		assertIDs(t, "munasabah for target ayah", ids, wantIDs(live.ID, withGoneSource.ID))
	})

	t.Run("lookup by a deleted ayah returns no deleted rows", func(t *testing.T) {
		items, err := repo.FindByAyahID(idOf(goneTo.ID))
		if err != nil {
			t.Fatalf("FindByAyahID: %v", err)
		}
		for _, item := range items {
			if idOf(item.ID) == idOf(goneRow.ID) {
				t.Fatalf("deleted munasabah leaked: %+v", item)
			}
			if ayahID(item.AyahTo) == idOf(goneTo.ID) || ayahID(item.AyahFrom) == idOf(goneTo.ID) {
				t.Fatalf("deleted ayah leaked through munasabah %d", idOf(item.ID))
			}
		}
	})
}
