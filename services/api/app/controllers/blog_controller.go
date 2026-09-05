package controllers

import (
	"strconv"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

type BlogController interface {
	FindAllPosts(ctx *fiber.Ctx) error
	FindPostBySlug(ctx *fiber.Ctx) error
	FindRelatedPosts(ctx *fiber.Ctx) error
	FindPopularPosts(ctx *fiber.Ctx) error
	PreviewPost(ctx *fiber.Ctx) error
	CreatePost(ctx *fiber.Ctx) error
	UpdatePost(ctx *fiber.Ctx) error
	DeletePost(ctx *fiber.Ctx) error
	FindPostsByCategorySlug(ctx *fiber.Ctx) error
	FindPostsByTagSlug(ctx *fiber.Ctx) error
	FindAllCategories(ctx *fiber.Ctx) error
	CreateCategory(ctx *fiber.Ctx) error
	UpdateCategory(ctx *fiber.Ctx) error
	DeleteCategory(ctx *fiber.Ctx) error
	FindAllTags(ctx *fiber.Ctx) error
	CreateTag(ctx *fiber.Ctx) error
	DeleteTag(ctx *fiber.Ctx) error
}

type blogController struct {
	svc service.BlogService
}

func NewBlogController(services *service.Services) BlogController {
	return &blogController{services.Blog}
}

// @Summary Get all blog posts with pagination
// @Tags Belajar
// @Accept json
// @Produce json
// @Param category_id query int false "Filter by category ID"
// @Param tag_id query int false "Filter by tag ID"
// @Param search query string false "Search keyword"
// @Param page query int false "Page number"
// @Param size query int false "Page size"
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /blog/posts [get]
func (c *blogController) FindAllPosts(ctx *fiber.Ctx) error {
	var categoryID *int
	var tagID *int
	if v := ctx.QueryInt("category_id", 0); v > 0 {
		categoryID = &v
	}
	if v := ctx.QueryInt("tag_id", 0); v > 0 {
		tagID = &v
	}
	status := strings.ToLower(strings.TrimSpace(ctx.Query("status")))
	if status != "" && status != "published" {
		claims, _ := lib.ExtractToken(ctx)
		if claims["role"] != string(model.RoleAdmin) {
			return lib.ErrorUnauthorized(ctx)
		}
	}
	page := c.svc.FindAllPosts(ctx, categoryID, tagID, ctx.Query("search"), status)
	filterBlogPostsPage(ctx, page)
	return lib.OK(ctx, page)
}

// @Summary Get blog post by slug
// @Tags Belajar
// @Accept json
// @Produce json
// @Param slug path string true "Post slug"
// @Success 200 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /blog/posts/{slug} [get]
func (c *blogController) FindPostBySlug(ctx *fiber.Ctx) error {
	post, err := c.svc.FindPostBySlug(ctx.Params("slug"))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	filterBlogPost(post, lib.GetPreferredLang(ctx))
	return lib.OK(ctx, post)
}

// @Summary Get related blog posts
// @Tags Belajar
// @Accept json
// @Produce json
// @Param slug path string true "Post slug"
// @Success 200 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /blog/posts/{slug}/related [get]
func (c *blogController) FindRelatedPosts(ctx *fiber.Ctx) error {
	posts, err := c.svc.FindRelatedPosts(ctx.Params("slug"))
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range posts {
		filterBlogPost(&posts[i], lang)
	}
	return lib.OK(ctx, posts)
}

// @Summary Get popular blog posts
// @Tags Belajar
// @Accept json
// @Produce json
// @Param limit query int false "Number of posts (default 10)"
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /blog/posts/popular [get]
func (c *blogController) FindPopularPosts(ctx *fiber.Ctx) error {
	posts, err := c.svc.FindPopularPosts(ctx.QueryInt("limit", 10))
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range posts {
		filterBlogPost(&posts[i], lang)
	}
	return lib.OK(ctx, posts)
}

func filterBlogPost(p *model.BlogPost, lang string) {
	if p == nil {
		return
	}
	p.Translation.FilterByLang(lang)
	if p.Category != nil {
		p.Category.Translation.FilterByLang(lang)
	}
	for i := range p.Tags {
		p.Tags[i].Translation.FilterByLang(lang)
	}
}

func filterBlogPostsPage(ctx *fiber.Ctx, page *paginate.Page) {
	lang := lib.GetPreferredLang(ctx)
	lib.ApplyToPageItems(page, func(p *model.BlogPost) {
		filterBlogPost(p, lang)
	})
}

// @Summary Preview blog post by ID
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Post ID"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /blog/posts/{id}/preview [get]
func (c *blogController) PreviewPost(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	claims, _ := lib.ExtractToken(ctx)
	isAdmin := claims["role"] == string(model.RoleAdmin)
	post, err := c.svc.PreviewPost(ctx.Params("id"), userID, isAdmin)
	if err != nil {
		if err.Error() == "forbidden" {
			return lib.ErrorForbidden(ctx)
		}
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, post)
}

// @Summary Create a blog post
// @Tags Belajar
// @Accept json
// @Produce json
// @Param post body model.CreateBlogPostRequest true "Post data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /blog/posts [post]
func (c *blogController) CreatePost(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	req := new(model.CreateBlogPostRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	post, err := c.svc.CreatePost(userID, req)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, post)
}

// @Summary Update a blog post
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Post ID"
// @Param post body model.UpdateBlogPostRequest true "Post data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /blog/posts/{id} [put]
func (c *blogController) UpdatePost(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	claims, _ := lib.ExtractToken(ctx)
	isAdmin := claims["role"] == string(model.RoleAdmin)

	req := new(model.UpdateBlogPostRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	post, err := c.svc.UpdatePost(ctx.Params("id"), userID, isAdmin, req)
	if err != nil {
		if err.Error() == "forbidden" {
			return lib.ErrorForbidden(ctx)
		}
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, post)
}

// @Summary Delete a blog post
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Post ID"
// @Success 200 {object} lib.Response
// @Failure 401 {object} lib.Response
// @Failure 403 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /blog/posts/{id} [delete]
func (c *blogController) DeletePost(ctx *fiber.Ctx) error {
	userID, err := extractUserID(ctx)
	if err != nil {
		return lib.ErrorUnauthorized(ctx)
	}
	claims, _ := lib.ExtractToken(ctx)
	isAdmin := claims["role"] == string(model.RoleAdmin)

	if err := c.svc.DeletePost(ctx.Params("id"), userID, isAdmin); err != nil {
		if err.Error() == "forbidden" {
			return lib.ErrorForbidden(ctx)
		}
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

// @Summary Get blog posts by category slug
// @Tags Belajar
// @Accept json
// @Produce json
// @Param slug path string true "Category slug"
// @Param page query int false "Page number"
// @Param size query int false "Page size"
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /blog/categories/{slug}/posts [get]
func (c *blogController) FindPostsByCategorySlug(ctx *fiber.Ctx) error {
	slug := ctx.Params("slug")
	page := c.svc.FindPostsByCategorySlug(ctx, slug)
	filterBlogPostsPage(ctx, page)
	return lib.OK(ctx, page)
}

// @Summary Get blog posts by tag slug
// @Tags Belajar
// @Accept json
// @Produce json
// @Param slug path string true "Tag slug"
// @Param page query int false "Page number"
// @Param size query int false "Page size"
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /blog/tags/{slug}/posts [get]
func (c *blogController) FindPostsByTagSlug(ctx *fiber.Ctx) error {
	slug := ctx.Params("slug")
	page := c.svc.FindPostsByTagSlug(ctx, slug)
	filterBlogPostsPage(ctx, page)
	return lib.OK(ctx, page)
}

// @Summary Get all blog categories
// @Tags Belajar
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /blog/categories [get]
func (c *blogController) FindAllCategories(ctx *fiber.Ctx) error {
	list, err := c.svc.FindAllCategories()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range list {
		list[i].Translation.FilterByLang(lang)
	}
	return lib.OK(ctx, list)
}

// @Summary Create a blog category
// @Tags Belajar
// @Accept json
// @Produce json
// @Param category body model.CreateBlogCategoryRequest true "Category data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /blog/categories [post]
func (c *blogController) CreateCategory(ctx *fiber.Ctx) error {
	req := new(model.CreateBlogCategoryRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	cat, err := c.svc.CreateCategory(req)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, cat)
}

// @Summary Update a blog category
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Param category body model.CreateBlogCategoryRequest true "Category data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /blog/categories/{id} [put]
func (c *blogController) UpdateCategory(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	req := new(model.CreateBlogCategoryRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	cat, err := c.svc.UpdateCategory(id, req)
	if err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx, cat)
}

// @Summary Delete a blog category
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Category ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /blog/categories/{id} [delete]
func (c *blogController) DeleteCategory(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteCategory(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}

// @Summary Get all blog tags
// @Tags Belajar
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /blog/tags [get]
func (c *blogController) FindAllTags(ctx *fiber.Ctx) error {
	list, err := c.svc.FindAllTags()
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range list {
		list[i].Translation.FilterByLang(lang)
	}
	return lib.OK(ctx, list)
}

// @Summary Create a blog tag
// @Tags Belajar
// @Accept json
// @Produce json
// @Param tag body model.CreateBlogTagRequest true "Tag data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 409 {object} lib.Response
// @Router /blog/tags [post]
func (c *blogController) CreateTag(ctx *fiber.Ctx) error {
	req := new(model.CreateBlogTagRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	tag, err := c.svc.CreateTag(req)
	if err != nil {
		return lib.ErrorConflict(ctx, err)
	}
	return lib.OK(ctx, tag)
}

// @Summary Delete a blog tag
// @Tags Belajar
// @Accept json
// @Produce json
// @Param id path int true "Tag ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 404 {object} lib.Response
// @Router /blog/tags/{id} [delete]
func (c *blogController) DeleteTag(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, "invalid id")
	}
	if err := c.svc.DeleteTag(id); err != nil {
		return lib.ErrorNotFound(ctx)
	}
	return lib.OK(ctx)
}
