package model

type LibraryBookStatus string
type LibraryBookFormat string
type LibraryBookSourceType string
type LibraryBookLicenseStatus string

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
	License          string                   `json:"license" gorm:"type:varchar(256)"`
	LicenseStatus    LibraryBookLicenseStatus `json:"license_status" gorm:"type:varchar(30);default:'unverified';index"`
	SourceNote       string                   `json:"source_note" gorm:"type:text"`
	IsSourceVerified bool                     `json:"is_source_verified" gorm:"default:false;index"`
	Pages            int                      `json:"pages" gorm:"default:0"`
	Tags             string                   `json:"tags" gorm:"type:varchar(500)"`
	Status           LibraryBookStatus        `json:"status" gorm:"type:varchar(30);default:'published';index"`
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
