package model

type (
	LibraryBookStatus        string
	LibraryBookFormat        string
	LibraryBookSourceType    string
	LibraryBookLicenseStatus string
)

const (
	LibraryBookStatusDraft     LibraryBookStatus = "draft"
	LibraryBookStatusPublished LibraryBookStatus = "published"

	LibraryBookFormatPDF  LibraryBookFormat = "pdf"
	LibraryBookFormatEPUB LibraryBookFormat = "epub"
	LibraryBookFormatHTML LibraryBookFormat = "html"
	LibraryBookFormatLink LibraryBookFormat = "link"

	LibraryBookSourceExternal LibraryBookSourceType = "external"
	LibraryBookSourceUploaded LibraryBookSourceType = "uploaded"

	LibraryBookLicenseUnverified LibraryBookLicenseStatus = "unverified"
	LibraryBookLicenseVerified   LibraryBookLicenseStatus = "verified"
	LibraryBookLicenseRestricted LibraryBookLicenseStatus = "restricted"
	LibraryBookLicenseReview     LibraryBookLicenseStatus = "needs_review"
)

type LibraryBook struct {
	BaseID
	Title            string                   `json:"title" gorm:"type:varchar(256);not null;index"`
	Slug             string                   `json:"slug" gorm:"type:varchar(256);not null;uniqueIndex"`
	Author           string                   `json:"author" gorm:"type:varchar(256);index"`
	Description      string                   `json:"description" gorm:"type:text"`
	Category         string                   `json:"category" gorm:"type:varchar(100);index"`
	Level            string                   `json:"level" gorm:"type:varchar(50);index"`
	Language         string                   `json:"language" gorm:"type:varchar(50);index"`
	Format           LibraryBookFormat        `json:"format" gorm:"type:varchar(30);default:'link';index"`
	SourceType       LibraryBookSourceType    `json:"source_type" gorm:"type:varchar(30);default:'external';index"`
	SourceURL        string                   `json:"source_url" gorm:"type:varchar(700)"`
	CoverURL         string                   `json:"cover_url" gorm:"type:varchar(700)"`
	FileName         string                   `json:"file_name" gorm:"type:varchar(256)"`
	FileMimeType     string                   `json:"file_mime_type" gorm:"type:varchar(120)"`
	FileSizeBytes    int64                    `json:"file_size_bytes" gorm:"default:0"`
	FileObjectKey    string                   `json:"-" gorm:"type:varchar(700)"`
	CoverObjectKey   string                   `json:"-" gorm:"type:varchar(700)"`
	FileURL          string                   `json:"file_url" gorm:"type:varchar(700)"`
	ChecksumSHA256   string                   `json:"checksum_sha256" gorm:"type:varchar(64)"`
	License          string                   `json:"license" gorm:"type:varchar(256)"`
	LicenseStatus    LibraryBookLicenseStatus `json:"license_status" gorm:"type:varchar(30);default:'unverified';index"`
	SourceNote       string                   `json:"source_note" gorm:"type:text"`
	IsSourceVerified bool                     `json:"is_source_verified" gorm:"default:false;index"`
	Pages            int                      `json:"pages" gorm:"default:0"`
	Tags             string                   `json:"tags" gorm:"type:varchar(500)"`
	Status           LibraryBookStatus        `json:"status" gorm:"type:varchar(30);default:'published';index"`
	ExtractionStatus LibraryBookExtractStatus `json:"extraction_status" gorm:"type:varchar(30);default:'none';index"`
	ExtractionError  string                   `json:"extraction_error" gorm:"type:text"`
}

type LibraryBookExtractStatus string

const (
	LibraryBookExtractNone          LibraryBookExtractStatus = "none"
	LibraryBookExtractProcessing    LibraryBookExtractStatus = "processing"
	LibraryBookExtractDone          LibraryBookExtractStatus = "done"
	LibraryBookExtractNeedsOCR      LibraryBookExtractStatus = "needs_ocr"
	LibraryBookExtractLowConfidence LibraryBookExtractStatus = "low_confidence"
	LibraryBookExtractFailed        LibraryBookExtractStatus = "failed"
)

// LibraryBookExtractedText holds one page of text pulled from a
// LibraryBook's PDF (see docs/features/todo/perpustakaan-ekstraksi-konten-untuk-belajar.md).
// Kept per-page rather than as one blob per book so generated Lesson/Quiz
// content can cite the exact source page for a reviewer to verify.
type LibraryBookExtractedText struct {
	BaseID
	LibraryBookID    int    `json:"library_book_id" gorm:"not null;uniqueIndex:idx_library_book_page"`
	PageNumber       int    `json:"page_number" gorm:"not null;uniqueIndex:idx_library_book_page"`
	Text             string `json:"text" gorm:"type:text"`
	ExtractionMethod string `json:"extraction_method" gorm:"type:varchar(30)"`
	// No gorm "default" tag on purpose: the app always sets this explicitly
	// on insert, and GORM treats a bool's zero value (false) as "unset" when
	// a column default is declared, silently writing the default instead —
	// which would flip every real false back to true on save.
	Confident bool `json:"confident"`
}

// ManualExtractedPage is one corrected page submitted by a human (or an
// OCR pass run outside the API, e.g. against a rendered page image when the
// PDF's own text layer is corrupted) to overwrite a specific page's stored
// text without touching the rest of the book's already-good pages.
type ManualExtractedPage struct {
	PageNumber int    `json:"page_number" validate:"required"`
	Text       string `json:"text" validate:"required"`
}

type UpsertExtractedPagesRequest struct {
	Pages []ManualExtractedPage `json:"pages" validate:"required,dive"`
}

type CreateLibraryBookRequest struct {
	Title            string                   `json:"title" validate:"required,max=256"`
	Slug             string                   `json:"slug" validate:"max=256"`
	Author           string                   `json:"author" validate:"max=256"`
	Description      string                   `json:"description" validate:"max=5000"`
	Category         string                   `json:"category" validate:"max=100"`
	Level            string                   `json:"level" validate:"max=50"`
	Language         string                   `json:"language" validate:"max=50"`
	Format           LibraryBookFormat        `json:"format"`
	SourceType       LibraryBookSourceType    `json:"source_type"`
	SourceURL        string                   `json:"source_url" validate:"max=700"`
	CoverURL         string                   `json:"cover_url" validate:"max=700"`
	FileName         string                   `json:"file_name" validate:"max=256"`
	FileMimeType     string                   `json:"file_mime_type" validate:"max=120"`
	FileSizeBytes    int64                    `json:"file_size_bytes"`
	License          string                   `json:"license" validate:"max=256"`
	LicenseStatus    LibraryBookLicenseStatus `json:"license_status"`
	SourceNote       string                   `json:"source_note" validate:"max=5000"`
	IsSourceVerified bool                     `json:"is_source_verified"`
	Pages            int                      `json:"pages"`
	Tags             string                   `json:"tags" validate:"max=500"`
	Status           LibraryBookStatus        `json:"status"`
}

type LibraryBookResource struct {
	SourceURL     string            `json:"source_url"`
	FileName      string            `json:"file_name"`
	FileMimeType  string            `json:"file_mime_type"`
	FileSizeBytes int64             `json:"file_size_bytes"`
	ObjectKey     string            `json:"object_key"`
	Format        LibraryBookFormat `json:"format"`
}

type LibraryBookCover struct {
	CoverURL  string `json:"cover_url"`
	ObjectKey string `json:"object_key"`
}
