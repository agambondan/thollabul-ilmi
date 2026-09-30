package rijal

import (
	"sort"
	"strings"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func baseID(id int) model.BaseID {
	return model.BaseID{ID: testdb.Int(id)}
}

func mustCreate(t *testing.T, db *gorm.DB, value interface{}) {
	t.Helper()
	if err := db.Create(value).Error; err != nil {
		t.Fatalf("create %T: %v", value, err)
	}
}

func mustExec(t *testing.T, db *gorm.DB, query string, args ...interface{}) {
	t.Helper()
	if err := db.Exec(query, args...).Error; err != nil {
		t.Fatalf("exec %q: %v", query, err)
	}
}

func newFiberCtx(t *testing.T, uri string) *fiber.Ctx {
	t.Helper()
	app := fiber.New()
	fctx := &fasthttp.RequestCtx{}
	fctx.Request.Header.SetMethod(fiber.MethodGet)
	fctx.Request.SetRequestURI(uri)
	c := app.AcquireCtx(fctx)
	t.Cleanup(func() { app.ReleaseCtx(c) })
	return c
}

func assertIDs(t *testing.T, label string, got []int, want ...int) {
	t.Helper()
	gotSorted := append([]int{}, got...)
	wantSorted := append([]int{}, want...)
	sort.Ints(gotSorted)
	sort.Ints(wantSorted)
	if len(gotSorted) != len(wantSorted) {
		t.Fatalf("%s: got ids %v, want %v", label, gotSorted, wantSorted)
	}
	for i := range gotSorted {
		if gotSorted[i] != wantSorted[i] {
			t.Fatalf("%s: got ids %v, want %v", label, gotSorted, wantSorted)
		}
	}
}

func assertAbsent(t *testing.T, label string, got []int, forbidden ...int) {
	t.Helper()
	for _, f := range forbidden {
		for _, g := range got {
			if g == f {
				t.Fatalf("%s: soft-deleted id %d leaked, got ids %v", label, f, got)
			}
		}
	}
}

func str(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func qualifyOrderByForSQLite(t *testing.T, db *gorm.DB, from, to string) {
	t.Helper()
	err := db.Callback().Query().Before("gorm:query").Register("softdelete:qualify_order_by", func(tx *gorm.DB) {
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
			if columns[i].Column.Name == from {
				columns[i].Column.Name = to
				continue
			}
			columns[i].Column.Name = strings.Replace(columns[i].Column.Name, ", "+from, ", "+to, 1)
		}
		orderBy.Columns = columns
		c.Expression = orderBy
		tx.Statement.Clauses["ORDER BY"] = c
	})
	if err != nil {
		t.Fatalf("register order by callback: %v", err)
	}
}
