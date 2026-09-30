package reference

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
)

type dictionaryFixture struct {
	repo             repository.DictionaryRepository
	termDeleted      *model.IslamicTerm
	termLive         *model.IslamicTerm
	termDelTr        *model.IslamicTerm
	termOther        *model.IslamicTerm
	termOtherDeleted *model.IslamicTerm
}

func newDictionaryFixture(t *testing.T) *dictionaryFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.IslamicTerm{})
	live := seedTranslation(t, db, "live")
	dead := seedDeletedTranslation(t, db, "dead")

	f := &dictionaryFixture{repo: repository.NewDictionaryRepository(db)}

	newTerm := func(term string, category model.TermCategory, tr *model.Translation) *model.IslamicTerm {
		item := &model.IslamicTerm{
			Term:          term,
			Category:      category,
			Definition:    "definisi " + term,
			TranslationID: tr.ID,
		}
		mustCreate(t, db, item)
		return item
	}
	f.termDeleted = newTerm("Shalat Sunnah", model.TermCategoryFiqh, live)
	f.termOtherDeleted = newTerm("Tauhid Rububiyah", model.TermCategoryAqidah, live)
	f.termLive = newTerm("Shalat Wajib", model.TermCategoryFiqh, live)
	f.termDelTr = newTerm("Shalat Jenazah", model.TermCategoryFiqh, dead)
	f.termOther = newTerm("Tauhid", model.TermCategoryAqidah, live)

	testdb.Delete(t, db, f.termDeleted)
	testdb.Delete(t, db, f.termOtherDeleted)
	return f
}

func islamicTermNames(list []model.IslamicTerm) []string {
	var out []string
	for _, item := range list {
		out = append(out, item.Term)
	}
	return out
}

func TestSoftDeleteDictionaryFindAll(t *testing.T) {
	f := newDictionaryFixture(t)

	all, err := f.repo.FindAll("", "")
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	requireStrings(t, "all", islamicTermNames(all), []string{"Shalat Jenazah", "Shalat Wajib", "Tauhid"})
	requireNoTranslation(t, "Shalat Jenazah translation", all[0].Translation)
	requireTranslation(t, "Shalat Wajib translation", all[1].Translation, "live")

	fiqh, err := f.repo.FindAll("fiqh", "")
	if err != nil {
		t.Fatalf("FindAll fiqh: %v", err)
	}
	requireStrings(t, "fiqh", islamicTermNames(fiqh), []string{"Shalat Jenazah", "Shalat Wajib"})

	aqidah, err := f.repo.FindAll("aqidah", "")
	if err != nil {
		t.Fatalf("FindAll aqidah: %v", err)
	}
	requireStrings(t, "aqidah", islamicTermNames(aqidah), []string{"Tauhid"})

	searchDeleted, err := f.repo.FindAll("", "Sunnah")
	if err != nil {
		t.Fatalf("FindAll search deleted: %v", err)
	}
	requireStrings(t, "search deleted", islamicTermNames(searchDeleted), nil)

	searchByDefinition, err := f.repo.FindAll("", "definisi Tauhid Rub")
	if err != nil {
		t.Fatalf("FindAll search definition: %v", err)
	}
	requireStrings(t, "search definition", islamicTermNames(searchByDefinition), nil)

	searchLive, err := f.repo.FindAll("", "Shalat")
	if err != nil {
		t.Fatalf("FindAll search live: %v", err)
	}
	requireStrings(t, "search live", islamicTermNames(searchLive), []string{"Shalat Jenazah", "Shalat Wajib"})
}

func TestSoftDeleteDictionaryFindByTerm(t *testing.T) {
	f := newDictionaryFixture(t)

	_, err := f.repo.FindByTerm("Shalat Sunnah")
	requireNotFound(t, "deleted term", err)

	prefixed, err := f.repo.FindByTerm("Shalat%")
	if err != nil {
		t.Fatalf("FindByTerm prefix: %v", err)
	}
	if prefixed.Term != "Shalat Wajib" {
		t.Fatalf("prefix match must skip the soft-deleted twin, got %q", prefixed.Term)
	}
	requireTranslation(t, "Shalat Wajib translation", prefixed.Translation, "live")

	delTr, err := f.repo.FindByTerm("Shalat Jenazah")
	if err != nil {
		t.Fatalf("FindByTerm deltr: %v", err)
	}
	requireNoTranslation(t, "Shalat Jenazah translation", delTr.Translation)
}

func TestSoftDeleteDictionaryFindByCategory(t *testing.T) {
	f := newDictionaryFixture(t)

	fiqh, err := f.repo.FindByCategory(model.TermCategoryFiqh)
	if err != nil {
		t.Fatalf("FindByCategory fiqh: %v", err)
	}
	requireStrings(t, "fiqh", islamicTermNames(fiqh), []string{"Shalat Jenazah", "Shalat Wajib"})
	requireNoTranslation(t, "Shalat Jenazah translation", fiqh[0].Translation)
	requireTranslation(t, "Shalat Wajib translation", fiqh[1].Translation, "live")

	aqidah, err := f.repo.FindByCategory(model.TermCategoryAqidah)
	if err != nil {
		t.Fatalf("FindByCategory aqidah: %v", err)
	}
	requireStrings(t, "aqidah", islamicTermNames(aqidah), []string{"Tauhid"})
}

func TestSoftDeleteDictionaryFindByID(t *testing.T) {
	f := newDictionaryFixture(t)

	_, err := f.repo.FindByID(*f.termDeleted.ID)
	requireNotFound(t, "deleted term", err)

	live, err := f.repo.FindByID(*f.termLive.ID)
	if err != nil {
		t.Fatalf("FindByID live: %v", err)
	}
	requireTranslation(t, "live translation", live.Translation, "live")

	delTr, err := f.repo.FindByID(*f.termDelTr.ID)
	if err != nil {
		t.Fatalf("FindByID deltr: %v", err)
	}
	requireNoTranslation(t, "deltr translation", delTr.Translation)
}
