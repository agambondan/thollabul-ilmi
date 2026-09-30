package quran

import (
	"errors"
	"sort"
	"strconv"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func qualifyBareIDOrder(db *gorm.DB) {
	err := db.Callback().Query().Before("gorm:query").Register("quran_test:qualify_bare_id_order", func(tx *gorm.DB) {
		c, ok := tx.Statement.Clauses["ORDER BY"]
		if !ok {
			return
		}
		orderBy, ok := c.Expression.(clause.OrderBy)
		if !ok {
			return
		}
		columns := make([]clause.OrderByColumn, len(orderBy.Columns))
		copy(columns, orderBy.Columns)
		for i := range columns {
			if columns[i].Column.Raw && columns[i].Column.Name == "id" {
				columns[i].Column = clause.Column{Table: clause.CurrentTable, Name: "id"}
			}
		}
		orderBy.Columns = columns
		c.Expression = orderBy
		tx.Statement.Clauses["ORDER BY"] = c
	})
	if err != nil {
		panic(err)
	}
}

func newTheme(t *testing.T, db *gorm.DB, idn string) (*model.Theme, *model.Translation) {
	t.Helper()
	tr := newTranslation(t, db, idn)
	theme := &model.Theme{TranslationID: tr.ID}
	mustCreate(t, db, theme)
	return theme, tr
}

func newChapter(t *testing.T, db *gorm.DB, theme *model.Theme, idn string) (*model.Chapter, *model.Translation) {
	t.Helper()
	tr := newTranslation(t, db, idn)
	chapter := &model.Chapter{ThemeID: theme.ID, TranslationID: tr.ID}
	mustCreate(t, db, chapter)
	return chapter, tr
}

func newClassifiedHadith(t *testing.T, db *gorm.DB, book *model.Book, theme *model.Theme, chapter *model.Chapter, number int, idn string) (*model.Hadith, *model.Translation) {
	t.Helper()
	hadith, tr := newHadith(t, db, book, number, idn)
	if err := db.Model(hadith).Updates(map[string]interface{}{
		"theme_id":   theme.ID,
		"chapter_id": chapter.ID,
	}).Error; err != nil {
		t.Fatalf("classify hadith: %v", err)
	}
	hadith.ThemeID = theme.ID
	hadith.ChapterID = chapter.ID
	return hadith, tr
}

func hadithIDsOf(hadiths []model.Hadith) []int {
	var ids []int
	for _, h := range hadiths {
		ids = append(ids, idOf(h.ID))
	}
	return ids
}

type hadithFixture struct {
	repo repository.HadithRepository

	bukhari, muslim, goneBook    *model.Book
	iman, goneTrTheme, goneTheme *model.Theme
	c1, goneTrChapter, goneChap  *model.Chapter

	live, goneRow, goneClassification, goneBookHadith, goneTranslations, goneHadithTr *model.Hadith
	liveAsset, goneAsset                                                              *model.HadithAsset
}

func newHadithFixture(t *testing.T) *hadithFixture {
	t.Helper()
	db := testdb.Open(t,
		&model.Translation{}, &model.Multimedia{}, &model.Book{}, &model.Theme{}, &model.Chapter{},
		&model.Hadith{}, &model.HadithAsset{},
	)
	qualifyBareIDOrder(db)
	f := &hadithFixture{repo: repository.NewHadithRepository(db, paginate.New())}

	var muslimTr, goneTrThemeTr, goneTrChapterTr, goneHadithTr *model.Translation
	f.bukhari, _ = newBook(t, db, "bukhari")
	f.muslim, muslimTr = newBook(t, db, "muslim")
	f.goneBook, _ = newBook(t, db, "gone")

	f.iman, _ = newTheme(t, db, "Iman")
	f.goneTrTheme, goneTrThemeTr = newTheme(t, db, "Tema Tr Hapus")
	f.goneTheme, _ = newTheme(t, db, "Tema Hapus")

	f.c1, _ = newChapter(t, db, f.iman, "Bab Satu")
	f.goneTrChapter, goneTrChapterTr = newChapter(t, db, f.goneTrTheme, "Bab Tr Hapus")
	f.goneChap, _ = newChapter(t, db, f.goneTheme, "Bab Hapus")

	f.live, _ = newClassifiedHadith(t, db, f.bukhari, f.iman, f.c1, 1, "live hadith")
	f.goneRow, _ = newClassifiedHadith(t, db, f.bukhari, f.iman, f.c1, 2, "gone hadith")
	f.goneClassification, _ = newClassifiedHadith(t, db, f.bukhari, f.goneTheme, f.goneChap, 3, "gone classification hadith")
	f.goneBookHadith, _ = newClassifiedHadith(t, db, f.goneBook, f.iman, f.c1, 4, "gone book hadith")
	f.goneTranslations, _ = newClassifiedHadith(t, db, f.bukhari, f.goneTrTheme, f.goneTrChapter, 5, "gone translations hadith")
	f.goneHadithTr, goneHadithTr = newClassifiedHadith(t, db, f.muslim, f.iman, f.c1, 6, "gone hadith translation")

	f.liveAsset = &model.HadithAsset{HadithID: f.live.ID}
	f.goneAsset = &model.HadithAsset{HadithID: f.live.ID}
	mustCreate(t, db, f.liveAsset)
	mustCreate(t, db, f.goneAsset)

	testdb.Delete(t, db, f.goneRow)
	testdb.Delete(t, db, f.goneAsset)
	testdb.Delete(t, db, f.goneBook)
	testdb.Delete(t, db, f.goneTheme)
	testdb.Delete(t, db, f.goneChap)
	testdb.Delete(t, db, goneTrThemeTr)
	testdb.Delete(t, db, goneTrChapterTr)
	testdb.Delete(t, db, muslimTr)
	testdb.Delete(t, db, goneHadithTr)
	return f
}

func (f *hadithFixture) liveIDs() []int {
	return wantIDs(f.live.ID, f.goneClassification.ID, f.goneBookHadith.ID, f.goneTranslations.ID, f.goneHadithTr.ID)
}

func (f *hadithFixture) assertGraph(t *testing.T, hadiths []model.Hadith) {
	t.Helper()
	for _, h := range hadiths {
		switch idOf(h.ID) {
		case idOf(f.live.ID):
			if h.Translation == nil || h.Book == nil || h.Book.Translation == nil ||
				h.Theme == nil || h.Theme.Translation == nil || h.Chapter == nil || h.Chapter.Translation == nil {
				t.Fatalf("live hadith must keep its full live graph, got %+v", h)
			}
			var media []int
			for _, asset := range h.Media {
				media = append(media, idOf(asset.ID))
			}
			assertIDs(t, "media of live hadith", media, wantIDs(f.liveAsset.ID))
		case idOf(f.goneClassification.ID):
			if h.Theme != nil || h.Chapter != nil {
				t.Fatalf("deleted theme/chapter leaked: theme %+v chapter %+v", h.Theme, h.Chapter)
			}
			if h.Book == nil {
				t.Fatalf("live book must be kept")
			}
		case idOf(f.goneBookHadith.ID):
			if h.Book != nil {
				t.Fatalf("deleted book leaked: %+v", h.Book)
			}
		case idOf(f.goneTranslations.ID):
			if h.Theme == nil || h.Theme.Translation != nil || h.Chapter == nil || h.Chapter.Translation != nil {
				t.Fatalf("themes and chapters must be kept without their deleted translations, got theme %+v chapter %+v", h.Theme, h.Chapter)
			}
		case idOf(f.goneHadithTr.ID):
			if h.Translation != nil {
				t.Fatalf("deleted hadith translation leaked: %+v", h.Translation)
			}
			if h.Book == nil || h.Book.Translation != nil {
				t.Fatalf("book must be kept without its deleted translation, got %+v", h.Book)
			}
		}
	}
}

func (f *hadithFixture) paged(t *testing.T, target string, fn func(ctx *fiber.Ctx) (*paginate.Page, error)) ([]model.Hadith, int64) {
	t.Helper()
	page := inFiberCtx(t, target, func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return fn(ctx)
	})
	if page.RawError != nil {
		t.Fatalf("paginate error: %v", page.RawError)
	}
	return sliceOf[model.Hadith](t, page.Items), page.Total
}

func (f *hadithFixture) assertPaged(t *testing.T, label string, fn func(ctx *fiber.Ctx) (*paginate.Page, error), want []int) []model.Hadith {
	t.Helper()
	hadiths, total := f.paged(t, "/?page=0&size=50", fn)
	assertIDs(t, label, hadithIDsOf(hadiths), want)
	if int(total) != len(want) {
		t.Fatalf("%s: total %d, want %d", label, total, len(want))
	}
	f.assertGraph(t, hadiths)
	return hadiths
}

const pageQuery = "/?page=0&size=50"

func TestSoftDeleteHadithFindAll(t *testing.T) {
	f := newHadithFixture(t)

	f.assertPaged(t, "FindAll", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return f.repo.FindAll(ctx), nil
	}, f.liveIDs())

	numeric, total := f.paged(t, "/?page=0&size=50&q=2", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return f.repo.FindAll(ctx), nil
	})
	if len(numeric) != 0 || total != 0 {
		t.Fatalf("searching the number of a deleted hadith must find nothing, got %v (total %d)", hadithIDsOf(numeric), total)
	}
}

func TestSoftDeleteHadithFindAllKeyset(t *testing.T) {
	f := newHadithFixture(t)

	first := inFiberCtx(t, "/?limit=2", f.repo.FindAllKeyset)
	assertIDs(t, "keyset first page", hadithIDsOf(sliceOf[model.Hadith](t, first.Items)), wantIDs(f.live.ID, f.goneClassification.ID))
	if first.Total != 5 || !first.HasMore || idOf(first.NextCursor) != idOf(f.goneClassification.ID) {
		t.Fatalf("keyset first page: total %d, hasMore %v, cursor %v", first.Total, first.HasMore, first.NextCursor)
	}

	second := inFiberCtx(t, "/?limit=2&cursor="+strconv.Itoa(idOf(f.goneClassification.ID)), f.repo.FindAllKeyset)
	assertIDs(t, "keyset second page", hadithIDsOf(sliceOf[model.Hadith](t, second.Items)), wantIDs(f.goneBookHadith.ID, f.goneTranslations.ID))
	if !second.HasMore {
		t.Fatalf("keyset second page must have one more row")
	}

	third := inFiberCtx(t, "/?limit=2&cursor="+strconv.Itoa(idOf(f.goneTranslations.ID)), f.repo.FindAllKeyset)
	hadiths := sliceOf[model.Hadith](t, third.Items)
	assertIDs(t, "keyset last page", hadithIDsOf(hadiths), wantIDs(f.goneHadithTr.ID))
	if third.HasMore {
		t.Fatalf("keyset last page must be the last one")
	}
	f.assertGraph(t, hadiths)
}

func TestSoftDeleteHadithFindByIDAndMany(t *testing.T) {
	f := newHadithFixture(t)

	if _, err := f.repo.FindById(f.goneRow.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindById of a deleted hadith: got %v, want ErrRecordNotFound", err)
	}

	for _, h := range []*model.Hadith{f.live, f.goneClassification, f.goneBookHadith, f.goneTranslations, f.goneHadithTr} {
		got, err := f.repo.FindById(h.ID)
		if err != nil {
			t.Fatalf("FindById(%d): %v", idOf(h.ID), err)
		}
		f.assertGraph(t, []model.Hadith{*got})
	}

	many, err := f.repo.FindManyByIds([]int{
		idOf(f.live.ID), idOf(f.goneRow.ID), idOf(f.goneClassification.ID),
		idOf(f.goneBookHadith.ID), idOf(f.goneTranslations.ID), idOf(f.goneHadithTr.ID),
	})
	if err != nil {
		t.Fatalf("FindManyByIds: %v", err)
	}
	ids := hadithIDsOf(many)
	sort.Ints(ids)
	assertIDs(t, "FindManyByIds", ids, f.liveIDs())
	f.assertGraph(t, many)
}

func TestSoftDeleteHadithFindByOffsetAndCount(t *testing.T) {
	f := newHadithFixture(t)

	want := []*model.Hadith{f.live, f.goneClassification, f.goneBookHadith, f.goneTranslations, f.goneHadithTr}
	for offset, h := range want {
		got, err := f.repo.FindByOffset(int64(offset))
		if err != nil {
			t.Fatalf("FindByOffset(%d): %v", offset, err)
		}
		if idOf(got.ID) != idOf(h.ID) {
			t.Fatalf("FindByOffset(%d): got hadith %d, want %d", offset, idOf(got.ID), idOf(h.ID))
		}
		f.assertGraph(t, []model.Hadith{*got})
	}
	if _, err := f.repo.FindByOffset(int64(len(want))); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("FindByOffset past the last live hadith: got %v, want ErrRecordNotFound", err)
	}

	count, err := f.repo.Count()
	if err != nil {
		t.Fatalf("Count: %v", err)
	}
	if *count != 5 {
		t.Fatalf("Count: got %d, want 5 live hadiths", *count)
	}
}

func TestSoftDeleteHadithFindByBookSlug(t *testing.T) {
	f := newHadithFixture(t)

	find := func(slug string) func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return func(ctx *fiber.Ctx) (*paginate.Page, error) { return f.repo.FindByBookSlug(ctx, &slug) }
	}

	f.assertPaged(t, "bukhari", find("bukhari"), wantIDs(f.live.ID, f.goneClassification.ID, f.goneTranslations.ID))
	f.assertPaged(t, "muslim", find("muslim"), wantIDs(f.goneHadithTr.ID))
	f.assertPaged(t, "deleted book", find("gone"), nil)
}

func TestSoftDeleteHadithFindByBookSlugSlim(t *testing.T) {
	f := newHadithFixture(t)

	find := func(slug string) func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return func(ctx *fiber.Ctx) (*paginate.Page, error) { return f.repo.FindByBookSlugSlim(ctx, &slug) }
	}

	bukhari, total := f.paged(t, pageQuery, find("bukhari"))
	assertIDs(t, "bukhari", hadithIDsOf(bukhari), wantIDs(f.live.ID, f.goneClassification.ID, f.goneTranslations.ID))
	if total != 3 {
		t.Fatalf("bukhari total: got %d, want 3", total)
	}
	for _, h := range bukhari {
		if idOf(h.ID) != idOf(f.live.ID) {
			continue
		}
		var media []int
		for _, asset := range h.Media {
			media = append(media, idOf(asset.ID))
		}
		assertIDs(t, "media of live hadith", media, wantIDs(f.liveAsset.ID))
		if h.Book == nil || h.Translation == nil {
			t.Fatalf("live hadith must keep its book and translation, got %+v", h)
		}
	}

	muslim, _ := f.paged(t, pageQuery, find("muslim"))
	assertIDs(t, "muslim", hadithIDsOf(muslim), wantIDs(f.goneHadithTr.ID))
	if muslim[0].Translation != nil {
		t.Fatalf("deleted hadith translation leaked: %+v", muslim[0].Translation)
	}

	deletedBook, _ := f.paged(t, pageQuery, find("gone"))
	assertIDs(t, "deleted book", hadithIDsOf(deletedBook), nil)
}

func TestSoftDeleteHadithFindByBookSlugNumber(t *testing.T) {
	f := newHadithFixture(t)

	slug := "bukhari"
	deletedNumber := 2
	if _, err := f.repo.FindByBookSlugNumber(&slug, &deletedNumber); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("deleted hadith by number: got %v, want ErrRecordNotFound", err)
	}

	liveNumber := 1
	got, err := f.repo.FindByBookSlugNumber(&slug, &liveNumber)
	if err != nil {
		t.Fatalf("FindByBookSlugNumber: %v", err)
	}
	f.assertGraph(t, []model.Hadith{*got})

	goneSlug := "gone"
	goneBookNumber := 4
	if _, err := f.repo.FindByBookSlugNumber(&goneSlug, &goneBookNumber); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("hadith of a deleted book by slug: got %v, want ErrRecordNotFound", err)
	}
}

func TestSoftDeleteHadithFindByTheme(t *testing.T) {
	f := newHadithFixture(t)

	byID := func(id *int) func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return func(ctx *fiber.Ctx) (*paginate.Page, error) { return f.repo.FindByThemeId(ctx, id) }
	}
	byName := func(name string) func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return func(ctx *fiber.Ctx) (*paginate.Page, error) { return f.repo.FindByThemeName(ctx, &name) }
	}

	imanIDs := wantIDs(f.live.ID, f.goneBookHadith.ID, f.goneHadithTr.ID)
	f.assertPaged(t, "FindByThemeId(iman)", byID(f.iman.ID), imanIDs)
	f.assertPaged(t, "FindByThemeId(theme with deleted translation)", byID(f.goneTrTheme.ID), wantIDs(f.goneTranslations.ID))
	f.assertPaged(t, "FindByThemeId(deleted theme)", byID(f.goneTheme.ID), wantIDs(f.goneClassification.ID))

	f.assertPaged(t, "FindByThemeName(iman)", byName("iman"), imanIDs)
	f.assertPaged(t, "FindByThemeName(theme with deleted translation)", byName("tema tr hapus"), nil)
	f.assertPaged(t, "FindByThemeName(deleted theme)", byName("tema hapus"), nil)
}

func TestSoftDeleteHadithFindByChapter(t *testing.T) {
	f := newHadithFixture(t)

	byID := func(id *int) func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return func(ctx *fiber.Ctx) (*paginate.Page, error) { return f.repo.FindByChapterId(ctx, id) }
	}

	f.assertPaged(t, "FindByChapterId(c1)", byID(f.c1.ID), wantIDs(f.live.ID, f.goneBookHadith.ID, f.goneHadithTr.ID))
	f.assertPaged(t, "FindByChapterId(chapter with deleted translation)", byID(f.goneTrChapter.ID), wantIDs(f.goneTranslations.ID))
	f.assertPaged(t, "FindByChapterId(deleted chapter)", byID(f.goneChap.ID), wantIDs(f.goneClassification.ID))
}

func TestSoftDeleteHadithFindByCombinedFilters(t *testing.T) {
	f := newHadithFixture(t)

	bukhari := "bukhari"
	gone := "gone"

	f.assertPaged(t, "FindByBookSlugThemeId", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return f.repo.FindByBookSlugThemeId(ctx, &bukhari, f.iman.ID)
	}, wantIDs(f.live.ID))

	f.assertPaged(t, "FindByBookSlugThemeId(deleted book)", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return f.repo.FindByBookSlugThemeId(ctx, &gone, f.iman.ID)
	}, nil)

	f.assertPaged(t, "FindByBookSlugChapterId", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return f.repo.FindByBookSlugChapterId(ctx, &bukhari, f.c1.ID)
	}, wantIDs(f.live.ID))

	f.assertPaged(t, "FindByThemeIdChapterId", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return f.repo.FindByThemeIdChapterId(ctx, f.iman.ID, f.c1.ID)
	}, wantIDs(f.live.ID, f.goneBookHadith.ID, f.goneHadithTr.ID))

	f.assertPaged(t, "FindByBookSlugThemeIdChapterId", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return f.repo.FindByBookSlugThemeIdChapterId(ctx, &bukhari, f.iman.ID, f.c1.ID)
	}, wantIDs(f.live.ID))
}
