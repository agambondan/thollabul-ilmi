package userdata

import (
	"errors"
	"net/http/httptest"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

func seedFeedPost(t *testing.T, db *gorm.DB, userID uuid.UUID, refType model.FeedRefType, caption string) *model.FeedPost {
	t.Helper()
	post := &model.FeedPost{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		UserID:   userID,
		RefType:  refType,
		RefID:    1,
		Caption:  caption,
	}
	create(t, db, post)
	return post
}

func feedPageCaptions(t *testing.T, raw interface{}) []string {
	t.Helper()
	var posts []model.FeedPost
	switch items := raw.(type) {
	case *[]model.FeedPost:
		posts = *items
	case []model.FeedPost:
		posts = items
	default:
		t.Fatalf("unexpected page items type %T", raw)
	}
	out := make([]string, 0, len(posts))
	for _, post := range posts {
		out = append(out, post.Caption)
	}
	return out
}

func TestSoftDeleteFeedFindByID(t *testing.T) {
	db := testdb.Open(t, &model.User{}, &model.FeedPost{})
	repo := repository.NewFeedRepository(db, paginate.New())
	author := seedUser(t, db, "author")
	leaver := seedUser(t, db, "leaver")

	live := seedFeedPost(t, db, author.ID, model.FeedRefTypeAyah, "live")
	deleted := seedFeedPost(t, db, author.ID, model.FeedRefTypeAyah, "deleted")
	orphan := seedFeedPost(t, db, leaver.ID, model.FeedRefTypeHadith, "orphan")
	testdb.Delete(t, db, deleted)
	testdb.Delete(t, db, leaver)

	got, err := repo.FindByID(live.ID.String())
	if err != nil {
		t.Fatalf("FindByID live: %v", err)
	}
	if got.Caption != "live" || got.Author == nil || got.Author.ID != author.ID || got.Author.Name == nil || *got.Author.Name != "author" {
		t.Fatalf("live post should carry its live author: %#v", got)
	}

	if _, err := repo.FindByID(deleted.ID.String()); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted post must be not found, got err=%v", err)
	}

	orphaned, err := repo.FindByID(orphan.ID.String())
	if err != nil {
		t.Fatalf("live post of a soft-deleted author must still be found: %v", err)
	}
	if orphaned.Author != nil {
		t.Fatalf("soft-deleted author leaked through post: %#v", orphaned.Author)
	}
}

func TestSoftDeleteFeedFindAll(t *testing.T) {
	db := testdb.Open(t, &model.User{}, &model.FeedPost{})
	repo := repository.NewFeedRepository(db, paginate.New())
	author := seedUser(t, db, "author")

	seedFeedPost(t, db, author.ID, model.FeedRefTypeAyah, "ayah live")
	deletedAyah := seedFeedPost(t, db, author.ID, model.FeedRefTypeAyah, "ayah deleted")
	hiddenAyah := seedFeedPost(t, db, author.ID, model.FeedRefTypeAyah, "ayah hidden")
	seedFeedPost(t, db, author.ID, model.FeedRefTypeHadith, "hadith live")
	deletedHadith := seedFeedPost(t, db, author.ID, model.FeedRefTypeHadith, "hadith deleted")
	testdb.Delete(t, db, deletedAyah)
	testdb.Delete(t, db, deletedHadith)

	app := fiber.New()
	app.Get("/", func(ctx *fiber.Ctx) error {
		refType := model.FeedRefType(ctx.Query("ref_type"))
		var hidden []string
		if ctx.Query("hide") == "1" {
			hidden = []string{hiddenAyah.ID.String()}
		}
		page := repo.FindAll(ctx, refType, hidden)
		captions := feedPageCaptions(t, page.Items)
		switch {
		case refType == "" && hidden == nil:
			if !equalStrings(captions, []string{"ayah live", "ayah hidden", "hadith live"}) || page.Total != 3 {
				t.Errorf("unfiltered feed leaked a deleted post: total=%d captions=%v", page.Total, captions)
			}
		case refType == model.FeedRefTypeAyah && hidden == nil:
			if !equalStrings(captions, []string{"ayah live", "ayah hidden"}) || page.Total != 2 {
				t.Errorf("ayah feed leaked a deleted post: total=%d captions=%v", page.Total, captions)
			}
		case refType == model.FeedRefTypeHadith:
			if !equalStrings(captions, []string{"hadith live"}) || page.Total != 1 {
				t.Errorf("hadith feed leaked a deleted post: total=%d captions=%v", page.Total, captions)
			}
		default:
			if !equalStrings(captions, []string{"ayah live", "hadith live"}) || page.Total != 2 {
				t.Errorf("hidden ids must exclude only that post: total=%d captions=%v", page.Total, captions)
			}
		}
		return ctx.SendStatus(fiber.StatusNoContent)
	})

	for _, path := range []string{
		"/?page=0&size=10",
		"/?page=0&size=10&ref_type=ayah",
		"/?page=0&size=10&ref_type=hadith",
		"/?page=0&size=10&hide=1",
	} {
		resp, err := app.Test(httptest.NewRequest("GET", path, nil))
		if err != nil {
			t.Fatalf("fiber test %s: %v", path, err)
		}
		if resp.StatusCode != fiber.StatusNoContent {
			t.Fatalf("expected 204 for %s, got %d", path, resp.StatusCode)
		}
	}
}
