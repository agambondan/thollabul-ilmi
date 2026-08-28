package service

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
)

type fakeDzikirRepo struct {
	dzikirs         []model.Dzikir
	dzikir          *model.Dzikir
	categoryDzikirs []model.Dzikir
	err             error
	categoryErr     error
}

func (f *fakeDzikirRepo) FindAll(limit, offset int) ([]model.Dzikir, error) {
	return f.dzikirs, f.err
}

func (f *fakeDzikirRepo) FindByID(id int) (*model.Dzikir, error) {
	return f.dzikir, f.err
}

func (f *fakeDzikirRepo) FindByCategory(category model.DzikirCategory, limit, offset int) ([]model.Dzikir, error) {
	return f.categoryDzikirs, f.categoryErr
}

func (f *fakeDzikirRepo) FindByOccasion(occasion string, limit, offset int) ([]model.Dzikir, error) {
	return f.dzikirs, f.err
}
func (f *fakeDzikirRepo) Create(d *model.Dzikir) (*model.Dzikir, error)         { return d, nil }
func (f *fakeDzikirRepo) Update(id int, d *model.Dzikir) (*model.Dzikir, error) { return d, nil }
func (f *fakeDzikirRepo) Delete(id int) error                                   { return nil }

func TestDzikirServiceFindAll(t *testing.T) {
	repo := &fakeDzikirRepo{
		dzikirs: []model.Dzikir{
			{Category: model.DzikirPagi},
			{Category: model.DzikirPetang},
		},
	}
	svc := NewDzikirService(repo)

	result, err := svc.FindAll(10, 0)
	if err != nil {
		t.Fatalf("find all: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("expected 2 dzikirs, got %d", len(result))
	}
	if result[0].Category != model.DzikirPagi {
		t.Fatalf("expected first dzikir category pagi, got %s", result[0].Category)
	}
}

func TestDzikirServiceFindAllPropagatesError(t *testing.T) {
	repo := &fakeDzikirRepo{err: errors.New("db error")}
	svc := NewDzikirService(repo)

	if _, err := svc.FindAll(10, 0); err == nil {
		t.Fatal("expected error to propagate")
	}
}

func TestDzikirServiceFindByCategory(t *testing.T) {
	repo := &fakeDzikirRepo{
		categoryDzikirs: []model.Dzikir{
			{Category: model.DzikirSetelahSholat},
		},
	}
	svc := NewDzikirService(repo)

	result, err := svc.FindByCategory("setelah_sholat", 10, 0)
	if err != nil {
		t.Fatalf("find by category: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("expected 1 dzikir, got %d", len(result))
	}
	if result[0].Category != model.DzikirSetelahSholat {
		t.Fatalf("expected category setelah_sholat, got %s", result[0].Category)
	}
}

func TestDzikirServiceFindByCategoryEmpty(t *testing.T) {
	repo := &fakeDzikirRepo{}
	svc := NewDzikirService(repo)

	result, err := svc.FindByCategory("nonexistent", 10, 0)
	if err != nil {
		t.Fatalf("find by unknown category: %v", err)
	}
	if len(result) != 0 {
		t.Fatalf("expected 0 dzikirs, got %d", len(result))
	}
}
