package collections

import (
	"testing"

	"errors"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type chapterFixture struct {
	db             *gorm.DB
	themeLive      *model.Theme
	themeDeleted   *model.Theme
	themeTrDeleted *model.Theme
	chLive         *model.Chapter
	chDeadTheme    *model.Chapter
	chDeadTr       *model.Chapter
	chDeleted      *model.Chapter
	chThemeDeadTr  *model.Chapter
}

func createChapter(t *testing.T, db *gorm.DB, theme *model.Theme, tr *model.Translation) *model.Chapter {
	t.Helper()
	ch := &model.Chapter{}
	if theme != nil {
		ch.ThemeID = theme.ID
	}
	if tr != nil {
		ch.TranslationID = tr.ID
	}
	mustCreate(t, db, ch)
	return ch
}

func newChapterFixture(t *testing.T) *chapterFixture {
	t.Helper()
	db := openDB(t, &model.Translation{}, &model.Theme{}, &model.Chapter{})
	f := &chapterFixture{db: db}

	f.themeLive = createTheme(t, db, newTranslation(t, db, "Tema Hidup"))
	f.themeDeleted = createTheme(t, db, newTranslation(t, db, "Tema Terhapus"))
	themeTr := newTranslation(t, db, "Terjemahan Tema Terhapus")
	f.themeTrDeleted = createTheme(t, db, themeTr)

	f.chLive = createChapter(t, db, f.themeLive, newTranslation(t, db, "Bab Hidup"))
	f.chDeadTheme = createChapter(t, db, f.themeDeleted, newTranslation(t, db, "Bab Tema Terhapus"))
	chTr := newTranslation(t, db, "Terjemahan Bab Terhapus")
	f.chDeadTr = createChapter(t, db, f.themeLive, chTr)
	f.chDeleted = createChapter(t, db, f.themeLive, newTranslation(t, db, "Bab Terhapus"))
	f.chThemeDeadTr = createChapter(t, db, f.themeTrDeleted, newTranslation(t, db, "Bab Tema Terjemahan Terhapus"))

	testdb.Delete(t, db, f.themeDeleted)
	testdb.Delete(t, db, themeTr)
	testdb.Delete(t, db, chTr)
	testdb.Delete(t, db, f.chDeleted)
	return f
}

func (f *chapterFixture) check(t *testing.T, label string, byID map[int]model.Chapter) {
	t.Helper()
	live := byID[*f.chLive.ID]
	if live.Theme == nil || live.Theme.Translation == nil || live.Translation == nil {
		t.Fatalf("%s: fully live chapter lost a live association: theme=%+v translation=%+v", label, live.Theme, live.Translation)
	}
	if deadTheme, ok := byID[*f.chDeadTheme.ID]; !ok {
		t.Fatalf("%s: live chapter whose theme is soft-deleted must still be returned", label)
	} else if deadTheme.Theme != nil {
		t.Fatalf("%s: soft-deleted theme leaked on live chapter: %+v", label, deadTheme.Theme)
	}
	if deadTr, ok := byID[*f.chDeadTr.ID]; !ok {
		t.Fatalf("%s: live chapter whose translation is soft-deleted must still be returned", label)
	} else if deadTr.Translation != nil {
		t.Fatalf("%s: soft-deleted translation leaked on live chapter: %+v", label, deadTr.Translation)
	}
	if themeDeadTr, ok := byID[*f.chThemeDeadTr.ID]; !ok {
		t.Fatalf("%s: live chapter whose theme translation is soft-deleted must still be returned", label)
	} else if themeDeadTr.Theme == nil {
		t.Fatalf("%s: live theme was dropped because its translation is soft-deleted", label)
	} else if themeDeadTr.Theme.Translation != nil {
		t.Fatalf("%s: soft-deleted theme translation leaked: %+v", label, themeDeadTr.Theme.Translation)
	}
	if _, ok := byID[*f.chDeleted.ID]; ok {
		t.Fatalf("%s: soft-deleted chapter returned", label)
	}
}

func chaptersByID(chapters []model.Chapter) map[int]model.Chapter {
	out := map[int]model.Chapter{}
	for _, ch := range chapters {
		out[*ch.ID] = ch
	}
	return out
}

func TestSoftDeleteChapterFindAll(t *testing.T) {
	f := newChapterFixture(t)
	repo := repository.NewChapterRepository(f.db, paginate.New())

	page := runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindAll(ctx), nil
	})
	chapters := pageItems[model.Chapter](t, page.Items)
	byID := chaptersByID(chapters)
	f.check(t, "FindAll", byID)
	if len(chapters) != 4 {
		t.Fatalf("FindAll returned %d chapters, want 4 live ones", len(chapters))
	}
	if page.Total != 4 {
		t.Fatalf("FindAll total counts a soft-deleted chapter: got %d, want 4", page.Total)
	}
}

func TestSoftDeleteChapterFindById(t *testing.T) {
	f := newChapterFixture(t)
	repo := repository.NewChapterRepository(f.db, paginate.New())

	if _, err := repo.FindById(f.chDeleted.ID); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted chapter must not be found by id: err = %v", err)
	}

	byID := map[int]model.Chapter{}
	for _, ch := range []*model.Chapter{f.chLive, f.chDeadTheme, f.chDeadTr, f.chThemeDeadTr} {
		got, err := repo.FindById(ch.ID)
		if err != nil {
			t.Fatalf("FindById(%d): %v", *ch.ID, err)
		}
		byID[*ch.ID] = *got
	}
	f.check(t, "FindById", byID)
}

func TestSoftDeleteChapterFindByThemeId(t *testing.T) {
	f := newChapterFixture(t)
	repo := repository.NewChapterRepository(f.db, paginate.New())

	page := runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindByThemeId(ctx, f.themeLive.ID)
	})
	chapters := pageItems[model.Chapter](t, page.Items)
	var ids []int
	for _, ch := range chapters {
		ids = append(ids, *ch.ID)
	}
	assertIDs(t, "chapters of live theme", ids, *f.chLive.ID, *f.chDeadTr.ID)
	if page.Total != 2 {
		t.Fatalf("FindByThemeId total counts a soft-deleted chapter: got %d, want 2", page.Total)
	}
	byID := chaptersByID(chapters)
	if byID[*f.chDeadTr.ID].Translation != nil {
		t.Fatalf("soft-deleted translation leaked: %+v", byID[*f.chDeadTr.ID].Translation)
	}
	if byID[*f.chLive.ID].Translation == nil {
		t.Fatal("live chapter lost its live translation")
	}

	page = runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindByThemeId(ctx, f.themeTrDeleted.ID)
	})
	chapters = pageItems[model.Chapter](t, page.Items)
	if len(chapters) != 1 || chapters[0].Theme == nil || chapters[0].Theme.Translation != nil {
		t.Fatalf("chapter of a theme with soft-deleted translation: %+v", chapters)
	}
}

func TestSoftDeleteChapterCount(t *testing.T) {
	f := newChapterFixture(t)
	repo := repository.NewChapterRepository(f.db, paginate.New())

	count, err := repo.Count()
	if err != nil {
		t.Fatalf("Count: %v", err)
	}
	if *count != 4 {
		t.Fatalf("Count includes a soft-deleted chapter: got %d, want 4", *count)
	}
}
