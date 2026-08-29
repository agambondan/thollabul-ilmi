package service

import (
	"time"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

type HadithService interface {
	Create(*model.Hadith) (*model.Hadith, error)
	FindAll(*fiber.Ctx) *paginate.Page
	FindAllKeyset(*fiber.Ctx) (*lib.KeysetPage, error)
	FindById(*int) (*model.Hadith, error)
	FindDaily() (*model.Hadith, error)
	FindByBookSlug(*fiber.Ctx, *string) (*paginate.Page, error)
	FindByBookSlugSlim(*fiber.Ctx, *string) (*paginate.Page, error)
	FindByBookSlugNumber(*string, *int) (*model.Hadith, error)
	FindByThemeId(*fiber.Ctx, *int) (*paginate.Page, error)
	FindByThemeName(*fiber.Ctx, *string) (*paginate.Page, error)
	FindByBookSlugThemeId(*fiber.Ctx, *string, *int) (*paginate.Page, error)
	FindByChapterId(*fiber.Ctx, *int) (*paginate.Page, error)
	FindByBookSlugChapterId(*fiber.Ctx, *string, *int) (*paginate.Page, error)
	FindByThemeIdChapterId(*fiber.Ctx, *int, *int) (*paginate.Page, error)
	FindByBookSlugThemeIdChapterId(*fiber.Ctx, *string, *int, *int) (*paginate.Page, error)
	UpdateById(*int, *model.Hadith) (*model.Hadith, error)
	DeleteById(*int, *string) error
	Count() (*int64, error)
}

type hadithService struct {
	hadith repository.HadithRepository
	cache  *lib.CacheService
}

// NewHadithService implements the HadithService Interface
func NewHadithService(repo repository.HadithRepository) HadithService {
	return &hadithService{hadith: repo}
}

func NewHadithServiceWithCache(repo repository.HadithRepository, cache *lib.CacheService) HadithService {
	return &hadithService{hadith: repo, cache: cache}
}

func (b *hadithService) FindById(id *int) (*model.Hadith, error) {
	if b.cache == nil {
		return b.hadith.FindById(id)
	}
	var result *model.Hadith
	key := lib.CacheKey("hadith:id", *id)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindById(id)
	})
	if err != nil {
		return result, err
	}
	return result, nil
}

func (b *hadithService) FindByBookSlug(ctx *fiber.Ctx, bookSlug *string) (*paginate.Page, error) {
	if b.cache == nil {
		return b.hadith.FindByBookSlug(ctx, bookSlug)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:book", ctx, *bookSlug)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByBookSlug(ctx, bookSlug)
	})
	if err != nil {
		return result, err
	}
	return result, nil
}

func (b *hadithService) FindByBookSlugSlim(ctx *fiber.Ctx, bookSlug *string) (*paginate.Page, error) {
	if b.cache == nil {
		return b.hadith.FindByBookSlugSlim(ctx, bookSlug)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:book-slim", ctx, *bookSlug)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByBookSlugSlim(ctx, bookSlug)
	})
	if err != nil {
		return result, err
	}
	return result, nil
}

func (b *hadithService) FindByBookSlugNumber(bookSlug *string, number *int) (*model.Hadith, error) {
	if b.cache == nil {
		return b.hadith.FindByBookSlugNumber(bookSlug, number)
	}
	var result *model.Hadith
	key := lib.CacheKey("hadith:book-number", *bookSlug, *number)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByBookSlugNumber(bookSlug, number)
	})
	if err != nil {
		return result, err
	}
	return result, nil
}

func (b *hadithService) Create(hadith *model.Hadith) (*model.Hadith, error) {
	result, err := b.hadith.Save(hadith)
	if err == nil && b.cache != nil {
		b.cache.Invalidate("hadith:*")
	}
	return result, err
}

func (b *hadithService) FindAll(ctx *fiber.Ctx) *paginate.Page {
	if b.cache == nil {
		return b.hadith.FindAll(ctx)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:all", ctx)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindAll(ctx), nil
	})
	if err != nil {
		return b.hadith.FindAll(ctx)
	}
	return result
}

func (b *hadithService) FindAllKeyset(ctx *fiber.Ctx) (*lib.KeysetPage, error) {
	return b.hadith.FindAllKeyset(ctx)
}

func (b *hadithService) FindDaily() (*model.Hadith, error) {
	if b.cache != nil {
		var result *model.Hadith
		key := lib.CacheKey("hadith:daily", time.Now().UTC().Format("2006-01-02"))
		err := b.cache.Remember(key, &result, func() (interface{}, error) {
			return b.findDailyFromRepo()
		})
		return result, err
	}
	return b.findDailyFromRepo()
}

func (b *hadithService) findDailyFromRepo() (*model.Hadith, error) {
	count, err := b.hadith.Count()
	if err != nil || count == nil || *count == 0 {
		return nil, err
	}
	now := time.Now().UTC()
	dayOfYear := int64(now.YearDay()) + int64(now.Year())*1000
	offset := dayOfYear % *count
	return b.hadith.FindByOffset(offset)
}

func (b *hadithService) FindByThemeId(ctx *fiber.Ctx, id *int) (*paginate.Page, error) {
	if b.cache == nil {
		return b.hadith.FindByThemeId(ctx, id)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:theme", ctx, *id)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByThemeId(ctx, id)
	})
	return result, err
}

func (b *hadithService) FindByThemeName(ctx *fiber.Ctx, name *string) (*paginate.Page, error) {
	if b.cache == nil {
		return b.hadith.FindByThemeName(ctx, name)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:theme-name", ctx, *name)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByThemeName(ctx, name)
	})
	return result, err
}

func (b *hadithService) FindByBookSlugThemeId(ctx *fiber.Ctx, bookSlug *string, themeId *int) (*paginate.Page, error) {
	if b.cache == nil {
		return b.hadith.FindByBookSlugThemeId(ctx, bookSlug, themeId)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:book-theme", ctx, *bookSlug, *themeId)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByBookSlugThemeId(ctx, bookSlug, themeId)
	})
	return result, err
}

func (b *hadithService) FindByChapterId(ctx *fiber.Ctx, id *int) (*paginate.Page, error) {
	if b.cache == nil {
		return b.hadith.FindByChapterId(ctx, id)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:chapter", ctx, *id)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByChapterId(ctx, id)
	})
	return result, err
}

func (b *hadithService) FindByBookSlugChapterId(ctx *fiber.Ctx, bookSlug *string, chapterId *int) (*paginate.Page, error) {
	if b.cache == nil {
		return b.hadith.FindByBookSlugChapterId(ctx, bookSlug, chapterId)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:book-chapter", ctx, *bookSlug, *chapterId)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByBookSlugChapterId(ctx, bookSlug, chapterId)
	})
	return result, err
}

func (b *hadithService) FindByThemeIdChapterId(ctx *fiber.Ctx, themeId, chapterId *int) (*paginate.Page, error) {
	if b.cache == nil {
		return b.hadith.FindByThemeIdChapterId(ctx, themeId, chapterId)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:theme-chapter", ctx, *themeId, *chapterId)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByThemeIdChapterId(ctx, themeId, chapterId)
	})
	return result, err
}

func (b *hadithService) FindByBookSlugThemeIdChapterId(ctx *fiber.Ctx, bookSlug *string, themeId, chapterId *int) (*paginate.Page, error) {
	if b.cache == nil {
		return b.hadith.FindByBookSlugThemeIdChapterId(ctx, bookSlug, themeId, chapterId)
	}
	var result *paginate.Page
	key := lib.RequestCacheKey("hadith:book-theme-chapter", ctx, *bookSlug, *themeId, *chapterId)
	err := b.cache.Remember(key, &result, func() (interface{}, error) {
		return b.hadith.FindByBookSlugThemeIdChapterId(ctx, bookSlug, themeId, chapterId)
	})
	return result, err
}

func (b *hadithService) UpdateById(id *int, hadith *model.Hadith) (*model.Hadith, error) {
	result, err := b.hadith.UpdateById(id, hadith)
	if err == nil && b.cache != nil {
		b.cache.Invalidate("hadith:*")
	}
	return result, err
}

func (b *hadithService) DeleteById(id *int, scoped *string) error {
	err := b.hadith.DeleteById(id, scoped)
	if err == nil && b.cache != nil {
		b.cache.Invalidate("hadith:*")
	}
	return err
}

func (b *hadithService) Count() (*int64, error) {
	return b.hadith.Count()
}
