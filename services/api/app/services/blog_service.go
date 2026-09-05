package service

import (
	"errors"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/morkid/paginate"
)

type BlogService interface {
	FindAllPosts(ctx *fiber.Ctx, categoryID *int, tagID *int, search, status string) *paginate.Page
	FindPostBySlug(slug string) (*model.BlogPost, error)
	FindRelatedPosts(slug string) ([]model.BlogPost, error)
	FindPopularPosts(limit int) ([]model.BlogPost, error)
	PreviewPost(id string, authorID uuid.UUID, isAdmin bool) (*model.BlogPost, error)
	CreatePost(authorID uuid.UUID, req *model.CreateBlogPostRequest) (*model.BlogPost, error)
	UpdatePost(id string, authorID uuid.UUID, isAdmin bool, req *model.UpdateBlogPostRequest) (*model.BlogPost, error)
	DeletePost(id string, authorID uuid.UUID, isAdmin bool) error
	FindPostsByCategorySlug(ctx *fiber.Ctx, slug string) *paginate.Page
	FindPostsByTagSlug(ctx *fiber.Ctx, slug string) *paginate.Page
	FindAllCategories() ([]model.BlogCategory, error)
	CreateCategory(req *model.CreateBlogCategoryRequest) (*model.BlogCategory, error)
	UpdateCategory(id int, req *model.CreateBlogCategoryRequest) (*model.BlogCategory, error)
	DeleteCategory(id int) error
	FindAllTags() ([]model.BlogTag, error)
	CreateTag(req *model.CreateBlogTagRequest) (*model.BlogTag, error)
	DeleteTag(id int) error
}

type blogService struct {
	repo repository.BlogRepository
}

func NewBlogService(repo repository.BlogRepository) BlogService {
	return &blogService{repo}
}

func slugify(s string) string {
	s = strings.ToLower(s)
	var b strings.Builder
	prevDash := false
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
			prevDash = false
		} else if !prevDash {
			b.WriteRune('-')
			prevDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

func (s *blogService) FindPostsByCategorySlug(ctx *fiber.Ctx, slug string) *paginate.Page {
	return s.repo.FindPostsByCategorySlug(ctx, slug)
}

func (s *blogService) FindPostsByTagSlug(ctx *fiber.Ctx, slug string) *paginate.Page {
	return s.repo.FindPostsByTagSlug(ctx, slug)
}

func (s *blogService) FindAllPosts(ctx *fiber.Ctx, categoryID *int, tagID *int, search, status string) *paginate.Page {
	return s.repo.FindAllPosts(ctx, categoryID, tagID, search, status)
}

func (s *blogService) FindPostBySlug(slug string) (*model.BlogPost, error) {
	post, err := s.repo.FindPostBySlug(slug)
	if err != nil {
		return nil, err
	}
	_ = s.repo.IncrementViewCount(post.ID.String())
	post.ViewCount++
	return post, nil
}

func (s *blogService) FindRelatedPosts(slug string) ([]model.BlogPost, error) {
	return s.repo.FindRelatedPosts(slug, 6)
}

func (s *blogService) FindPopularPosts(limit int) ([]model.BlogPost, error) {
	return s.repo.FindPopularPosts(limit)
}

func (s *blogService) PreviewPost(id string, authorID uuid.UUID, isAdmin bool) (*model.BlogPost, error) {
	post, err := s.repo.FindPostByID(id)
	if err != nil {
		return nil, errors.New("post not found")
	}
	if !isAdmin && post.AuthorID != authorID {
		return nil, errors.New("forbidden")
	}
	return post, nil
}

func (s *blogService) CreatePost(authorID uuid.UUID, req *model.CreateBlogPostRequest) (*model.BlogPost, error) {
	slug := uniqueBlogSlug(req.Title, func(candidate string) bool {
		_, err := s.repo.FindPostBySlugAny(candidate)
		return err == nil
	})

	status := req.Status
	if status == "" {
		status = model.BlogStatusDraft
	}

	post := &model.BlogPost{
		BaseUUID:   model.BaseUUID{ID: uuid.New()},
		AuthorID:   authorID,
		CategoryID: req.CategoryID,
		Title:      req.Title,
		Slug:       slug,
		Excerpt:    req.Excerpt,
		Content:    req.Content,
		CoverImage: req.CoverImage,
		Status:     status,
	}

	if status == model.BlogStatusPublished {
		now := time.Now()
		post.PublishedAt = &now
	}

	if len(req.Tags) > 0 {
		var tags []model.BlogTag
		for _, tagID := range req.Tags {
			tags = append(tags, model.BlogTag{BaseID: model.BaseID{ID: &tagID}})
		}
		post.Tags = tags
	}

	return s.repo.SavePost(post)
}

func (s *blogService) UpdatePost(id string, authorID uuid.UUID, isAdmin bool, req *model.UpdateBlogPostRequest) (*model.BlogPost, error) {
	existing, err := s.repo.FindPostByID(id)
	if err != nil {
		return nil, errors.New("post not found")
	}
	if !isAdmin && existing.AuthorID != authorID {
		return nil, errors.New("forbidden")
	}

	updates := &model.BlogPost{}
	if req.Title != nil {
		updates.Title = *req.Title
		updates.Slug = uniqueBlogSlug(*req.Title, func(candidate string) bool {
			found, err := s.repo.FindPostBySlugAny(candidate)
			return err == nil && found != nil && found.ID.String() != id
		})
	}
	if req.Excerpt != nil {
		updates.Excerpt = *req.Excerpt
	}
	if req.Content != nil {
		updates.Content = *req.Content
	}
	if req.CoverImage != nil {
		updates.CoverImage = req.CoverImage
	}
	if req.CategoryID != nil {
		updates.CategoryID = req.CategoryID
	}
	if req.Status != nil {
		updates.Status = *req.Status
		if *req.Status == model.BlogStatusPublished && existing.PublishedAt == nil {
			now := time.Now()
			updates.PublishedAt = &now
		}
	}

	return s.repo.UpdatePost(id, updates)
}

func (s *blogService) DeletePost(id string, authorID uuid.UUID, isAdmin bool) error {
	existing, err := s.repo.FindPostByID(id)
	if err != nil {
		return errors.New("post not found")
	}
	if !isAdmin && existing.AuthorID != authorID {
		return errors.New("forbidden")
	}
	return s.repo.DeletePost(id)
}

func uniqueBlogSlug(title string, exists func(string) bool) string {
	base := slugify(title)
	if base == "" {
		base = "post"
	}
	slug := base
	for index := 2; exists(slug); index++ {
		slug = base + "-" + strconv.Itoa(index)
	}
	return slug
}

func (s *blogService) FindAllCategories() ([]model.BlogCategory, error) {
	return s.repo.FindAllCategories()
}

func (s *blogService) CreateCategory(req *model.CreateBlogCategoryRequest) (*model.BlogCategory, error) {
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Name)
	}
	c := &model.BlogCategory{Name: req.Name, Slug: slug, Description: req.Description}
	return s.repo.SaveCategory(c)
}

func (s *blogService) UpdateCategory(id int, req *model.CreateBlogCategoryRequest) (*model.BlogCategory, error) {
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Name)
	}
	c := &model.BlogCategory{Name: req.Name, Slug: slug, Description: req.Description}
	return s.repo.UpdateCategory(id, c)
}

func (s *blogService) DeleteCategory(id int) error {
	return s.repo.DeleteCategory(id)
}

func (s *blogService) FindAllTags() ([]model.BlogTag, error) {
	return s.repo.FindAllTags()
}

func (s *blogService) CreateTag(req *model.CreateBlogTagRequest) (*model.BlogTag, error) {
	slug := req.Slug
	if slug == "" {
		slug = slugify(req.Name)
	}
	t := &model.BlogTag{Name: req.Name, Slug: slug}
	return s.repo.SaveTag(t)
}

func (s *blogService) DeleteTag(id int) error {
	return s.repo.DeleteTag(id)
}
