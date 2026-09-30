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

func openHadithGraphDB(t *testing.T) *gorm.DB {
	t.Helper()
	return openDB(t,
		&model.Translation{},
		&model.Book{},
		&model.Theme{},
		&model.Chapter{},
		&model.Hadith{},
		&model.BookThemes{},
	)
}

func createBook(t *testing.T, db *gorm.DB, slug string, tr *model.Translation) *model.Book {
	t.Helper()
	book := &model.Book{Slug: testdb.Str(slug)}
	if tr != nil {
		book.TranslationID = tr.ID
	}
	mustCreate(t, db, book)
	return book
}

func createTheme(t *testing.T, db *gorm.DB, tr *model.Translation) *model.Theme {
	t.Helper()
	theme := &model.Theme{}
	if tr != nil {
		theme.TranslationID = tr.ID
	}
	mustCreate(t, db, theme)
	return theme
}

func linkBookTheme(t *testing.T, db *gorm.DB, book *model.Book, theme *model.Theme) *model.BookThemes {
	t.Helper()
	link := &model.BookThemes{BookID: book.ID, ThemeID: theme.ID}
	mustCreate(t, db, link)
	return link
}

func createHadith(t *testing.T, db *gorm.DB, number int, book *model.Book, theme *model.Theme) *model.Hadith {
	t.Helper()
	h := &model.Hadith{Number: testdb.Int(number)}
	if book != nil {
		h.BookID = book.ID
	}
	if theme != nil {
		h.ThemeID = theme.ID
	}
	mustCreate(t, db, h)
	return h
}

func themeIDs(themes []model.Theme) []int {
	ids := make([]int, 0, len(themes))
	for _, th := range themes {
		ids = append(ids, *th.ID)
	}
	return ids
}

func TestSoftDeleteBookFindAll(t *testing.T) {
	db := openHadithGraphDB(t)
	repo := repository.NewBookRepository(db, paginate.New())

	bookA := createBook(t, db, "book-a", newTranslation(t, db, "Kitab A"))
	bookBTr := newTranslation(t, db, "Kitab B")
	bookB := createBook(t, db, "book-b", bookBTr)
	testdb.Delete(t, db, bookBTr)
	bookDeleted := createBook(t, db, "book-deleted", newTranslation(t, db, "Kitab Terhapus"))
	testdb.Delete(t, db, bookDeleted)

	themeLive := createTheme(t, db, newTranslation(t, db, "Tema Hidup"))
	themeDeleted := createTheme(t, db, newTranslation(t, db, "Tema Terhapus"))
	themeTrTr := newTranslation(t, db, "Tema Terjemahan Terhapus")
	themeTrDeleted := createTheme(t, db, themeTrTr)
	testdb.Delete(t, db, themeTrTr)

	linkBookTheme(t, db, bookA, themeLive)
	linkBookTheme(t, db, bookA, themeDeleted)
	linkBookTheme(t, db, bookA, themeTrDeleted)
	deadLink := linkBookTheme(t, db, bookB, themeLive)
	testdb.Delete(t, db, deadLink)
	testdb.Delete(t, db, themeDeleted)

	createHadith(t, db, 1, bookA, themeLive)
	createHadith(t, db, 2, bookA, themeLive)
	deletedHadithA := createHadith(t, db, 3, bookA, themeLive)
	testdb.Delete(t, db, deletedHadithA)
	deletedHadithB := createHadith(t, db, 4, bookB, themeLive)
	testdb.Delete(t, db, deletedHadithB)

	page := runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindAll(ctx), nil
	})
	books := pageItems[model.Book](t, page.Items)

	var slugs []string
	byID := map[int]model.Book{}
	for _, b := range books {
		slugs = append(slugs, *b.Slug)
		byID[*b.ID] = b
	}
	assertStrings(t, "book slugs", slugs, "book-a", "book-b")
	if page.Total != 2 {
		t.Fatalf("page total counts a soft-deleted book: got %d, want 2", page.Total)
	}

	a := byID[*bookA.ID]
	if a.Translation == nil || a.Translation.Idn == nil || *a.Translation.Idn != "Kitab A" {
		t.Fatalf("live book lost its live translation: %+v", a.Translation)
	}
	if countOf(a.Count) != 2 {
		t.Fatalf("hadith count of book A includes a soft-deleted hadith: %d, want 2", countOf(a.Count))
	}
	assertIDs(t, "themes of book A", themeIDs(a.Theme), *themeLive.ID, *themeTrDeleted.ID)
	for _, th := range a.Theme {
		if *th.ID == *themeTrDeleted.ID && th.Translation != nil {
			t.Fatalf("soft-deleted theme translation leaked: %+v", th.Translation)
		}
		if *th.ID == *themeLive.ID && th.Translation == nil {
			t.Fatal("live theme lost its live translation")
		}
	}

	b := byID[*bookB.ID]
	if b.Translation != nil {
		t.Fatalf("soft-deleted translation leaked on live book: %+v", b.Translation)
	}
	if countOf(b.Count) != 0 {
		t.Fatalf("book B only has a soft-deleted hadith, count = %d, want 0", countOf(b.Count))
	}
	if len(b.Theme) != 0 {
		t.Fatalf("book B only has a soft-deleted book_themes link, got themes %v", themeIDs(b.Theme))
	}
}

func TestSoftDeleteBookFindById(t *testing.T) {
	db := openHadithGraphDB(t)
	repo := repository.NewBookRepository(db, paginate.New())

	bookLive := createBook(t, db, "book-live", newTranslation(t, db, "Kitab Hidup"))
	bookTr := newTranslation(t, db, "Terjemahan Kitab")
	bookTrDeleted := createBook(t, db, "book-tr-deleted", bookTr)
	testdb.Delete(t, db, bookTr)
	bookDeleted := createBook(t, db, "book-deleted", newTranslation(t, db, "Kitab Terhapus"))
	testdb.Delete(t, db, bookDeleted)

	themeLive := createTheme(t, db, newTranslation(t, db, "Tema Hidup"))
	themeDeleted := createTheme(t, db, newTranslation(t, db, "Tema Terhapus"))
	themeTrTr := newTranslation(t, db, "Tema Terjemahan Terhapus")
	themeTrDeleted := createTheme(t, db, themeTrTr)
	themeDeadLink := createTheme(t, db, newTranslation(t, db, "Tema Tautan Terhapus"))
	linkBookTheme(t, db, bookLive, themeLive)
	linkBookTheme(t, db, bookLive, themeDeleted)
	linkBookTheme(t, db, bookLive, themeTrDeleted)
	deadLink := linkBookTheme(t, db, bookLive, themeDeadLink)
	linkBookTheme(t, db, bookDeleted, themeLive)
	testdb.Delete(t, db, themeDeleted)
	testdb.Delete(t, db, themeTrTr)
	testdb.Delete(t, db, deadLink)

	if _, err := repo.FindById(bookDeleted.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted book must not be found by id: err = %v", err)
	}

	got, err := repo.FindById(bookLive.ID)
	if err != nil {
		t.Fatalf("FindById live book: %v", err)
	}
	if got.Translation == nil {
		t.Fatal("live book lost its live translation")
	}
	assertIDs(t, "themes", themeIDs(got.Themes), *themeLive.ID, *themeTrDeleted.ID)
	assertIDs(t, "theme alias", themeIDs(got.Theme), *themeLive.ID, *themeTrDeleted.ID)
	for _, th := range got.Themes {
		if *th.ID == *themeTrDeleted.ID && th.Translation != nil {
			t.Fatalf("soft-deleted theme translation leaked: %+v", th.Translation)
		}
		if *th.ID == *themeLive.ID && th.Translation == nil {
			t.Fatal("live theme lost its live translation")
		}
	}

	orphan, err := repo.FindById(bookTrDeleted.ID)
	if err != nil {
		t.Fatalf("a live book whose translation is soft-deleted must still be found: %v", err)
	}
	if orphan.Translation != nil {
		t.Fatalf("soft-deleted translation leaked on live book: %+v", orphan.Translation)
	}
}

func TestSoftDeleteBookFindBySlug(t *testing.T) {
	db := openHadithGraphDB(t)
	repo := repository.NewBookRepository(db, paginate.New())

	bookLive := createBook(t, db, "book-live", newTranslation(t, db, "Kitab Hidup"))
	bookTr := newTranslation(t, db, "Terjemahan Kitab")
	bookTrDeleted := createBook(t, db, "book-tr-deleted", bookTr)
	testdb.Delete(t, db, bookTr)
	bookDeleted := createBook(t, db, "book-deleted", newTranslation(t, db, "Kitab Terhapus"))
	testdb.Delete(t, db, bookDeleted)

	if _, err := repo.FindBySlug(nil, bookDeleted.Slug); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted book must not be found by slug: err = %v", err)
	}

	got, err := repo.FindBySlug(nil, bookLive.Slug)
	if err != nil {
		t.Fatalf("FindBySlug live book: %v", err)
	}
	if got.Translation == nil {
		t.Fatal("live book lost its live translation")
	}

	orphan, err := repo.FindBySlug(nil, bookTrDeleted.Slug)
	if err != nil {
		t.Fatalf("a live book whose translation is soft-deleted must still be found: %v", err)
	}
	if orphan.Translation != nil {
		t.Fatalf("soft-deleted translation leaked on live book: %+v", orphan.Translation)
	}
}

func TestSoftDeleteBookCount(t *testing.T) {
	db := openHadithGraphDB(t)
	repo := repository.NewBookRepository(db, paginate.New())

	createBook(t, db, "book-one", nil)
	createBook(t, db, "book-two", nil)
	deleted := createBook(t, db, "book-deleted", nil)
	testdb.Delete(t, db, deleted)

	count, err := repo.Count()
	if err != nil {
		t.Fatalf("Count: %v", err)
	}
	if *count != 2 {
		t.Fatalf("Count includes a soft-deleted book: got %d, want 2", *count)
	}
}
