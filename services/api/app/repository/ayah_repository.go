package repository

import (
	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type AyahRepository interface {
	Save(*model.Ayah) (*model.Ayah, error)
	FindAll(*fiber.Ctx) *paginate.Page
	FindAllKeyset(*fiber.Ctx) (*lib.KeysetPage, error)
	FindById(*int) (*model.Ayah, error)
	FindManyByIds(ids []int) ([]model.Ayah, error)
	FindDaily(number int) (*model.Ayah, error)
	FindByNumber(*fiber.Ctx, *int) (*paginate.Page, error)
	FindBySurahNumber(*fiber.Ctx, *int) (*paginate.Page, error)
	FindByPage(page int) ([]model.Ayah, error)
	FindByHizbQuarter(hizb int) ([]model.Ayah, error)
	UpdateById(*int, *model.Ayah) (*model.Ayah, error)
	DeleteById(*int, *string) error
	Count() (*int64, error)
}

type ayahRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewAyahRepository(db *gorm.DB, pg *paginate.Pagination) AyahRepository {
	return &ayahRepo{db, pg}
}

func (c *ayahRepo) Save(Ayah *model.Ayah) (*model.Ayah, error) {
	if err := c.db.Create(&Ayah).Error; err != nil {
		return nil, err
	}
	return Ayah, nil
}

func (c *ayahRepo) FindAll(ctx *fiber.Ctx) *paginate.Page {
	var ayahs []model.Ayah
	mod := c.db.Model(&model.Ayah{}).Joins("Translation").Joins("Surah").Joins("Surah.Translation").Order(`"ayah".id`)
	page := c.pg.With(mod).Request(ctx.Request()).Response(&ayahs)

	return &page
}

func (c *ayahRepo) FindAllKeyset(ctx *fiber.Ctx) (*lib.KeysetPage, error) {
	cursor, limit := lib.GetKeysetParams(ctx)

	var total int64
	c.db.Model(&model.Ayah{}).Count(&total)

	var ayahs []model.Ayah
	query := c.db.Model(&model.Ayah{}).
		Joins("Translation").Joins("Surah").Joins("Surah.Translation").
		Order(`"ayah".id`)
	if cursor > 0 {
		query = query.Where(`"ayah".id > ?`, cursor)
	}
	query = query.Limit(limit + 1)
	if err := query.Find(&ayahs).Error; err != nil {
		return nil, err
	}

	hasMore := len(ayahs) > limit
	if hasMore {
		ayahs = ayahs[:limit]
	}

	var nextCursor *int
	if hasMore && len(ayahs) > 0 {
		nextCursor = ayahs[len(ayahs)-1].ID
	}

	return &lib.KeysetPage{
		Items:      ayahs,
		NextCursor: nextCursor,
		HasMore:    hasMore,
		Total:      total,
	}, nil
}

func (c *ayahRepo) FindById(id *int) (*model.Ayah, error) {
	var Ayah *model.Ayah
	if err := c.db.Joins("Translation").Joins("Surah").Joins("Surah.Translation").
		First(&Ayah, `ayah.id = ?`, id).Error; err != nil {
		return nil, err
	}
	return Ayah, nil
}

func (c *ayahRepo) FindManyByIds(ids []int) ([]model.Ayah, error) {
	var ayahs []model.Ayah
	err := c.db.Joins("Translation").Joins("Surah").Joins("Surah.Translation").
		Where("ayah.id IN ?", ids).Find(&ayahs).Error
	return ayahs, err
}

func (c *ayahRepo) FindDaily(number int) (*model.Ayah, error) {
	if number < 1 {
		number = 1
	}

	var id int
	err := c.db.Model(&model.Ayah{}).
		Select("id").
		Order(`"ayah".id`).
		Offset(number - 1).
		Limit(1).
		Scan(&id).Error
	if err != nil {
		return nil, err
	}
	if id == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return c.FindById(&id)
}

func (c *ayahRepo) FindByNumber(ctx *fiber.Ctx, number *int) (*paginate.Page, error) {
	var ayahs []*model.Ayah
	mod := c.db.Model(&model.Ayah{}).Joins("Translation").Joins("Surah").Joins("Surah.Translation").Where(`"ayah".number = ?`, number).Order(`"ayah".id`)
	page := c.pg.With(mod).Request(ctx.Request()).Response(&ayahs)

	return &page, nil
}

func (c *ayahRepo) FindBySurahNumber(ctx *fiber.Ctx, number *int) (*paginate.Page, error) {
	var ayahs []*model.Ayah
	mod := c.db.Model(&model.Ayah{}).Joins("Translation").Joins("Surah").Joins("Surah.Translation").Where(`"Surah".number = ?`, number).Order(`"ayah".id, "Surah".id`)
	page := c.pg.With(mod).Request(ctx.Request()).Response(&ayahs)

	return &page, nil
}

func (c *ayahRepo) FindByPage(page int) ([]model.Ayah, error) {
	var ayahs []model.Ayah
	err := c.db.Model(&model.Ayah{}).
		Joins("Translation").
		Joins("Surah").
		Joins("Surah.Translation").
		Where(`"ayah".page = ?`, page).
		Order(`"ayah".id`).
		Find(&ayahs).Error
	return ayahs, err
}

func (c *ayahRepo) FindByHizbQuarter(hizb int) ([]model.Ayah, error) {
	var ayahs []model.Ayah
	err := c.db.Model(&model.Ayah{}).
		Joins("Translation").
		Joins("Surah").
		Joins("Surah.Translation").
		Where(`"ayah".hizb_quarter = ?`, hizb).
		Order(`"ayah".id`).
		Find(&ayahs).Error
	return ayahs, err
}

func (c *ayahRepo) UpdateById(id *int, Ayah *model.Ayah) (*model.Ayah, error) {
	if _, err := c.FindById(id); err != nil {
		return nil, err
	}
	Ayah.ID = id
	if err := c.db.Updates(&Ayah).Error; err != nil {
		return Ayah, err
	}
	return Ayah, nil
}

func (c *ayahRepo) DeleteById(id *int, scoped *string) error {
	if _, err := c.FindById(id); err != nil {
		return err
	}
	if scoped != nil && *scoped == "hard" {
		return c.db.Unscoped().Delete(&model.Ayah{}, id).Error
	}
	return c.db.Delete(&model.Ayah{}, id).Error
}

func (c *ayahRepo) Count() (*int64, error) {
	var count int64
	c.db.Table("ayah").Count(&count)
	return &count, nil
}
