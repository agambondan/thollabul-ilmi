package repository

import (
	"database/sql"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type BlogRepository interface {
	// Posts
	FindAllPosts(*fiber.Ctx, *int, *int, string, string) *paginate.Page
	FindPostBySlug(string) (*model.BlogPost, error)
	FindPostByID(string) (*model.BlogPost, error)
	FindPostBySlugAny(string) (*model.BlogPost, error)
	SavePost(*model.BlogPost) (*model.BlogPost, error)
	UpdatePost(string, *model.BlogPost) (*model.BlogPost, error)
	DeletePost(string) error
	IncrementViewCount(string) error
	FindPopularPosts(int) ([]model.BlogPost, error)
	FindRelatedPosts(string, int) ([]model.BlogPost, error)
	// Posts by category/tag slug
	FindPostsByCategorySlug(*fiber.Ctx, string) *paginate.Page
	FindPostsByTagSlug(*fiber.Ctx, string) *paginate.Page
	// Categories
	FindAllCategories() ([]model.BlogCategory, error)
	FindCategoryBySlug(string) (*model.BlogCategory, error)
	SaveCategory(*model.BlogCategory) (*model.BlogCategory, error)
	UpdateCategory(int, *model.BlogCategory) (*model.BlogCategory, error)
	DeleteCategory(int) error
	// Tags
	FindAllTags() ([]model.BlogTag, error)
	FindTagBySlug(string) (*model.BlogTag, error)
	SaveTag(*model.BlogTag) (*model.BlogTag, error)
	DeleteTag(int) error
}

type blogRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewBlogRepository(db *gorm.DB, pg *paginate.Pagination) BlogRepository {
	return &blogRepo{db, pg}
}

func (r *blogRepo) postBase() *gorm.DB {
	return r.db.Model(&model.BlogPost{}).
		Preload("Author").
		Preload("Category").
		Preload("Category.Translation").
		Preload("Tags").
		Preload("Tags.Translation").
		Preload("Translation")
}

func (r *blogRepo) FindAllPosts(ctx *fiber.Ctx, categoryID *int, tagID *int, search, status string) *paginate.Page {
	var posts []model.BlogPost
	mod := r.postBase().Order("published_at desc, created_at desc")
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "":
		mod = mod.Where("blog_post.status = ?", model.BlogStatusPublished)
	case "all":
	default:
		mod = mod.Where("blog_post.status = ?", status)
	}
	if categoryID != nil {
		mod = mod.Where("blog_post.category_id = ?", *categoryID)
	}
	if tagID != nil {
		mod = mod.Joins("JOIN blog_post_tags ON blog_post_tags.blog_post_id = blog_post.id").
			Where("blog_post_tags.blog_tag_id = ?", *tagID)
	}
	if search != "" {
		like := "%" + search + "%"
		mod = mod.Where("(blog_post.title ILIKE ? OR blog_post.excerpt ILIKE ? OR blog_post.content ILIKE ?)", like, like, like)
	}
	page := r.pg.With(mod).Request(ctx.Request()).Response(&posts)
	return &page
}

func (r *blogRepo) FindPostBySlug(slug string) (*model.BlogPost, error) {
	var p model.BlogPost
	err := r.postBase().Where("blog_post.slug = ? AND blog_post.status = ?", slug, model.BlogStatusPublished).First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *blogRepo) FindPostBySlugAny(slug string) (*model.BlogPost, error) {
	var p model.BlogPost
	err := r.postBase().Where("blog_post.slug = ?", slug).First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *blogRepo) FindPostByID(id string) (*model.BlogPost, error) {
	var p model.BlogPost
	err := r.postBase().Where("blog_post.id = ?", id).First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *blogRepo) FindPopularPosts(limit int) ([]model.BlogPost, error) {
	if limit <= 0 {
		limit = 10
	}
	var posts []model.BlogPost
	err := r.postBase().
		Where("blog_post.status = ?", model.BlogStatusPublished).
		Order("view_count desc, published_at desc").
		Limit(limit).
		Find(&posts).Error
	return posts, err
}

func (r *blogRepo) FindRelatedPosts(slug string, limit int) ([]model.BlogPost, error) {
	if limit <= 0 {
		limit = 6
	}
	current, err := r.FindPostBySlug(slug)
	if err != nil {
		return nil, err
	}
	var posts []model.BlogPost
	q := r.postBase().
		Where("blog_post.status = ? AND blog_post.id <> ?", model.BlogStatusPublished, current.ID).
		Limit(limit).
		Order("published_at desc, created_at desc")
	if current.CategoryID != nil {
		q = q.Where("blog_post.category_id = ?", *current.CategoryID)
	} else if len(current.Tags) > 0 {
		tagIDs := make([]int, 0, len(current.Tags))
		for _, tag := range current.Tags {
			if tag.ID != nil {
				tagIDs = append(tagIDs, *tag.ID)
			}
		}
		if len(tagIDs) > 0 {
			q = q.Joins("JOIN blog_post_tags ON blog_post_tags.blog_post_id = blog_post.id").
				Where("blog_post_tags.blog_tag_id IN ?", tagIDs)
		}
	}
	err = q.Distinct("blog_post.*").Find(&posts).Error
	return posts, err
}

func (r *blogRepo) SavePost(p *model.BlogPost) (*model.BlogPost, error) {
	if err := r.db.Create(p).Error; err != nil {
		return nil, err
	}
	return r.FindPostByID(p.ID.String())
}

func (r *blogRepo) UpdatePost(id string, p *model.BlogPost) (*model.BlogPost, error) {
	if err := r.db.Model(&model.BlogPost{}).Where("id = ?", id).Updates(p).Error; err != nil {
		return nil, err
	}
	return r.FindPostByID(id)
}

func (r *blogRepo) DeletePost(id string) error {
	return r.db.Where("id = ?", id).Delete(&model.BlogPost{}).Error
}

func (r *blogRepo) IncrementViewCount(id string) error {
	return r.db.Model(&model.BlogPost{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

func (r *blogRepo) FindPostsByCategorySlug(ctx *fiber.Ctx, slug string) *paginate.Page {
	var posts []model.BlogPost
	mod := r.postBase().
		Joins("JOIN blog_categories ON blog_categories.id = blog_post.category_id").
		Where("blog_categories.slug = ? AND blog_post.status = ?", slug, model.BlogStatusPublished).
		Order("blog_post.published_at desc")
	page := r.pg.With(mod).Request(ctx.Request()).Response(&posts)
	return &page
}

func (r *blogRepo) FindPostsByTagSlug(ctx *fiber.Ctx, slug string) *paginate.Page {
	var posts []model.BlogPost
	mod := r.postBase().
		Joins("JOIN blog_post_tags ON blog_post_tags.blog_post_id = blog_post.id").
		Joins("JOIN blog_tags ON blog_tags.id = blog_post_tags.blog_tag_id").
		Where("blog_tags.slug = ? AND blog_post.status = ?", slug, model.BlogStatusPublished).
		Order("blog_post.published_at desc")
	page := r.pg.With(mod).Request(ctx.Request()).Response(&posts)
	return &page
}

func (r *blogRepo) categoryTableName() string {
	if r.db != nil && r.db.Migrator().HasTable("blog_category") {
		return "blog_category"
	}
	return "blog_categories"
}

func (r *blogRepo) tagTableName() string {
	if r.db != nil && r.db.Migrator().HasTable("blog_tag") {
		return "blog_tag"
	}
	return "blog_tags"
}

func scanBlogCategoryRow(scanner interface{ Scan(...interface{}) error }) (model.BlogCategory, error) {
	var item model.BlogCategory
	var tID *int
	var tIdn, tEn, tAr *string
	var createdAt, updatedAt *time.Time
	var desc sql.NullString

	err := scanner.Scan(
		&item.ID, &createdAt, &updatedAt, &item.DeletedAt,
		&item.Name, &item.Slug, &desc, &item.TranslationID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return item, err
	}
	item.CreatedAt = createdAt
	item.UpdatedAt = updatedAt
	if desc.Valid {
		item.Description = desc.String
	}
	if tID != nil {
		item.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}
	return item, nil
}

func scanBlogCategoryRows(rows *sql.Rows) ([]model.BlogCategory, error) {
	var list []model.BlogCategory
	for rows.Next() {
		item, err := scanBlogCategoryRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}

func scanBlogTagRow(scanner interface{ Scan(...interface{}) error }) (model.BlogTag, error) {
	var item model.BlogTag
	var tID *int
	var tIdn, tEn, tAr *string
	var createdAt, updatedAt *time.Time

	err := scanner.Scan(
		&item.ID, &createdAt, &updatedAt, &item.DeletedAt,
		&item.Name, &item.Slug, &item.TranslationID,
		&tID, &tIdn, &tEn, &tAr,
	)
	if err != nil {
		return item, err
	}
	item.CreatedAt = createdAt
	item.UpdatedAt = updatedAt
	if tID != nil {
		item.Translation = &model.Translation{
			BaseID: model.BaseID{ID: tID},
			Idn:    tIdn,
			En:     tEn,
			Ar:     tAr,
		}
	}
	return item, nil
}

func scanBlogTagRows(rows *sql.Rows) ([]model.BlogTag, error) {
	var list []model.BlogTag
	for rows.Next() {
		item, err := scanBlogTagRow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}

func (r *blogRepo) FindAllCategories() ([]model.BlogCategory, error) {
	tbl := r.categoryTableName()
	rows, err := r.db.Raw(`
		SELECT bc.id, bc.created_at, bc.updated_at, bc.deleted_at, bc.name, bc.slug, bc.description, bc.translation_id,
		       t.id, t.idn, t.en, t.ar
		FROM ` + tbl + ` bc
		LEFT JOIN translation t ON t.id = bc.translation_id AND t.deleted_at IS NULL
		WHERE bc.deleted_at IS NULL
		ORDER BY bc.name ASC
	`).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanBlogCategoryRows(rows)
}

func (r *blogRepo) FindCategoryBySlug(slug string) (*model.BlogCategory, error) {
	tbl := r.categoryTableName()
	rows, err := r.db.Raw(`
		SELECT bc.id, bc.created_at, bc.updated_at, bc.deleted_at, bc.name, bc.slug, bc.description, bc.translation_id,
		       t.id, t.idn, t.en, t.ar
		FROM ` + tbl + ` bc
		LEFT JOIN translation t ON t.id = bc.translation_id AND t.deleted_at IS NULL
		WHERE bc.slug = ? AND bc.deleted_at IS NULL
		LIMIT 1
	`, slug).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, gorm.ErrRecordNotFound
	}
	item, err := scanBlogCategoryRow(rows)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *blogRepo) SaveCategory(c *model.BlogCategory) (*model.BlogCategory, error) {
	if err := r.db.Create(c).Error; err != nil {
		return nil, err
	}
	return c, nil
}

func (r *blogRepo) UpdateCategory(id int, c *model.BlogCategory) (*model.BlogCategory, error) {
	if err := r.db.Model(&model.BlogCategory{}).Where("id = ?", id).Updates(c).Error; err != nil {
		return nil, err
	}
	var updated model.BlogCategory
	r.db.First(&updated, id)
	return &updated, nil
}

func (r *blogRepo) DeleteCategory(id int) error {
	return r.db.Delete(&model.BlogCategory{}, id).Error
}

func (r *blogRepo) FindAllTags() ([]model.BlogTag, error) {
	tbl := r.tagTableName()
	rows, err := r.db.Raw(`
		SELECT bt.id, bt.created_at, bt.updated_at, bt.deleted_at, bt.name, bt.slug, bt.translation_id,
		       t.id, t.idn, t.en, t.ar
		FROM ` + tbl + ` bt
		LEFT JOIN translation t ON t.id = bt.translation_id AND t.deleted_at IS NULL
		WHERE bt.deleted_at IS NULL
		ORDER BY bt.name ASC
	`).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanBlogTagRows(rows)
}

func (r *blogRepo) FindTagBySlug(slug string) (*model.BlogTag, error) {
	tbl := r.tagTableName()
	rows, err := r.db.Raw(`
		SELECT bt.id, bt.created_at, bt.updated_at, bt.deleted_at, bt.name, bt.slug, bt.translation_id,
		       t.id, t.idn, t.en, t.ar
		FROM ` + tbl + ` bt
		LEFT JOIN translation t ON t.id = bt.translation_id AND t.deleted_at IS NULL
		WHERE bt.slug = ? AND bt.deleted_at IS NULL
		LIMIT 1
	`, slug).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	if !rows.Next() {
		if err := rows.Err(); err != nil {
			return nil, err
		}
		return nil, gorm.ErrRecordNotFound
	}
	item, err := scanBlogTagRow(rows)
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *blogRepo) SaveTag(t *model.BlogTag) (*model.BlogTag, error) {
	if err := r.db.Create(t).Error; err != nil {
		return nil, err
	}
	return t, nil
}

func (r *blogRepo) DeleteTag(id int) error {
	return r.db.Delete(&model.BlogTag{}, id).Error
}
