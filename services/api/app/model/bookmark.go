package model

import "github.com/google/uuid"

type BookmarkType string

const (
	BookmarkAyah        BookmarkType = "ayah"
	BookmarkHadith      BookmarkType = "hadith"
	BookmarkArticle     BookmarkType = "article"
	BookmarkLibraryBook BookmarkType = "library_book"
)

type Bookmark struct {
	BaseUUID
	UserID      uuid.UUID    `json:"user_id" gorm:"type:uuid;not null;uniqueIndex:idx_bookmark_user_ref"`
	RefType     BookmarkType `json:"ref_type" gorm:"type:varchar(50);not null;uniqueIndex:idx_bookmark_user_ref"`
	RefID       int          `json:"ref_id" gorm:"not null;uniqueIndex:idx_bookmark_user_ref"`
	RefSlug     string       `json:"ref_slug,omitempty" gorm:"type:varchar(512);uniqueIndex:idx_bookmark_user_ref"`
	Color       string       `json:"color,omitempty" gorm:"type:varchar(20)"`
	Label       string       `json:"label,omitempty" gorm:"type:varchar(64)"`
	Ayah        *Ayah        `json:"ayah,omitempty" gorm:"-"`
	Hadith      *Hadith      `json:"hadith,omitempty" gorm:"-"`
	LibraryBook *LibraryBook `json:"library_book,omitempty" gorm:"-"`
}

type UpdateBookmarkRequest struct {
	Color *string `json:"color,omitempty"`
	Label *string `json:"label,omitempty"`
}
