package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type KajianNoteService interface {
	Create(userID uuid.UUID, req model.CreateKajianNoteRequest) (*model.KajianUserNote, error)
	GetByID(userID uuid.UUID, id int) (*model.KajianUserNote, error)
	List(userID uuid.UUID, query model.KajianNoteListQuery) ([]model.KajianUserNote, error)
	Update(userID uuid.UUID, id int, req model.UpdateKajianNoteRequest) (*model.KajianUserNote, error)
	Delete(userID uuid.UUID, id int) error
}

type kajianNoteService struct {
	repo repository.KajianNoteRepository
}

func NewKajianNoteService(repo repository.KajianNoteRepository) KajianNoteService {
	return &kajianNoteService{repo: repo}
}

func (s *kajianNoteService) Create(userID uuid.UUID, req model.CreateKajianNoteRequest) (*model.KajianUserNote, error) {
	note := &model.KajianUserNote{
		UserID:   userID,
		KajianID: req.KajianID,
		StartSec: req.StartSec,
		EndSec:   req.EndSec,
		Content:  req.Content,
	}
	if err := s.repo.Create(note); err != nil {
		return nil, err
	}
	return note, nil
}

func (s *kajianNoteService) GetByID(userID uuid.UUID, id int) (*model.KajianUserNote, error) {
	return s.repo.GetByID(userID, id)
}

func (s *kajianNoteService) List(userID uuid.UUID, query model.KajianNoteListQuery) ([]model.KajianUserNote, error) {
	if query.Limit <= 0 || query.Limit > 200 {
		query.Limit = 100
	}
	if query.Offset < 0 {
		query.Offset = 0
	}
	return s.repo.List(userID, query)
}

func (s *kajianNoteService) Update(userID uuid.UUID, id int, req model.UpdateKajianNoteRequest) (*model.KajianUserNote, error) {
	note, err := s.repo.GetByID(userID, id)
	if err != nil {
		return nil, err
	}
	if req.StartSec != nil {
		note.StartSec = *req.StartSec
	}
	if req.EndSec != nil {
		note.EndSec = req.EndSec
	}
	note.Content = req.Content
	if err := s.repo.Update(note); err != nil {
		return nil, err
	}
	return note, nil
}

func (s *kajianNoteService) Delete(userID uuid.UUID, id int) error {
	return s.repo.Delete(userID, id)
}