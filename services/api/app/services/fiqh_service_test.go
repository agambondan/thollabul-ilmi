package service

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
)

type fakeFiqhRepo struct {
	categories    []model.FiqhCategory
	category      *model.FiqhCategory
	items         []model.FiqhItem
	item          *model.FiqhItem
	err           error
	itemErr       error
	createCat     *model.FiqhCategory
	createCatErr  error
	createItem    *model.FiqhItem
	createItemErr error
	updateCat     *model.FiqhCategory
	updateCatErr  error
	updateItem    *model.FiqhItem
	updateItemErr error
	deleteErr     error
	deleteItemErr error
}

func (f *fakeFiqhRepo) FindAllCategories(limit, offset int) ([]model.FiqhCategory, error) {
	return f.categories, f.err
}

func (f *fakeFiqhRepo) FindAllItems(limit, offset int) ([]model.FiqhItem, error) {
	return f.items, f.itemErr
}

func (f *fakeFiqhRepo) FindCategoryBySlug(slug string, limit, offset int) (*model.FiqhCategory, error) {
	return f.category, f.err
}

func (f *fakeFiqhRepo) FindItemBySlug(slug string) (*model.FiqhItem, error) {
	return f.item, f.itemErr
}

func (f *fakeFiqhRepo) FindItemByCategoryAndID(slug string, id int) (*model.FiqhItem, error) {
	return f.item, f.itemErr
}

func (f *fakeFiqhRepo) CreateCategory(cat *model.FiqhCategory) (*model.FiqhCategory, error) {
	return f.createCat, f.createCatErr
}

func (f *fakeFiqhRepo) UpdateCategory(id int, cat *model.FiqhCategory) (*model.FiqhCategory, error) {
	return f.updateCat, f.updateCatErr
}

func (f *fakeFiqhRepo) DeleteCategory(id int) error {
	return f.deleteErr
}

func (f *fakeFiqhRepo) CreateItem(item *model.FiqhItem) (*model.FiqhItem, error) {
	return f.createItem, f.createItemErr
}

func (f *fakeFiqhRepo) UpdateItem(id int, item *model.FiqhItem) (*model.FiqhItem, error) {
	return f.updateItem, f.updateItemErr
}

func (f *fakeFiqhRepo) DeleteItem(id int) error {
	return f.deleteItemErr
}

func TestFiqhServiceFindAllCategories(t *testing.T) {
	repo := &fakeFiqhRepo{
		categories: []model.FiqhCategory{
			{Name: "Thaharah", Slug: "thaharah"},
			{Name: "Shalat", Slug: "shalat"},
		},
	}
	svc := NewFiqhService(repo)

	result, err := svc.FindAllCategories(10, 0)
	if err != nil {
		t.Fatalf("find all: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("expected 2 categories, got %d", len(result))
	}
	if result[0].Slug != "thaharah" {
		t.Fatalf("expected thaharah, got %s", result[0].Slug)
	}
}

func TestFiqhServiceFindAllCategoriesPropagatesError(t *testing.T) {
	repo := &fakeFiqhRepo{err: errors.New("db error")}
	svc := NewFiqhService(repo)

	if _, err := svc.FindAllCategories(10, 0); err == nil {
		t.Fatal("expected error to propagate")
	}
}

func TestFiqhServiceFindAllItems(t *testing.T) {
	repo := &fakeFiqhRepo{
		items: []model.FiqhItem{
			{Title: "Wudhu", Slug: "wudhu"},
		},
	}
	svc := NewFiqhService(repo)

	result, err := svc.FindAllItems(10, 0)
	if err != nil {
		t.Fatalf("find all items: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("expected 1 item, got %d", len(result))
	}
}

func TestFiqhServiceFindAllItemsPropagatesError(t *testing.T) {
	repo := &fakeFiqhRepo{itemErr: errors.New("db error")}
	svc := NewFiqhService(repo)

	if _, err := svc.FindAllItems(10, 0); err == nil {
		t.Fatal("expected error to propagate")
	}
}

func TestFiqhServiceFindCategoryBySlug(t *testing.T) {
	repo := &fakeFiqhRepo{
		category: &model.FiqhCategory{Name: "Shalat", Slug: "shalat"},
	}
	svc := NewFiqhService(repo)

	result, err := svc.FindCategoryBySlug("shalat", 10, 0)
	if err != nil {
		t.Fatalf("find by slug: %v", err)
	}
	if result.Slug != "shalat" {
		t.Fatalf("expected slug shalat, got %s", result.Slug)
	}
}

func TestFiqhServiceFindCategoryBySlugNotFound(t *testing.T) {
	repo := &fakeFiqhRepo{}
	svc := NewFiqhService(repo)

	result, err := svc.FindCategoryBySlug("nonexistent", 10, 0)
	if err != nil {
		t.Fatalf("find by slug: %v", err)
	}
	if result != nil {
		t.Fatal("expected nil for not found")
	}
}

func TestFiqhServiceFindItemBySlug(t *testing.T) {
	repo := &fakeFiqhRepo{
		item: &model.FiqhItem{Title: "Wudhu", Slug: "wudhu"},
	}
	svc := NewFiqhService(repo)

	result, err := svc.FindItemBySlug("wudhu")
	if err != nil {
		t.Fatalf("find item by slug: %v", err)
	}
	if result.Slug != "wudhu" {
		t.Fatalf("expected wudhu, got %s", result.Slug)
	}
}

func TestFiqhServiceFindItemBySlugNotFound(t *testing.T) {
	repo := &fakeFiqhRepo{}
	svc := NewFiqhService(repo)

	result, err := svc.FindItemBySlug("nonexistent")
	if err != nil {
		t.Fatalf("find item by slug: %v", err)
	}
	if result != nil {
		t.Fatal("expected nil for not found")
	}
}

func TestFiqhServiceCreateCategory(t *testing.T) {
	repo := &fakeFiqhRepo{
		createCat: &model.FiqhCategory{Name: "New Cat", Slug: "new-cat"},
	}
	svc := NewFiqhService(repo)

	result, err := svc.CreateCategory(&model.CreateFiqhCategoryRequest{
		Name: "New Cat", Slug: "new-cat",
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if result.Slug != "new-cat" {
		t.Fatalf("expected new-cat, got %s", result.Slug)
	}
}

func TestFiqhServiceCreateCategoryPropagatesError(t *testing.T) {
	repo := &fakeFiqhRepo{createCatErr: errors.New("db error")}
	svc := NewFiqhService(repo)

	if _, err := svc.CreateCategory(&model.CreateFiqhCategoryRequest{}); err == nil {
		t.Fatal("expected error to propagate")
	}
}

func TestFiqhServiceUpdateCategory(t *testing.T) {
	repo := &fakeFiqhRepo{
		updateCat: &model.FiqhCategory{Name: "Updated", Slug: "updated"},
	}
	svc := NewFiqhService(repo)

	result, err := svc.UpdateCategory(1, &model.CreateFiqhCategoryRequest{
		Name: "Updated", Slug: "updated",
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if result.Name != "Updated" {
		t.Fatalf("expected Updated, got %s", result.Name)
	}
}

func TestFiqhServiceUpdateCategoryPropagatesError(t *testing.T) {
	repo := &fakeFiqhRepo{updateCatErr: errors.New("db error")}
	svc := NewFiqhService(repo)

	if _, err := svc.UpdateCategory(1, &model.CreateFiqhCategoryRequest{}); err == nil {
		t.Fatal("expected error to propagate")
	}
}

func TestFiqhServiceDeleteCategory(t *testing.T) {
	repo := &fakeFiqhRepo{}
	svc := NewFiqhService(repo)

	if err := svc.DeleteCategory(1); err != nil {
		t.Fatalf("delete: %v", err)
	}
}

func TestFiqhServiceDeleteCategoryPropagatesError(t *testing.T) {
	repo := &fakeFiqhRepo{deleteErr: errors.New("db error")}
	svc := NewFiqhService(repo)

	if err := svc.DeleteCategory(1); err == nil {
		t.Fatal("expected error to propagate")
	}
}

func TestFiqhServiceCreateItem(t *testing.T) {
	cid := 1
	repo := &fakeFiqhRepo{
		createItem: &model.FiqhItem{Title: "New Item", Slug: "new-item", CategoryID: &cid},
	}
	svc := NewFiqhService(repo)

	result, err := svc.CreateItem(&model.CreateFiqhItemRequest{
		CategoryID: 1, Title: "New Item", Slug: "new-item", Content: "content",
	})
	if err != nil {
		t.Fatalf("create item: %v", err)
	}
	if result.Title != "New Item" {
		t.Fatalf("expected New Item, got %s", result.Title)
	}
}

func TestFiqhServiceDeleteItem(t *testing.T) {
	repo := &fakeFiqhRepo{}
	svc := NewFiqhService(repo)

	if err := svc.DeleteItem(1); err != nil {
		t.Fatalf("delete item: %v", err)
	}
}

func TestFiqhServiceDeleteItemPropagatesError(t *testing.T) {
	repo := &fakeFiqhRepo{deleteItemErr: errors.New("db error")}
	svc := NewFiqhService(repo)

	if err := svc.DeleteItem(1); err == nil {
		t.Fatal("expected error to propagate")
	}
}
