package repository

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
	"gorm.io/gorm"
)

type JuzRepository interface {
	Save(*model.Juz) (*model.Juz, error)
	FindAll(*fiber.Ctx) *paginate.Page
	FindById(*int) (*model.Juz, error)
	FindBySurahName(*fiber.Ctx, *string) (*model.Juz, error)
	UpdateById(*int, *model.Juz) (*model.Juz, error)
	DeleteById(*int, *string) error
	Count() (*int64, error)
}

type juzRepo struct {
	db *gorm.DB
	pg *paginate.Pagination
}

func NewJuzRepository(db *gorm.DB, pg *paginate.Pagination) JuzRepository {
	return &juzRepo{db, pg}
}

func (c *juzRepo) Save(Juz *model.Juz) (*model.Juz, error) {
	if err := c.db.Create(&Juz).Error; err != nil {
		return nil, err
	}
	return Juz, nil
}

func (c *juzRepo) FindAll(ctx *fiber.Ctx) *paginate.Page {
	var juz []*model.Juz
	mod := c.db.Model(&model.Juz{}).Joins("StartSurah").Joins("StartSurah.Translation").
		Joins("EndSurah").Joins("EndSurah.Translation").
		Joins("StartAyah").Joins("StartAyah.Translation").
		Joins("EndAyah").Joins("EndAyah.Translation").Order("id")
	page := c.pg.With(mod).Request(ctx.Request()).Response(&juz)

	return &page
}

func (c *juzRepo) loadAyahsForJuz(juzID int) ([]*model.Ayah, error) {
	rows, err := c.db.Raw(`
		SELECT
			a.id, a.number, a.surah_id, a.juz_id, a.manzil, a.page, a.ruku, a.hizb_quarter, a.sajda, a.translation_id,
			t.id, t.idn, t.en, t.ar
		FROM ayah a
		LEFT JOIN translation t ON t.id = a.translation_id
		WHERE a.juz_id = ?
		ORDER BY a.id ASC
	`, juzID).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ayahs []*model.Ayah
	for rows.Next() {
		var a model.Ayah
		var tID *int
		var tIdn, tEn, tAr *string
		if err := rows.Scan(
			&a.ID, &a.Number, &a.SurahID, &a.JuzID, &a.Manzil, &a.Page, &a.Ruku, &a.HizbQuarter, &a.Sajda, &a.TranslationID,
			&tID, &tIdn, &tEn, &tAr,
		); err != nil {
			return nil, err
		}
		if tID != nil {
			a.Translation = &model.Translation{
				BaseID: model.BaseID{ID: tID},
				Idn:    tIdn,
				En:     tEn,
				Ar:     tAr,
			}
		}
		ayahs = append(ayahs, &a)
	}
	return ayahs, rows.Err()
}

func (c *juzRepo) FindById(id *int) (*model.Juz, error) {
	var juz model.Juz
	if err := c.db.
		Joins("StartSurah").Joins("StartSurah.Translation").
		Joins("EndSurah").Joins("EndSurah.Translation").
		Joins("StartAyah").Joins("StartAyah.Translation").
		Joins("EndAyah").Joins("EndAyah.Translation").
		First(&juz, `juz.id = ?`, id).Error; err != nil {
		return nil, err
	}
	if juz.ID != nil {
		ayahs, err := c.loadAyahsForJuz(*juz.ID)
		if err != nil {
			return nil, err
		}
		juz.Ayahs = ayahs
	}
	return &juz, nil
}

func (c *juzRepo) FindBySurahName(ctx *fiber.Ctx, name *string) (*model.Juz, error) {
	var juz model.Juz
	if err := c.db.
		Joins("StartSurah").Joins("StartSurah.Translation").
		Joins("EndSurah").Joins("EndSurah.Translation").
		Joins("StartAyah").Joins("StartAyah.Translation").
		Joins("EndAyah").Joins("EndAyah.Translation").
		First(&juz).Error; err != nil {
		return nil, err
	}
	if juz.ID != nil {
		ayahs, err := c.loadAyahsForJuz(*juz.ID)
		if err != nil {
			return nil, err
		}
		juz.Ayahs = ayahs
	}
	return &juz, nil
}

func (c *juzRepo) UpdateById(id *int, Juz *model.Juz) (*model.Juz, error) {
	if _, err := c.FindById(id); err != nil {
		return nil, err
	}
	Juz.ID = id
	if err := c.db.Updates(&Juz).Error; err != nil {
		return Juz, err
	}
	return Juz, nil
}

func (c *juzRepo) DeleteById(id *int, scoped *string) error {
	if _, err := c.FindById(id); err != nil {
		return err
	}
	if scoped != nil && *scoped == "hard" {
		return c.db.Unscoped().Delete(&model.Juz{}, id).Error
	}
	return c.db.Delete(&model.Juz{}, id).Error
}

func (c *juzRepo) Count() (*int64, error) {
	var count int64
	c.db.Table("juz").Count(&count)
	return &count, nil
}
