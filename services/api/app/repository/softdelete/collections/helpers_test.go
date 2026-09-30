package collections

import (
	"net/http/httptest"
	"sort"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func qualifyBareOrderByID(db *gorm.DB) {
	stmt := db.Statement
	if stmt == nil || stmt.Table == "" {
		return
	}
	c, ok := stmt.Clauses["ORDER BY"]
	if !ok {
		return
	}
	orderBy, ok := c.Expression.(clause.OrderBy)
	if !ok {
		return
	}
	for i, col := range orderBy.Columns {
		if col.Column.Raw && col.Column.Name == "id" {
			orderBy.Columns[i].Column = clause.Column{Table: stmt.Table, Name: "id"}
		}
	}
	c.Expression = orderBy
	stmt.Clauses["ORDER BY"] = c
}

func openDB(t *testing.T, models ...interface{}) *gorm.DB {
	t.Helper()
	db := testdb.Open(t, models...)
	if err := db.Callback().Query().Before("gorm:query").Register("softdelete:qualify_bare_order_by_id", qualifyBareOrderByID); err != nil {
		t.Fatalf("register order by shim: %v", err)
	}
	return db
}

func runPage(t *testing.T, query string, call func(ctx *fiber.Ctx) (*paginate.Page, error)) *paginate.Page {
	t.Helper()
	var page *paginate.Page
	var callErr error
	app := fiber.New()
	app.Get("/", func(ctx *fiber.Ctx) error {
		page, callErr = call(ctx)
		return ctx.SendStatus(fiber.StatusNoContent)
	})
	resp, err := app.Test(httptest.NewRequest("GET", "/?"+query, nil), -1)
	if err != nil {
		t.Fatalf("fiber test: %v", err)
	}
	if resp.StatusCode != fiber.StatusNoContent {
		t.Fatalf("unexpected status %d", resp.StatusCode)
	}
	if callErr != nil {
		t.Fatalf("repository call: %v", callErr)
	}
	if page == nil {
		t.Fatal("repository returned a nil page")
	}
	if page.Error || page.RawError != nil {
		t.Fatalf("page error: %s (%v)", page.ErrorMessage, page.RawError)
	}
	return page
}

func pageItems[T any](t *testing.T, raw interface{}) []T {
	t.Helper()
	switch items := raw.(type) {
	case nil:
		return nil
	case []T:
		return items
	case *[]T:
		if items == nil {
			return nil
		}
		return *items
	default:
		t.Fatalf("unexpected page items type %T", raw)
		return nil
	}
}

func mustCreate(t *testing.T, db *gorm.DB, value interface{}) {
	t.Helper()
	if err := db.Create(value).Error; err != nil {
		t.Fatalf("create %T: %v", value, err)
	}
}

func newTranslation(t *testing.T, db *gorm.DB, idn string) *model.Translation {
	t.Helper()
	tr := &model.Translation{Idn: testdb.Str(idn)}
	mustCreate(t, db, tr)
	return tr
}

func sortedInts(values []int) []int {
	out := append([]int(nil), values...)
	sort.Ints(out)
	return out
}

func equalInts(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func assertIDs(t *testing.T, label string, got []int, want ...int) {
	t.Helper()
	if !equalInts(sortedInts(got), sortedInts(want)) {
		t.Fatalf("%s: got ids %v, want %v", label, sortedInts(got), sortedInts(want))
	}
}

func assertStrings(t *testing.T, label string, got []string, want ...string) {
	t.Helper()
	g := append([]string(nil), got...)
	w := append([]string(nil), want...)
	sort.Strings(g)
	sort.Strings(w)
	if len(g) != len(w) {
		t.Fatalf("%s: got %v, want %v", label, g, w)
	}
	for i := range g {
		if g[i] != w[i] {
			t.Fatalf("%s: got %v, want %v", label, g, w)
		}
	}
}

func countOf(p *int64) int64 {
	if p == nil {
		return -1
	}
	return *p
}
