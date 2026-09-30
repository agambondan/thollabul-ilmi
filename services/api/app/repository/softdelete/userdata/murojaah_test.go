package userdata

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func seedMurojaahSession(t *testing.T, db *gorm.DB, userID uuid.UUID, date string, surahID int, score int, duration int) *model.MurojaahSession {
	t.Helper()
	session := &model.MurojaahSession{
		UserID:   userID,
		Date:     date,
		SurahID:  surahID,
		FromAyah: 1,
		ToAyah:   5,
		Score:    score,
		Duration: duration,
	}
	create(t, db, session)
	return session
}

func murojaahSessionIDs(sessions []model.MurojaahSession) []int {
	out := make([]int, 0, len(sessions))
	for _, session := range sessions {
		out = append(out, *session.ID)
	}
	return out
}

func TestSoftDeleteMurojaahFindByUserID(t *testing.T) {
	db := testdb.Open(t, &model.MurojaahSession{})
	repo := repository.NewMurojaahRepository(db)
	alice := uuid.New()
	bob := uuid.New()

	first := seedMurojaahSession(t, db, alice, "2026-09-01", 1, 70, 60)
	second := seedMurojaahSession(t, db, alice, "2026-09-02", 2, 80, 90)
	deleted := seedMurojaahSession(t, db, alice, "2026-09-09", 3, 100, 600)
	testdb.Delete(t, db, deleted)
	seedMurojaahSession(t, db, bob, "2026-09-03", 4, 90, 30)

	got, err := repo.FindByUserID(alice, 0)
	if err != nil {
		t.Fatalf("FindByUserID: %v", err)
	}
	if !equalInts(murojaahSessionIDs(got), []int{*first.ID, *second.ID}) {
		t.Fatalf("expected alice's live sessions only, got %v", murojaahSessionIDs(got))
	}

	limited, err := repo.FindByUserID(alice, 1)
	if err != nil {
		t.Fatalf("FindByUserID limited: %v", err)
	}
	if len(limited) != 1 || *limited[0].ID != *second.ID {
		t.Fatalf("limit must be applied to live rows only, got %v", murojaahSessionIDs(limited))
	}
}

func TestSoftDeleteMurojaahStats(t *testing.T) {
	db := testdb.Open(t, &model.MurojaahSession{})
	repo := repository.NewMurojaahRepository(db)
	alice := uuid.New()
	bob := uuid.New()
	onlyDeleted := uuid.New()

	seedMurojaahSession(t, db, alice, "2026-09-01", 1, 80, 60)
	seedMurojaahSession(t, db, alice, "2026-09-02", 2, 60, 30)
	deleted := seedMurojaahSession(t, db, alice, "2026-09-03", 3, 100, 1000)
	testdb.Delete(t, db, deleted)
	seedMurojaahSession(t, db, bob, "2026-09-04", 4, 10, 500)
	ghost := seedMurojaahSession(t, db, onlyDeleted, "2026-09-05", 5, 90, 90)
	testdb.Delete(t, db, ghost)

	stats, err := repo.Stats(alice)
	if err != nil {
		t.Fatalf("Stats: %v", err)
	}
	if stats.TotalSessions != 2 || stats.AvgScore != 70 || stats.TotalDuration != 90 || stats.SurahCovered != 2 {
		t.Fatalf("stats must ignore deleted and foreign sessions, got %#v", stats)
	}

	empty, err := repo.Stats(onlyDeleted)
	if err != nil {
		t.Fatalf("Stats only deleted: %v", err)
	}
	if empty.TotalSessions != 0 || empty.AvgScore != 0 || empty.TotalDuration != 0 || empty.SurahCovered != 0 {
		t.Fatalf("a user with only deleted sessions must have empty stats, got %#v", empty)
	}
}

func seedMurojaahSurah(t *testing.T, db *gorm.DB, number int) *model.Surah {
	t.Helper()
	translation := &model.Translation{Idn: testdb.Str("surah"), Ar: testdb.Str("سورة")}
	create(t, db, translation)
	surah := &model.Surah{
		Number:        lib.Intptr(number),
		TranslationID: translation.ID,
	}
	create(t, db, surah)
	return surah
}

func seedMurojaahAyah(t *testing.T, db *gorm.DB, surah *model.Surah, number int) (*model.Ayah, *model.Translation) {
	t.Helper()
	translation := &model.Translation{Idn: testdb.Str("ayah"), Ar: testdb.Str("آية")}
	create(t, db, translation)
	ayah := &model.Ayah{
		Number:        lib.Intptr(number),
		SurahID:       surah.ID,
		TranslationID: translation.ID,
	}
	create(t, db, ayah)
	return ayah, translation
}

func TestSoftDeleteMurojaahFindRandomAyahFromSurah(t *testing.T) {
	db := testdb.Open(t, &model.Translation{}, &model.Surah{}, &model.Ayah{})
	repo := repository.NewMurojaahRepository(db)

	liveSurah := seedMurojaahSurah(t, db, 1)
	goneSurah := seedMurojaahSurah(t, db, 2)
	testdb.Delete(t, db, goneSurah)

	liveAyah, _ := seedMurojaahAyah(t, db, liveSurah, 1)
	deletedAyah, _ := seedMurojaahAyah(t, db, liveSurah, 2)
	testdb.Delete(t, db, deletedAyah)
	ayahInGoneSurah, _ := seedMurojaahAyah(t, db, goneSurah, 1)
	ayahGoneTranslation, goneTranslation := seedMurojaahAyah(t, db, liveSurah, 3)
	testdb.Delete(t, db, goneTranslation)

	got, err := repo.FindRandomAyahFromSurah([]int{1, 2}, 50)
	if err != nil {
		t.Fatalf("FindRandomAyahFromSurah: %v", err)
	}

	byID := map[int]model.Ayah{}
	for _, ayah := range got {
		byID[*ayah.ID] = ayah
	}
	if _, leaked := byID[*deletedAyah.ID]; leaked {
		t.Fatalf("soft-deleted ayah leaked: %#v", got)
	}
	if _, leaked := byID[*ayahInGoneSurah.ID]; leaked {
		t.Fatalf("ayah of a soft-deleted surah leaked: %#v", got)
	}
	if len(got) != 2 {
		t.Fatalf("expected 2 live ayahs, got %d", len(got))
	}

	withTranslation, ok := byID[*liveAyah.ID]
	if !ok || withTranslation.Translation == nil {
		t.Fatalf("live ayah should carry its live translation: %#v", withTranslation)
	}

	withoutTranslation, ok := byID[*ayahGoneTranslation.ID]
	if !ok {
		t.Fatalf("live ayah with a soft-deleted translation must still be returned")
	}
	if withoutTranslation.Translation != nil {
		t.Fatalf("soft-deleted translation leaked: %#v", withoutTranslation.Translation)
	}
}
