package service

import (
	"fmt"

	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type NoteService interface {
	FindByUser(userID uuid.UUID, refType model.NoteRefType, refID int) ([]model.Note, error)
	FindByID(id int) (*model.Note, error)
	Create(userID uuid.UUID, req *model.CreateNoteRequest) (*model.Note, error)
	Update(id int, userID uuid.UUID, req *model.UpdateNoteRequest) (*model.Note, error)
	Delete(id int, userID uuid.UUID) error
}

type noteService struct{ repo repository.NoteRepository }

func NewNoteService(repo repository.NoteRepository) NoteService {
	return &noteService{repo}
}

func (s *noteService) FindByUser(userID uuid.UUID, refType model.NoteRefType, refID int) ([]model.Note, error) {
	return s.repo.FindByUser(userID, refType, refID)
}

func (s *noteService) FindByID(id int) (*model.Note, error) {
	return s.repo.FindByID(id)
}

func (s *noteService) Create(userID uuid.UUID, req *model.CreateNoteRequest) (*model.Note, error) {
	return s.repo.Create(&model.Note{
		UserID:  userID,
		RefType: req.RefType,
		RefID:   req.RefID,
		Content: req.Content,
	})
}

func (s *noteService) Update(id int, userID uuid.UUID, req *model.UpdateNoteRequest) (*model.Note, error) {
	n, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if n.UserID != userID {
		return nil, fmt.Errorf("forbidden")
	}
	return s.repo.Update(id, userID, &model.Note{Content: req.Content})
}

func (s *noteService) Delete(id int, userID uuid.UUID) error {
	return s.repo.Delete(id, userID)
}
