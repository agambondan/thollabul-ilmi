package service

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

type fakeSurahRepo struct {
	surah           *model.Surah
	count           int64
	findByNumberErr error
}

func (f *fakeSurahRepo) Save(s *model.Surah) (*model.Surah, error) { return s, nil }
func (f *fakeSurahRepo) FindAll(ctx *fiber.Ctx) *paginate.Page     { return &paginate.Page{} }
func (f *fakeSurahRepo) FindById(ctx *fiber.Ctx, id *int) (*model.Surah, error) {
	return f.surah, nil
}

func (f *fakeSurahRepo) FindByNumber(ctx *fiber.Ctx, number *int) (*model.Surah, error) {
	return f.surah, f.findByNumberErr
}

func (f *fakeSurahRepo) FindByName(ctx *fiber.Ctx, name *string) (*model.Surah, error) {
	return f.surah, nil
}
func (f *fakeSurahRepo) UpdateById(id *int, s *model.Surah) (*model.Surah, error) { return s, nil }
func (f *fakeSurahRepo) DeleteById(id *int, scoped *string) error                 { return nil }
func (f *fakeSurahRepo) Count() (*int64, error)                                   { return &f.count, nil }

func TestSurahServiceFindAll(t *testing.T) {
	repo := &fakeSurahRepo{}
	svc := NewSurahService(repo)

	page := svc.FindAll(nil)
	if page == nil {
		t.Fatal("expected non-nil page")
	}
}

func TestSurahServiceFindByNumber(t *testing.T) {
	num := 1
	repo := &fakeSurahRepo{surah: &model.Surah{Number: &num}}
	svc := NewSurahService(repo)

	one := 1
	surah, err := svc.FindByNumber(nil, &one)
	if err != nil {
		t.Fatalf("find by number: %v", err)
	}
	if surah == nil || surah.Number == nil || *surah.Number != 1 {
		t.Fatalf("expected surah number 1, got %#v", surah)
	}
}

func TestSurahServiceFindByNumberNotFound(t *testing.T) {
	repo := &fakeSurahRepo{findByNumberErr: errors.New("not found")}
	svc := NewSurahService(repo)

	one := 1
	if _, err := svc.FindByNumber(nil, &one); err == nil {
		t.Fatal("expected error for not found")
	}
}

func TestSurahServiceCount(t *testing.T) {
	repo := &fakeSurahRepo{count: 114}
	svc := NewSurahService(repo)

	count, err := svc.Count()
	if err != nil {
		t.Fatalf("count: %v", err)
	}
	if count == nil || *count != 114 {
		t.Fatalf("expected count 114, got %#v", count)
	}
}
