package userdata

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func seedHafalanSurah(t *testing.T, db *gorm.DB, number int) (*model.Surah, *model.Translation) {
	t.Helper()
	translation := &model.Translation{Idn: testdb.Str("Surah"), Ar: testdb.Str("سورة")}
	create(t, db, translation)
	surah := &model.Surah{
		Number:        lib.Intptr(number),
		TranslationID: translation.ID,
	}
	create(t, db, surah)
	return surah, translation
}

func seedHafalan(t *testing.T, db *gorm.DB, userID uuid.UUID, surahID int, status model.HafalanStatus) *model.HafalanProgress {
	t.Helper()
	progress := &model.HafalanProgress{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   userID,
		SurahID:  surahID,
		Status:   status,
	}
	create(t, db, progress)
	return progress
}

func hafalanSurahIDs(list []model.HafalanProgress) []int {
	out := make([]int, 0, len(list))
	for _, progress := range list {
		out = append(out, progress.SurahID)
	}
	return out
}

type hafalanFixture struct {
	repo  repository.HafalanRepository
	alice uuid.UUID
	bob   uuid.UUID

	full              int
	goneSurah         int
	goneTranslation   int
	deletedMemorized  int
	deletedNotStarted int
	deletedInProgress int
	bobOnly           int
	bobNotStarted     int
}

func newHafalanFixture(t *testing.T) *hafalanFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Surah{}, &model.HafalanProgress{})
	f := &hafalanFixture{
		repo:  repository.NewHafalanRepository(db),
		alice: uuid.New(),
		bob:   uuid.New(),
	}

	full, _ := seedHafalanSurah(t, db, 1)
	goneSurah, _ := seedHafalanSurah(t, db, 2)
	goneTranslation, goneTranslationRow := seedHafalanSurah(t, db, 3)
	deletedMemorized, _ := seedHafalanSurah(t, db, 4)
	deletedNotStarted, _ := seedHafalanSurah(t, db, 5)
	deletedInProgress, _ := seedHafalanSurah(t, db, 6)
	bobOnly, _ := seedHafalanSurah(t, db, 7)
	bobNotStarted, _ := seedHafalanSurah(t, db, 8)

	testdb.Delete(t, db, goneSurah)
	testdb.Delete(t, db, goneTranslationRow)

	f.full = *full.ID
	f.goneSurah = *goneSurah.ID
	f.goneTranslation = *goneTranslation.ID
	f.deletedMemorized = *deletedMemorized.ID
	f.deletedNotStarted = *deletedNotStarted.ID
	f.deletedInProgress = *deletedInProgress.ID
	f.bobOnly = *bobOnly.ID
	f.bobNotStarted = *bobNotStarted.ID

	seedHafalan(t, db, f.alice, f.full, model.HafalanMemorized)
	seedHafalan(t, db, f.alice, f.goneSurah, model.HafalanInProgress)
	seedHafalan(t, db, f.alice, f.goneTranslation, model.HafalanMemorized)
	testdb.Delete(t, db, seedHafalan(t, db, f.alice, f.deletedMemorized, model.HafalanMemorized))
	testdb.Delete(t, db, seedHafalan(t, db, f.alice, f.deletedNotStarted, model.HafalanNotStarted))
	testdb.Delete(t, db, seedHafalan(t, db, f.alice, f.deletedInProgress, model.HafalanInProgress))

	seedHafalan(t, db, f.bob, f.full, model.HafalanMemorized)
	seedHafalan(t, db, f.bob, f.bobOnly, model.HafalanMemorized)
	seedHafalan(t, db, f.bob, f.bobNotStarted, model.HafalanNotStarted)
	return f
}

func TestSoftDeleteHafalanFindByUserID(t *testing.T) {
	f := newHafalanFixture(t)

	got, err := f.repo.FindByUserID(f.alice)
	if err != nil {
		t.Fatalf("FindByUserID: %v", err)
	}
	if !equalInts(hafalanSurahIDs(got), []int{f.full, f.goneSurah, f.goneTranslation}) {
		t.Fatalf("expected alice's live progress only, got surahs %v", hafalanSurahIDs(got))
	}

	bySurah := map[int]model.HafalanProgress{}
	for _, progress := range got {
		if progress.UserID != f.alice {
			t.Fatalf("progress of another user leaked: %#v", progress)
		}
		bySurah[progress.SurahID] = progress
	}

	full := bySurah[f.full]
	if full.Surah == nil || full.Surah.Translation == nil {
		t.Fatalf("live progress should carry live surah and translation: %#v", full)
	}

	orphanSurah := bySurah[f.goneSurah]
	if orphanSurah.Surah != nil {
		t.Fatalf("soft-deleted surah leaked through progress: %#v", orphanSurah.Surah)
	}

	orphanTranslation := bySurah[f.goneTranslation]
	if orphanTranslation.Surah == nil {
		t.Fatalf("live surah should stay attached when only its translation is deleted")
	}
	if orphanTranslation.Surah.Translation != nil {
		t.Fatalf("soft-deleted translation leaked through surah: %#v", orphanTranslation.Surah.Translation)
	}

	bobs, err := f.repo.FindByUserID(f.bob)
	if err != nil {
		t.Fatalf("FindByUserID bob: %v", err)
	}
	if !equalInts(hafalanSurahIDs(bobs), []int{f.full, f.bobOnly, f.bobNotStarted}) {
		t.Fatalf("expected bob's own progress, got surahs %v", hafalanSurahIDs(bobs))
	}
}

func TestSoftDeleteHafalanFindByUserIDAndSurahID(t *testing.T) {
	f := newHafalanFixture(t)

	full, err := f.repo.FindByUserIDAndSurahID(f.alice, f.full)
	if err != nil || full.Surah == nil || full.Surah.Translation == nil {
		t.Fatalf("live progress should be found with surah and translation, got %#v err=%v", full, err)
	}

	orphanSurah, err := f.repo.FindByUserIDAndSurahID(f.alice, f.goneSurah)
	if err != nil {
		t.Fatalf("live progress with soft-deleted surah must still be found: %v", err)
	}
	if orphanSurah.Surah != nil {
		t.Fatalf("soft-deleted surah leaked: %#v", orphanSurah.Surah)
	}

	orphanTranslation, err := f.repo.FindByUserIDAndSurahID(f.alice, f.goneTranslation)
	if err != nil {
		t.Fatalf("live progress with soft-deleted translation must still be found: %v", err)
	}
	if orphanTranslation.Surah == nil || orphanTranslation.Surah.Translation != nil {
		t.Fatalf("soft-deleted translation leaked: %#v", orphanTranslation.Surah)
	}

	for _, surahID := range []int{f.deletedMemorized, f.deletedNotStarted, f.deletedInProgress} {
		if _, err := f.repo.FindByUserIDAndSurahID(f.alice, surahID); !errors.Is(err, gorm.ErrRecordNotFound) {
			t.Fatalf("soft-deleted progress for surah %d must be not found, got err=%v", surahID, err)
		}
	}

	if _, err := f.repo.FindByUserIDAndSurahID(f.alice, f.bobOnly); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("another user's progress must be not found, got err=%v", err)
	}
}

func TestSoftDeleteHafalanFindMemorizedSurahIDs(t *testing.T) {
	f := newHafalanFixture(t)

	alices, err := f.repo.FindMemorizedSurahIDs(f.alice)
	if err != nil {
		t.Fatalf("FindMemorizedSurahIDs: %v", err)
	}
	if !equalInts(alices, []int{f.full, f.goneTranslation}) {
		t.Fatalf("expected alice's live memorized surahs only, got %v", alices)
	}

	bobs, err := f.repo.FindMemorizedSurahIDs(f.bob)
	if err != nil {
		t.Fatalf("FindMemorizedSurahIDs bob: %v", err)
	}
	if !equalInts(bobs, []int{f.full, f.bobOnly}) {
		t.Fatalf("expected bob's memorized surahs, got %v", bobs)
	}
}

func TestSoftDeleteHafalanSummary(t *testing.T) {
	f := newHafalanFixture(t)

	alices, err := f.repo.Summary(f.alice)
	if err != nil {
		t.Fatalf("Summary: %v", err)
	}
	if alices.Memorized != 2 || alices.InProgress != 1 || alices.NotStarted != 0 || alices.Total != 114 {
		t.Fatalf("summary must ignore deleted progress, got %#v", alices)
	}

	bobs, err := f.repo.Summary(f.bob)
	if err != nil {
		t.Fatalf("Summary bob: %v", err)
	}
	if bobs.Memorized != 2 || bobs.InProgress != 0 || bobs.NotStarted != 1 {
		t.Fatalf("summary must only count bob's progress, got %#v", bobs)
	}
}
