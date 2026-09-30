package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type BookRepository interface {
	Save(*model.Book) (*model.Book, error)
	FindAll(*fiber.Ctx) *paginate.Page
	FindById(*int) (*model.Book, error)
	FindBySlug(*fiber.Ctx, *string) (*model.Book, error)
	UpdateById(*int, *model.Book) (*model.Book, error)
	DeleteById(*int, *string) error
	Count() (*int64, error)
}

type bookRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewBookRepository(db *gorm.DB, pg *paginate.Pagination) BookRepository {
	return &bookRepo{db, pg}
}

func (c *bookRepo) Save(Book *model.Book) (*model.Book, error) {
	if err := c.db.Create(&Book).Error; err != nil {
		return nil, err
	}
	return Book, nil
}

func (c *bookRepo) FindAll(ctx *fiber.Ctx) *paginate.Page {
	var books []model.Book
	mod := c.db.Model(&model.Book{}).Joins("Translation").Order("id")
	page := c.pg.With(mod).Request(ctx.Request()).Response(&books)

	if len(books) == 0 {
		page.Items = books
		return &page
	}

	bookIDs := make([]int, 0, len(books))
	for _, b := range books {
		if b.ID != nil {
			bookIDs = append(bookIDs, *b.ID)
		}
	}

	type countRow struct {
		BookID int   `gorm:"column:book_id"`
		Count  int64 `gorm:"column:count"`
	}
	var countRows []countRow
	c.db.Table("hadith").Select("book_id, COUNT(*) as count").
		Where("book_id IN ? AND deleted_at IS NULL", bookIDs).Group("book_id").Scan(&countRows)
	countMap := make(map[int]int64, len(countRows))
	for _, r := range countRows {
		countMap[r.BookID] = r.Count
	}

	type bookThemeRow struct {
		BookID  int `gorm:"column:book_id"`
		ThemeID int `gorm:"column:theme_id"`
	}
	var btRows []bookThemeRow
	c.db.Table("book_themes").Select("book_id, theme_id").
		Where("book_id IN ? AND deleted_at IS NULL", bookIDs).Scan(&btRows)

	themeIDSet := make(map[int]struct{})
	for _, bt := range btRows {
		themeIDSet[bt.ThemeID] = struct{}{}
	}
	themeIDs := make([]int, 0, len(themeIDSet))
	for id := range themeIDSet {
		themeIDs = append(themeIDs, id)
	}

	themeMap := make(map[int]model.Theme)
	if len(themeIDs) > 0 {
		var themes []model.Theme
		if err := c.db.Joins("Translation").Where(`"theme".id IN ?`, themeIDs).Find(&themes).Error; err != nil {
			return &page
		}
		for _, t := range themes {
			if t.ID != nil {
				themeMap[*t.ID] = t
			}
		}
	}

	bookThemeMap := make(map[int][]model.Theme)
	for _, bt := range btRows {
		if t, ok := themeMap[bt.ThemeID]; ok {
			bookThemeMap[bt.BookID] = append(bookThemeMap[bt.BookID], t)
		}
	}

	for i := range books {
		if books[i].ID != nil {
			cnt := countMap[*books[i].ID]
			books[i].Count = &cnt
			books[i].Theme = bookThemeMap[*books[i].ID]
		}
	}
	page.Items = books
	return &page
}

func (c *bookRepo) loadThemesForBook(bookID int) ([]model.Theme, error) {
	rows, err := c.db.Raw(`
		SELECT t.id, t.default_language, t.translation_id,
		       tr.id, tr.idn, tr.en, tr.ar
		FROM book_themes bt
		JOIN theme t ON t.id = bt.theme_id AND t.deleted_at IS NULL
		LEFT JOIN translation tr ON tr.id = t.translation_id AND tr.deleted_at IS NULL
		WHERE bt.book_id = ? AND bt.deleted_at IS NULL
		ORDER BY t.id ASC
	`, bookID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var themes []model.Theme
	for rows.Next() {
		var t model.Theme
		var trID *int
		var trIdn, trEn, trAr *string
		if err := rows.Scan(
			&t.ID, &t.DefaultLanguage, &t.TranslationID,
			&trID, &trIdn, &trEn, &trAr,
		); err != nil {
			return nil, err
		}
		if trID != nil {
			t.Translation = &model.Translation{
				BaseID: model.BaseID{ID: trID},
				Idn:    trIdn,
				En:     trEn,
				Ar:     trAr,
			}
		}
		themes = append(themes, t)
	}
	return themes, rows.Err()
}

func (c *bookRepo) FindById(id *int) (*model.Book, error) {
	var book model.Book
	if err := c.db.Joins("Translation").
		First(&book, `book.id = ?`, id).Error; err != nil {
		return nil, err
	}
	if book.ID != nil {
		themes, err := c.loadThemesForBook(*book.ID)
		if err != nil {
			return nil, err
		}
		book.Themes = themes
		book.Theme = themes
	}
	return &book, nil
}

func (c *bookRepo) FindBySlug(ctx *fiber.Ctx, slug *string) (*model.Book, error) {
	var book model.Book
	if err := c.db.Joins("Translation").
		First(&book, `book.slug = ?`, slug).Error; err != nil {
		return nil, err
	}
	if book.ID != nil {
		type themeIDRow struct {
			ThemeID *int `gorm:"column:theme_id"`
		}
		var rows []themeIDRow
		c.db.Raw(`
			SELECT DISTINCT ON (theme_id) theme_id
			FROM hadith
			WHERE book_id = ? AND theme_id IS NOT NULL AND deleted_at IS NULL
			ORDER BY theme_id, number
		`, book.ID).Scan(&rows)

		var themeIDs []int
		for _, v := range rows {
			if v.ThemeID != nil {
				themeIDs = append(themeIDs, *v.ThemeID)
			}
		}
		if len(themeIDs) > 0 {
			var themes []model.Theme
			c.db.Joins("Translation").Where(`"theme".id IN ?`, themeIDs).Order(`"theme".id ASC`).Find(&themes)
			book.Theme = themes
		}
	}
	return &book, nil
}

func (c *bookRepo) UpdateById(id *int, Book *model.Book) (*model.Book, error) {
	if _, err := c.FindById(id); err != nil {
		return nil, err
	}
	Book.ID = id
	if err := c.db.Updates(&Book).Error; err != nil {
		return Book, err
	}
	return Book, nil
}

func (c *bookRepo) DeleteById(id *int, scoped *string) error {
	if _, err := c.FindById(id); err != nil {
		return err
	}
	if scoped != nil && *scoped == "hard" {
		return c.db.Unscoped().Delete(&model.Book{}, id).Error
	}
	return c.db.Delete(&model.Book{}, id).Error
}

func (c *bookRepo) Count() (*int64, error) {
	var count int64
	c.db.Table("book").Count(&count)
	return &count, nil
}
