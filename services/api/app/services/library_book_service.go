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

func (s *libraryBookService) Delete(id int) error {
	return s.repo.Delete(id)
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
