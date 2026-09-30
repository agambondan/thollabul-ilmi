package collections

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

type juzFixture struct {
	db           *gorm.DB
	juzDeleted   *model.Juz
	juzLive      *model.Juz
	juzDeadParts *model.Juz
	ayahLive     *model.Ayah
	ayahDeleted  *model.Ayah
	ayahTrDead   *model.Ayah
}

func createSurah(t *testing.T, db *gorm.DB, number int, tr *model.Translation) *model.Surah {
	t.Helper()
	surah := &model.Surah{Number: testdb.Int(number), TranslationID: tr.ID}
	mustCreate(t, db, surah)
	return surah
}

func createAyah(t *testing.T, db *gorm.DB, surah *model.Surah, number int, tr *model.Translation, juzID *int) *model.Ayah {
	t.Helper()
	ayah := &model.Ayah{Number: testdb.Int(number), SurahID: surah.ID, TranslationID: tr.ID, JuzID: juzID}
	mustCreate(t, db, ayah)
	return ayah
}

func createJuz(t *testing.T, db *gorm.DB, number int, startSurah, endSurah *model.Surah, startAyah, endAyah *model.Ayah) *model.Juz {
	t.Helper()
	juz := &model.Juz{
		Number:       testdb.Int(number),
		StartSurahID: startSurah.ID,
		EndSurahID:   endSurah.ID,
		StartAyahID:  startAyah.ID,
		EndAyahID:    endAyah.ID,
	}
	mustCreate(t, db, juz)
	return juz
}

func newJuzFixture(t *testing.T) *juzFixture {
	t.Helper()
	db := openDB(t, &model.Translation{}, &model.Surah{}, &model.Ayah{}, &model.Juz{})
	f := &juzFixture{db: db}

	surahLive := createSurah(t, db, 1, newTranslation(t, db, "Al-Fatihah"))
	surahDeleted := createSurah(t, db, 2, newTranslation(t, db, "Al-Baqarah"))
	surahTr := newTranslation(t, db, "Ali Imran")
	surahTrDead := createSurah(t, db, 3, surahTr)

	ayahStart := createAyah(t, db, surahLive, 1, newTranslation(t, db, "Ayat awal"), nil)
	ayahGone := createAyah(t, db, surahLive, 2, newTranslation(t, db, "Ayat terhapus"), nil)
	ayahTr := newTranslation(t, db, "Terjemahan ayat terhapus")
	ayahTrDead := createAyah(t, db, surahLive, 3, ayahTr, nil)

	f.juzDeleted = createJuz(t, db, 10, surahLive, surahLive, ayahStart, ayahStart)
	f.juzLive = createJuz(t, db, 11, surahLive, surahLive, ayahStart, ayahStart)
	f.juzDeadParts = createJuz(t, db, 12, surahDeleted, surahTrDead, ayahGone, ayahTrDead)

	f.ayahLive = createAyah(t, db, surahLive, 4, newTranslation(t, db, "Ayat hidup"), f.juzLive.ID)
	f.ayahDeleted = createAyah(t, db, surahLive, 5, newTranslation(t, db, "Ayat juz terhapus"), f.juzLive.ID)
	ayahJuzTr := newTranslation(t, db, "Terjemahan ayat juz terhapus")
	f.ayahTrDead = createAyah(t, db, surahLive, 6, ayahJuzTr, f.juzLive.ID)

	testdb.Delete(t, db, f.juzDeleted)
	testdb.Delete(t, db, surahDeleted)
	testdb.Delete(t, db, surahTr)
	testdb.Delete(t, db, ayahGone)
	testdb.Delete(t, db, ayahTr)
	testdb.Delete(t, db, f.ayahDeleted)
	testdb.Delete(t, db, ayahJuzTr)
	return f
}

func (f *juzFixture) checkAssociations(t *testing.T, label string, live, deadParts *model.Juz) {
	t.Helper()
	if live == nil || deadParts == nil {
		t.Fatalf("%s: a live juz was not returned (live=%v deadParts=%v)", label, live, deadParts)
	}
	if live.StartSurah == nil || live.StartSurah.Translation == nil ||
		live.EndSurah == nil || live.EndSurah.Translation == nil ||
		live.StartAyah == nil || live.StartAyah.Translation == nil ||
		live.EndAyah == nil || live.EndAyah.Translation == nil {
		t.Fatalf("%s: fully live juz lost a live association: %+v", label, live)
	}
	if deadParts.StartSurah != nil {
		t.Fatalf("%s: soft-deleted start surah leaked: %+v", label, deadParts.StartSurah)
	}
	if deadParts.EndSurah == nil {
		t.Fatalf("%s: live end surah dropped because its translation is soft-deleted", label)
	}
	if deadParts.EndSurah.Translation != nil {
		t.Fatalf("%s: soft-deleted surah translation leaked: %+v", label, deadParts.EndSurah.Translation)
	}
	if deadParts.StartAyah != nil {
		t.Fatalf("%s: soft-deleted start ayah leaked: %+v", label, deadParts.StartAyah)
	}
	if deadParts.EndAyah == nil {
		t.Fatalf("%s: live end ayah dropped because its translation is soft-deleted", label)
	}
	if deadParts.EndAyah.Translation != nil {
		t.Fatalf("%s: soft-deleted ayah translation leaked: %+v", label, deadParts.EndAyah.Translation)
	}
}

func TestSoftDeleteJuzFindAll(t *testing.T) {
	f := newJuzFixture(t)
	repo := repository.NewJuzRepository(f.db, paginate.New())

	page := runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindAll(ctx), nil
	})
	juz := pageItems[*model.Juz](t, page.Items)
	byID := map[int]*model.Juz{}
	var ids []int
	for _, j := range juz {
		byID[*j.ID] = j
		ids = append(ids, *j.ID)
	}
	assertIDs(t, "juz list", ids, *f.juzLive.ID, *f.juzDeadParts.ID)
	if page.Total != 2 {
		t.Fatalf("FindAll total counts a soft-deleted juz: got %d, want 2", page.Total)
	}
	f.checkAssociations(t, "FindAll", byID[*f.juzLive.ID], byID[*f.juzDeadParts.ID])
}

func TestSoftDeleteJuzFindById(t *testing.T) {
	f := newJuzFixture(t)
	repo := repository.NewJuzRepository(f.db, paginate.New())

	if _, err := repo.FindById(f.juzDeleted.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted juz must not be found by id: err = %v", err)
	}

	live, err := repo.FindById(f.juzLive.ID)
	if err != nil {
		t.Fatalf("FindById live juz: %v", err)
	}
	deadParts, err := repo.FindById(f.juzDeadParts.ID)
	if err != nil {
		t.Fatalf("FindById juz with soft-deleted associations: %v", err)
	}
	f.checkAssociations(t, "FindById", live, deadParts)

	var ayahIDs []int
	for _, a := range live.Ayahs {
		ayahIDs = append(ayahIDs, *a.ID)
	}
	assertIDs(t, "ayahs of juz", ayahIDs, *f.ayahLive.ID, *f.ayahTrDead.ID)
	for _, a := range live.Ayahs {
		if *a.ID == *f.ayahTrDead.ID && a.Translation != nil {
			t.Fatalf("soft-deleted ayah translation leaked: %+v", a.Translation)
		}
		if *a.ID == *f.ayahLive.ID && a.Translation == nil {
			t.Fatal("live ayah lost its live translation")
		}
	}
}

func TestSoftDeleteJuzFindBySurahName(t *testing.T) {
	f := newJuzFixture(t)
	repo := repository.NewJuzRepository(f.db, paginate.New())

	got, err := repo.FindBySurahName(nil, testdb.Str("al-fatihah"))
	if err != nil {
		t.Fatalf("FindBySurahName: %v", err)
	}
	if *got.ID == *f.juzDeleted.ID {
		t.Fatal("FindBySurahName returned the soft-deleted juz")
	}
	if *got.ID != *f.juzLive.ID {
		t.Fatalf("FindBySurahName returned juz %d, want the first live juz %d", *got.ID, *f.juzLive.ID)
	}
	var ayahIDs []int
	for _, a := range got.Ayahs {
		ayahIDs = append(ayahIDs, *a.ID)
	}
	assertIDs(t, "ayahs of juz", ayahIDs, *f.ayahLive.ID, *f.ayahTrDead.ID)
}

func TestSoftDeleteJuzCount(t *testing.T) {
	f := newJuzFixture(t)
	repo := repository.NewJuzRepository(f.db, paginate.New())

	count, err := repo.Count()
	if err != nil {
		t.Fatalf("Count: %v", err)
	}
	if *count != 2 {
		t.Fatalf("Count includes a soft-deleted juz: got %d, want 2", *count)
	}
}
