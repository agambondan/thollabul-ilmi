package quran

import (
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

func mustCreate(t *testing.T, db *gorm.DB, value interface{}) {
	t.Helper()
	if err := db.Create(value).Error; err != nil {
		t.Fatalf("create %T: %v", value, err)
	}
}

func newTranslation(t *testing.T, db *gorm.DB, idn string) *model.Translation {
	t.Helper()
	tr := &model.Translation{
		Idn:      testdb.Str(idn),
		En:       testdb.Str(idn + " en"),
		Ar:       testdb.Str(idn + " ar"),
		LatinIdn: testdb.Str(idn),
		LatinEn:  testdb.Str(idn),
	}
	mustCreate(t, db, tr)
	return tr
}

func newSurah(t *testing.T, db *gorm.DB, number int, idn string) (*model.Surah, *model.Translation) {
	t.Helper()
	tr := newTranslation(t, db, idn)
	surah := &model.Surah{
		Number:         testdb.Int(number),
		Slug:           testdb.Str(idn),
		RevelationType: testdb.Str("Makkiyah"),
		TranslationID:  tr.ID,
	}
	mustCreate(t, db, surah)
	return surah, tr
}

func newAyah(t *testing.T, db *gorm.DB, surah *model.Surah, number, page, hizb int, idn string) (*model.Ayah, *model.Translation) {
	t.Helper()
	tr := newTranslation(t, db, idn)
	ayah := &model.Ayah{
		Number:        testdb.Int(number),
		Page:          testdb.Int(page),
		HizbQuarter:   testdb.Int(hizb),
		JuzNumber:     testdb.Int(1),
		SurahID:       surah.ID,
		TranslationID: tr.ID,
	}
	mustCreate(t, db, ayah)
	return ayah, tr
}

func idOf(id *int) int {
	if id == nil {
		return 0
	}
	return *id
}

func ayahID(a *model.Ayah) int {
	if a == nil {
		return 0
	}
	return idOf(a.ID)
}

func surahID(s *model.Surah) int {
	if s == nil {
		return 0
	}
	return idOf(s.ID)
}

func translationID(tr *model.Translation) int {
	if tr == nil {
		return 0
	}
	return idOf(tr.ID)
}

func wantIDs(ids ...*int) []int {
	out := make([]int, 0, len(ids))
	for _, id := range ids {
		out = append(out, idOf(id))
	}
	return out
}

func assertIDs(t *testing.T, label string, got []int, want []int) {
	t.Helper()
	if len(got) == 0 && len(want) == 0 {
		return
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("%s: got ids %v, want %v", label, got, want)
	}
}

func newBook(t *testing.T, db *gorm.DB, slug string) (*model.Book, *model.Translation) {
	t.Helper()
	tr := newTranslation(t, db, slug+" book")
	book := &model.Book{Slug: testdb.Str(slug), TranslationID: tr.ID}
	mustCreate(t, db, book)
	return book, tr
}

func newHadith(t *testing.T, db *gorm.DB, book *model.Book, number int, idn string) (*model.Hadith, *model.Translation) {
	t.Helper()
	tr := newTranslation(t, db, idn)
	hadith := &model.Hadith{
		Number:        testdb.Int(number),
		TranslationID: tr.ID,
	}
	if book != nil {
		hadith.BookID = book.ID
	}
	mustCreate(t, db, hadith)
	return hadith, tr
}

func inFiberCtx[T any](t *testing.T, target string, fn func(ctx *fiber.Ctx) (T, error)) T {
	t.Helper()
	var (
		result T
		fnErr  error
	)
	app := fiber.New()
	app.Get("/", func(ctx *fiber.Ctx) error {
		result, fnErr = fn(ctx)
		return ctx.SendStatus(fiber.StatusNoContent)
	})
	resp, err := app.Test(httptest.NewRequest("GET", target, nil), -1)
	if err != nil {
		t.Fatalf("fiber test: %v", err)
	}
	if resp.StatusCode != fiber.StatusNoContent {
		t.Fatalf("unexpected status %d", resp.StatusCode)
	}
	if fnErr != nil {
		t.Fatalf("repository call: %v", fnErr)
	}
	return result
}

func pageOf(t *testing.T, target string, fn func(ctx *fiber.Ctx) *paginate.Page) *paginate.Page {
	t.Helper()
	page := inFiberCtx(t, target, func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return fn(ctx), nil
	})
	if page.RawError != nil {
		t.Fatalf("paginate error: %v", page.RawError)
	}
	return page
}

func sliceOf[T any](t *testing.T, items interface{}) []T {
	t.Helper()
	v := reflect.ValueOf(items)
	for v.IsValid() && (v.Kind() == reflect.Ptr || v.Kind() == reflect.Interface) {
		if v.IsNil() {
			return nil
		}
		v = v.Elem()
	}
	if !v.IsValid() || v.Kind() != reflect.Slice {
		t.Fatalf("expected a slice, got %T", items)
	}
	out := make([]T, 0, v.Len())
	for i := 0; i < v.Len(); i++ {
		e := v.Index(i)
		for e.Kind() == reflect.Ptr {
			if e.IsNil() {
				t.Fatalf("nil element at %d in %T", i, items)
			}
			e = e.Elem()
		}
		item, ok := e.Interface().(T)
		if !ok {
			t.Fatalf("element %d is %T", i, e.Interface())
		}
		out = append(out, item)
	}
	return out
}

func ayahIDsOf(ayahs []model.Ayah) []int {
	var ids []int
	for _, ayah := range ayahs {
		ids = append(ids, idOf(ayah.ID))
	}
	return ids
}
