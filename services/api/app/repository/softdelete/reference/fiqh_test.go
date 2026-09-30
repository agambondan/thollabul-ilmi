package reference

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
)

type fiqhFixture struct {
	repo             repository.FiqhRepository
	catDeleted       *model.FiqhCategory
	catLive          *model.FiqhCategory
	catLiveDelTr     *model.FiqhCategory
	itemDeleted      *model.FiqhItem
	itemLive         *model.FiqhItem
	itemDelTr        *model.FiqhItem
	itemInDeletedCat *model.FiqhItem
}

func newFiqhFixture(t *testing.T) *fiqhFixture {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.FiqhCategory{}, &model.FiqhItem{})
	live := seedTranslation(t, db, "live")
	dead := seedDeletedTranslation(t, db, "dead")

	f := &fiqhFixture{repo: repository.NewFiqhRepository(db)}

	f.catDeleted = &model.FiqhCategory{Name: "Deleted", Slug: "cat-deleted", Description: "d", TranslationID: live.ID}
	mustCreate(t, db, f.catDeleted)
	f.catLive = &model.FiqhCategory{Name: "Live", Slug: "cat-live", Description: "l", TranslationID: live.ID}
	mustCreate(t, db, f.catLive)
	f.catLiveDelTr = &model.FiqhCategory{Name: "LiveDelTr", Slug: "cat-live-deltr", Description: "x", TranslationID: dead.ID}
	mustCreate(t, db, f.catLiveDelTr)

	newItem := func(cat *model.FiqhCategory, slug string, order int, tr *model.Translation) *model.FiqhItem {
		item := &model.FiqhItem{
			CategoryID:    cat.ID,
			Title:         slug,
			Slug:          slug,
			Content:       "content " + slug,
			Source:        "source",
			SortOrder:     order,
			TranslationID: tr.ID,
		}
		mustCreate(t, db, item)
		return item
	}
	f.itemDeleted = newItem(f.catLive, "item-deleted", 1, live)
	f.itemLive = newItem(f.catLive, "item-live", 2, live)
	f.itemDelTr = newItem(f.catLive, "item-deltr", 3, dead)
	f.itemInDeletedCat = newItem(f.catDeleted, "item-in-deleted-cat", 1, live)

	testdb.Delete(t, db, f.itemDeleted)
	testdb.Delete(t, db, f.catDeleted)
	return f
}

func fiqhCategorySlugs(list []model.FiqhCategory) []string {
	var out []string
	for _, c := range list {
		out = append(out, c.Slug)
	}
	return out
}

func fiqhItemSlugs(list []model.FiqhItem) []string {
	var out []string
	for _, i := range list {
		out = append(out, i.Slug)
	}
	return out
}

func TestSoftDeleteFiqhFindAllCategories(t *testing.T) {
	f := newFiqhFixture(t)

	list, err := f.repo.FindAllCategories(20, 0)
	if err != nil {
		t.Fatalf("FindAllCategories: %v", err)
	}
	requireStrings(t, "categories", fiqhCategorySlugs(list), []string{"cat-live", "cat-live-deltr"})
	requireTranslation(t, "cat-live translation", list[0].Translation, "live")
	requireNoTranslation(t, "cat-live-deltr translation", list[1].Translation)

	page, err := f.repo.FindAllCategories(1, 0)
	if err != nil {
		t.Fatalf("FindAllCategories page: %v", err)
	}
	requireStrings(t, "first page", fiqhCategorySlugs(page), []string{"cat-live"})
}

func TestSoftDeleteFiqhFindAllItems(t *testing.T) {
	f := newFiqhFixture(t)

	list, err := f.repo.FindAllItems(20, 0)
	if err != nil {
		t.Fatalf("FindAllItems: %v", err)
	}
	requireStrings(t, "items", fiqhItemSlugs(list), []string{"item-in-deleted-cat", "item-live", "item-deltr"})

	bySlug := map[string]model.FiqhItem{}
	for _, item := range list {
		bySlug[item.Slug] = item
	}

	live := bySlug["item-live"]
	requireTranslation(t, "item-live translation", live.Translation, "live")
	if live.Category == nil || live.Category.Slug != "cat-live" {
		t.Fatalf("item-live category: got %+v", live.Category)
	}

	delTr := bySlug["item-deltr"]
	requireNoTranslation(t, "item-deltr translation", delTr.Translation)
	if delTr.Category == nil {
		t.Fatalf("item-deltr must keep its live category")
	}

	orphan := bySlug["item-in-deleted-cat"]
	if orphan.Category != nil {
		t.Fatalf("soft-deleted category leaked into item: %+v", orphan.Category)
	}
	requireTranslation(t, "orphan translation", orphan.Translation, "live")

	page, err := f.repo.FindAllItems(1, 0)
	if err != nil {
		t.Fatalf("FindAllItems page: %v", err)
	}
	requireStrings(t, "first page", fiqhItemSlugs(page), []string{"item-in-deleted-cat"})
}

func TestSoftDeleteFiqhFindCategoryBySlug(t *testing.T) {
	f := newFiqhFixture(t)

	_, err := f.repo.FindCategoryBySlug("cat-deleted", 20, 0)
	requireNotFound(t, "deleted category", err)

	cat, err := f.repo.FindCategoryBySlug("cat-live", 20, 0)
	if err != nil {
		t.Fatalf("FindCategoryBySlug: %v", err)
	}
	requireTranslation(t, "category translation", cat.Translation, "live")
	requireStrings(t, "category items", fiqhItemSlugs(cat.Items), []string{"item-live", "item-deltr"})
	requireTranslation(t, "item-live translation", cat.Items[0].Translation, "live")
	requireNoTranslation(t, "item-deltr translation", cat.Items[1].Translation)

	first, err := f.repo.FindCategoryBySlug("cat-live", 1, 0)
	if err != nil {
		t.Fatalf("FindCategoryBySlug first page: %v", err)
	}
	requireStrings(t, "first page items", fiqhItemSlugs(first.Items), []string{"item-live"})

	second, err := f.repo.FindCategoryBySlug("cat-live", 1, 1)
	if err != nil {
		t.Fatalf("FindCategoryBySlug second page: %v", err)
	}
	requireStrings(t, "second page items", fiqhItemSlugs(second.Items), []string{"item-deltr"})

	delTr, err := f.repo.FindCategoryBySlug("cat-live-deltr", 20, 0)
	if err != nil {
		t.Fatalf("FindCategoryBySlug deltr: %v", err)
	}
	requireNoTranslation(t, "cat-live-deltr translation", delTr.Translation)
}

func TestSoftDeleteFiqhFindItemBySlug(t *testing.T) {
	f := newFiqhFixture(t)

	_, err := f.repo.FindItemBySlug("item-deleted")
	requireNotFound(t, "deleted item", err)

	live, err := f.repo.FindItemBySlug("item-live")
	if err != nil {
		t.Fatalf("FindItemBySlug live: %v", err)
	}
	requireTranslation(t, "item-live translation", live.Translation, "live")
	if live.Category == nil || live.Category.Slug != "cat-live" {
		t.Fatalf("item-live category: got %+v", live.Category)
	}

	delTr, err := f.repo.FindItemBySlug("item-deltr")
	if err != nil {
		t.Fatalf("FindItemBySlug deltr: %v", err)
	}
	requireNoTranslation(t, "item-deltr translation", delTr.Translation)

	orphan, err := f.repo.FindItemBySlug("item-in-deleted-cat")
	if err != nil {
		t.Fatalf("FindItemBySlug orphan: %v", err)
	}
	if orphan.Category != nil {
		t.Fatalf("soft-deleted category leaked into item: %+v", orphan.Category)
	}
}

func TestSoftDeleteFiqhFindItemByCategoryAndID(t *testing.T) {
	f := newFiqhFixture(t)

	_, err := f.repo.FindItemByCategoryAndID("cat-live", *f.itemDeleted.ID)
	requireNotFound(t, "deleted item", err)

	_, err = f.repo.FindItemByCategoryAndID("cat-deleted", *f.itemInDeletedCat.ID)
	requireNotFound(t, "item of deleted category", err)

	live, err := f.repo.FindItemByCategoryAndID("cat-live", *f.itemLive.ID)
	if err != nil {
		t.Fatalf("FindItemByCategoryAndID live: %v", err)
	}
	requireTranslation(t, "item-live translation", live.Translation, "live")

	delTr, err := f.repo.FindItemByCategoryAndID("cat-live", *f.itemDelTr.ID)
	if err != nil {
		t.Fatalf("FindItemByCategoryAndID deltr: %v", err)
	}
	requireNoTranslation(t, "item-deltr translation", delTr.Translation)
}
