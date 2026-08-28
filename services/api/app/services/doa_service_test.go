package service

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
)

type fakeDoaRepo struct {
	doas         []model.Doa
	doa          *model.Doa
	categoryDoas []model.Doa
	err          error
	categoryErr  error
}

func (f *fakeDoaRepo) FindAll(limit, offset int) ([]model.Doa, error) {
	return f.doas, f.err
}

func (f *fakeDoaRepo) FindByID(id int) (*model.Doa, error) {
	return f.doa, f.err
}

func (f *fakeDoaRepo) FindByCategory(category model.DoaCategory, limit, offset int) ([]model.Doa, error) {
	return f.categoryDoas, f.categoryErr
}

func (f *fakeDoaRepo) Create(doa *model.Doa) (*model.Doa, error) {
	return doa, f.err
}

func (f *fakeDoaRepo) Update(id int, doa *model.Doa) (*model.Doa, error) {
	return doa, f.err
}

func (f *fakeDoaRepo) Delete(id int) error {
	return f.err
}

func TestDoaServiceFindAll(t *testing.T) {
	repo := &fakeDoaRepo{
		doas: []model.Doa{
			{Category: model.DoaCategoryPagi},
			{Category: model.DoaCategoryPetang},
		},
	}
	svc := NewDoaService(repo)

	result, err := svc.FindAll(10, 0)
	if err != nil {
		t.Fatalf("find all: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("expected 2 doas, got %d", len(result))
	}
	if result[0].Category != model.DoaCategoryPagi {
		t.Fatalf("expected first doa category pagi, got %s", result[0].Category)
	}
}

func TestDoaServiceFindAllPropagatesError(t *testing.T) {
	repo := &fakeDoaRepo{err: errors.New("db error")}
	svc := NewDoaService(repo)

	if _, err := svc.FindAll(10, 0); err == nil {
		t.Fatal("expected error to propagate")
	}
}

func TestDoaServiceFindByCategory(t *testing.T) {
	repo := &fakeDoaRepo{
		categoryDoas: []model.Doa{
			{Category: model.DoaCategoryMakan},
		},
	}
	svc := NewDoaService(repo)

	result, err := svc.FindByCategory(model.DoaCategoryMakan, 10, 0)
	if err != nil {
		t.Fatalf("find by category: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("expected 1 doa, got %d", len(result))
	}
	if result[0].Category != model.DoaCategoryMakan {
		t.Fatalf("expected category makan, got %s", result[0].Category)
	}
}

func TestDoaServiceFindByCategoryEmpty(t *testing.T) {
	repo := &fakeDoaRepo{}
	svc := NewDoaService(repo)

	result, err := svc.FindByCategory(model.DoaCategory("nonexistent"), 10, 0)
	if err != nil {
		t.Fatalf("find by unknown category: %v", err)
	}
	if len(result) != 0 {
		t.Fatalf("expected 0 doas, got %d", len(result))
	}
}
