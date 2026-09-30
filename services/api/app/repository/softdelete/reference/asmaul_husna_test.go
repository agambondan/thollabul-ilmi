package reference

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
)

type asmaFixture struct {
	repo    repository.AsmaUlHusnaRepository
	deleted *model.AsmaUlHusna
	live    *model.AsmaUlHusna
	delTr   *model.AsmaUlHusna
}

func newAsmaFixture(t *testing.T) *asmaFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.AsmaUlHusna{})
	live := seedTranslation(t, db, "live")
	dead := seedDeletedTranslation(t, db, "dead")

	f := &asmaFixture{repo: repository.NewAsmaUlHusnaRepository(db)}

	newName := func(number int, tr *model.Translation) *model.AsmaUlHusna {
		item := &model.AsmaUlHusna{
			Number:          number,
			Arabic:          "arab",
			Transliteration: "translit",
			Indonesian:      "indonesia",
			English:         "english",
			TranslationID:   tr.ID,
		}
		mustCreate(t, db, item)
		return item
	}
	f.deleted = newName(1, live)
	f.live = newName(2, live)
	f.delTr = newName(3, dead)
	newName(4, live)

	testdb.Delete(t, db, f.deleted)
	return f
}

func asmaNumbers(list []model.AsmaUlHusna) []int {
	var out []int
	for _, item := range list {
		out = append(out, item.Number)
	}
	return out
}

func requireInts(t *testing.T, label string, got, want []int) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("%s: got %v, want %v", label, got, want)
	}
	for i := range got {
		if got[i] != want[i] {
			t.Fatalf("%s: got %v, want %v", label, got, want)
		}
	}
}

func TestSoftDeleteAsmaUlHusnaFindAll(t *testing.T) {
	f := newAsmaFixture(t)

	list, err := f.repo.FindAll(0, 0)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	requireInts(t, "numbers", asmaNumbers(list), []int{2, 3, 4})
	requireTranslation(t, "number 2 translation", list[0].Translation, "live")
	requireNoTranslation(t, "number 3 translation", list[1].Translation)

	page, err := f.repo.FindAll(1, 0)
	if err != nil {
		t.Fatalf("FindAll page: %v", err)
	}
	requireInts(t, "first page", asmaNumbers(page), []int{2})

	next, err := f.repo.FindAll(1, 1)
	if err != nil {
		t.Fatalf("FindAll next page: %v", err)
	}
	requireInts(t, "second page", asmaNumbers(next), []int{3})
}

func TestSoftDeleteAsmaUlHusnaFindByNumber(t *testing.T) {
	f := newAsmaFixture(t)

	_, err := f.repo.FindByNumber(1)
	requireNotFound(t, "deleted number", err)

	live, err := f.repo.FindByNumber(2)
	if err != nil {
		t.Fatalf("FindByNumber live: %v", err)
	}
	requireTranslation(t, "live translation", live.Translation, "live")

	delTr, err := f.repo.FindByNumber(3)
	if err != nil {
		t.Fatalf("FindByNumber deltr: %v", err)
	}
	requireNoTranslation(t, "deltr translation", delTr.Translation)
}

func TestSoftDeleteAsmaUlHusnaFindByID(t *testing.T) {
	f := newAsmaFixture(t)

	_, err := f.repo.FindByID(*f.deleted.ID)
	requireNotFound(t, "deleted id", err)

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
