package service

import (
	"errors"
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
)

type fakeSearchRepo struct {
	ayahs     []model.Ayah
	ayahTot   int64
	hadiths   []model.Hadith
	hadithTot int64
	dicts     []model.IslamicTerm
	dictTot   int64
	doas      []model.Doa
	doaTot    int64
	kajians   []model.Kajian
	kajianTot int64
	perawis   []model.Perawi
	perawiTot int64
	err       error
}

func (f *fakeSearchRepo) SearchAyah(query string, limit, offset int) ([]model.Ayah, int64, error) {
	return f.ayahs, f.ayahTot, f.err
}

func (f *fakeSearchRepo) SearchHadith(query string, bookID *int, limit, offset int) ([]model.Hadith, int64, error) {
	return f.hadiths, f.hadithTot, f.err
}

func (f *fakeSearchRepo) SearchDictionary(query string, limit, offset int) ([]model.IslamicTerm, int64, error) {
	return f.dicts, f.dictTot, f.err
}

func (f *fakeSearchRepo) SearchDoa(query string, limit, offset int) ([]model.Doa, int64, error) {
	return f.doas, f.doaTot, f.err
}

func (f *fakeSearchRepo) SearchKajian(query string, limit, offset int) ([]model.Kajian, int64, error) {
	return f.kajians, f.kajianTot, f.err
}

func (f *fakeSearchRepo) SearchPerawi(query string, limit, offset int) ([]model.Perawi, int64, error) {
	return f.perawis, f.perawiTot, f.err
}

func TestSearchServiceSingleTypeReturnsTotal(t *testing.T) {
	repo := &fakeSearchRepo{
		hadiths:   make([]model.Hadith, 5),
		hadithTot: 72,
	}
	svc := NewSearchService(repo)

	result, err := svc.Search("sabar", "hadith", nil, 20, 0)
	if err != nil {
		t.Fatalf("search hadith: %v", err)
	}
	if result.HadithTotal != 72 {
		t.Fatalf("expected hadith total 72, got %d", result.HadithTotal)
	}
	if len(result.Hadiths) != 5 {
		t.Fatalf("expected 5 hadiths, got %d", len(result.Hadiths))
	}
	if result.Total != 72 {
		t.Fatalf("expected result total 72, got %d", result.Total)
	}
}

func TestSearchServiceAllTypeSumsAllTotals(t *testing.T) {
	repo := &fakeSearchRepo{
		ayahs:     make([]model.Ayah, 3),
		ayahTot:   50,
		hadiths:   make([]model.Hadith, 3),
		hadithTot: 72,
		dicts:     make([]model.IslamicTerm, 2),
		dictTot:   10,
		doas:      make([]model.Doa, 2),
		doaTot:    8,
		kajians:   make([]model.Kajian, 2),
		kajianTot: 5,
		perawis:   make([]model.Perawi, 2),
		perawiTot: 3,
	}
	svc := NewSearchService(repo)

	result, err := svc.Search("sabar", "all", nil, 20, 0)
	if err != nil {
		t.Fatalf("search all: %v", err)
	}
	expectedTotal := int64(50 + 72 + 10 + 8 + 5 + 3)
	if int64(result.Total) != expectedTotal {
		t.Fatalf("expected total %d, got %d", expectedTotal, result.Total)
	}
	if result.AyahTotal != 50 {
		t.Fatalf("expected ayah total 50, got %d", result.AyahTotal)
	}
	if result.HadithTotal != 72 {
		t.Fatalf("expected hadith total 72, got %d", result.HadithTotal)
	}
}

func TestSearchServiceAllTypeEachCategoryGetsLimitDivided(t *testing.T) {
	repo := &fakeSearchRepo{
		ayahs:     make([]model.Ayah, 3),
		ayahTot:   50,
		hadiths:   make([]model.Hadith, 3),
		hadithTot: 72,
		dicts:     make([]model.IslamicTerm, 3),
		dictTot:   10,
		doas:      make([]model.Doa, 3),
		doaTot:    8,
		kajians:   make([]model.Kajian, 3),
		kajianTot: 5,
		perawis:   make([]model.Perawi, 3),
		perawiTot: 3,
	}
	svc := NewSearchService(repo)

	result, err := svc.Search("sabar", "all", nil, 18, 0)
	if err != nil {
		t.Fatalf("search all: %v", err)
	}
	if len(result.Ayahs) > 3 || len(result.Hadiths) > 3 {
		t.Fatalf("limit/6 should cap each category")
	}
}

func TestSearchServiceRespectsPageOffset(t *testing.T) {
	repo := &fakeSearchRepo{
		hadiths:   make([]model.Hadith, 20),
		hadithTot: 72,
	}
	svc := NewSearchService(repo)

	result, err := svc.Search("sabar", "hadith", nil, 20, 1)
	if err != nil {
		t.Fatalf("search with page: %v", err)
	}
	if result.HadithTotal != 72 {
		t.Fatalf("total should be 72 regardless of page, got %d", result.HadithTotal)
	}
}

func TestSearchServicePropagatesError(t *testing.T) {
	repo := &fakeSearchRepo{err: errors.New("db error")}
	svc := NewSearchService(repo)

	if _, err := svc.Search("x", "ayah", nil, 20, 0); err == nil {
		t.Fatal("expected error to propagate")
	}
}

func TestSearchServiceLimitsBounds(t *testing.T) {
	repo := &fakeSearchRepo{
		hadiths:   make([]model.Hadith, 20),
		hadithTot: 20,
	}
	svc := NewSearchService(repo)

	limit := 999
	result, err := svc.Search("test", "hadith", nil, limit, 0)
	if err != nil {
		t.Fatalf("search with large limit: %v", err)
	}
	if result.HadithTotal != 20 {
		t.Fatalf("expected total 20, got %d", result.HadithTotal)
	}

	result, err = svc.Search("test", "hadith", nil, -1, 0)
	if err != nil {
		t.Fatalf("search with negative limit: %v", err)
	}
	if result.HadithTotal != 20 {
		t.Fatalf("expected total 20 for clamped limit, got %d", result.HadithTotal)
	}
}

func TestSearchServiceUnknownTypeDefaultsToAll(t *testing.T) {
	repo := &fakeSearchRepo{
		ayahs:     make([]model.Ayah, 2),
		ayahTot:   10,
		hadiths:   make([]model.Hadith, 2),
		hadithTot: 10,
		dicts:     make([]model.IslamicTerm, 2),
		dictTot:   10,
		doas:      make([]model.Doa, 2),
		doaTot:    10,
		kajians:   make([]model.Kajian, 2),
		kajianTot: 10,
		perawis:   make([]model.Perawi, 2),
		perawiTot: 10,
	}
	svc := NewSearchService(repo)

	result, err := svc.Search("test", "unknown_type", nil, 20, 0)
	if err != nil {
		t.Fatalf("search unknown type: %v", err)
	}
	if result.Total != 60 {
		t.Fatalf("expected total 60 (6x10), got %d", result.Total)
	}
}
