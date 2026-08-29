package controllers

import (
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/sync/errgroup"
)

type SearchController interface {
	Search(ctx *fiber.Ctx) error
}

type searchController struct {
	svc service.SearchService
}

func NewSearchController(services *service.Services) SearchController {
	return &searchController{services.Search}
}

// Search Global search across Quran, Hadith, Doa, and Kajian
// @Summary Global search across Quran, Hadith, Doa, and Kajian
// @Tags Search
// @Accept json
// @Produce json
// @Param q query string true "Search query"
// @Param type query string false "Search type filter (all, ayah, hadith, doa, kajian)" default(all)
// @Param limit query int false "Results per page" default(20)
// @Param page query int false "Page number" default(0)
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /search [get]
func (c *searchController) Search(ctx *fiber.Ctx) error {
	q := ctx.Query("q")
	if q == "" {
		return lib.ErrorBadRequest(ctx, "query parameter 'q' is required")
	}
	searchType := ctx.Query("type", "all")
	limit, _ := strconv.Atoi(ctx.Query("limit", "20"))
	page, _ := strconv.Atoi(ctx.Query("page", "0"))
	lang := lib.GetPreferredLang(ctx)

	var bookID *int
	if raw := ctx.Query("book_id"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil && v > 0 {
			bookID = &v
		}
	}

	result, err := c.svc.Search(q, searchType, bookID, limit, page)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}

	g := new(errgroup.Group)
	g.Go(func() error {
		for i := range result.Ayahs {
			result.Ayahs[i].Translation.FilterByLang(lang)
			if result.Ayahs[i].Surah != nil {
				result.Ayahs[i].Surah.Translation.FilterByLang(lang)
			}
		}
		return nil
	})
	g.Go(func() error {
		for i := range result.Hadiths {
			result.Hadiths[i].Translation.FilterByLang(lang)
			if result.Hadiths[i].Book != nil {
				result.Hadiths[i].Book.Translation.FilterByLang(lang)
			}
			if result.Hadiths[i].Theme != nil {
				result.Hadiths[i].Theme.Translation.FilterByLang(lang)
			}
			if result.Hadiths[i].Chapter != nil {
				result.Hadiths[i].Chapter.Translation.FilterByLang(lang)
			}
		}
		return nil
	})
	g.Go(func() error {
		for i := range result.Doas {
			result.Doas[i].Translation.FilterByLang(lang)
		}
		return nil
	})
	g.Go(func() error {
		for i := range result.Kajians {
			result.Kajians[i].Translation.FilterByLang(lang)
		}
		return nil
	})
	if err := g.Wait(); err != nil {
		return lib.ErrorInternal(ctx)
	}

	return lib.OK(ctx, result)
}
