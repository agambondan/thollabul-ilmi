package collections

import (
	"errors"
	"testing"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/agambondan/islamic-explorer/app/repository/softdelete/testdb"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type blogFixture struct {
	db *gorm.DB

	author        *model.User
	deletedAuthor *model.User

	catLive      *model.BlogCategory
	catDeleted   *model.BlogCategory
	catTrDeleted *model.BlogCategory

	tagLive      *model.BlogTag
	tagDeleted   *model.BlogTag
	tagTrDeleted *model.BlogTag

	pLive         *model.BlogPost
	pDeadCat      *model.BlogPost
	pDeadAuthor   *model.BlogPost
	pTrCat        *model.BlogPost
	pDeleted      *model.BlogPost
	pDraft        *model.BlogPost
	pSibling      *model.BlogPost
	pSiblingGone  *model.BlogPost
	pTagSibling   *model.BlogPost
	pTagSibGone   *model.BlogPost
	pDeadTagOnly  *model.BlogPost
	pNoCategory   *model.BlogPost
	publishedBase time.Time
}

func createUser(t *testing.T, db *gorm.DB, name string) *model.User {
	t.Helper()
	u := &model.User{
		BaseUUID: model.BaseUUID{ID: uuid.New()},
		Name:     testdb.Str(name),
		Password: testdb.Str("secret"),
	}
	mustCreate(t, db, u)
	return u
}

func createBlogCategory(t *testing.T, db *gorm.DB, name, slug string, tr *model.Translation) *model.BlogCategory {
	t.Helper()
	c := &model.BlogCategory{Name: name, Slug: slug}
	if tr != nil {
		c.TranslationID = tr.ID
	}
	mustCreate(t, db, c)
	return c
}

func createBlogTag(t *testing.T, db *gorm.DB, name, slug string, tr *model.Translation) *model.BlogTag {
	t.Helper()
	tag := &model.BlogTag{Name: name, Slug: slug}
	if tr != nil {
		tag.TranslationID = tr.ID
	}
	mustCreate(t, db, tag)
	return tag
}

func (f *blogFixture) createPost(t *testing.T, slug string, author *model.User, cat *model.BlogCategory, status model.BlogStatus, views int, offset int, tr *model.Translation, tags ...*model.BlogTag) *model.BlogPost {
	t.Helper()
	published := f.publishedBase.Add(time.Duration(offset) * time.Hour)
	p := &model.BlogPost{
		BaseUUID:    model.BaseUUID{ID: uuid.New()},
		AuthorID:    author.ID,
		Title:       slug,
		Slug:        slug,
		Content:     "content",
		Status:      status,
		PublishedAt: &published,
		ViewCount:   views,
	}
	if cat != nil {
		p.CategoryID = cat.ID
	}
	if tr != nil {
		p.TranslationID = tr.ID
	}
	mustCreate(t, f.db, p)
	for _, tag := range tags {
		if err := f.db.Exec("INSERT INTO blog_post_tags (blog_post_id, blog_tag_id) VALUES (?, ?)", p.ID.String(), *tag.ID).Error; err != nil {
			t.Fatalf("link tag: %v", err)
		}
	}
	return p
}

func newBlogFixture(t *testing.T) *blogFixture {
	t.Helper()
	db := openDB(t,
		&model.Translation{},
		&model.User{},
		&model.BlogCategory{},
		&model.BlogTag{},
		&model.BlogPost{},
	)
	f := &blogFixture{db: db, publishedBase: time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)}

	f.author = createUser(t, db, "Penulis")
	f.deletedAuthor = createUser(t, db, "Penulis Terhapus")

	catTr := newTranslation(t, db, "Kategori terjemahan terhapus")
	f.catLive = createBlogCategory(t, db, "Fiqh", "fiqh", newTranslation(t, db, "Fikih"))
	f.catDeleted = createBlogCategory(t, db, "Akidah", "akidah", newTranslation(t, db, "Akidah"))
	f.catTrDeleted = createBlogCategory(t, db, "Sirah", "sirah", catTr)

	tagTr := newTranslation(t, db, "Tag terjemahan terhapus")
	f.tagLive = createBlogTag(t, db, "Salat", "salat", newTranslation(t, db, "Salat"))
	f.tagDeleted = createBlogTag(t, db, "Zakat", "zakat", newTranslation(t, db, "Zakat"))
	f.tagTrDeleted = createBlogTag(t, db, "Puasa", "puasa", tagTr)

	postTr := newTranslation(t, db, "Terjemahan artikel")
	f.pLive = f.createPost(t, "p-live", f.author, f.catLive, model.BlogStatusPublished, 50, 1, postTr, f.tagLive, f.tagDeleted, f.tagTrDeleted)
	f.pDeadCat = f.createPost(t, "p-dead-cat", f.author, f.catDeleted, model.BlogStatusPublished, 40, 2, nil)
	f.pDeadAuthor = f.createPost(t, "p-dead-author", f.deletedAuthor, f.catLive, model.BlogStatusPublished, 30, 3, nil)
	postDeadTr := newTranslation(t, db, "Terjemahan artikel terhapus")
	f.pTrCat = f.createPost(t, "p-tr-cat", f.author, f.catTrDeleted, model.BlogStatusPublished, 20, 4, postDeadTr)
	f.pDeleted = f.createPost(t, "p-deleted", f.author, f.catLive, model.BlogStatusPublished, 1000, 5, nil, f.tagLive)
	f.pDraft = f.createPost(t, "p-draft", f.author, f.catLive, model.BlogStatusDraft, 5, 6, nil)
	f.pSibling = f.createPost(t, "p-sibling", f.author, f.catLive, model.BlogStatusPublished, 10, 7, nil)
	f.pSiblingGone = f.createPost(t, "p-sibling-gone", f.author, f.catLive, model.BlogStatusPublished, 999, 8, nil)
	f.pNoCategory = f.createPost(t, "p-no-category", f.author, nil, model.BlogStatusPublished, 1, 9, nil, f.tagLive, f.tagDeleted)
	f.pTagSibling = f.createPost(t, "p-tag-sibling", f.author, f.catTrDeleted, model.BlogStatusPublished, 2, 10, nil, f.tagLive)
	f.pTagSibGone = f.createPost(t, "p-tag-sibling-gone", f.author, f.catTrDeleted, model.BlogStatusPublished, 3, 11, nil, f.tagLive)
	f.pDeadTagOnly = f.createPost(t, "p-dead-tag-only", f.author, f.catTrDeleted, model.BlogStatusPublished, 4, 12, nil, f.tagDeleted)

	testdb.Delete(t, db, f.deletedAuthor)
	testdb.Delete(t, db, f.catDeleted)
	testdb.Delete(t, db, catTr)
	testdb.Delete(t, db, postDeadTr)
	testdb.Delete(t, db, f.tagDeleted)
	testdb.Delete(t, db, tagTr)
	testdb.Delete(t, db, f.pDeleted)
	testdb.Delete(t, db, f.pSiblingGone)
	testdb.Delete(t, db, f.pTagSibGone)
	return f
}

func postSlugs(posts []model.BlogPost) []string {
	out := make([]string, 0, len(posts))
	for _, p := range posts {
		out = append(out, p.Slug)
	}
	return out
}

func tagSlugs(tags []model.BlogTag) []string {
	out := make([]string, 0, len(tags))
	for _, tag := range tags {
		out = append(out, tag.Slug)
	}
	return out
}

func postBySlug(posts []model.BlogPost) map[string]model.BlogPost {
	out := map[string]model.BlogPost{}
	for _, p := range posts {
		out[p.Slug] = p
	}
	return out
}

func assertNoSoftDeletedPostParts(t *testing.T, label string, posts []model.BlogPost) {
	t.Helper()
	for _, p := range posts {
		if p.Author != nil && p.Author.DeletedAt.Valid {
			t.Fatalf("%s: %s exposes a soft-deleted author", label, p.Slug)
		}
		if p.Translation != nil && p.Translation.DeletedAt.Valid {
			t.Fatalf("%s: %s exposes a soft-deleted translation", label, p.Slug)
		}
		if p.Category != nil {
			if p.Category.DeletedAt.Valid {
				t.Fatalf("%s: %s exposes a soft-deleted category", label, p.Slug)
			}
			if p.Category.Translation != nil && p.Category.Translation.DeletedAt.Valid {
				t.Fatalf("%s: %s exposes a soft-deleted category translation", label, p.Slug)
			}
		}
		for _, tag := range p.Tags {
			if tag.DeletedAt.Valid {
				t.Fatalf("%s: %s exposes soft-deleted tag %s", label, p.Slug, tag.Slug)
			}
			if tag.Translation != nil && tag.Translation.DeletedAt.Valid {
				t.Fatalf("%s: %s exposes a soft-deleted tag translation", label, p.Slug)
			}
		}
	}
}

func (f *blogFixture) checkPostAssociations(t *testing.T, label string, bySlug map[string]model.BlogPost) {
	t.Helper()
	live, ok := bySlug["p-live"]
	if !ok {
		t.Fatalf("%s: p-live missing", label)
	}
	if live.Category == nil || live.Category.Translation == nil {
		t.Fatalf("%s: live post lost its live category/translation: %+v", label, live.Category)
	}
	if live.Translation == nil {
		t.Fatalf("%s: live post lost its live translation", label)
	}
	if live.Author == nil {
		t.Fatalf("%s: live post lost its live author", label)
	}
	assertStrings(t, label+": tags of p-live", tagSlugs(live.Tags), "salat", "puasa")
	for _, tag := range live.Tags {
		if tag.Slug == "puasa" && tag.Translation != nil {
			t.Fatalf("%s: soft-deleted tag translation leaked: %+v", label, tag.Translation)
		}
		if tag.Slug == "salat" && tag.Translation == nil {
			t.Fatalf("%s: live tag lost its live translation", label)
		}
	}

	if dead, ok := bySlug["p-dead-cat"]; !ok {
		t.Fatalf("%s: live post whose category is soft-deleted must still be returned", label)
	} else if dead.Category != nil {
		t.Fatalf("%s: soft-deleted category leaked: %+v", label, dead.Category)
	}

	if dead, ok := bySlug["p-dead-author"]; !ok {
		t.Fatalf("%s: live post whose author is soft-deleted must still be returned", label)
	} else if dead.Author != nil {
		t.Fatalf("%s: soft-deleted author leaked: %+v", label, dead.Author)
	}

	if tr, ok := bySlug["p-tr-cat"]; !ok {
		t.Fatalf("%s: live post whose category translation is soft-deleted must still be returned", label)
	} else if tr.Category == nil {
		t.Fatalf("%s: live category dropped because its translation is soft-deleted", label)
	} else if tr.Category.Translation != nil {
		t.Fatalf("%s: soft-deleted category translation leaked: %+v", label, tr.Category.Translation)
	} else if tr.Translation != nil {
		t.Fatalf("%s: soft-deleted post translation leaked: %+v", label, tr.Translation)
	}
}

func TestSoftDeleteBlogFindAllPosts(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	run := func(categoryID, tagID *int, status string) *paginate.Page {
		return runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
			return repo.FindAllPosts(ctx, categoryID, tagID, "", status), nil
		})
	}

	page := run(nil, nil, "")
	posts := pageItems[model.BlogPost](t, page.Items)
	wantPublished := []string{"p-live", "p-dead-cat", "p-dead-author", "p-tr-cat", "p-sibling", "p-no-category", "p-tag-sibling", "p-dead-tag-only"}
	assertStrings(t, "published posts", postSlugs(posts), wantPublished...)
	if page.Total != int64(len(wantPublished)) {
		t.Fatalf("total counts a soft-deleted post: got %d, want %d", page.Total, len(wantPublished))
	}
	f.checkPostAssociations(t, "FindAllPosts", postBySlug(posts))

	page = run(nil, nil, "all")
	posts = pageItems[model.BlogPost](t, page.Items)
	assertStrings(t, "all posts", postSlugs(posts), append(append([]string(nil), wantPublished...), "p-draft")...)

	page = run(f.catLive.ID, nil, "")
	assertStrings(t, "posts of live category", postSlugs(pageItems[model.BlogPost](t, page.Items)), "p-live", "p-dead-author", "p-sibling")

	page = run(nil, f.tagLive.ID, "")
	assertStrings(t, "posts of live tag", postSlugs(pageItems[model.BlogPost](t, page.Items)), "p-live", "p-no-category", "p-tag-sibling")

	page = run(f.catDeleted.ID, nil, "")
	if got := pageItems[model.BlogPost](t, page.Items); len(got) != 0 {
		t.Fatalf("filtering by soft-deleted category still returned posts: %v", postSlugs(got))
	}

	page = run(nil, f.tagDeleted.ID, "")
	if got := pageItems[model.BlogPost](t, page.Items); len(got) != 0 {
		t.Fatalf("filtering by soft-deleted tag still returned posts: %v", postSlugs(got))
	}
}

func TestSoftDeleteBlogFindPostBySlug(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	if _, err := repo.FindPostBySlug(f.pDeleted.Slug); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted post must not be found by slug: err = %v", err)
	}

	bySlug := map[string]model.BlogPost{}
	for _, p := range []*model.BlogPost{f.pLive, f.pDeadCat, f.pDeadAuthor, f.pTrCat} {
		got, err := repo.FindPostBySlug(p.Slug)
		if err != nil {
			t.Fatalf("FindPostBySlug(%s): %v", p.Slug, err)
		}
		bySlug[got.Slug] = *got
	}
	f.checkPostAssociations(t, "FindPostBySlug", bySlug)
}

func TestSoftDeleteBlogFindPostBySlugAny(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	if _, err := repo.FindPostBySlugAny(f.pDeleted.Slug); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted post must not be found by slug: err = %v", err)
	}
	if _, err := repo.FindPostBySlugAny(f.pDraft.Slug); err != nil {
		t.Fatalf("live draft post must be found: %v", err)
	}

	bySlug := map[string]model.BlogPost{}
	for _, p := range []*model.BlogPost{f.pLive, f.pDeadCat, f.pDeadAuthor, f.pTrCat} {
		got, err := repo.FindPostBySlugAny(p.Slug)
		if err != nil {
			t.Fatalf("FindPostBySlugAny(%s): %v", p.Slug, err)
		}
		bySlug[got.Slug] = *got
	}
	f.checkPostAssociations(t, "FindPostBySlugAny", bySlug)
}

func TestSoftDeleteBlogFindPostByID(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	if _, err := repo.FindPostByID(f.pDeleted.ID.String()); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted post must not be found by id: err = %v", err)
	}

	bySlug := map[string]model.BlogPost{}
	for _, p := range []*model.BlogPost{f.pLive, f.pDeadCat, f.pDeadAuthor, f.pTrCat} {
		got, err := repo.FindPostByID(p.ID.String())
		if err != nil {
			t.Fatalf("FindPostByID(%s): %v", p.Slug, err)
		}
		bySlug[got.Slug] = *got
	}
	f.checkPostAssociations(t, "FindPostByID", bySlug)
}

func TestSoftDeleteBlogFindPopularPosts(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	posts, err := repo.FindPopularPosts(100)
	if err != nil {
		t.Fatalf("FindPopularPosts: %v", err)
	}
	slugs := postSlugs(posts)
	assertStrings(t, "popular posts", slugs, "p-live", "p-dead-cat", "p-dead-author", "p-tr-cat", "p-sibling", "p-no-category", "p-tag-sibling", "p-dead-tag-only")
	if slugs[0] != "p-live" {
		t.Fatalf("most viewed live post should come first, got %v", slugs)
	}
	f.checkPostAssociations(t, "FindPopularPosts", postBySlug(posts))
}

func TestSoftDeleteBlogFindRelatedPosts(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	byCategory, err := repo.FindRelatedPosts(f.pLive.Slug, 50)
	if err != nil {
		t.Fatalf("FindRelatedPosts by category: %v", err)
	}
	assertStrings(t, "related by category", postSlugs(byCategory), "p-dead-author", "p-sibling")
	assertNoSoftDeletedPostParts(t, "FindRelatedPosts by category", byCategory)

	byTag, err := repo.FindRelatedPosts(f.pNoCategory.Slug, 50)
	if err != nil {
		t.Fatalf("FindRelatedPosts by tag: %v", err)
	}
	assertStrings(t, "related by tag", postSlugs(byTag), "p-live", "p-tag-sibling")
	assertNoSoftDeletedPostParts(t, "FindRelatedPosts by tag", byTag)

	if _, err := repo.FindRelatedPosts(f.pDeleted.Slug, 50); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("related posts of a soft-deleted post: err = %v", err)
	}
}

func TestSoftDeleteBlogFindPostsByCategorySlug(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	page := runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindPostsByCategorySlug(ctx, f.catLive.Slug), nil
	})
	catPosts := pageItems[model.BlogPost](t, page.Items)
	assertStrings(t, "posts of live category", postSlugs(catPosts), "p-live", "p-dead-author", "p-sibling")
	assertNoSoftDeletedPostParts(t, "FindPostsByCategorySlug", catPosts)
	if page.Total != 3 {
		t.Fatalf("total counts a soft-deleted post: got %d, want 3", page.Total)
	}

	page = runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindPostsByCategorySlug(ctx, f.catDeleted.Slug), nil
	})
	if got := pageItems[model.BlogPost](t, page.Items); len(got) != 0 {
		t.Fatalf("soft-deleted category slug still resolves to posts: %v", postSlugs(got))
	}
}

func TestSoftDeleteBlogFindPostsByTagSlug(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	page := runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindPostsByTagSlug(ctx, f.tagLive.Slug), nil
	})
	tagPosts := pageItems[model.BlogPost](t, page.Items)
	assertStrings(t, "posts of live tag", postSlugs(tagPosts), "p-live", "p-no-category", "p-tag-sibling")
	assertNoSoftDeletedPostParts(t, "FindPostsByTagSlug", tagPosts)
	if page.Total != 3 {
		t.Fatalf("total counts a soft-deleted post: got %d, want 3", page.Total)
	}

	page = runPage(t, "page=0&size=50", func(ctx *fiber.Ctx) (*paginate.Page, error) {
		return repo.FindPostsByTagSlug(ctx, f.tagDeleted.Slug), nil
	})
	if got := pageItems[model.BlogPost](t, page.Items); len(got) != 0 {
		t.Fatalf("soft-deleted tag slug still resolves to posts: %v", postSlugs(got))
	}
}

func TestSoftDeleteBlogFindAllCategories(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	categories, err := repo.FindAllCategories()
	if err != nil {
		t.Fatalf("FindAllCategories: %v", err)
	}
	var slugs []string
	for _, c := range categories {
		slugs = append(slugs, c.Slug)
		if c.Slug == "sirah" && c.Translation != nil {
			t.Fatalf("soft-deleted category translation leaked: %+v", c.Translation)
		}
		if c.Slug == "fiqh" && c.Translation == nil {
			t.Fatal("live category lost its live translation")
		}
	}
	assertStrings(t, "categories", slugs, "fiqh", "sirah")
}

func TestSoftDeleteBlogFindCategoryBySlug(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	if _, err := repo.FindCategoryBySlug(f.catDeleted.Slug); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted category must not be found by slug: err = %v", err)
	}
	live, err := repo.FindCategoryBySlug(f.catLive.Slug)
	if err != nil {
		t.Fatalf("FindCategoryBySlug live: %v", err)
	}
	if live.Translation == nil {
		t.Fatal("live category lost its live translation")
	}
	orphan, err := repo.FindCategoryBySlug(f.catTrDeleted.Slug)
	if err != nil {
		t.Fatalf("a live category whose translation is soft-deleted must still be found: %v", err)
	}
	if orphan.Translation != nil {
		t.Fatalf("soft-deleted translation leaked on live category: %+v", orphan.Translation)
	}
}

func TestSoftDeleteBlogFindAllTags(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	tags, err := repo.FindAllTags()
	if err != nil {
		t.Fatalf("FindAllTags: %v", err)
	}
	assertStrings(t, "tags", tagSlugs(tags), "salat", "puasa")
	for _, tag := range tags {
		if tag.Slug == "puasa" && tag.Translation != nil {
			t.Fatalf("soft-deleted tag translation leaked: %+v", tag.Translation)
		}
		if tag.Slug == "salat" && tag.Translation == nil {
			t.Fatal("live tag lost its live translation")
		}
	}
}

func TestSoftDeleteBlogFindTagBySlug(t *testing.T) {
	f := newBlogFixture(t)
	repo := repository.NewBlogRepository(f.db, paginate.New())

	if _, err := repo.FindTagBySlug(f.tagDeleted.Slug); !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("soft-deleted tag must not be found by slug: err = %v", err)
	}
	live, err := repo.FindTagBySlug(f.tagLive.Slug)
	if err != nil {
		t.Fatalf("FindTagBySlug live: %v", err)
	}
	if live.Translation == nil {
		t.Fatal("live tag lost its live translation")
	}
	orphan, err := repo.FindTagBySlug(f.tagTrDeleted.Slug)
	if err != nil {
		t.Fatalf("a live tag whose translation is soft-deleted must still be found: %v", err)
	}
	if orphan.Translation != nil {
		t.Fatalf("soft-deleted translation leaked on live tag: %+v", orphan.Translation)
	}
}
