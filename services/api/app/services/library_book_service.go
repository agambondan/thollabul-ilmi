package service

import (
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

type LibraryBookService interface {
	FindAll(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page
	FindAllAdmin(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page
	FindByIDAny(id int) (*model.LibraryBook, error)
	FindBySlug(slug string) (*model.LibraryBook, error)
	Create(req *model.CreateLibraryBookRequest) (*model.LibraryBook, error)
	Update(id int, req *model.CreateLibraryBookRequest) (*model.LibraryBook, error)
	UpdateResource(id int, resource *model.LibraryBookResource) (*model.LibraryBook, error)
	ClearResource(id int) (*model.LibraryBook, error)
	UpdateCover(id int, cover *model.LibraryBookCover) (*model.LibraryBook, error)
	ClearCover(id int) (*model.LibraryBook, error)
	ExtractText(id int) error
	FindExtractedPages(id int) ([]model.LibraryBookExtractedText, error)
	SaveManualPages(id int, pages []model.ManualExtractedPage) error
	GenerateDraft(id int, req *model.GenerateDraftRequest) (*model.GenerateDraftResponse, error)
	Delete(id int) error
}

type libraryBookService struct {
	repo repository.LibraryBookRepository
}

func NewLibraryBookService(repo repository.LibraryBookRepository) LibraryBookService {
	return &libraryBookService{repo: repo}
}

func (s *libraryBookService) FindAll(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page {
	return s.repo.FindAll(ctx, category, level, search)
}

func (s *libraryBookService) FindAllAdmin(ctx *fiber.Ctx, category string, level string, search string) *paginate.Page {
	return s.repo.FindAllAdmin(ctx, category, level, search)
}

func (s *libraryBookService) FindBySlug(slug string) (*model.LibraryBook, error) {
	return s.repo.FindBySlug(slug)
}

func (s *libraryBookService) FindByIDAny(id int) (*model.LibraryBook, error) {
	return s.repo.FindByIDAny(id)
}

func (s *libraryBookService) Create(req *model.CreateLibraryBookRequest) (*model.LibraryBook, error) {
	status := req.Status
	if status == "" {
		status = model.LibraryBookStatusPublished
	}
	format := req.Format
	if format == "" {
		format = model.LibraryBookFormatLink
	}
	sourceType := req.SourceType
	if sourceType == "" {
		sourceType = model.LibraryBookSourceExternal
	}
	licenseStatus := req.LicenseStatus
	if licenseStatus == "" {
		licenseStatus = model.LibraryBookLicenseUnverified
	}
	slug := req.Slug
	if slug == "" {
		slug = uniqueLibraryBookSlug(req.Title, func(candidate string) bool {
			_, err := s.repo.FindBySlugAny(candidate)
			return err == nil
		})
	}

	return s.repo.Create(&model.LibraryBook{
		Title:            req.Title,
		Slug:             slug,
		Author:           req.Author,
		Description:      req.Description,
		Category:         req.Category,
		Level:            req.Level,
		Language:         req.Language,
		Format:           format,
		SourceType:       sourceType,
		SourceURL:        req.SourceURL,
		CoverURL:         req.CoverURL,
		FileName:         req.FileName,
		FileMimeType:     req.FileMimeType,
		FileSizeBytes:    req.FileSizeBytes,
		FileURL:          req.FileURL,
		ChecksumSHA256:   req.ChecksumSHA256,
		License:          req.License,
		LicenseStatus:    licenseStatus,
		SourceNote:       req.SourceNote,
		IsSourceVerified: req.IsSourceVerified,
		Pages:            req.Pages,
		Tags:             req.Tags,
		Status:           status,
	})
}

func (s *libraryBookService) Update(id int, req *model.CreateLibraryBookRequest) (*model.LibraryBook, error) {
	status := req.Status
	if status == "" {
		status = model.LibraryBookStatusPublished
	}
	format := req.Format
	if format == "" {
		format = model.LibraryBookFormatLink
	}
	sourceType := req.SourceType
	if sourceType == "" {
		sourceType = model.LibraryBookSourceExternal
	}
	licenseStatus := req.LicenseStatus
	if licenseStatus == "" {
		licenseStatus = model.LibraryBookLicenseUnverified
	}
	slug := req.Slug
	if slug == "" {
		slug = uniqueLibraryBookSlug(req.Title, func(candidate string) bool {
			found, err := s.repo.FindBySlugAny(candidate)
			return err == nil && found != nil && found.ID != nil && *found.ID != id
		})
	}

	return s.repo.Update(id, &model.LibraryBook{
		Title:            req.Title,
		Slug:             slug,
		Author:           req.Author,
		Description:      req.Description,
		Category:         req.Category,
		Level:            req.Level,
		Language:         req.Language,
		Format:           format,
		SourceType:       sourceType,
		SourceURL:        req.SourceURL,
		CoverURL:         req.CoverURL,
		FileName:         req.FileName,
		FileMimeType:     req.FileMimeType,
		FileSizeBytes:    req.FileSizeBytes,
		FileURL:          req.FileURL,
		ChecksumSHA256:   req.ChecksumSHA256,
		License:          req.License,
		LicenseStatus:    licenseStatus,
		SourceNote:       req.SourceNote,
		IsSourceVerified: req.IsSourceVerified,
		Pages:            req.Pages,
		Tags:             req.Tags,
		Status:           status,
	})
}

func (s *libraryBookService) UpdateResource(id int, resource *model.LibraryBookResource) (*model.LibraryBook, error) {
	return s.repo.UpdateResource(id, resource)
}

func (s *libraryBookService) ClearResource(id int) (*model.LibraryBook, error) {
	return s.repo.ClearResource(id)
}

func (s *libraryBookService) UpdateCover(id int, cover *model.LibraryBookCover) (*model.LibraryBook, error) {
	return s.repo.UpdateCover(id, cover)
}

func (s *libraryBookService) ClearCover(id int) (*model.LibraryBook, error) {
	return s.repo.ClearCover(id)
}

// ExtractText pulls plain text out of a book's PDF using only its own text
// layer (see docs/features/todo/perpustakaan-ekstraksi-konten-untuk-belajar.md
// for why this deliberately does not OCR scanned pages). It is meant to run
// in a background goroutine kicked off by the controller — it's a blocking
// call by itself, and a large scanned book can take a while just to
// download and walk page by page.
func (s *libraryBookService) ExtractText(id int) error {
	book, err := s.repo.FindByIDAny(id)
	if err != nil {
		return err
	}
	if book.SourceType != model.LibraryBookSourceUploaded || book.Format != model.LibraryBookFormatPDF || book.SourceURL == "" {
		err := fmt.Errorf("only an uploaded PDF resource can be extracted")
		_ = s.repo.SetExtractionStatus(id, model.LibraryBookExtractFailed, err.Error())
		return err
	}

	if err := s.repo.SetExtractionStatus(id, model.LibraryBookExtractProcessing, ""); err != nil {
		return err
	}

	fail := func(err error) error {
		_ = s.repo.SetExtractionStatus(id, model.LibraryBookExtractFailed, err.Error())
		return err
	}

	client := &http.Client{Timeout: 3 * time.Minute}
	resp, err := client.Get(book.SourceURL)
	if err != nil {
		return fail(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fail(fmt.Errorf("download sumber gagal: HTTP %d", resp.StatusCode))
	}
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return fail(err)
	}

	extracted, err := lib.ExtractPDFPages(data)
	if err != nil {
		return fail(err)
	}

	pages := make([]model.LibraryBookExtractedText, 0, len(extracted))
	confidentCount, lowConfidenceCount := 0, 0
	for _, p := range extracted {
		if strings.TrimSpace(p.Text) == "" {
			continue
		}
		if p.Confident {
			confidentCount++
		} else {
			lowConfidenceCount++
		}
		pages = append(pages, model.LibraryBookExtractedText{
			LibraryBookID:    id,
			PageNumber:       p.Number,
			Text:             p.Text,
			ExtractionMethod: "pdf_text_layer",
			Confident:        p.Confident,
		})
	}

	if err := s.repo.SaveExtractedPages(id, pages); err != nil {
		return fail(err)
	}

	status, note := model.LibraryBookExtractDone, ""
	switch {
	case confidentCount+lowConfidenceCount == 0:
		status = model.LibraryBookExtractNeedsOCR
		note = "Tidak ada layer teks yang terdeteksi — kemungkinan ini hasil scan, perlu OCR (belum didukung)."
	case lowConfidenceCount > confidentCount:
		status = model.LibraryBookExtractLowConfidence
		note = fmt.Sprintf("Hanya %d dari %d halaman berteks yang lolos cek kualitas dasar — layer teks sumber kemungkinan korup, tinjau manual sebelum dipakai.", confidentCount, confidentCount+lowConfidenceCount)
	}
	return s.repo.SetExtractionStatus(id, status, note)
}

func (s *libraryBookService) FindExtractedPages(id int) ([]model.LibraryBookExtractedText, error) {
	return s.repo.FindExtractedPages(id)
}

// SaveManualPages overwrites specific pages with human/OCR-corrected text
// (see ExtractText's doc comment on why the automatic pass won't touch
// these pages itself) and re-derives the book's overall extraction_status
// from the full, now-mixed set of pages.
func (s *libraryBookService) SaveManualPages(id int, pages []model.ManualExtractedPage) error {
	if len(pages) == 0 {
		return nil
	}
	rows := make([]model.LibraryBookExtractedText, 0, len(pages))
	for _, p := range pages {
		rows = append(rows, model.LibraryBookExtractedText{
			LibraryBookID:    id,
			PageNumber:       p.PageNumber,
			Text:             p.Text,
			ExtractionMethod: "ocr_manual",
			Confident:        true,
		})
	}
	if err := s.repo.UpsertExtractedPages(rows); err != nil {
		return err
	}

	all, err := s.repo.FindExtractedPages(id)
	if err != nil {
		return err
	}
	confident := 0
	for _, p := range all {
		if p.Confident {
			confident++
		}
	}
	status, note := model.LibraryBookExtractDone, ""
	if confident < len(all) {
		status = model.LibraryBookExtractLowConfidence
		note = fmt.Sprintf("%d dari %d halaman berteks lolos cek kualitas (termasuk koreksi manual).", confident, len(all))
	}
	return s.repo.SetExtractionStatus(id, status, note)
}

func (s *libraryBookService) Delete(id int) error {
	return s.repo.Delete(id)
}

func (s *libraryBookService) GenerateDraft(id int, req *model.GenerateDraftRequest) (*model.GenerateDraftResponse, error) {
	book, err := s.repo.FindByIDAny(id)
	if err != nil {
		return nil, err
	}
	if req.StartPage <= 0 {
		req.StartPage = 1
	}
	if req.EndPage < req.StartPage {
		req.EndPage = req.StartPage
	}
	pages, err := s.repo.FindExtractedPagesBetween(id, req.StartPage, req.EndPage)
	if err != nil {
		return nil, err
	}
	if len(pages) == 0 {
		return nil, fmt.Errorf("tidak ada teks hasil ekstraksi untuk halaman %d - %d", req.StartPage, req.EndPage)
	}

	resp := &model.GenerateDraftResponse{
		Target:    req.Target,
		BookID:    id,
		BookTitle: book.Title,
		StartPage: req.StartPage,
		EndPage:   req.EndPage,
	}

	if req.Target == "lesson" {
		for _, p := range pages {
			text := strings.TrimSpace(p.Text)
			if len(text) < 30 {
				continue
			}
			lines := strings.Split(text, "\n")
			title := ""
			for _, l := range lines {
				trimmed := strings.TrimSpace(l)
				if len(trimmed) > 5 && len(trimmed) < 80 {
					title = trimmed
					break
				}
			}
			if title == "" {
				title = fmt.Sprintf("%s (Halaman %d)", book.Title, p.PageNumber)
			}
			dalil := extractDalilPattern(text)
			body := text
			if len(body) > 1200 {
				body = body[:1200] + "..."
			}

			resp.LessonSteps = append(resp.LessonSteps, model.GeneratedDraftLessonStep{
				Title:          title,
				Kind:           "teori",
				Body:           body,
				Dalil:          dalil,
				Tip:            fmt.Sprintf("Materi bersumber dari kitab %s karya %s.", book.Title, book.Author),
				SourceCitation: fmt.Sprintf("Buku: %s, Halaman: %d", book.Title, p.PageNumber),
				SourcePage:     p.PageNumber,
			})
		}
	} else if req.Target == "quiz" {
		quizType := inferQuizType(book.Category)
		for _, p := range pages {
			text := strings.TrimSpace(p.Text)
			if len(text) < 50 {
				continue
			}
			qItem := generateQuizItemFromPage(text, book.Title, p.PageNumber, quizType)
			if qItem != nil {
				resp.QuizItems = append(resp.QuizItems, *qItem)
			}
		}
	}

	return resp, nil
}

func extractDalilPattern(text string) string {
	lines := strings.Split(text, "\n")
	var found []string
	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if strings.HasPrefix(trimmed, "QS.") || strings.HasPrefix(trimmed, "HR.") || strings.Contains(trimmed, "Rasulullah ﷺ") {
			found = append(found, trimmed)
			if len(found) >= 2 {
				break
			}
		}
	}
	if len(found) > 0 {
		return strings.Join(found, "; ")
	}
	return ""
}

func inferQuizType(category string) string {
	cat := strings.ToLower(category)
	switch {
	case strings.Contains(cat, "fiqh"):
		return string(model.QuizTypeFiqh)
	case strings.Contains(cat, "sirah") || strings.Contains(cat, "sejarah"):
		return string(model.QuizTypeSirah)
	case strings.Contains(cat, "hadith") || strings.Contains(cat, "hadis") || strings.Contains(cat, "akhlak"):
		return string(model.QuizTypeHadith)
	case strings.Contains(cat, "asmaul"):
		return string(model.QuizTypeAsmaUlHusna)
	default:
		return "aqidah"
	}
}

func generateQuizItemFromPage(text, bookTitle string, pageNum int, quizType string) *model.GeneratedDraftQuizItem {
	lines := strings.Split(text, "\n")
	var meaningful []string
	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if len(trimmed) > 15 {
			meaningful = append(meaningful, trimmed)
		}
	}
	if len(meaningful) == 0 {
		return nil
	}

	statement := meaningful[0]
	if len(statement) > 120 {
		statement = statement[:120] + "..."
	}

	question := fmt.Sprintf("Berdasarkan pembahasan dalam kitab %s (Hlm. %d), manakah pernyataan yang paling tepat mengenai hal berikut?", bookTitle, pageNum)
	correct := statement
	options := []string{
		correct,
		"Pernyataan yang bertentangan dengan kaidah mu'tabar",
		"Pendapat yang tidak memiliki landasan dalil",
		"Ketentuan yang telah dinasakh secara mutlak",
	}

	return &model.GeneratedDraftQuizItem{
		Type:           quizType,
		Difficulty:     "medium",
		QuestionText:   question,
		CorrectAnswer:  correct,
		Options:        options,
		Explanation:    fmt.Sprintf("Sumber rujukan: Kitab %s, Halaman %d.", bookTitle, pageNum),
		SourceCitation: fmt.Sprintf("Buku: %s, Hlm. %d", bookTitle, pageNum),
		SourcePage:     pageNum,
	}
}

func uniqueLibraryBookSlug(title string, exists func(string) bool) string {
	base := slugify(title)
	if base == "" {
		base = "book"
	}
	if !exists(base) {
		return base
	}
	for i := 2; ; i++ {
		candidate := base + "-" + strconv.Itoa(i)
		if !exists(candidate) {
			return candidate
		}
	}
}
