package reference

import (
	"fmt"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
)

type manasikFixture struct {
	repo  repository.ManasikRepository
	delTr *model.ManasikStep
}

func newManasikFixture(t *testing.T) *manasikFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.ManasikStep{})
	live := seedTranslation(t, db, "live")
	dead := seedDeletedTranslation(t, db, "dead")

	f := &manasikFixture{repo: repository.NewManasikRepository(db)}

	newStep := func(kind model.ManasikType, order int, tr *model.Translation) *model.ManasikStep {
		step := &model.ManasikStep{
			Type:          kind,
			StepOrder:     order,
			Title:         fmt.Sprintf("%s-%d", kind, order),
			TranslationID: tr.ID,
		}
		mustCreate(t, db, step)
		return step
	}
	hajiDeleted := newStep(model.ManasikTypeHaji, 1, live)
	newStep(model.ManasikTypeHaji, 2, live)
	f.delTr = newStep(model.ManasikTypeHaji, 3, dead)
	newStep(model.ManasikTypeUmrah, 1, live)
	umrahDeleted := newStep(model.ManasikTypeUmrah, 2, live)

	testdb.Delete(t, db, hajiDeleted)
	testdb.Delete(t, db, umrahDeleted)
	return f
}

func manasikKeys(list []model.ManasikStep) []string {
	var out []string
	for _, step := range list {
		out = append(out, fmt.Sprintf("%s-%d", step.Type, step.StepOrder))
	}
	return out
}

func TestSoftDeleteManasikFindAll(t *testing.T) {
	f := newManasikFixture(t)

	list, err := f.repo.FindAll(20, 0)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	requireStrings(t, "steps", manasikKeys(list), []string{"haji-2", "haji-3", "umrah-1"})
	requireTranslation(t, "haji-2 translation", list[0].Translation, "live")
	requireNoTranslation(t, "haji-3 translation", list[1].Translation)

	page, err := f.repo.FindAll(1, 0)
	if err != nil {
		t.Fatalf("FindAll page: %v", err)
	}
	requireStrings(t, "first page", manasikKeys(page), []string{"haji-2"})
}

func TestSoftDeleteManasikFindByType(t *testing.T) {
	f := newManasikFixture(t)

	haji, err := f.repo.FindByType(model.ManasikTypeHaji, 20, 0)
	if err != nil {
		t.Fatalf("FindByType haji: %v", err)
	}
	requireStrings(t, "haji", manasikKeys(haji), []string{"haji-2", "haji-3"})
	requireNoTranslation(t, "haji-3 translation", haji[1].Translation)

	umrah, err := f.repo.FindByType(model.ManasikTypeUmrah, 20, 0)
	if err != nil {
		t.Fatalf("FindByType umrah: %v", err)
	}
	requireStrings(t, "umrah", manasikKeys(umrah), []string{"umrah-1"})

	page, err := f.repo.FindByType(model.ManasikTypeHaji, 1, 0)
	if err != nil {
		t.Fatalf("FindByType page: %v", err)
	}
	requireStrings(t, "first page", manasikKeys(page), []string{"haji-2"})
}

func TestSoftDeleteManasikFindByTypeAndStep(t *testing.T) {
	f := newManasikFixture(t)

	_, err := f.repo.FindByTypeAndStep(model.ManasikTypeHaji, 1)
	requireNotFound(t, "deleted haji step", err)

	_, err = f.repo.FindByTypeAndStep(model.ManasikTypeUmrah, 2)
	requireNotFound(t, "deleted umrah step", err)

	live, err := f.repo.FindByTypeAndStep(model.ManasikTypeHaji, 2)
	if err != nil {
		t.Fatalf("FindByTypeAndStep live: %v", err)
	}
	requireTranslation(t, "live translation", live.Translation, "live")

	delTr, err := f.repo.FindByTypeAndStep(model.ManasikTypeHaji, 3)
	if err != nil {
		t.Fatalf("FindByTypeAndStep deltr: %v", err)
	}
	requireNoTranslation(t, "deltr translation", delTr.Translation)
	if delTr.ID == nil || *delTr.ID != *f.delTr.ID {
		t.Fatalf("deltr step id: got %v, want %d", delTr.ID, *f.delTr.ID)
	}
}
