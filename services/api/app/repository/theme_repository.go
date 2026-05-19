package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type ThemeRepository interface {
	Save(*model.Theme) (*model.Theme, error)
	FindAll(*fiber.Ctx) *paginate.Page
	FindById(*int) (*model.Theme, error)
	FindByBookSlug(*fiber.Ctx, *string) (*[]model.BookThemes, error)
	UpdateById(*int, *model.Theme) (*model.Theme, error)
	DeleteById(*int, *string) error
	Count() (*int64, error)
}

type themeRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewThemeRepository(db *gorm.DB, pg *paginate.Pagination) ThemeRepository {
	return &themeRepo{db, pg}
}

func (c *themeRepo) Save(Theme *model.Theme) (*model.Theme, error) {
	if err := c.db.Create(&Theme).Error; err != nil {
		return nil, err
	}
	return Theme, nil
}

func (c *themeRepo) FindAll(ctx *fiber.Ctx) *paginate.Page {
	var themes []*model.Theme
	mod := c.db.Model(&model.Theme{}).Joins("Translation").Preload("Media").Order("id")
	page := c.pg.With(mod).Request(ctx.Request()).Response(&themes)

	if len(themes) == 0 {
		return &page
	}

	themeIDs := make([]int, 0, len(themes))
	for _, t := range themes {
		if t.ID != nil {
			themeIDs = append(themeIDs, *t.ID)
		}
	}

	// batch hadith count per theme — O(1) query
	type themeCount struct {
		ThemeID int   `gorm:"column:theme_id"`
		Total   int64 `gorm:"column:total"`
	}
	var counts []themeCount
	c.db.Table("hadith").
		Select("theme_id, COUNT(*) as total").
		Where("theme_id IN ?", themeIDs).
		Group("theme_id").Scan(&counts)
	countMap := make(map[int]int64, len(counts))
	for _, ct := range counts {
		countMap[ct.ThemeID] = ct.Total
	}

	// batch distinct book_ids per theme — O(1) query
	type themeBook struct {
		ThemeID int `gorm:"column:theme_id"`
		BookID  int `gorm:"column:book_id"`
	}
	var themeBooks []themeBook
	c.db.Table("hadith").
		Select("DISTINCT theme_id, book_id").
		Where("theme_id IN ? AND book_id IS NOT NULL", themeIDs).
		Scan(&themeBooks)

	bookIDSet := make(map[int]struct{})
	for _, tb := range themeBooks {
		bookIDSet[tb.BookID] = struct{}{}
	}
	bookIDs := make([]int, 0, len(bookIDSet))
	for id := range bookIDSet {
		bookIDs = append(bookIDs, id)
	}

	bookMap := make(map[int]model.Book)
	if len(bookIDs) > 0 {
		var books []model.Book
		c.db.Joins("Translation").Where("book.id IN ?", bookIDs).Order("book.id").Find(&books)
		for _, b := range books {
			if b.ID != nil {
				bookMap[*b.ID] = b
			}
		}
	}

	themeBookMap := make(map[int][]model.Book)
	for _, tb := range themeBooks {
		if b, ok := bookMap[tb.BookID]; ok {
			themeBookMap[tb.ThemeID] = append(themeBookMap[tb.ThemeID], b)
		}
	}

	for _, t := range themes {
		if t.ID != nil {
			total := countMap[*t.ID]
			t.TotalHadith = &total
			t.Book = themeBookMap[*t.ID]
		}
	}

	return &page
}

func (c *themeRepo) FindById(id *int) (*model.Theme, error) {
	var theme *model.Theme
	if err := c.db.Joins("Translation").Preload("Chapters.Translation").Preload("Media").
		First(&theme, `theme.id = ?`, id).Error; err != nil {
		return nil, err
	}
	return theme, nil
}

func (c *themeRepo) FindByBookSlug(ctx *fiber.Ctx, slug *string) (*[]model.BookThemes, error) {
	var theme *[]model.BookThemes
	if err := c.db.Joins("Theme").Joins("Theme.Translation").
		// Preload("Theme.Chapters").Preload("Theme.Chapters.Translation").
		// Preload("Theme.Hadiths").Preload("Theme.Hadiths.Translation").
		Joins("Book").Find(&theme, `"Book".slug = ?`, slug).Error; err != nil {
		return nil, err
	}
	return theme, nil
}

func (c *themeRepo) UpdateById(id *int, Theme *model.Theme) (*model.Theme, error) {
	if _, err := c.FindById(id); err != nil {
		return nil, err
	}
	Theme.ID = id
	if err := c.db.Updates(&Theme).Error; err != nil {
		return Theme, err
	}
	return Theme, nil
}

func (c *themeRepo) DeleteById(id *int, scoped *string) error {
	if _, err := c.FindById(id); err != nil {
		return err
	}
	if scoped != nil && *scoped == "hard" {
		return c.db.Unscoped().Delete(&model.Theme{}, id).Error
	}
	return c.db.Delete(&model.Theme{}, id).Error
}

func (c *themeRepo) Count() (*int64, error) {
	var count int64
	if err := c.db.Table("theme").Count(&count).Error; err != nil {
		return nil, err
	}
	return &count, nil
}
