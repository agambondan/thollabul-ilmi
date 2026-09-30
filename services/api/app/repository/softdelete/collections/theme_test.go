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

func bookIDs(books []model.Book) []int {
	ids := make([]int, 0, len(books))
	for _, b := range books {
		ids = append(ids, *b.ID)
	}
	return ids
}

func TestSoftDeleteThemeFindAll(t *testing.T) {
	db := openHadithGraphDB(t)
	repo := repository.NewThemeRepository(db, paginate.New())

	themeA := createTheme(t, db, newTranslation(t, db, "Tema A"))
	themeBTr := newTranslation(t, db, "Tema B")
	themeB := createTheme(t, db, themeBTr)
	themeC := createTheme(t, db, newTranslation(t, db, "Tema C"))

	book1 := createBook(t, db, "book-1", newTranslation(t, db, "Kitab 1"))
	bookDeleted := createBook(t, db, "book-deleted", newTranslation(t, db, "Kitab Terhapus"))
	book2 := createBook(t, db, "book-2", newTranslation(t, db, "Kitab 2"))
	book3Tr := newTranslation(t, db, "Kitab 3")
	book3 := createBook(t, db, "book-3", book3Tr)

	createHadith(t, db, 1, book1, themeA)
	h2 := createHadith(t, db, 2, book1, themeA)
	createHadith(t, db, 3, bookDeleted, themeA)
	h4 := createHadith(t, db, 4, book2, themeA)
	createHadith(t, db, 5, book1, themeC)
	createHadith(t, db, 6, book3, themeA)

	testdb.Delete(t, db, themeC)
	testdb.Delete(t, db, themeBTr)
	testdb.Delete(t, db, bookDeleted)
	testdb.Delete(t, db, book3Tr)
	testdb.Delete(t, db, h2)
	testdb.Delete(t, db, h4)

	page := runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindAll(ctx), nil
	})
	themes := pageItems[*model.Theme](t, page.Items)
	byID := map[int]*model.Theme{}
	var ids []int
	for _, th := range themes {
		byID[*th.ID] = th
		ids = append(ids, *th.ID)
	}
	assertIDs(t, "theme list", ids, *themeA.ID, *themeB.ID)
	if page.Total != 2 {
		t.Fatalf("FindAll total counts a soft-deleted theme: got %d, want 2", page.Total)
	}

	a := byID[*themeA.ID]
	if a.Translation == nil {
		t.Fatal("live theme lost its live translation")
	}
	if a.TotalHadith == nil || *a.TotalHadith != 3 {
		t.Fatalf("hadith count of theme A includes a soft-deleted hadith: %v, want 3", countOf(a.TotalHadith))
	}
	assertIDs(t, "books of theme A", bookIDs(a.Book), *book1.ID, *book3.ID)
	for _, b := range a.Book {
		if *b.ID == *book3.ID && b.Translation != nil {
			t.Fatalf("soft-deleted book translation leaked: %+v", b.Translation)
		}
		if *b.ID == *book1.ID && b.Translation == nil {
			t.Fatal("live book lost its live translation")
		}
	}

	b := byID[*themeB.ID]
	if b.Translation != nil {
		t.Fatalf("soft-deleted translation leaked on live theme: %+v", b.Translation)
	}
	if b.TotalHadith == nil || *b.TotalHadith != 0 || len(b.Book) != 0 {
		t.Fatalf("theme B has no hadith: total=%v books=%v", countOf(b.TotalHadith), bookIDs(b.Book))
	}
}

func TestSoftDeleteThemeFindById(t *testing.T) {
	db := openHadithGraphDB(t)
	repo := repository.NewThemeRepository(db, paginate.New())

	themeLive := createTheme(t, db, newTranslation(t, db, "Tema Hidup"))
	themeTr := newTranslation(t, db, "Terjemahan Tema Terhapus")
	themeTrDeleted := createTheme(t, db, themeTr)
	themeDeleted := createTheme(t, db, newTranslation(t, db, "Tema Terhapus"))
	themeOther := createTheme(t, db, newTranslation(t, db, "Tema Lain"))

	chLive := createChapter(t, db, themeLive, newTranslation(t, db, "Bab Hidup"))
	chTr := newTranslation(t, db, "Terjemahan Bab Terhapus")
	chTrDeleted := createChapter(t, db, themeLive, chTr)
	chDeleted := createChapter(t, db, themeLive, newTranslation(t, db, "Bab Terhapus"))
	createChapter(t, db, themeOther, newTranslation(t, db, "Bab Tema Lain"))

	testdb.Delete(t, db, themeDeleted)
	testdb.Delete(t, db, themeTr)
	testdb.Delete(t, db, chTr)
	testdb.Delete(t, db, chDeleted)

	if _, err := repo.FindById(themeDeleted.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted theme must not be found by id: err = %v", err)
	}

	got, err := repo.FindById(themeLive.ID)
	if err != nil {
		t.Fatalf("FindById live theme: %v", err)
	}
	var chapterIDs []int
	for _, ch := range got.Chapters {
		chapterIDs = append(chapterIDs, *ch.ID)
	}
	assertIDs(t, "chapters of theme", chapterIDs, *chLive.ID, *chTrDeleted.ID)
	for _, ch := range got.Chapters {
		if *ch.ID == *chTrDeleted.ID && ch.Translation != nil {
			t.Fatalf("soft-deleted chapter translation leaked: %+v", ch.Translation)
		}
		if *ch.ID == *chLive.ID && ch.Translation == nil {
			t.Fatal("live chapter lost its live translation")
		}
	}

	orphan, err := repo.FindById(themeTrDeleted.ID)
	if err != nil {
		t.Fatalf("a live theme whose translation is soft-deleted must still be found: %v", err)
	}
	if orphan.Translation != nil {
		t.Fatalf("soft-deleted translation leaked on live theme: %+v", orphan.Translation)
	}
}

func TestSoftDeleteThemeFindByBookSlug(t *testing.T) {
	db := openHadithGraphDB(t)
	repo := repository.NewThemeRepository(db, paginate.New())

	bookLive := createBook(t, db, "book-live", newTranslation(t, db, "Kitab Hidup"))
	bookDeleted := createBook(t, db, "book-deleted", newTranslation(t, db, "Kitab Terhapus"))

	themeLive := createTheme(t, db, newTranslation(t, db, "Tema Hidup"))
	themeTr := newTranslation(t, db, "Terjemahan Tema Terhapus")
	themeTrDeleted := createTheme(t, db, themeTr)
	themeDeleted := createTheme(t, db, newTranslation(t, db, "Tema Terhapus"))
	themeDeadLink := createTheme(t, db, newTranslation(t, db, "Tema Tautan Terhapus"))

	linkLive := linkBookTheme(t, db, bookLive, themeLive)
	linkTrDeleted := linkBookTheme(t, db, bookLive, themeTrDeleted)
	linkBookTheme(t, db, bookLive, themeDeleted)
	linkDead := linkBookTheme(t, db, bookLive, themeDeadLink)
	linkBookTheme(t, db, bookDeleted, themeLive)

	testdb.Delete(t, db, themeDeleted)
	testdb.Delete(t, db, themeTr)
	testdb.Delete(t, db, linkDead)
	testdb.Delete(t, db, bookDeleted)

	links, err := repo.FindByBookSlug(nil, bookLive.Slug)
	if err != nil {
		t.Fatalf("FindByBookSlug: %v", err)
	}
	var linkIDs, themeIDsSeen []int
	for _, l := range *links {
		linkIDs = append(linkIDs, *l.ID)
		if l.Theme != nil {
			themeIDsSeen = append(themeIDsSeen, *l.Theme.ID)
			if *l.Theme.ID == *themeTrDeleted.ID && l.Theme.Translation != nil {
				t.Fatalf("soft-deleted theme translation leaked: %+v", l.Theme.Translation)
			}
			if *l.Theme.ID == *themeLive.ID && l.Theme.Translation == nil {
				t.Fatal("live theme lost its live translation")
			}
		}
	}
	assertIDs(t, "themes of book", themeIDsSeen, *themeLive.ID, *themeTrDeleted.ID)
	for _, id := range linkIDs {
		if id == *linkDead.ID {
			t.Fatal("soft-deleted book_themes link returned")
		}
	}
	for _, id := range []int{*linkLive.ID, *linkTrDeleted.ID} {
		found := false
		for _, got := range linkIDs {
			found = found || got == id
		}
		if !found {
			t.Fatalf("live link %d missing from result %v", id, linkIDs)
		}
	}

	gone, err := repo.FindByBookSlug(nil, bookDeleted.Slug)
	if err != nil {
		t.Fatalf("FindByBookSlug deleted book: %v", err)
	}
	if gone != nil && len(*gone) != 0 {
		t.Fatalf("soft-deleted book still resolves to %d theme links", len(*gone))
	}
}

func TestSoftDeleteThemeCount(t *testing.T) {
	db := openHadithGraphDB(t)
	repo := repository.NewThemeRepository(db, paginate.New())

	createTheme(t, db, nil)
	createTheme(t, db, nil)
	deleted := createTheme(t, db, nil)
	testdb.Delete(t, db, deleted)

	count, err := repo.Count()
	if err != nil {
		t.Fatalf("Count: %v", err)
	}
	if *count != 2 {
		t.Fatalf("Count includes a soft-deleted theme: got %d, want 2", *count)
	}
}
