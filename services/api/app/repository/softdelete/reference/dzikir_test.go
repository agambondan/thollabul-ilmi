package reference

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
)

type dzikirFixture struct {
	repo          repository.DzikirRepository
	deleted       *model.Dzikir
	live          *model.Dzikir
	delTr         *model.Dzikir
	petangDeleted *model.Dzikir
	petangLive    *model.Dzikir
}

func newDzikirFixture(t *testing.T) *dzikirFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Dzikir{})
	live := seedTranslation(t, db, "live")
	dead := seedDeletedTranslation(t, db, "dead")

	f := &dzikirFixture{repo: repository.NewDzikirRepository(db)}

	newDzikir := func(category model.DzikirCategory, title, occasion string, tr *model.Translation) *model.Dzikir {
		item := &model.Dzikir{
			Category:        category,
			Occasion:        occasion,
			Title:           title,
			Arabic:          "arab",
			TranslationText: "terjemah",
			Count:           1,
			TranslationID:   tr.ID,
		}
		mustCreate(t, db, item)
		return item
	}
	f.deleted = newDzikir(model.DzikirPagi, "pagi-deleted", "subuh", live)
	f.petangDeleted = newDzikir(model.DzikirPetang, "petang-deleted", "maghrib", live)
	f.live = newDzikir(model.DzikirPagi, "pagi-live", "subuh", live)
	f.delTr = newDzikir(model.DzikirPagi, "pagi-deltr", "subuh", dead)
	f.petangLive = newDzikir(model.DzikirPetang, "petang-live", "maghrib", live)

	testdb.Delete(t, db, f.deleted)
	testdb.Delete(t, db, f.petangDeleted)
	return f
}

func dzikirTitles(list []model.Dzikir) []string {
	var out []string
	for _, item := range list {
		out = append(out, item.Title)
	}
	return out
}

func TestSoftDeleteDzikirFindAll(t *testing.T) {
	f := newDzikirFixture(t)

	list, err := f.repo.FindAll(20, 0)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	requireStrings(t, "titles", dzikirTitles(list), []string{"pagi-live", "pagi-deltr", "petang-live"})
	requireTranslation(t, "pagi-live translation", list[0].Translation, "live")
	requireNoTranslation(t, "pagi-deltr translation", list[1].Translation)

	page, err := f.repo.FindAll(1, 0)
	if err != nil {
		t.Fatalf("FindAll page: %v", err)
	}
	requireStrings(t, "first page", dzikirTitles(page), []string{"pagi-live"})
}

func TestSoftDeleteDzikirFindByID(t *testing.T) {
	f := newDzikirFixture(t)

	_, err := f.repo.FindByID(*f.deleted.ID)
	requireNotFound(t, "deleted dzikir", err)

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

func TestSoftDeleteDzikirFindByCategory(t *testing.T) {
	f := newDzikirFixture(t)

	pagi, err := f.repo.FindByCategory(model.DzikirPagi, 20, 0)
	if err != nil {
		t.Fatalf("FindByCategory pagi: %v", err)
	}
	requireStrings(t, "pagi", dzikirTitles(pagi), []string{"pagi-live", "pagi-deltr"})
	requireNoTranslation(t, "pagi-deltr translation", pagi[1].Translation)

	petang, err := f.repo.FindByCategory(model.DzikirPetang, 20, 0)
	if err != nil {
		t.Fatalf("FindByCategory petang: %v", err)
	}
	requireStrings(t, "petang", dzikirTitles(petang), []string{"petang-live"})

	page, err := f.repo.FindByCategory(model.DzikirPagi, 1, 0)
	if err != nil {
		t.Fatalf("FindByCategory page: %v", err)
	}
	requireStrings(t, "first page", dzikirTitles(page), []string{"pagi-live"})
}

func TestSoftDeleteDzikirFindByOccasion(t *testing.T) {
	f := newDzikirFixture(t)

	subuh, err := f.repo.FindByOccasion("subuh", 20, 0)
	if err != nil {
		t.Fatalf("FindByOccasion subuh: %v", err)
	}
	requireStrings(t, "subuh", dzikirTitles(subuh), []string{"pagi-live", "pagi-deltr"})
	requireNoTranslation(t, "pagi-deltr translation", subuh[1].Translation)

	maghrib, err := f.repo.FindByOccasion("maghrib", 20, 0)
	if err != nil {
		t.Fatalf("FindByOccasion maghrib: %v", err)
	}
	requireStrings(t, "maghrib", dzikirTitles(maghrib), []string{"petang-live"})
}
