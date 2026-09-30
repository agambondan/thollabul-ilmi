package reference

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
)

type doaFixture struct {
	repo         repository.DoaRepository
	deleted      *model.Doa
	live         *model.Doa
	delTr        *model.Doa
	makanDeleted *model.Doa
	makanLive    *model.Doa
}

func newDoaFixture(t *testing.T) *doaFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.Doa{})
	live := seedTranslation(t, db, "live")
	dead := seedDeletedTranslation(t, db, "dead")

	f := &doaFixture{repo: repository.NewDoaRepository(db)}

	newDoa := func(category model.DoaCategory, title string, tr *model.Translation) *model.Doa {
		item := &model.Doa{
			Category:        category,
			Title:           title,
			Arabic:          "arab",
			TranslationText: "terjemah",
			TranslationID:   tr.ID,
		}
		mustCreate(t, db, item)
		return item
	}
	f.deleted = newDoa(model.DoaCategoryBangun, "bangun-deleted", live)
	f.makanDeleted = newDoa(model.DoaCategoryMakan, "makan-deleted", live)
	f.live = newDoa(model.DoaCategoryBangun, "bangun-live", live)
	f.delTr = newDoa(model.DoaCategoryBangun, "bangun-deltr", dead)
	f.makanLive = newDoa(model.DoaCategoryMakan, "makan-live", live)

	testdb.Delete(t, db, f.deleted)
	testdb.Delete(t, db, f.makanDeleted)
	return f
}

func doaTitles(list []model.Doa) []string {
	var out []string
	for _, item := range list {
		out = append(out, item.Title)
	}
	return out
}

func TestSoftDeleteDoaFindAll(t *testing.T) {
	f := newDoaFixture(t)

	list, err := f.repo.FindAll(20, 0)
	if err != nil {
		t.Fatalf("FindAll: %v", err)
	}
	requireStrings(t, "titles", doaTitles(list), []string{"bangun-live", "bangun-deltr", "makan-live"})
	requireTranslation(t, "bangun-live translation", list[0].Translation, "live")
	requireNoTranslation(t, "bangun-deltr translation", list[1].Translation)

	page, err := f.repo.FindAll(1, 0)
	if err != nil {
		t.Fatalf("FindAll page: %v", err)
	}
	requireStrings(t, "first page", doaTitles(page), []string{"bangun-live"})
}

func TestSoftDeleteDoaFindByID(t *testing.T) {
	f := newDoaFixture(t)

	_, err := f.repo.FindByID(*f.deleted.ID)
	requireNotFound(t, "deleted doa", err)

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

func TestSoftDeleteDoaFindByCategory(t *testing.T) {
	f := newDoaFixture(t)

	bangun, err := f.repo.FindByCategory(model.DoaCategoryBangun, 20, 0)
	if err != nil {
		t.Fatalf("FindByCategory bangun: %v", err)
	}
	requireStrings(t, "bangun", doaTitles(bangun), []string{"bangun-live", "bangun-deltr"})
	requireNoTranslation(t, "bangun-deltr translation", bangun[1].Translation)

	makan, err := f.repo.FindByCategory(model.DoaCategoryMakan, 20, 0)
	if err != nil {
		t.Fatalf("FindByCategory makan: %v", err)
	}
	requireStrings(t, "makan", doaTitles(makan), []string{"makan-live"})

	page, err := f.repo.FindByCategory(model.DoaCategoryBangun, 1, 0)
	if err != nil {
		t.Fatalf("FindByCategory page: %v", err)
	}
	requireStrings(t, "first page", doaTitles(page), []string{"bangun-live"})
}
