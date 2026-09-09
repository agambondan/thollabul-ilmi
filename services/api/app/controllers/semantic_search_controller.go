package controllers

import (
	"context"
	"strings"

	"github.com/agambondan/islamic-explorer/app/lib"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type SemanticSearchController interface {
	SemanticSearch(ctx *fiber.Ctx) error
	Ask(ctx *fiber.Ctx) error
}

type semanticSearchController struct {
	svc service.ContentEmbeddingService
}

func NewSemanticSearchController(services *service.Services) SemanticSearchController {
	return &semanticSearchController{services.ContentEmbedding}
}

// SemanticSearch searches across Islamic content using semantic similarity
// @Summary Semantic search across Islamic content
// @Tags Semantic Search
// @Accept json
// @Produce json
// @Param q query string true "Search query"
// @Param types query string false "Comma-separated content types (quran,hadith,tafsir,asbabun_nuzul,doa,fiqh,sirah,blog,kajian)"
// @Param limit query int false "Results limit" default(10)
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /search/semantic [get]
func (c *semanticSearchController) SemanticSearch(ctx *fiber.Ctx) error {
	q := ctx.Query("q")
	if q == "" {
		return lib.ErrorBadRequest(ctx, "query parameter 'q' is required")
	}

	typesParam := ctx.Query("types", "quran,hadith,tafsir,asbabun_nuzul,doa,fiqh,sirah,blog,kajian")
	contentTypes := strings.Split(typesParam, ",")
	for i := range contentTypes {
		contentTypes[i] = strings.TrimSpace(contentTypes[i])
	}

	limit := 10
	if l := ctx.Query("limit"); l != "" {
		if v, err := parseInt(l); err == nil && v > 0 {
			limit = v
		}
	}

	results, err := c.svc.SemanticSearch(context.Background(), q, contentTypes, limit)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}

	return lib.OK(ctx, fiber.Map{
		"query":   q,
		"results": results,
		"count":   len(results),
	})
}

// Ask answers a question using Islamic content retrieval
// @Summary Ask a question with grounded Islamic sources
// @Tags Semantic Search
// @Accept json
// @Produce json
// @Param request body AskRequest true "Question request"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /ask [post]
func (c *semanticSearchController) Ask(ctx *fiber.Ctx) error {
	var req AskRequest
	if err := ctx.BodyParser(&req); err != nil {
		return lib.ErrorBadRequest(ctx, "Invalid request body")
	}

	if strings.TrimSpace(req.Question) == "" {
		return lib.ErrorBadRequest(ctx, "question is required")
	}

	contentTypes := req.Types
	if len(contentTypes) == 0 {
		contentTypes = []string{"quran", "hadith", "tafsir", "asbabun_nuzul", "doa", "fiqh", "sirah", "blog", "kajian"}
	}

	response, err := c.svc.AskQuestion(context.Background(), req.Question, contentTypes)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}

	return lib.OK(ctx, response)
}

type AskRequest struct {
	Question string   `json:"question"`
	Types    []string `json:"types,omitempty"`
}

func parseInt(s string) (int, error) {
	var n int
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, errInvalidInt
		}
		n = n*10 + int(c-'0')
	}
	return n, nil
}

var errInvalidInt = &parseError{}

type parseError struct{}

func (e *parseError) Error() string {
	return "invalid integer"
}
