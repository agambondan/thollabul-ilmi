package service

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/lib"
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/gofiber/fiber/v2"
	"github.com/morkid/paginate"
)

type fakeAyahRepo struct {
	count                int64
	dailyInput           int
	findByNumberErr      error
	findBySurahNumberErr error
}

func (f *fakeAyahRepo) Save(ayah *model.Ayah) (*model.Ayah, error) { return ayah, nil }
func (f *fakeAyahRepo) FindAll(ctx *fiber.Ctx) *paginate.Page      { return &paginate.Page{} }
func (f *fakeAyahRepo) FindById(id *int) (*model.Ayah, error)      { return &model.Ayah{}, nil }
func (f *fakeAyahRepo) FindManyByIds(ids []int) ([]model.Ayah, error) {
	return []model.Ayah{}, nil
}

func (f *fakeAyahRepo) FindDaily(number int) (*model.Ayah, error) {
	f.dailyInput = number
	return &model.Ayah{Number: &number}, nil
}

func (f *fakeAyahRepo) FindAllKeyset(ctx *fiber.Ctx) (*lib.KeysetPage, error) {
	return &lib.KeysetPage{}, nil
}

func (f *fakeAyahRepo) FindByNumber(ctx *fiber.Ctx, number *int) (*paginate.Page, error) {
	return &paginate.Page{}, f.findByNumberErr
}

func (f *fakeAyahRepo) FindBySurahNumber(ctx *fiber.Ctx, number *int) (*paginate.Page, error) {
	return &paginate.Page{}, f.findBySurahNumberErr
}

func (f *fakeAyahRepo) FindByPage(page int) ([]model.Ayah, error) {
	return []model.Ayah{}, nil
}

func (f *fakeAyahRepo) FindByHizbQuarter(hizb int) ([]model.Ayah, error) {
	return []model.Ayah{}, nil
}

func (f *fakeAyahRepo) UpdateById(id *int, ayah *model.Ayah) (*model.Ayah, error) {
	return ayah, nil
}
func (f *fakeAyahRepo) DeleteById(id *int, scoped *string) error { return nil }
func (f *fakeAyahRepo) Count() (*int64, error)                   { return &f.count, nil }

func TestAyahServiceFindDailyUsesActualCount(t *testing.T) {
	repo := &fakeAyahRepo{count: 7}
	svc := NewAyahService(repo)

	ayah, err := svc.FindDaily()
	if err != nil {
		t.Fatalf("find daily: %v", err)
	}
	if repo.dailyInput < 1 || repo.dailyInput > int(repo.count) {
		t.Fatalf("daily input out of range: %d for count %d", repo.dailyInput, repo.count)
	}
	if ayah.Number == nil || *ayah.Number != repo.dailyInput {
		t.Fatalf("expected ayah number %d, got %#v", repo.dailyInput, ayah.Number)
	}
}

func TestAyahServiceFindDailyRejectsEmptyCount(t *testing.T) {
	repo := &fakeAyahRepo{count: 0}
	svc := NewAyahService(repo)

	if _, err := svc.FindDaily(); err == nil {
		t.Fatal("expected error for empty ayah count")
	}
}

func TestAyahServiceFindByNumber(t *testing.T) {
	repo := &fakeAyahRepo{}
	svc := NewAyahService(repo)

	ten := 10
	result, err := svc.FindByNumber(nil, &ten)
	if err != nil {
		t.Fatalf("find by number: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil page")
	}
}

func TestAyahServiceFindByNumberPropagatesError(t *testing.T) {
	repo := &fakeAyahRepo{findByNumberErr: errors.New("db error")}
	svc := NewAyahService(repo)

	ten := 10
	if _, err := svc.FindByNumber(nil, &ten); err == nil {
		t.Fatal("expected error to propagate")
	}
}

func TestAyahServiceFindBySurahNumber(t *testing.T) {
	repo := &fakeAyahRepo{}
	svc := NewAyahService(repo)

	one := 1
	result, err := svc.FindBySurahNumber(nil, &one)
	if err != nil {
		t.Fatalf("find by surah number: %v", err)
	}
	if result == nil {
		t.Fatal("expected non-nil page")
	}
}

func TestAyahServiceFindBySurahNumberPropagatesError(t *testing.T) {
	repo := &fakeAyahRepo{findBySurahNumberErr: errors.New("db error")}
	svc := NewAyahService(repo)

	one := 1
	if _, err := svc.FindBySurahNumber(nil, &one); err == nil {
		t.Fatal("expected error to propagate")
	}
}
