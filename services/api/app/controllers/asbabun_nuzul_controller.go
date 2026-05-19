package controllers

import (
	"fmt"
	"sort"
	"strconv"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	service "github.com/agambondan/islamic-explorer/app/services"
	"github.com/gofiber/fiber/v2"
)

type AsbabunNuzulController interface {
	FindAll(ctx *fiber.Ctx) error
	FindByAyahID(ctx *fiber.Ctx) error
	FindBySurahNumber(ctx *fiber.Ctx) error
	Create(ctx *fiber.Ctx) error
	Update(ctx *fiber.Ctx) error
	Delete(ctx *fiber.Ctx) error
}

type asbabunNuzulController struct {
	svc service.AsbabunNuzulService
}

type asbabunNuzulRequest struct {
	Title       string                `json:"title" validate:"required"`
	Narrator    string                `json:"narrator"`
	Content     string                `json:"content" validate:"required"`
	Source      string                `json:"source"`
	DisplayRef  string                `json:"display_ref"`
	SurahNumber int                   `json:"surah_number" validate:"required,gt=0"`
	AyahNumber  int                   `json:"ayah_number" validate:"gt=0"`
	AyahStart   int                   `json:"ayah_start" validate:"gt=0"`
	AyahEnd     int                   `json:"ayah_end" validate:"gt=0"`
	AyahIDs     []int                 `json:"ayah_ids"`
	AyahRefs    []model.AyahReference `json:"ayah_refs"`
}

type asbabunNuzulResponse struct {
	ID            *int                  `json:"id,omitempty"`
	Title         string                `json:"title"`
	Narrator      string                `json:"narrator"`
	Content       string                `json:"content"`
	Source        string                `json:"source"`
	DisplayRef    string                `json:"display_ref"`
	SurahNumber   int                   `json:"surah_number,omitempty"`
	AyahNumber    int                   `json:"ayah_number,omitempty"`
	AyahStart     int                   `json:"ayah_start,omitempty"`
	AyahEnd       int                   `json:"ayah_end,omitempty"`
	AyahIDs       []int                 `json:"ayah_ids,omitempty"`
	AyahRefs      []model.AyahReference `json:"ayah_refs,omitempty"`
	Ayahs         []model.Ayah          `json:"ayahs,omitempty"`
	TranslationID *int                  `json:"translation_id,omitempty"`
	Translation   *model.Translation    `json:"translation,omitempty"`
}

func NewAsbabunNuzulController(services *service.Services) AsbabunNuzulController {
	return &asbabunNuzulController{services.AsbabunNuzul}
}

// FindAll asbabun nuzul
// @Summary List all asbabun nuzul
// @Description Get paginated list of all asbabun nuzul (reasons for revelation)
// @Accept json
// @Produce json
// @Success 200 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /asbabun-nuzul [get]
// @Tags AsbabunNuzul
func (c *asbabunNuzulController) FindAll(ctx *fiber.Ctx) error {
	page := ctx.QueryInt("page", 0)
	size := ctx.QueryInt("size", 100)
	if size > 500 {
		size = 500
	}

	items, err := c.svc.FindAll(page, size)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range items {
		if items[i].Translation != nil {
			items[i].Translation.FilterByLang(lang)
		}
	}
	return lib.OK(ctx, fiber.Map{"items": asbabunNuzulResponses(items), "page": page, "size": size})
}

// FindByAyahID asbabun nuzul
// @Summary Get asbabun nuzul by ayah ID
// @Description Get reasons for revelation for a specific ayah
// @Accept json
// @Produce json
// @Param id path int true "Ayah ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /asbabun-nuzul/ayah/{id} [get]
// @Tags AsbabunNuzul
func (c *asbabunNuzulController) FindByAyahID(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	items, err := c.svc.FindByAyahID(id)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range items {
		if items[i].Translation != nil {
			items[i].Translation.FilterByLang(lang)
		}
	}
	return lib.OK(ctx, asbabunNuzulResponses(items))
}

// FindBySurahNumber asbabun nuzul
// @Summary Get asbabun nuzul by surah number
// @Description Get reasons for revelation for a surah
// @Accept json
// @Produce json
// @Param number path int true "Surah number"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /asbabun-nuzul/surah/{number} [get]
// @Tags AsbabunNuzul
func (c *asbabunNuzulController) FindBySurahNumber(ctx *fiber.Ctx) error {
	number, err := strconv.Atoi(ctx.Params("number"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	limit, offset := lib.GetLimitOffset(ctx)
	if limit > 100 {
		limit = 100
	}
	items, err := c.svc.FindBySurahNumber(number, lib.FetchLimitForMeta(ctx, limit), offset)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	lang := lib.GetPreferredLang(ctx)
	for i := range items {
		if items[i].Translation != nil {
			items[i].Translation.FilterByLang(lang)
		}
	}
	items, hasMore := lib.TrimPaginationItems(items, limit)
	return lib.OKPaginated(ctx, asbabunNuzulResponses(items), limit, offset, hasMore)
}

// Create asbabun nuzul
// @Summary Create asbabun nuzul
// @Description Create a new asbabun nuzul entry
// @Accept json
// @Produce json
// @Param body body asbabunNuzulRequest true "Asbabun nuzul data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /asbabun-nuzul [post]
// @Tags AsbabunNuzul
func (c *asbabunNuzulController) Create(ctx *fiber.Ctx) error {
	req := new(asbabunNuzulRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, ayahIDs, err := c.buildAsbabunMutation(req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err.Error())
	}
	result, err := c.svc.CreateWithAyahs(item, ayahIDs)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, asbabunNuzulToResponse(result))
}

// Update asbabun nuzul
// @Summary Update asbabun nuzul
// @Description Update asbabun nuzul by ID
// @Accept json
// @Produce json
// @Param id path int true "Asbabun nuzul ID"
// @Param body body asbabunNuzulRequest true "Asbabun nuzul data"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /asbabun-nuzul/{id} [put]
// @Tags AsbabunNuzul
func (c *asbabunNuzulController) Update(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	req := new(asbabunNuzulRequest)
	if err := lib.BodyParser(ctx, req); err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	item, ayahIDs, err := c.buildAsbabunMutation(req)
	if err != nil {
		return lib.ErrorBadRequest(ctx, err.Error())
	}
	result, err := c.svc.UpdateWithAyahs(id, item, ayahIDs)
	if err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, asbabunNuzulToResponse(result))
}

// Delete asbabun nuzul
// @Summary Delete asbabun nuzul
// @Description Delete asbabun nuzul by ID
// @Accept json
// @Produce json
// @Param id path int true "Asbabun nuzul ID"
// @Success 200 {object} lib.Response
// @Failure 400 {object} lib.Response
// @Failure 500 {object} lib.Response
// @Router /asbabun-nuzul/{id} [delete]
// @Tags AsbabunNuzul
func (c *asbabunNuzulController) Delete(ctx *fiber.Ctx) error {
	id, err := strconv.Atoi(ctx.Params("id"))
	if err != nil {
		return lib.ErrorBadRequest(ctx, err)
	}
	if err := c.svc.Delete(id); err != nil {
		return lib.ErrorInternal(ctx)
	}
	return lib.OK(ctx, nil)
}

func (c *asbabunNuzulController) buildAsbabunMutation(req *asbabunNuzulRequest) (*model.AsbabunNuzul, []int, error) {
	if req.Title == "" {
		return nil, nil, fiber.NewError(fiber.StatusBadRequest, "title is required")
	}
	if req.Content == "" {
		return nil, nil, fiber.NewError(fiber.StatusBadRequest, "content is required")
	}

	ayahIDs := uniqueAsbabunIDs(req.AyahIDs)
	refs := normalizeAsbabunRefs(req)
	if len(ayahIDs) == 0 {
		if len(refs) == 0 {
			return nil, nil, fiber.NewError(fiber.StatusBadRequest, "ayah reference is required")
		}
		var err error
		ayahIDs, err = c.svc.ResolveAyahIDs(refs)
		if err != nil {
			return nil, nil, err
		}
	}

	displayRef := req.DisplayRef
	if displayRef == "" {
		displayRef = formatAsbabunDisplayRef(refs)
	}

	return &model.AsbabunNuzul{
		Title:      req.Title,
		Narrator:   req.Narrator,
		Content:    req.Content,
		Source:     req.Source,
		DisplayRef: displayRef,
	}, ayahIDs, nil
}

func normalizeAsbabunRefs(req *asbabunNuzulRequest) []model.AyahReference {
	if len(req.AyahRefs) > 0 {
		refs := make([]model.AyahReference, 0, len(req.AyahRefs))
		for _, ref := range req.AyahRefs {
			if ref.SurahNumber > 0 && ref.AyahNumber > 0 {
				refs = append(refs, ref)
			}
		}
		return refs
	}
	if req.SurahNumber <= 0 {
		return nil
	}

	start := req.AyahStart
	if start == 0 {
		start = req.AyahNumber
	}
	end := req.AyahEnd
	if end == 0 {
		end = start
	}
	if start <= 0 {
		return nil
	}
	if end < start {
		end = start
	}
	if end-start > 300 {
		end = start + 300
	}

	refs := make([]model.AyahReference, 0, end-start+1)
	for ayah := start; ayah <= end; ayah++ {
		refs = append(refs, model.AyahReference{
			SurahNumber: req.SurahNumber,
			AyahNumber:  ayah,
		})
	}
	return refs
}

func formatAsbabunDisplayRef(refs []model.AyahReference) string {
	if len(refs) == 0 {
		return ""
	}
	sorted := append([]model.AyahReference(nil), refs...)
	sort.Slice(sorted, func(i, j int) bool {
		if sorted[i].SurahNumber == sorted[j].SurahNumber {
			return sorted[i].AyahNumber < sorted[j].AyahNumber
		}
		return sorted[i].SurahNumber < sorted[j].SurahNumber
	})
	first := sorted[0]
	last := sorted[len(sorted)-1]
	if first.SurahNumber == last.SurahNumber && first.AyahNumber == last.AyahNumber {
		return fmt.Sprintf("QS %d:%d", first.SurahNumber, first.AyahNumber)
	}
	if first.SurahNumber == last.SurahNumber {
		return fmt.Sprintf("QS %d:%d-%d", first.SurahNumber, first.AyahNumber, last.AyahNumber)
	}
	return fmt.Sprintf("QS %d:%d - QS %d:%d", first.SurahNumber, first.AyahNumber, last.SurahNumber, last.AyahNumber)
}

func asbabunNuzulResponses(items []model.AsbabunNuzul) []asbabunNuzulResponse {
	result := make([]asbabunNuzulResponse, 0, len(items))
	for i := range items {
		result = append(result, asbabunNuzulToResponse(&items[i]))
	}
	return result
}

func asbabunNuzulToResponse(item *model.AsbabunNuzul) asbabunNuzulResponse {
	refs, ayahIDs := refsFromAsbabunAyahs(item.Ayahs)
	resp := asbabunNuzulResponse{
		ID:            item.ID,
		Title:         item.Title,
		Narrator:      item.Narrator,
		Content:       item.Content,
		Source:        item.Source,
		DisplayRef:    item.DisplayRef,
		AyahIDs:       ayahIDs,
		AyahRefs:      refs,
		Ayahs:         item.Ayahs,
		TranslationID: item.TranslationID,
		Translation:   item.Translation,
	}
	if len(refs) > 0 {
		resp.SurahNumber = refs[0].SurahNumber
		resp.AyahNumber = refs[0].AyahNumber
		resp.AyahStart = refs[0].AyahNumber
		resp.AyahEnd = refs[len(refs)-1].AyahNumber
	}
	return resp
}

func refsFromAsbabunAyahs(ayahs []model.Ayah) ([]model.AyahReference, []int) {
	refs := make([]model.AyahReference, 0, len(ayahs))
	ids := make([]int, 0, len(ayahs))
	for _, ayah := range ayahs {
		if ayah.ID != nil {
			ids = append(ids, *ayah.ID)
		}
		if ayah.Number == nil || ayah.Surah == nil || ayah.Surah.Number == nil {
			continue
		}
		refs = append(refs, model.AyahReference{
			SurahNumber: *ayah.Surah.Number,
			AyahNumber:  *ayah.Number,
		})
	}
	sort.Slice(refs, func(i, j int) bool {
		if refs[i].SurahNumber == refs[j].SurahNumber {
			return refs[i].AyahNumber < refs[j].AyahNumber
		}
		return refs[i].SurahNumber < refs[j].SurahNumber
	})
	sort.Ints(ids)
	return refs, uniqueAsbabunIDs(ids)
}

func uniqueAsbabunIDs(values []int) []int {
	seen := map[int]bool{}
	result := make([]int, 0, len(values))
	for _, value := range values {
		if value <= 0 || seen[value] {
			continue
		}
		seen[value] = true
		result = append(result, value)
	}
	return result
}
