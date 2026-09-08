package service

import (
	"github.com/agambondan/islamic-explorer/app/model"
	"github.com/agambondan/islamic-explorer/app/repository"
)

type AudioService interface {
	GetManifest() (*model.AudioManifest, error)
	FindSurahAudio(surahID int) ([]model.SurahAudio, error)
	FindAyahAudio(ayahID int) ([]model.AyahAudio, error)
	AddSurahAudio(*model.SurahAudio) (*model.SurahAudio, error)
	AddAyahAudio(*model.AyahAudio) (*model.AyahAudio, error)
	DeleteSurahAudio(int) error
	DeleteAyahAudio(int) error
}

type audioService struct {
	repo repository.AudioRepository
}

func NewAudioService(repo repository.AudioRepository) AudioService {
	return &audioService{repo}
}

func (s *audioService) GetManifest() (*model.AudioManifest, error) {
	return s.repo.FindManifest()
}

func (s *audioService) FindSurahAudio(surahID int) ([]model.SurahAudio, error) {
	return s.repo.FindSurahAudioBySurahID(surahID)
}

func (s *audioService) FindAyahAudio(ayahID int) ([]model.AyahAudio, error) {
	return s.repo.FindAyahAudioByAyahID(ayahID)
}

func (s *audioService) AddSurahAudio(a *model.SurahAudio) (*model.SurahAudio, error) {
	return s.repo.SaveSurahAudio(a)
}

func (s *audioService) AddAyahAudio(a *model.AyahAudio) (*model.AyahAudio, error) {
	return s.repo.SaveAyahAudio(a)
}

func (s *audioService) DeleteSurahAudio(id int) error {
	return s.repo.DeleteSurahAudio(id)
}

func (s *audioService) DeleteAyahAudio(id int) error {
	return s.repo.DeleteAyahAudio(id)
}
