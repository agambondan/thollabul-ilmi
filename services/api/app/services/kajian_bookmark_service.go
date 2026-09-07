package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
	"github.com/google/uuid"
)

type KajianBookmarkService interface {
	Add(userID uuid.UUID, chunkID int, kajianID int, note string) (bool, error)
	Remove(userID uuid.UUID, chunkID int) error
	ListByUser(userID uuid.UUID, limit int) ([]model.KajianUserBookmark, error)
	ChunkIDsByUser(userID uuid.UUID, kajianID int) ([]int, error)
}

type kajianBookmarkService struct {
	repo repository.KajianBookmarkRepository
}

func NewKajianBookmarkService(repo repository.KajianBookmarkRepository) KajianBookmarkService {
	return &kajianBookmarkService{repo: repo}
}

func (s *kajianBookmarkService) Add(userID uuid.UUID, chunkID int, kajianID int, note string) (bool, error) {
	return s.repo.Add(userID, chunkID, kajianID, note)
}

func (s *kajianBookmarkService) Remove(userID uuid.UUID, chunkID int) error {
	return s.repo.Remove(userID, chunkID)
}

func (s *kajianBookmarkService) ListByUser(userID uuid.UUID, limit int) ([]model.KajianUserBookmark, error) {
	return s.repo.ListByUser(userID, limit)
}

func (s *kajianBookmarkService) ChunkIDsByUser(userID uuid.UUID, kajianID int) ([]int, error) {
	return s.repo.ChunkIDsByUser(userID, kajianID)
}
