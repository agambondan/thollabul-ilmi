package reference

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
)

type hijriFixture struct {
	repo    repository.IslamicEventRepository
	deleted *model.IslamicEvent
	live    *model.IslamicEvent
	delTr   *model.IslamicEvent
	puasa   *model.IslamicEvent
}

func newHijriFixture(t *testing.T) *hijriFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.IslamicEvent{})
	live := seedTranslation(t, db, "live")
	dead := seedDeletedTranslation(t, db, "dead")

	f := &hijriFixture{repo: repository.NewIslamicEventRepository(db)}

	newEvent := func(name string, month, day int, category model.IslamicEventCategory, tr *model.Translation) *model.IslamicEvent {
		event := &model.IslamicEvent{
			Name:          name,
			HijriMonth:    month,
			HijriDay:      day,
			Category:      category,
			TranslationID: tr.ID,
		}
		mustCreate(t, db, event)
		return event
	}
	f.deleted = newEvent("Awal Ramadan", 9, 1, model.EventCategoryPuasa, live)
	f.live = newEvent("Nuzulul Quran", 9, 17, model.EventCategoryPeristiwa, live)
	f.delTr = newEvent("Lailatul Qadr", 9, 27, model.EventCategoryPeristiwa, dead)
	f.puasa = newEvent("Puasa Arafah", 12, 9, model.EventCategoryPuasa, live)

	testdb.Delete(t, db, f.deleted)
	return f
}

func islamicEventNames(list []model.IslamicEvent) []string {
	var out []string
	for _, item := range list {
		out = append(out, item.Name)
	}
	return out
}

func TestSoftDeleteHijriFindAll(t *testing.T) {
	f := newHijriFixture(t)

	all, err := f.repo.FindAll("")
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	requireStrings(t, "all", islamicEventNames(all), []string{"Nuzulul Quran", "Lailatul Qadr", "Puasa Arafah"})
	requireTranslation(t, "Nuzulul Quran translation", all[0].Translation, "live")
	requireNoTranslation(t, "Lailatul Qadr translation", all[1].Translation)

	puasa, err := f.repo.FindAll("puasa")
	if err != nil {
		t.Fatalf("FindAll puasa: %v", err)
	}
	requireStrings(t, "puasa", islamicEventNames(puasa), []string{"Puasa Arafah"})
}

func TestSoftDeleteHijriFindByMonth(t *testing.T) {
	f := newHijriFixture(t)

	ramadan, err := f.repo.FindByMonth(9)
	if err != nil {
		t.Fatalf("FindByMonth: %v", err)
	}
	requireStrings(t, "ramadan", islamicEventNames(ramadan), []string{"Nuzulul Quran", "Lailatul Qadr"})
	requireTranslation(t, "Nuzulul Quran translation", ramadan[0].Translation, "live")
	requireNoTranslation(t, "Lailatul Qadr translation", ramadan[1].Translation)
}

func TestSoftDeleteHijriFindByID(t *testing.T) {
	f := newHijriFixture(t)

	_, err := f.repo.FindByID(*f.deleted.ID)
	requireNotFound(t, "deleted event", err)

	live, err := f.repo.FindByID(*f.live.ID)
	if err != nil {
		t.Fatalf("FindByID live: %v", err)
	}
	requireTranslation(t, "live translation", live.Translation, "live")

	delTr, err := f.repo.FindByID(*f.delTr.ID)
	if err != nil {
		t.Fatalf("FindByID deltr: %v", err)
	}
	requireNoTranslation(t, "deltr translation", delTr.Translation)
}
