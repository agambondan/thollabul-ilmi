package repository

import (
	"net/http/httptest"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestLibraryBookRepositoryPublicAndAdminStatusScope(t *testing.T) {
	db := newLibraryBookRepositoryTestDB(t)
	repo := NewLibraryBookRepository(db, paginate.New())
	createLibraryBookRepositoryTestBook(t, db, "published-book", model.LibraryBookStatusPublished)
	createLibraryBookRepositoryTestBook(t, db, "draft-book", model.LibraryBookStatusDraft)

	app := fiber.New()
	app.Get("/public", func(ctx *fiber.Ctx) error {
		page := repo.FindAll(ctx, "", "", "")
		items := libraryBookPageItems(t, page.Items)
		if len(items) != 1 || items[0].Slug != "published-book" {
			t.Fatalf("expected only published book on public list, got %#v", items)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})
	app.Get("/admin", func(ctx *fiber.Ctx) error {
		page := repo.FindAllAdmin(ctx, "", "", "")
		items := libraryBookPageItems(t, page.Items)
		if len(items) != 2 {
			t.Fatalf("expected published and draft books on admin list, got %#v", items)
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})

	for _, path := range []string{"/public?page=0&size=10", "/admin?page=0&size=10"} {
		resp, err := app.Test(httptest.NewRequest("GET", path, nil))
		if err != nil {
			t.Fatalf("fiber test %s: %v", path, err)
		}
		if resp.StatusCode != fiber.StatusNoContent {
			t.Fatalf("expected 204 for %s, got %d", path, resp.StatusCode)
		}
	}
}

func TestLibraryBookRepositoryResourceLifecycle(t *testing.T) {
	db := newLibraryBookRepositoryTestDB(t)
	repo := NewLibraryBookRepository(db, paginate.New())
	createLibraryBookRepositoryTestBook(t, db, "resource-book", model.LibraryBookStatusPublished)

	book, err := repo.FindBySlugAny("resource-book")
	if err != nil {
		t.Fatalf("find book: %v", err)
	}
	updated, err := repo.UpdateResource(*book.ID, &model.LibraryBookResource{
		SourceURL:     "http://localhost:9020/library/resource-book.pdf",
		FileName:      "resource-book.pdf",
		FileMimeType:  "application/pdf",
		FileSizeBytes: 2048,
		ObjectKey:     "library/books/1/resource-book.pdf",
		Format:        model.LibraryBookFormatPDF,
	})
	if err != nil {
		t.Fatalf("update resource: %v", err)
	}
	if updated.SourceType != model.LibraryBookSourceUploaded || updated.FileObjectKey == "" || updated.FileSizeBytes != 2048 {
		t.Fatalf("resource metadata was not persisted: %#v", updated)
	}

	cleared, err := repo.ClearResource(*book.ID)
	if err != nil {
		t.Fatalf("clear resource: %v", err)
	}
	if cleared.SourceType != model.LibraryBookSourceExternal || cleared.Format != model.LibraryBookFormatLink {
		t.Fatalf("expected cleared resource to become external link, got %#v", cleared)
	}
	if cleared.SourceURL != "" || cleared.FileName != "" || cleared.FileMimeType != "" || cleared.FileSizeBytes != 0 || cleared.FileObjectKey != "" {
		t.Fatalf("resource fields were not cleared: %#v", cleared)
	}
}

func newLibraryBookRepositoryTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file::memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.LibraryBook{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func createLibraryBookRepositoryTestBook(t *testing.T, db *gorm.DB, slug string, status model.LibraryBookStatus) {
	t.Helper()
	if err := db.Create(&model.LibraryBook{
		Title:         slug,
		Slug:          slug,
		Format:        model.LibraryBookFormatLink,
		SourceType:    model.LibraryBookSourceExternal,
		LicenseStatus: model.LibraryBookLicenseUnverified,
		Status:        status,
	}).Error; err != nil {
		t.Fatalf("create library book: %v", err)
	}
}

func libraryBookPageItems(t *testing.T, raw interface{}) []model.LibraryBook {
	t.Helper()
	switch items := raw.(type) {
	case *[]model.LibraryBook:
		return *items
	case []model.LibraryBook:
		return items
	default:
		t.Fatalf("unexpected page items type %T", raw)
		return nil
	}
}
