package service

import (
	"testing"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/google/uuid"
)

type fakeNoteRepo struct {
	created *model.Note
}

func (f *fakeNoteRepo) FindByUser(userID uuid.UUID, refType model.NoteRefType, refID int, refSlug string) ([]model.Note, error) {
	return nil, nil
}
func (f *fakeNoteRepo) FindByID(id int) (*model.Note, error) { return nil, nil }
func (f *fakeNoteRepo) Create(n *model.Note) (*model.Note, error) {
	f.created = n
	return n, nil
}
func (f *fakeNoteRepo) Update(id int, userID uuid.UUID, n *model.Note) (*model.Note, error) {
	return n, nil
}
func (f *fakeNoteRepo) Delete(id int, userID uuid.UUID) error { return nil }

func TestNoteServiceCreateArticleIgnoresStrayRefID(t *testing.T) {
	repo := &fakeNoteRepo{}
	svc := NewNoteService(repo)
	userID := uuid.New()
	slug := "artikel-x"

	if _, err := svc.Create(userID, &model.CreateNoteRequest{
		RefType: model.NoteRefTypeArticle,
		RefID:   999,
		RefSlug: &slug,
		Content: "isi catatan",
	}); err != nil {
		t.Fatalf("create article note: %v", err)
	}
	if repo.created.RefID != 0 {
		t.Fatalf("expected ref_id forced to 0 for article note, got %d", repo.created.RefID)
	}
	if repo.created.RefSlug != slug {
		t.Fatalf("expected ref_slug %q, got %q", slug, repo.created.RefSlug)
	}
}

func TestNoteServiceCreateNumericRefIgnoresStraySlug(t *testing.T) {
	repo := &fakeNoteRepo{}
	svc := NewNoteService(repo)
	userID := uuid.New()
	strayslug := "should-not-be-stored"

	if _, err := svc.Create(userID, &model.CreateNoteRequest{
		RefType: model.NoteRefTypeAyah,
		RefID:   255,
		RefSlug: &strayslug,
		Content: "isi catatan",
	}); err != nil {
		t.Fatalf("create ayah note: %v", err)
	}
	if repo.created.RefID != 255 {
		t.Fatalf("expected ref_id 255, got %d", repo.created.RefID)
	}
	if repo.created.RefSlug != "" {
		t.Fatalf("expected ref_slug to stay empty for non-article note, got %q", repo.created.RefSlug)
	}
}
