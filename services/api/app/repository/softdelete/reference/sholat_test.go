package reference

import (
	"sort"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/google/uuid"
)

type sholatGuideFixture struct {
	repo    repository.SholatRepository
	deleted *model.SholatGuide
	live    *model.SholatGuide
	delTr   *model.SholatGuide
}

func newSholatGuideFixture(t *testing.T) *sholatGuideFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.SholatGuide{}, &model.SholatLog{})
	live := seedTranslation(t, db, "live")
	dead := seedDeletedTranslation(t, db, "dead")

	f := &sholatGuideFixture{repo: repository.NewSholatRepository(db)}

	newGuide := func(step int, tr *model.Translation) *model.SholatGuide {
		guide := &model.SholatGuide{
			Step:          step,
			Title:         "step",
			TranslationID: tr.ID,
		}
		mustCreate(t, db, guide)
		return guide
	}
	f.deleted = newGuide(1, live)
	f.live = newGuide(2, live)
	f.delTr = newGuide(3, dead)
	newGuide(4, live)

	testdb.Delete(t, db, f.deleted)
	return f
}

func sholatGuideSteps(list []model.SholatGuide) []int {
	var out []int
	for _, guide := range list {
		out = append(out, guide.Step)
	}
	return out
}

func TestSoftDeleteSholatFindAllGuides(t *testing.T) {
	f := newSholatGuideFixture(t)

	list, err := f.repo.FindAllGuides()
	if err != nil {
		t.Fatalf("FindAllGuides: %v", err)
	}
	requireInts(t, "steps", sholatGuideSteps(list), []int{2, 3, 4})
	requireTranslation(t, "step 2 translation", list[0].Translation, "live")
	requireNoTranslation(t, "step 3 translation", list[1].Translation)
}

func TestSoftDeleteSholatFindGuideByStep(t *testing.T) {
	f := newSholatGuideFixture(t)

	_, err := f.repo.FindGuideByStep(1)
	requireNotFound(t, "deleted step", err)

	live, err := f.repo.FindGuideByStep(2)
	if err != nil {
		t.Fatalf("FindGuideByStep live: %v", err)
	}
	requireTranslation(t, "live translation", live.Translation, "live")

	delTr, err := f.repo.FindGuideByStep(3)
	if err != nil {
		t.Fatalf("FindGuideByStep deltr: %v", err)
	}
	requireNoTranslation(t, "deltr translation", delTr.Translation)
}

func TestSoftDeleteSholatFindGuideByID(t *testing.T) {
	f := newSholatGuideFixture(t)

	_, err := f.repo.FindGuideByID(*f.deleted.ID)
	requireNotFound(t, "deleted guide", err)

	live, err := f.repo.FindGuideByID(*f.live.ID)
	if err != nil {
		t.Fatalf("FindGuideByID live: %v", err)
	}
	requireTranslation(t, "live translation", live.Translation, "live")

	delTr, err := f.repo.FindGuideByID(*f.delTr.ID)
	if err != nil {
		t.Fatalf("FindGuideByID deltr: %v", err)
	}
	requireNoTranslation(t, "deltr translation", delTr.Translation)
}

type sholatLogFixture struct {
	repo   repository.SholatRepository
	userID uuid.UUID
}

func newSholatLogFixture(t *testing.T) *sholatLogFixture {
	t.Helper()
	db := testdb.Open(t, &model.SholatLog{})
	f := &sholatLogFixture{repo: repository.NewSholatRepository(db), userID: uuid.New()}

	newLog := func(userID uuid.UUID, date string, prayer model.PrayerName) *model.SholatLog {
		log := &model.SholatLog{UserID: userID, Date: date, Prayer: prayer, Status: model.PrayerBerjamaah}
		mustCreate(t, db, log)
		return log
	}
	deletedToday := newLog(f.userID, "2026-09-10", model.PrayerDzuhur)
	newLog(f.userID, "2026-09-10", model.PrayerSubuh)
	newLog(f.userID, "2026-09-10", model.PrayerAshar)
	deletedEarlier := newLog(f.userID, "2026-09-09", model.PrayerMaghrib)
	newLog(f.userID, "2026-09-09", model.PrayerIsya)
	newLog(uuid.New(), "2026-09-10", model.PrayerSubuh)

	testdb.Delete(t, db, deletedToday)
	testdb.Delete(t, db, deletedEarlier)
	return f
}

func sholatLogKeys(list []model.SholatLog) []string {
	var out []string
	for _, log := range list {
		out = append(out, log.Date[:10]+"/"+string(log.Prayer))
	}
	return out
}

func TestSoftDeleteSholatFindByUserIDAndDate(t *testing.T) {
	f := newSholatLogFixture(t)

	list, err := f.repo.FindByUserIDAndDate(f.userID, "2026-09-10")
	if err != nil {
		t.Fatalf("FindByUserIDAndDate: %v", err)
	}
	keys := sholatLogKeys(list)
	sort.Strings(keys)
	requireStrings(t, "logs", keys, []string{"2026-09-10/ashar", "2026-09-10/subuh"})
}

func TestSoftDeleteSholatFindByUserIDDateRange(t *testing.T) {
	f := newSholatLogFixture(t)

	list, err := f.repo.FindByUserIDDateRange(f.userID, "2026-09-01", "2026-09-30")
	if err != nil {
		t.Fatalf("FindByUserIDDateRange: %v", err)
	}
	requireStrings(t, "logs", sholatLogKeys(list), []string{"2026-09-10/ashar", "2026-09-10/subuh", "2026-09-09/isya"})
}
