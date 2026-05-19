package model

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"gorm.io/gorm"
)

type Book struct {
	BaseID
	Count           *int64       `json:"count,omitempty" gorm:"-"`
	Slug            *string      `json:"slug,omitempty" gorm:"type:varchar(256);not null;index:,unique,where:deleted_at is null"`
	DefaultLanguage *string      `json:"default_language,omitempty" gorm:"default:Idn"`
	TranslationID   *int         `json:"translation_id,omitempty"`
	Translation     *Translation `json:"translation,omitempty"`
	Themes          []Theme      `json:"-" gorm:"many2many:book_themes"`
	Theme           []Theme      `json:"theme,omitempty" gorm:"-"`
	Hadith          []Hadith     `json:"hadith,omitempty"`
	Media           []BookAsset  `json:"media,omitempty"`
}

type BookAsset struct {
	BaseID
	BookID       *int        `json:"book_id,omitempty"`
	MultimediaID *int        `json:"multimedia_id,omitempty"`
	Book         *Book       `json:"book,omitempty"`
	Multimedia   *Multimedia `json:"multimedia,omitempty"`
}

type BookThemes struct {
	BaseID
	BookID  *int   `json:"-"`
	ThemeID *int   `json:"-"`
	Book    *Book  `json:"book,omitempty"`
	Theme   *Theme `json:"theme,omitempty"`
}

func (b *Book) Seed(db *gorm.DB) []Book {
	var books []Book
	booksString := []string{"Shahih Bukhari", "Shahih Muslim", "Sunan Abu Daud", "Sunan Tirmidzi", "Sunan Nasa'i", "Sunan Ibnu Majah", "Muwatha' Malik", "Musnad Ahmad", "Sunan Darimi"}
	booksSlug := []string{"bukhari", "muslim", "abudaud", "tirmidzi", "nasai", "ibnumajah", "malik", "ahmad", "darimi"}
	for i, v := range booksString {
		book := new(Book)
		err := db.First(&book).Error
		if err != nil || book == nil {
			book.Translation = &Translation{
				Idn: lib.Strptr(v),
				En:  lib.Strptr(v),
			}
			book.DefaultLanguage = lib.Strptr("idn")
			book.Slug = lib.Strptr(booksSlug[i])
			books = append(books, *book)
		}
	}
	return books
}
