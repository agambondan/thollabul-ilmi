package rijal

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

func seedSiroh(t *testing.T) *gorm.DB {
	t.Helper()
	db := testdb.Open(t, &model.Translation{}, &model.SirohCategory{}, &model.SirohContent{})

	mustCreate(t, db, &model.Translation{BaseID: baseID(1), Idn: testdb.Str("siroh-tr-live")})
	mustCreate(t, db, &model.Translation{BaseID: baseID(2), Idn: testdb.Str("siroh-tr-dead")})
	testdb.Delete(t, db, &model.Translation{BaseID: baseID(2)})

	category := func(id int, slug string, order, translationID int) {
		mustCreate(t, db, &model.SirohCategory{
			BaseID:        baseID(id),
			Title:         slug,
			Slug:          slug,
			Order:         order,
			TranslationID: testdb.Int(translationID),
		})
	}
	category(1, "cat-live", 1, 1)
	category(2, "cat-translation-dead", 2, 2)
	category(3, "cat-deleted", 3, 1)
	testdb.Delete(t, db, &model.SirohCategory{BaseID: baseID(3)})

	content := func(id, categoryID int, slug string, order, translationID int) {
		mustCreate(t, db, &model.SirohContent{
			BaseID:        baseID(id),
			CategoryID:    testdb.Int(categoryID),
			Title:         slug,
			Slug:          slug,
			Content:       "body of " + slug,
			Order:         order,
			TranslationID: testdb.Int(translationID),
		})
	}
	content(1, 1, "c-live", 1, 1)
	content(2, 1, "c-deleted", 2, 1)
	content(3, 1, "c-translation-dead", 3, 2)
	content(4, 2, "c-in-cat-translation-dead", 1, 1)
	content(5, 3, "c-in-deleted-cat", 1, 1)
	testdb.Delete(t, db, &model.SirohContent{BaseID: baseID(2)})
	return db
}

func sirohCategoryIDs(list []model.SirohCategory) []int {
	ids := make([]int, 0, len(list))
	for _, row := range list {
		ids = append(ids, *row.ID)
	}
	return ids
}

func sirohContentIDs(list []model.SirohContent) []int {
	ids := make([]int, 0, len(list))
	for _, row := range list {
		ids = append(ids, *row.ID)
	}
	return ids
}

func findSirohContent(list []model.SirohContent, id int) *model.SirohContent {
	for i := range list {
		if *list[i].ID == id {
			return &list[i]
		}
	}
	return nil
}

func TestSoftDeleteSirohFindAllCategories(t *testing.T) {
	repo := repository.NewSirohRepository(seedSiroh(t), paginate.New())

	list, err := repo.FindAllCategories()
	if err != nil {
		t.Fatalf("FindAllCategories: %v", err)
	}
	assertIDs(t, "FindAllCategories", sirohCategoryIDs(list), 1, 2)
	for _, cat := range list {
		switch *cat.ID {
		case 1:
			if cat.Translation == nil || str(cat.Translation.Idn) != "siroh-tr-live" {
				t.Fatalf("live category lost its live translation: %+v", cat.Translation)
			}
		case 2:
			if cat.Translation != nil {
				t.Fatalf("soft-deleted category translation leaked: %+v", cat.Translation)
			}
		}
	}
}

func TestSoftDeleteSirohFindCategoryBySlug(t *testing.T) {
	repo := repository.NewSirohRepository(seedSiroh(t), paginate.New())

	if _, err := repo.FindCategoryBySlug("cat-deleted"); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindCategoryBySlug(soft-deleted): want ErrRecordNotFound, got %v", err)
	}

	live, err := repo.FindCategoryBySlug("cat-live")
	if err != nil {
		t.Fatalf("FindCategoryBySlug(live): %v", err)
	}
	if live.Translation == nil || str(live.Translation.Idn) != "siroh-tr-live" {
		t.Fatalf("live category lost its live translation: %+v", live.Translation)
	}
	assertIDs(t, "FindCategoryBySlug(cat-live) contents", sirohContentIDs(live.Contents), 1, 3)
	if first := findSirohContent(live.Contents, 1); first.Translation == nil || str(first.Translation.Idn) != "siroh-tr-live" {
		t.Fatalf("live content lost its live translation: %+v", first.Translation)
	}
	if deadTr := findSirohContent(live.Contents, 3); deadTr.Translation != nil {
		t.Fatalf("soft-deleted content translation leaked: %+v", deadTr.Translation)
	}

	translationDead, err := repo.FindCategoryBySlug("cat-translation-dead")
	if err != nil {
		t.Fatalf("FindCategoryBySlug(live, translation soft-deleted) must be found: %v", err)
	}
	if translationDead.Translation != nil {
		t.Fatalf("soft-deleted category translation leaked: %+v", translationDead.Translation)
	}
	assertIDs(t, "FindCategoryBySlug(cat-translation-dead) contents", sirohContentIDs(translationDead.Contents), 4)
}

func TestSoftDeleteSirohFindContentBySlug(t *testing.T) {
	repo := repository.NewSirohRepository(seedSiroh(t), paginate.New())

	if _, err := repo.FindContentBySlug("c-deleted"); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindContentBySlug(soft-deleted): want ErrRecordNotFound, got %v", err)
	}

	live, err := repo.FindContentBySlug("c-live")
	if err != nil {
		t.Fatalf("FindContentBySlug(live): %v", err)
	}
	if live.Translation == nil || str(live.Translation.Idn) != "siroh-tr-live" {
		t.Fatalf("live content lost its live translation: %+v", live.Translation)
	}
	if live.Category == nil || *live.Category.ID != 1 {
		t.Fatalf("live content lost its live category: %+v", live.Category)
	}
	if live.Category.Translation == nil || str(live.Category.Translation.Idn) != "siroh-tr-live" {
		t.Fatalf("live category lost its live translation: %+v", live.Category.Translation)
	}

	translationDead, err := repo.FindContentBySlug("c-translation-dead")
	if err != nil {
		t.Fatalf("FindContentBySlug(live, translation soft-deleted) must be found: %v", err)
	}
	if translationDead.Translation != nil {
		t.Fatalf("soft-deleted content translation leaked: %+v", translationDead.Translation)
	}

	categoryTranslationDead, err := repo.FindContentBySlug("c-in-cat-translation-dead")
	if err != nil {
		t.Fatalf("FindContentBySlug(live, category translation soft-deleted) must be found: %v", err)
	}
	if categoryTranslationDead.Category == nil || *categoryTranslationDead.Category.ID != 2 {
		t.Fatalf("live category 2 must be kept: %+v", categoryTranslationDead.Category)
	}
	if categoryTranslationDead.Category.Translation != nil {
		t.Fatalf("soft-deleted category translation leaked: %+v", categoryTranslationDead.Category.Translation)
	}

	categoryDead, err := repo.FindContentBySlug("c-in-deleted-cat")
	if err != nil {
		t.Fatalf("FindContentBySlug(live, category soft-deleted) must be found: %v", err)
	}
	if categoryDead.Category != nil {
		t.Fatalf("soft-deleted category leaked: %+v", categoryDead.Category)
	}
}

func TestSoftDeleteSirohFindContentsByCategoryID(t *testing.T) {
	repo := repository.NewSirohRepository(seedSiroh(t), paginate.New())

	list, err := repo.FindContentsByCategoryID(1)
	if err != nil {
		t.Fatalf("FindContentsByCategoryID: %v", err)
	}
	assertIDs(t, "FindContentsByCategoryID(1)", sirohContentIDs(list), 1, 3)
	if first := findSirohContent(list, 1); first.Translation == nil || str(first.Translation.Idn) != "siroh-tr-live" {
		t.Fatalf("live content lost its live translation: %+v", first.Translation)
	}
	if deadTr := findSirohContent(list, 3); deadTr.Translation != nil {
		t.Fatalf("soft-deleted content translation leaked: %+v", deadTr.Translation)
	}
}

func TestSoftDeleteSirohFindAllContents(t *testing.T) {
	db := seedSiroh(t)
	qualifyOrderByForSQLite(t, db, `"order"`, `siroh_content."order"`)
	repo := repository.NewSirohRepository(db, paginate.New())

	page := repo.FindAllContents(newFiberCtx(t, "/?size=50"))
	if page == nil || page.RawError != nil {
		t.Fatalf("FindAllContents: %+v", page)
	}
	items, ok := page.Items.(*[]model.SirohContent)
	if !ok {
		t.Fatalf("FindAllContents: unexpected items type %T", page.Items)
	}
	assertIDs(t, "FindAllContents", sirohContentIDs(*items), 1, 3, 4, 5)
	if page.Total != 4 {
		t.Fatalf("FindAllContents: total counts soft-deleted rows, got %d want 4", page.Total)
	}

	live := findSirohContent(*items, 1)
	if live.Translation == nil || str(live.Translation.Idn) != "siroh-tr-live" {
		t.Fatalf("FindAllContents: live content lost its live translation: %+v", live.Translation)
	}
	if live.Category == nil || *live.Category.ID != 1 {
		t.Fatalf("FindAllContents: live content lost its live category: %+v", live.Category)
	}
	if live.Category.Translation == nil || str(live.Category.Translation.Idn) != "siroh-tr-live" {
		t.Fatalf("FindAllContents: live category lost its live translation: %+v", live.Category.Translation)
	}
	if translationDead := findSirohContent(*items, 3); translationDead.Translation != nil {
		t.Fatalf("FindAllContents: soft-deleted content translation leaked: %+v", translationDead.Translation)
	}
	categoryTranslationDead := findSirohContent(*items, 4)
	if categoryTranslationDead.Category == nil || *categoryTranslationDead.Category.ID != 2 {
		t.Fatalf("FindAllContents: live category 2 must be kept: %+v", categoryTranslationDead.Category)
	}
	if categoryTranslationDead.Category.Translation != nil {
		t.Fatalf("FindAllContents: soft-deleted category translation leaked: %+v", categoryTranslationDead.Category.Translation)
	}
	if categoryDead := findSirohContent(*items, 5); categoryDead.Category != nil {
		t.Fatalf("FindAllContents: soft-deleted category leaked: %+v", categoryDead.Category)
	}
}

func TestSoftDeleteSirohUpdatesRejectDeletedRows(t *testing.T) {
	repo := repository.NewSirohRepository(seedSiroh(t), paginate.New())

	if _, err := repo.UpdateCategory(3, &model.SirohCategory{Title: "resurrect"}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("UpdateCategory(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
	if _, err := repo.UpdateContent(2, &model.SirohContent{Title: "resurrect"}); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("UpdateContent(soft-deleted): want ErrRecordNotFound, got %v", err)
	}
}
