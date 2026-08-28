package service

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

type fakeHadithRepo struct {
	count              int64
	hadith             *model.Hadith
	findByIdErr        error
	findByOffsetResult *model.Hadith
}

func (f *fakeHadithRepo) FindByOffset(offset int64) (*model.Hadith, error) {
	return f.findByOffsetResult, nil
}

func (f *fakeHadithRepo) FindAllKeyset(ctx *fiber.Ctx) (*lib.KeysetPage, error) {
	return &lib.KeysetPage{}, nil
}
func (f *fakeHadithRepo) Save(h *model.Hadith) (*model.Hadith, error) { return h, nil }
func (f *fakeHadithRepo) FindAll(ctx *fiber.Ctx) *paginate.Page       { return &paginate.Page{} }
func (f *fakeHadithRepo) FindById(id *int) (*model.Hadith, error)     { return f.hadith, f.findByIdErr }

func (f *fakeHadithRepo) FindManyByIds(ids []int) ([]model.Hadith, error) {
	return []model.Hadith{}, nil
}

func (f *fakeHadithRepo) FindByBookSlug(ctx *fiber.Ctx, slug *string) (*paginate.Page, error) {
	return &paginate.Page{}, nil
}

func (f *fakeHadithRepo) FindByBookSlugNumber(slug *string, number *int) (*model.Hadith, error) {
	return f.hadith, f.findByIdErr
}

func (f *fakeHadithRepo) FindByThemeId(ctx *fiber.Ctx, id *int) (*paginate.Page, error) {
	return &paginate.Page{}, nil
}

func (f *fakeHadithRepo) FindByThemeName(ctx *fiber.Ctx, name *string) (*paginate.Page, error) {
	return &paginate.Page{}, nil
}

func (f *fakeHadithRepo) FindByBookSlugThemeId(ctx *fiber.Ctx, slug *string, id *int) (*paginate.Page, error) {
	return &paginate.Page{}, nil
}

func (f *fakeHadithRepo) FindByChapterId(ctx *fiber.Ctx, id *int) (*paginate.Page, error) {
	return &paginate.Page{}, nil
}

func (f *fakeHadithRepo) FindByBookSlugChapterId(ctx *fiber.Ctx, slug *string, id *int) (*paginate.Page, error) {
	return &paginate.Page{}, nil
}

func (f *fakeHadithRepo) FindByThemeIdChapterId(ctx *fiber.Ctx, id1, id2 *int) (*paginate.Page, error) {
	return &paginate.Page{}, nil
}

func (f *fakeHadithRepo) FindByBookSlugThemeIdChapterId(ctx *fiber.Ctx, slug *string, id1, id2 *int) (*paginate.Page, error) {
	return &paginate.Page{}, nil
}

func (f *fakeHadithRepo) UpdateById(id *int, h *model.Hadith) (*model.Hadith, error) { return h, nil }
func (f *fakeHadithRepo) DeleteById(id *int, scoped *string) error                   { return nil }
func (f *fakeHadithRepo) Count() (*int64, error)                                     { return &f.count, nil }

func TestHadithServiceFindDaily(t *testing.T) {
	repo := &fakeHadithRepo{count: 100, findByOffsetResult: &model.Hadith{}}
	svc := NewHadithService(repo)

	hadith, err := svc.FindDaily()
	if err != nil {
		t.Fatalf("find daily: %v", err)
	}
	if hadith == nil {
		t.Fatal("expected non-nil hadith")
	}
}

func TestHadithServiceFindDailyEmptyCount(t *testing.T) {
	repo := &fakeHadithRepo{count: 0}
	svc := NewHadithService(repo)

	hadith, err := svc.FindDaily()
	if hadith != nil {
		t.Fatal("expected nil hadith when count is 0")
	}
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
}

func TestHadithServiceFindByBookSlug(t *testing.T) {
	repo := &fakeHadithRepo{}
	svc := NewHadithService(repo)

	slug := "bulughul-maram"
	result, err := svc.FindByBookSlug(nil, &slug)
	if err != nil {
		t.Fatalf("find by book slug: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil page")
	}
}

func TestHadithServiceFindByIdFound(t *testing.T) {
	num := 42
	repo := &fakeHadithRepo{hadith: &model.Hadith{Number: &num}}
	svc := NewHadithService(repo)

	id := 1
	hadith, err := svc.FindById(&id)
	if err != nil {
		t.Fatalf("find by id: %v", err)
	}
	if hadith == nil || hadith.Number == nil || *hadith.Number != 42 {
		t.Fatalf("expected hadith number 42, got %#v", hadith)
	}
}

func TestHadithServiceFindByBookSlugNumberFound(t *testing.T) {
	num := 1
	repo := &fakeHadithRepo{hadith: &model.Hadith{Number: &num}}
	svc := NewHadithService(repo)

	slug := "bukhari"
	hadith, err := svc.FindByBookSlugNumber(&slug, &num)
	if err != nil {
		t.Fatalf("find by book slug number: %v", err)
	}
	if hadith == nil || hadith.Number == nil || *hadith.Number != 1 {
		t.Fatalf("expected hadith number 1, got %#v", hadith)
	}
}

func TestHadithServiceFindByIdNotFound(t *testing.T) {
	repo := &fakeHadithRepo{findByIdErr: errors.New("not found")}
	svc := NewHadithService(repo)

	id := 999
	if _, err := svc.FindById(&id); err == nil {
		t.Fatal("expected error for not found")
	}
}
